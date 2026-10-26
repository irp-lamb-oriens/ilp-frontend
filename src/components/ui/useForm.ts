"use client";

import { useCallback, useRef, useState, type ChangeEvent, type FormEvent } from "react";

/** A validator returns an error message, or nothing when the value is fine. */
export type Validator<V> = (value: V[keyof V], values: V) => string | null | undefined | false;
export type Errors<V> = Partial<Record<keyof V, string>>;

/** Small validators for the common cases. Compose them per field. */
export const validators = {
  required:
    (message = "This field is required.") =>
    (v: unknown) =>
      v === undefined || v === null || (typeof v === "string" && !v.trim()) || (Array.isArray(v) && !v.length) ? message : null,
  email:
    (message = "Enter an email address like name@example.com.") =>
    (v: unknown) =>
      typeof v === "string" && v.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? message : null,
  maxLength:
    (n: number, message?: string) =>
    (v: unknown) =>
      typeof v === "string" && v.length > n ? message ?? `Keep this under ${n} characters.` : null,
  /** For MoneyInput: undefined means the text was not a valid amount. */
  money:
    (message = "Enter an amount like 1,250.00.") =>
    (v: unknown) =>
      v === undefined ? message : null,
  minCents:
    (min: number, message?: string) =>
    (v: unknown) =>
      typeof v === "number" && v < min ? message ?? `Enter at least US$${(min / 100).toFixed(2)}.` : null,
};

export interface UseFormOptions<V extends Record<string, unknown>> {
  initial: V;
  /** Per-field validators, run in order; the first message wins. */
  rules?: { [K in keyof V]?: Array<(value: V[K], values: V) => string | null | undefined | false> };
  onSubmit: (values: V) => void | Promise<void>;
}

/**
 * Minimal form state: values, per-field errors shown after blur or submit,
 * a submit handler that validates, focuses the first invalid control and
 * catches the submit error.
 *
 *   const f = useForm({ initial: { title: "" }, rules: { title: [validators.required()] }, onSubmit: save });
 *   <form onSubmit={f.handleSubmit} noValidate>
 *     <TextInput label="Title" required {...f.text("title")} />
 */
export function useForm<V extends Record<string, unknown>>({ initial, rules, onSubmit }: UseFormOptions<V>) {
  const [values, setValues] = useState<V>(initial);
  const [touched, setTouched] = useState<Partial<Record<keyof V, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const initialRef = useRef(initial);

  const validate = useCallback(
    (vals: V): Errors<V> => {
      const out: Errors<V> = {};
      if (!rules) return out;
      for (const key of Object.keys(rules) as Array<keyof V>) {
        for (const rule of rules[key] ?? []) {
          const msg = rule(vals[key], vals);
          if (msg) {
            out[key] = msg;
            break;
          }
        }
      }
      return out;
    },
    [rules],
  );

  const allErrors = validate(values);
  const errors: Errors<V> = {};
  for (const k of Object.keys(allErrors) as Array<keyof V>) {
    if (submitted || touched[k]) errors[k] = allErrors[k];
  }

  const setValue = useCallback(<K extends keyof V>(key: K, value: V[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const touch = useCallback((key: keyof V) => setTouched((t) => (t[key] ? t : { ...t, [key]: true })), []);

  /** Props for TextInput / TextArea / Select / DateInput bound to a string field. */
  const text = <K extends keyof V>(key: K) => ({
    name: String(key),
    value: (values[key] ?? "") as string,
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setValue(key, e.target.value as V[K]),
    onBlur: () => touch(key),
    error: errors[key],
  });

  /** Props for MoneyInput bound to a cents field (number | null | undefined). */
  const money = <K extends keyof V>(key: K) => ({
    name: String(key),
    valueCents: values[key] as number | null | undefined,
    onChangeCents: (c: number | null | undefined) => setValue(key, c as V[K]),
    onBlur: () => touch(key),
    error: errors[key],
  });

  /** Props for Checkbox bound to a boolean field. */
  const checkbox = <K extends keyof V>(key: K) => ({
    name: String(key),
    checked: Boolean(values[key]),
    onChange: (e: ChangeEvent<HTMLInputElement>) => setValue(key, e.target.checked as V[K]),
    error: errors[key],
  });

  const handleSubmit = async (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    setSubmitted(true);
    setSubmitError(null);
    const found = validate(values);
    if (Object.keys(found).length) {
      const form = e?.currentTarget;
      // Focus the first invalid control once React has rendered the errors.
      window.requestAnimationFrame(() => form?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not save. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = (next?: V) => {
    const v = next ?? initialRef.current;
    if (next) initialRef.current = next;
    setValues(v);
    setTouched({});
    setSubmitted(false);
    setSubmitError(null);
  };

  return {
    values,
    errors,
    isValid: Object.keys(allErrors).length === 0,
    setValue,
    text,
    money,
    checkbox,
    handleSubmit,
    submitting,
    submitError,
    reset,
  };
}

export default useForm;
