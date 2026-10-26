"use client";

import { forwardRef, type ReactNode, type SelectHTMLAttributes } from "react";
import { Field, type FieldBaseProps } from "./Field";
import { cx } from "./cx";
import s from "./Input.module.scss";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export type SelectProps = FieldBaseProps &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, "className" | "multiple"> & {
    /** Options; or pass <option> children instead. */
    options?: SelectOption[];
    /** First, empty option, e.g. "Choose a lawyer". Selectable only when the field is optional. */
    placeholder?: string;
    inputClassName?: string;
    children?: ReactNode;
  };

/** Native select, styled to match the other inputs (keyboard and screen reader behaviour stay native). */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, required, optional, hideLabel, className, inputClassName, id, options, placeholder, children, ...rest },
  ref,
) {
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required} optional={optional} hideLabel={hideLabel} className={className}>
      {(control) => (
        <span className={s.selectWrap}>
          <select ref={ref} className={cx(s.control, s.select, inputClassName)} {...control} {...rest}>
            {placeholder !== undefined && (
              <option value="" disabled={required}>
                {placeholder}
              </option>
            )}
            {options?.map((o) => (
              <option key={o.value} value={o.value} disabled={o.disabled}>
                {o.label}
              </option>
            ))}
            {children}
          </select>
        </span>
      )}
    </Field>
  );
});

export default Select;
