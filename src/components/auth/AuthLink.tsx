"use client";

import type { AnchorHTMLAttributes } from "react";
import styles from "./authShell.module.scss";

interface AuthLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: "inline" | "standalone";
}

const VARIANT_CLASS = {
  inline: styles.inlineLink,
  standalone: styles.standaloneLink,
} as const;

/**
 * Modular auth link. Centralizes the inline (within copy) and standalone
 * (full-width secondary action) link variants with a shared interaction
 * model: hover, focus-visible, active, and visited.
 */
export default function AuthLink({
  variant = "inline",
  className,
  children,
  ...anchorProps
}: AuthLinkProps) {
  return (
    <a
      className={`${VARIANT_CLASS[variant]}${className ? ` ${className}` : ""}`}
      {...anchorProps}
    >
      {children}
    </a>
  );
}