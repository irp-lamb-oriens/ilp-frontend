"use client";

import { useId, type ReactNode } from "react";
import { cx } from "./cx";
import s from "./Field.module.scss";

/** Props every form-field primitive shares. */
export interface FieldBaseProps {
  /** Always rendered and tied to the control (use hideLabel to keep it for screen readers only). */
  label: ReactNode;
  /** Helper text under the label, linked with aria-describedby. */
  hint?: ReactNode;
  /** Error text under the control; sets aria-invalid. */
  error?: ReactNode;
  /** Shows the word "Required" next to the label and sets the native required attribute. */
  required?: boolean;
  /** Shows "Optional" next to the label (for forms where most fields are required). */
  optional?: boolean;
  /** Keep the label for screen readers but hide it visually (e.g. a search box with a visible button). */
  hideLabel?: boolean;
  /** Class on the outer wrapper. */
  className?: string;
}

/** What Field hands to the control it wraps. Spread onto the input. */
export interface FieldControlProps {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
  required?: boolean;
}

export interface FieldProps extends FieldBaseProps {
  /** Control id; generated when omitted. */
  id?: string;
  /** Render the control with the ids and aria attributes it needs. */
  children: (control: FieldControlProps) => ReactNode;
}

/** Ids for a field's control, hint and error. Exported for controls that render their own label. */
export function useFieldIds(id?: string) {
  const auto = useId();
  const base = id ?? `f${auto.replace(/[^A-Za-z0-9_-]/g, "")}`;
  return { id: base, hintId: `${base}-hint`, errorId: `${base}-error` };
}

export function describedBy(ids: { hintId: string; errorId: string }, hint: unknown, error: unknown, extra?: string) {
  const parts = [hint ? ids.hintId : null, error ? ids.errorId : null, extra ?? null].filter(Boolean);
  return parts.length ? parts.join(" ") : undefined;
}

export function FieldMarker({ required, optional }: { required?: boolean; optional?: boolean }) {
  if (required) return <span className={s.marker}>Required</span>;
  if (optional) return <span className={s.marker}>Optional</span>;
  return null;
}

export function FieldHint({ id, children }: { id: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} className={s.hint}>
      {children}
    </p>
  );
}

export function FieldError({ id, children }: { id: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} className={s.error}>
      <span className={s.errorPrefix}>Error: </span>
      {children}
    </p>
  );
}

/**
 * Label, hint and error around one control. The label sits above the control,
 * the hint under the label, the error under the control (rules.md section 9).
 * Every input primitive (TextInput, Select, …) is built on it; use it directly
 * for a custom control.
 */
export function Field({ id: idProp, label, hint, error, required, optional, hideLabel, className, children }: FieldProps) {
  const ids = useFieldIds(idProp);
  const control: FieldControlProps = { id: ids.id };
  const by = describedBy(ids, hint, error);
  if (by) control["aria-describedby"] = by;
  if (error) control["aria-invalid"] = true;
  if (required) control.required = true;
  return (
    <div className={cx(s.field, className)}>
      <label htmlFor={ids.id} className={cx(s.label, hideLabel && s.srOnly)}>
        <span>{label}</span>
        <FieldMarker required={required} optional={optional} />
      </label>
      <FieldHint id={ids.hintId}>{hint}</FieldHint>
      {children(control)}
      <FieldError id={ids.errorId}>{error}</FieldError>
    </div>
  );
}

export default Field;
