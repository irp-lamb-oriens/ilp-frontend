"use client";

import { forwardRef, useState, type ChangeEvent, type TextareaHTMLAttributes } from "react";
import { Field, type FieldBaseProps } from "./Field";
import { cx } from "./cx";
import s from "./Input.module.scss";

export type TextAreaProps = FieldBaseProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> & {
    /** Grow with the text instead of scrolling (CSS only, no inline styles). */
    autoGrow?: boolean;
    inputClassName?: string;
  };

/** Multi-line text input. `autoGrow` makes it as tall as its text. */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, hint, error, required, optional, hideLabel, className, inputClassName, id, autoGrow, onChange, rows = 4, ...rest },
  ref,
) {
  // Uncontrolled use still grows: mirror what the user types.
  const [typed, setTyped] = useState(String(rest.defaultValue ?? ""));
  const mirror = rest.value !== undefined ? String(rest.value ?? "") : typed;
  const handle = (e: ChangeEvent<HTMLTextAreaElement>) => {
    if (autoGrow && rest.value === undefined) setTyped(e.target.value);
    onChange?.(e);
  };
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required} optional={optional} hideLabel={hideLabel} className={className}>
      {(control) => {
        const area = (
          <textarea ref={ref} rows={rows} className={cx(s.control, s.textarea, inputClassName)} onChange={handle} {...control} {...rest} />
        );
        return autoGrow ? (
          <div className={s.grow} data-value={mirror}>
            {area}
          </div>
        ) : (
          area
        );
      }}
    </Field>
  );
});

export default TextArea;
