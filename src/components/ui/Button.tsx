"use client";

import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";
import s from "./Button.module.scss";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "md" | "sm";

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Stretch to the container width. */
  block?: boolean;
  /** Shows a spinner and blocks clicks. Label stays for screen readers. */
  busy?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
}

export type ButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement>;

function classes({ variant = "primary", size = "md", block, busy }: CommonProps, extra?: string) {
  return cx(s.button, s[variant], s[size], block && s.block, busy && s.busy, extra);
}

/** Button with primary / secondary / ghost / danger variants. 44px tall at md. */
export function Button({
  variant,
  size,
  block,
  busy = false,
  icon,
  children,
  className,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={classes({ variant, size, block, busy }, className)}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      {...rest}
    >
      {busy && <span className={s.spinner} aria-hidden="true" />}
      {!busy && icon && <span className={s.icon} aria-hidden="true">{icon}</span>}
      {children && <span>{children}</span>}
    </button>
  );
}

export type ButtonLinkProps = CommonProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    /** next/link prefetch. Default (auto) prefetches up to the route's loading.tsx; true prefetches the whole page. */
    prefetch?: boolean | null;
  };

/** Same look as Button, rendered as a Next.js link. */
export function ButtonLink({
  variant,
  size,
  block,
  icon,
  children,
  className,
  href,
  prefetch,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link href={href} prefetch={prefetch} className={classes({ variant, size, block }, className)} {...rest}>
      {icon && <span className={s.icon} aria-hidden="true">{icon}</span>}
      {children && <span>{children}</span>}
    </Link>
  );
}

export default Button;
