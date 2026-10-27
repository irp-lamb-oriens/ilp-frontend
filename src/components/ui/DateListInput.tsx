"use client";

import { useRef, useState, type ReactNode } from "react";
import { describedBy, FieldError, FieldHint, FieldMarker, useFieldIds } from "./Field";
import { cx } from "./cx";
import { IconClose, IconPlus } from "./icons";
import chips from "./Chips.module.scss";
import input from "./Input.module.scss";

const YMD = /^\d{4}-\d{2}-\d{2}$/;

/** "2026-12-24" → "Thu, 24 Dec 2026" (the date itself, no time-zone shift). */
export function formatDateChip(ymd: string): string {
  if (!YMD.test(ymd)) return ymd;
  const d = new Date(`${ymd}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return ymd;
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export interface DateListInputProps {
  label: ReactNode;
  hideLabel?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  /** "YYYY-MM-DD" dates. */
  value: readonly string[];
  /** Called with the new list, sorted and without duplicates. */
  onChange: (value: string[]) => void;
  /** Earliest / latest date that can be added ("YYYY-MM-DD"). */
  min?: string;
  max?: string;
  /** Text on the add button. Default "Add". */
  addLabel?: string;
  /** Accessible name of the chip list. Default: the label when it is a string. */
  listLabel?: string;
  /** Shown when the list is empty. */
  emptyText?: ReactNode;
  /** Chip text for a date. Default "Thu, 24 Dec 2026". */
  formatDate?: (ymd: string) => string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

/**
 * A list of dates (days off, holidays): pick a date, press Add or Enter, and
 * it joins the sorted chip list; each chip has its own remove button.
 * Duplicates and dates outside min/max are refused with an inline message.
 */
export function DateListInput({
  label,
  hideLabel,
  hint,
  error,
  required,
  value,
  onChange,
  min,
  max,
  addLabel = "Add",
  listLabel,
  emptyText = "No dates yet.",
  formatDate = formatDateChip,
  disabled,
  id,
  className,
}: DateListInputProps) {
  const ids = useFieldIds(id);
  const [draft, setDraft] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const shown = error ?? problem;

  const add = () => {
    if (!draft) return;
    if (!YMD.test(draft)) return setProblem("Pick a full date.");
    if (min && draft < min) return setProblem(`Pick ${formatDate(min)} or later.`);
    if (max && draft > max) return setProblem(`Pick ${formatDate(max)} or earlier.`);
    if (value.includes(draft)) return setProblem(`${formatDate(draft)} is already on the list.`);
    setProblem(null);
    onChange([...new Set([...value, draft])].sort());
    setDraft("");
    inputRef.current?.focus();
  };

  const remove = (d: string, k: number) => {
    onChange(value.filter((x) => x !== d));
    // Focus the chip that takes this one's place, or the date field.
    window.requestAnimationFrame(() => {
      const btns = listRef.current?.querySelectorAll<HTMLButtonElement>("button");
      const next = btns?.[Math.min(k, (btns?.length ?? 1) - 1)];
      (next ?? inputRef.current)?.focus();
    });
  };

  const sorted = [...value].sort();

  return (
    <div className={cx(chips.group, className)}>
      <label htmlFor={ids.id} className={cx(chips.legend, hideLabel && chips.srOnly)}>
        <span>{label}</span>
        <FieldMarker required={required} />
      </label>
      <FieldHint id={ids.hintId}>{hint}</FieldHint>
      <div className={chips.addRow}>
        <input
          ref={inputRef}
          id={ids.id}
          type="date"
          className={cx(input.control, chips.dateInput)}
          value={draft}
          min={min}
          max={max}
          disabled={disabled}
          aria-invalid={shown ? true : undefined}
          aria-describedby={describedBy(ids, hint, shown)}
          onChange={(e) => {
            setDraft(e.target.value);
            setProblem(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <button type="button" className={chips.addBtn} onClick={add} disabled={disabled || !draft}>
          <IconPlus />
          <span>{addLabel}</span>
        </button>
      </div>
      <FieldError id={ids.errorId}>{shown}</FieldError>
      {sorted.length === 0 ? (
        <p className={chips.empty}>{emptyText}</p>
      ) : (
        <ul ref={listRef} className={chips.list} aria-label={listLabel ?? (typeof label === "string" ? label : undefined)}>
          {sorted.map((d, k) => (
            <li key={d} className={chips.tag}>
              <span className={chips.tagText}>{formatDate(d)}</span>
              <button type="button" className={chips.tagRemove} onClick={() => remove(d, k)} disabled={disabled} aria-label={`Remove ${formatDate(d)}`}>
                <IconClose width={14} height={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default DateListInput;
