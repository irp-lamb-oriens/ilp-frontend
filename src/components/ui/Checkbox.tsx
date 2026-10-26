"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { describedBy, FieldError, FieldHint, FieldMarker, useFieldIds } from "./Field";
import { cx } from "./cx";
import s from "./Checkbox.module.scss";

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "type"> & {
  /** Text next to the box; clicking it toggles the box. */
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  className?: string;
};

/** Checkbox with its label on the right; the whole row is a 44px target. */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, hint, error, required, className, id: idProp, disabled, ...rest },
  ref,
) {
  const ids = useFieldIds(idProp);
  return (
    <div className={cx(s.wrap, className)}>
      <label htmlFor={ids.id} className={cx(s.row, disabled && s.disabled)}>
        <input
          ref={ref}
          id={ids.id}
          type="checkbox"
          className={s.box}
          disabled={disabled}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(ids, hint, error)}
          {...rest}
        />
        <span className={s.text}>
          {label}
          <FieldMarker required={required} />
        </span>
      </label>
      <div className={s.below}>
        <FieldHint id={ids.hintId}>{hint}</FieldHint>
        <FieldError id={ids.errorId}>{error}</FieldError>
      </div>
    </div>
  );
});

export default Checkbox;
