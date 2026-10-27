"use client";

import { forwardRef, useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Field, type FieldBaseProps } from "./Field";
import { cx } from "./cx";
import { IconClock } from "./icons";
import { formatTime12, isTimeValue, parseTimeInput, stepTime, timeOptions, timeToMinutes } from "./timeUtils";
import s from "./TimeInput.module.scss";

/** Props shared by TimeInput and the bare TimeField inside TimeRangeInput. */
export interface TimeFieldOwnProps {
  /** 24-hour "HH:MM", same as <input type="time">. Empty string when unset. */
  value: string;
  /** Called with the new "HH:MM" (never with text that is not a time). */
  onChange: (value: string) => void;
  /** Minutes between list options and per arrow-key press. Default 15. */
  stepMinutes?: number;
  /** Earliest and latest choosable "HH:MM". */
  min?: string;
  max?: string;
  /** Allow "24:00" (end of day), for the end of a range. */
  allowEndOfDay?: boolean;
  /** Extra text after each option in the list, e.g. a duration. */
  optionHint?: (value: string) => string | null;
  /** Adds a hidden input with this name so plain form posts still get "HH:MM". */
  name?: string;
  disabled?: boolean;
  placeholder?: string;
  /** Hide the clock icon (compact rows). */
  noIcon?: boolean;
  inputClassName?: string;
  onBlur?: () => void;
}

export type TimeFieldProps = TimeFieldOwnProps & {
  id?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false";
  required?: boolean;
  /** Visual variant: "boxed" has its own border; "bare" sits inside a parent box (TimeRangeInput). */
  appearance?: "boxed" | "bare";
};

/**
 * The time control without a label: a combobox text field showing
 * "8:30 AM", with a list of times every `stepMinutes`.
 *
 * Keyboard: ArrowUp/ArrowDown change the time by one step (and move the
 * list highlight when it is open), PageUp/PageDown by an hour, Alt+ArrowDown
 * opens the list, Enter confirms, Esc closes and undoes typing. Type-ahead:
 * "830", "8:30p", "14:00", "noon" are understood on Enter or blur; text that
 * is not a time is reverted on blur.
 *
 * Touch (pointer: coarse): a tap opens the list without the on-screen
 * keyboard (the field is read-only with inputMode="none" and focus moves to
 * the listbox, which takes arrow keys, Enter and Esc). "Type a time" at the
 * top of the list switches the field to typing until it loses focus.
 */
export const TimeField = forwardRef<HTMLInputElement, TimeFieldProps>(function TimeField(
  {
    value,
    onChange,
    stepMinutes = 15,
    min = "00:00",
    max,
    allowEndOfDay = false,
    optionHint,
    name,
    disabled,
    placeholder = "--:-- --",
    noIcon,
    inputClassName,
    onBlur,
    appearance = "boxed",
    id,
    ...aria
  },
  ref,
) {
  const hi = max ?? (allowEndOfDay ? "24:00" : "23:59");
  const listId = `${useId().replace(/[^A-Za-z0-9_-]/g, "")}-list`;
  const [text, setText] = useState(() => formatTime12(value));
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  // Touch: the field is a picker until "Type a time" turns typing on.
  const coarse = useCoarsePointer();
  const [typing, setTyping] = useState(false);
  const touchMode = coarse && !typing;
  const [listFocused, setListFocused] = useState(false);
  const focusListOnOpen = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const setInputRef = useCallback(
    (el: HTMLInputElement | null) => {
      inputRef.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) ref.current = el;
    },
    [ref],
  );

  const options = useMemo(() => timeOptions(stepMinutes, min, hi), [stepMinutes, min, hi]);

  useEffect(() => {
    if (!editing) setText(formatTime12(value));
  }, [value, editing]);

  // Index of the option nearest a time (for the highlight while typing or stepping).
  const nearest = (v: string | null) => {
    if (!v || !options.length) return -1;
    const t = timeToMinutes(v);
    let best = 0;
    for (let i = 1; i < options.length; i++) {
      if (Math.abs(timeToMinutes(options[i]) - t) < Math.abs(timeToMinutes(options[best]) - t)) best = i;
    }
    return best;
  };

  // On open: centre the selected time (or 9:00 AM when empty) in the list,
  // and on touch move focus to the list so no keyboard opens.
  useEffect(() => {
    if (!open || !listRef.current) return;
    const list = listRef.current;
    const at = active >= 0 ? active : nearest(isTimeValue(value, true) ? value : "09:00");
    scrollOptionIntoView(list, at, "center");
    if (focusListOnOpen.current) {
      focusListOnOpen.current = false;
      list.focus({ preventScroll: true });
    }
    // Only when the list opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Keep the highlighted option in view (inside the list only, never the page).
  useEffect(() => {
    if (open && active >= 0 && listRef.current) scrollOptionIntoView(listRef.current, active, "nearest");
  }, [open, active]);

  // Close on a press outside (mouse, pen or touch).
  useEffect(() => {
    if (!open) return;
    const onDown = (e: Event) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, [open]);

  const clamp = (v: string) => {
    const t = timeToMinutes(v);
    if (t < timeToMinutes(min)) return min;
    if (t > timeToMinutes(hi)) return hi;
    return v;
  };

  const commit = (v: string) => {
    const next = clamp(v);
    setEditing(false);
    setText(formatTime12(next));
    if (next !== value) onChange(next);
  };

  const commitText = () => {
    const parsed = parseTimeInput(text, allowEndOfDay);
    if (parsed) commit(parsed);
    else {
      setEditing(false);
      setText(formatTime12(value));
    }
  };

  const step = (n: number) => {
    const next = stepTime(isTimeValue(value, true) ? value : options[0] ?? min, n, stepMinutes, min, hi);
    commit(next);
    setActive(nearest(next));
  };

  const openList = () => {
    setOpen(true);
    setActive(nearest(value));
    if (touchMode) focusListOnOpen.current = true;
  };

  /** Pick an option; if the list had focus (touch), hand focus back to the field. */
  const choose = (o: string) => {
    commit(o);
    setOpen(false);
    if (listRef.current && listRef.current === document.activeElement) inputRef.current?.focus({ preventScroll: true });
  };

  /** Touch: switch the field to a text input and bring up the keyboard. */
  const startTyping = () => {
    const el = inputRef.current;
    if (!el) return;
    // Set the DOM props now: iOS only opens the keyboard for a focus() made
    // inside the tap, before React re-renders.
    el.readOnly = false;
    el.inputMode = "text";
    setTyping(true);
    el.focus();
    el.select();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" && e.altKey) {
      e.preventDefault();
      openList();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      step(e.key === "ArrowDown" ? 1 : -1);
    } else if (e.key === "PageDown" || e.key === "PageUp") {
      e.preventDefault();
      step((e.key === "PageDown" ? 60 : -60) / stepMinutes);
    } else if (e.key === "Enter") {
      if (open || editing) e.preventDefault();
      if (editing) commitText();
      else if (open && active >= 0) commit(options[active]);
      setOpen(false);
    } else if (e.key === "Escape") {
      if (open || editing) {
        e.preventDefault();
        e.stopPropagation();
      }
      setOpen(false);
      setEditing(false);
      setText(formatTime12(value));
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  // Keys while the list itself has focus (touch, or a hardware keyboard on a tablet).
  const onListKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    const last = options.length - 1;
    const from = active >= 0 ? active : nearest(value);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setActive(Math.max(0, Math.min(last, from + (e.key === "ArrowDown" ? 1 : -1))));
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      setActive(e.key === "Home" ? 0 : last);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (active >= 0) choose(options[active]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
      inputRef.current?.focus({ preventScroll: true });
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  const ariaInvalid = aria["aria-invalid"] === true || aria["aria-invalid"] === "true";
  const activeId = open && active >= 0 ? `${listId}-${active}` : undefined;

  return (
    <div
      ref={rootRef}
      className={cx(s.root, appearance === "bare" ? s.bare : s.boxed, ariaInvalid && s.invalid, disabled && s.disabled)}
      onBlur={(e) => {
        // Focus left the field and its list: close, and go back to picker mode on touch.
        if (rootRef.current && !rootRef.current.contains(e.relatedTarget as Node | null)) {
          setOpen(false);
          setTyping(false);
        }
      }}
    >
      {!noIcon && <IconClock className={s.icon} />}
      <input
        ref={setInputRef}
        id={id}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={listFocused ? undefined : activeId}
        autoComplete="off"
        spellCheck={false}
        inputMode={touchMode ? "none" : "text"}
        readOnly={touchMode}
        enterKeyHint="done"
        disabled={disabled}
        placeholder={placeholder}
        className={cx(s.input, noIcon && s.noIcon, touchMode && s.picker, inputClassName)}
        value={text}
        onChange={(e) => {
          setEditing(true);
          setText(e.target.value);
          const parsed = parseTimeInput(e.target.value, allowEndOfDay);
          if (parsed) setActive(nearest(parsed));
          if (!open) setOpen(true);
        }}
        onClick={() => {
          if (disabled) return;
          if (open) setOpen(false);
          else openList();
        }}
        onKeyDown={onKeyDown}
        onBlur={() => {
          if (editing) commitText();
          onBlur?.();
        }}
        {...aria}
      />
      {name && <input type="hidden" name={name} value={value} />}
      <div className={cx(s.pop, open && s.open)} hidden={!open}>
        {coarse && !typing && (
          <button type="button" className={s.typeBtn} onClick={startTyping} disabled={disabled}>
            Type a time
          </button>
        )}
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          className={s.list}
          tabIndex={-1}
          aria-label="Times"
          aria-activedescendant={listFocused ? activeId : undefined}
          onKeyDown={onListKeyDown}
          onFocus={() => setListFocused(true)}
          onBlur={() => setListFocused(false)}
        >
          {open &&
            options.map((o, i) => {
              const extra = optionHint?.(o);
              return (
                <li
                  key={o}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={o === value}
                  className={cx(s.option, i === active && s.active, o === value && s.selected)}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseMove={() => setActive(i)}
                  onClick={() => choose(o)}
                >
                  <span>{formatTime12(o)}</span>
                  {extra && <span className={s.optionHint}>{extra}</span>}
                </li>
              );
            })}
        </ul>
      </div>
    </div>
  );
});

/** True when the primary pointer is coarse (phones, tablets). False on the server. */
function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(pointer: coarse)");
    const sync = () => setCoarse(mq.matches);
    sync();
    mq.addEventListener?.("change", sync);
    return () => mq.removeEventListener?.("change", sync);
  }, []);
  return coarse;
}

/** Scroll the list (not the page) so option `i` is centred or just visible. */
function scrollOptionIntoView(list: HTMLElement, i: number, mode: "center" | "nearest") {
  const el = list.children[i] as HTMLElement | undefined;
  if (!el) return;
  const top = el.offsetTop;
  const bottom = top + el.offsetHeight;
  if (mode === "center") list.scrollTop = Math.max(0, top - (list.clientHeight - el.offsetHeight) / 2);
  else if (top < list.scrollTop) list.scrollTop = top;
  else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
}

export type TimeInputProps = FieldBaseProps &
  TimeFieldOwnProps & {
    id?: string;
  };

/**
 * Labelled time field (HH:MM stored, "8:30 AM" shown). Same value format as
 * <input type="time"> and the same `onChange(value)` shape as RadioGroup, so
 * it replaces a native time input without changing stored data. The label is
 * required; pass hideLabel in compact rows so it stays for screen readers.
 */
export const TimeInput = forwardRef<HTMLInputElement, TimeInputProps>(function TimeInput(
  { label, hint, error, required, optional, hideLabel, className, id, ...rest },
  ref,
) {
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required} optional={optional} hideLabel={hideLabel} className={className}>
      {(control) => <TimeField ref={ref} {...control} {...rest} />}
    </Field>
  );
});

export default TimeInput;
