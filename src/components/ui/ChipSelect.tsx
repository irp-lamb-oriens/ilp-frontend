"use client";

import type { ReactNode } from "react";
import { describedBy, FieldError, FieldHint, FieldMarker, useFieldIds } from "./Field";
import { cx } from "./cx";
import { IconCheck } from "./icons";
import s from "./Chips.module.scss";

export interface ChipOption {
  value: string;
  label: ReactNode;
}

export interface ChipSelectProps {
  /** Legend of the group. */
  label: ReactNode;
  hideLabel?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  options: readonly ChipOption[];
  /** Selected values, in any order. */
  value: readonly string[];
  /** Called with the new selection, kept in the order of `options`. */
  onChange: (value: string[]) => void;
  /** Most chips that can be on at once. */
  max?: number;
  disabled?: boolean;
  /** Base for the hidden checkboxes' name (form posts). */
  name?: string;
  id?: string;
  className?: string;
}

/**
 * Multi-select as toggle chips (legal areas, specialties). Each chip is a
 * real checkbox, so Tab moves between chips and Space toggles one; the group
 * is a fieldset with a legend.
 */
export function ChipSelect({ label, hideLabel, hint, error, required, options, value, onChange, max, disabled, name, id, className }: ChipSelectProps) {
  const ids = useFieldIds(id);
  const atMax = max != null && value.length >= max;
  const toggle = (v: string) => {
    const on = value.includes(v);
    if (!on && atMax) return;
    const next = new Set(value);
    if (on) next.delete(v);
    else next.add(v);
    onChange(options.map((o) => o.value).filter((x) => next.has(x)));
  };
  return (
    <fieldset className={cx(s.fieldset, className)} aria-describedby={describedBy(ids, hint, error)} aria-invalid={error ? true : undefined}>
      <legend className={cx(s.legend, hideLabel && s.srOnly)}>
        <span>{label}</span>
        <FieldMarker required={required} />
      </legend>
      <FieldHint id={ids.hintId}>{hint}</FieldHint>
      <div className={s.chips}>
        {options.map((o, i) => {
          const on = value.includes(o.value);
          const off = disabled || (!on && atMax);
          return (
            <label key={o.value} className={cx(s.chip, on && s.chipOn, off && s.chipDisabled)} htmlFor={`${ids.id}-${i}`}>
              <input
                id={`${ids.id}-${i}`}
                type="checkbox"
                className={s.chipInput}
                checked={on}
                disabled={off}
                name={name}
                value={o.value}
                onChange={() => toggle(o.value)}
              />
              <span className={s.chipCheck} aria-hidden="true">
                <IconCheck width={14} height={14} />
              </span>
              <span>{o.label}</span>
            </label>
          );
        })}
      </div>
      <FieldError id={ids.errorId}>{error}</FieldError>
    </fieldset>
  );
}

export default ChipSelect;
