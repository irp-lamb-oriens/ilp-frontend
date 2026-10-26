"use client";

import { useId, type ReactNode } from "react";
import { describedBy, FieldError, FieldHint, FieldMarker } from "./Field";
import { cx } from "./cx";
import s from "./Checkbox.module.scss";

export interface RadioOption {
  value: string;
  label: ReactNode;
  /** One line under the option label. */
  hint?: ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps {
  /** The question; rendered as the fieldset legend. */
  label: ReactNode;
  name: string;
  options: RadioOption[];
  value: string | null | undefined;
  onChange: (value: string) => void;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  /** Lay options side by side from 768px up (short labels only). */
  inline?: boolean;
  className?: string;
}

/** A set of radio buttons in a fieldset; arrow keys move between options (native behaviour). */
export function RadioGroup({
  label,
  name,
  options,
  value,
  onChange,
  hint,
  error,
  required,
  disabled,
  inline,
  className,
}: RadioGroupProps) {
  const auto = useId().replace(/[^A-Za-z0-9_-]/g, "");
  const ids = { hintId: `rg${auto}-hint`, errorId: `rg${auto}-error` };
  return (
    <fieldset
      className={cx(s.fieldset, className)}
      aria-describedby={describedBy(ids, hint, error)}
      aria-invalid={error ? true : undefined}
      disabled={disabled}
    >
      <legend className={s.legend}>
        <span>{label}</span>
        <FieldMarker required={required} />
      </legend>
      <FieldHint id={ids.hintId}>{hint}</FieldHint>
      <div className={cx(s.options, inline && s.inline)}>
        {options.map((o, i) => {
          const oid = `rg${auto}-${i}`;
          return (
            <label key={o.value} htmlFor={oid} className={cx(s.row, (disabled || o.disabled) && s.disabled)}>
              <input
                id={oid}
                type="radio"
                className={cx(s.box, s.radio)}
                name={name}
                value={o.value}
                checked={value === o.value}
                disabled={o.disabled}
                required={required}
                onChange={() => onChange(o.value)}
              />
              <span className={s.text}>
                {o.label}
                {o.hint && <span className={s.optionHint}>{o.hint}</span>}
              </span>
            </label>
          );
        })}
      </div>
      <FieldError id={ids.errorId}>{error}</FieldError>
    </fieldset>
  );
}

export default RadioGroup;
