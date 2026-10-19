"use client";

import type { InputHTMLAttributes } from "react";
import styles from "./authShell.module.scss";

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string | null;
  inputRef?: React.Ref<HTMLInputElement>;
}

/**
 * Modular auth input field. Owns the label, input, hint, and inline error so
 * every auth surface (dashboard, client status, lawyer) renders the same
 * field with the same interaction states instead of duplicating markup.
 */
export default function AuthField({
  label,
  hint,
  error,
  inputRef,
  className,
  ...inputProps
}: AuthFieldProps) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <input
        ref={inputRef}
        className={`${styles.input}${error ? ` ${styles.inputError}` : ""}${
          className ? ` ${className}` : ""
        }`}
        aria-invalid={error ? true : undefined}
        {...inputProps}
      />
      {hint && !error && <span className={styles.hint}>{hint}</span>}
      {error && <span className={styles.fieldError}>{error}</span>}
    </label>
  );
}