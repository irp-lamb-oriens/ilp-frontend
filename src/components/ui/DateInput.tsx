"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { Field, type FieldBaseProps } from "./Field";
import { cx } from "./cx";
import s from "./Input.module.scss";

export type DateInputProps = FieldBaseProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "type" | "size"> & {
    /** "date" (default) or "datetime-local". Values are the native strings ("2026-11-03", "2026-11-03T14:30"). */
    kind?: "date" | "datetime-local";
    inputClassName?: string;
  };

/** Native date (or date and time) picker. Convert with `dateInputValue` / `isoFromDateInput`. */
export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(function DateInput(
  { label, hint, error, required, optional, hideLabel, className, inputClassName, id, kind = "date", ...rest },
  ref,
) {
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required} optional={optional} hideLabel={hideLabel} className={className}>
      {(control) => <input ref={ref} type={kind} className={cx(s.control, inputClassName)} {...control} {...rest} />}
    </Field>
  );
});

const pad = (n: number) => String(n).padStart(2, "0");

/** ISO timestamp → the local "YYYY-MM-DD" (or "YYYY-MM-DDTHH:mm") a date input shows. Empty for missing/invalid. */
export function dateInputValue(iso: string | null | undefined, kind: "date" | "datetime-local" = "date"): string {
  if (!iso) return "";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const d = new Date(t);
  const day = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return kind === "date" ? day : `${day}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Date input value → ISO timestamp (local time). A plain date becomes 17:00
 * local by default, a sensible "due by end of day"; pass `hour` to change it.
 * Returns undefined for an empty or invalid value.
 */
export function isoFromDateInput(value: string | null | undefined, hour = 17): string | undefined {
  if (!value) return undefined;
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/.exec(value);
  if (!m) return undefined;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), m[4] ? Number(m[4]) : hour, m[5] ? Number(m[5]) : 0);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

export default DateInput;
