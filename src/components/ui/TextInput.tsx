"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { Field, type FieldBaseProps } from "./Field";
import { cx } from "./cx";
import s from "./Input.module.scss";

export type TextInputProps = FieldBaseProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "size" | "type"> & {
    type?: "text" | "email" | "tel" | "url" | "password" | "number";
    /** Class on the input itself (the wrapper takes className). */
    inputClassName?: string;
  };

/** Single-line text input with label, hint and error (email, tel, url, password, number too). */
export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { label, hint, error, required, optional, hideLabel, className, inputClassName, id, type = "text", ...rest },
  ref,
) {
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required} optional={optional} hideLabel={hideLabel} className={className}>
      {(control) => <input ref={ref} type={type} className={cx(s.control, inputClassName)} {...control} {...rest} />}
    </Field>
  );
});

export default TextInput;
