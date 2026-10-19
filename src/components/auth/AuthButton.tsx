"use client";

import type { ButtonHTMLAttributes } from "react";
import styles from "./authShell.module.scss";

type Variant = "primary" | "secondary" | "ghost";

interface AuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  busy?: boolean;
  busyLabel?: string;
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary: styles.primary,
  secondary: styles.secondary,
  ghost: styles.ghost,
};

/**
 * Modular auth button. Centralizes the primary / secondary / ghost variants
 * plus the busy (loading) state so every auth surface shares one interaction
 * model: hover, focus-visible, active, disabled, and busy.
 */
export default function AuthButton({
  variant = "primary",
  busy = false,
  busyLabel = "Please wait…",
  children,
  className,
  disabled,
  ...buttonProps
}: AuthButtonProps) {
  return (
    <button
      type="button"
      className={`${VARIANT_CLASS[variant]}${className ? ` ${className}` : ""}`}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      {...buttonProps}
    >
      {busy ? (
        <span className={styles.busyWrap}>
          <span className={styles.spinner} aria-hidden="true" />
          {busyLabel}
        </span>
      ) : (
        children
      )}
    </button>
  );
}