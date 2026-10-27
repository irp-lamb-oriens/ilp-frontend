"use client";

import { forwardRef, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
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
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

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

  // Keep the highlighted option in view.
  useEffect(() => {
    if (!open || active < 0) return;
    const el = listRef.current?.children[active] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  // Close on a pointer press outside.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
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

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" && e.altKey) {
      e.preventDefault();
      setOpen(true);
      setActive(nearest(value));
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

  const ariaInvalid = aria["aria-invalid"] === true || aria["aria-invalid"] === "true";

  return (
    <div ref={rootRef} className={cx(s.root, appearance === "bare" ? s.bare : s.boxed, ariaInvalid && s.invalid, disabled && s.disabled)}>
      {!noIcon && <IconClock className={s.icon} />}
      <input
        ref={ref}
        id={id}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        spellCheck={false}
        inputMode="text"
        enterKeyHint="done"
        disabled={disabled}
        placeholder={placeholder}
        className={cx(s.input, noIcon && s.noIcon, inputClassName)}
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
          setOpen((o) => !o);
          setActive(nearest(value));
        }}
        onKeyDown={onKeyDown}
        onBlur={() => {
          if (editing) commitText();
          onBlur?.();
        }}
        {...aria}
      />
      {name && <input type="hidden" name={name} value={value} />}
      <ul ref={listRef} id={listId} role="listbox" className={cx(s.list, open && s.open)} hidden={!open} tabIndex={-1} aria-label="Times">
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
                onClick={() => {
                  commit(o);
                  setOpen(false);
                }}
              >
                <span>{formatTime12(o)}</span>
                {extra && <span className={s.optionHint}>{extra}</span>}
              </li>
            );
          })}
      </ul>
    </div>
  );
});

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
