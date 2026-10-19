"use client";

import type { FormEvent, ReactNode } from "react";
import Image from "next/image";
import AuthButton from "./AuthButton";
import styles from "./authShell.module.scss";

interface BrandProps {
  src: string;
  name: string;
  sub: string;
}

interface AuthShellProps {
  title: string;
  sub?: ReactNode;
  children?: ReactNode;
  notice?: string | null;
  error?: string | null;
  primaryLabel: string;
  busy?: boolean;
  onSubmit: (e: FormEvent) => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  secondaryVisible?: boolean;
  brand?: BrandProps;
}

/**
 * Shared OTP auth chrome for the staff dashboard and client status portal.
 * Renders the centered card, optional brand block, title, subcopy, form
 * fields (via children), notice/error lines, and the primary + optional
 * secondary actions.
 */
export default function AuthShell({
  title,
  sub,
  children,
  notice,
  error,
  primaryLabel,
  busy = false,
  onSubmit,
  secondaryLabel,
  onSecondary,
  secondaryVisible = false,
  brand,
}: AuthShellProps) {
  return (
    <main className={styles.auth}>
      <div className={styles.authCard}>
        {brand && (
          <div className={styles.brand}>
            <Image
              src={brand.src}
              alt={brand.name}
              width={48}
              height={48}
              className={styles.logo}
              priority
            />
            <div className={styles.brandText}>
              <h1 className={styles.title}>{title}</h1>
              <p className={styles.brandSub}>{brand.sub}</p>
            </div>
          </div>
        )}

        {!brand && <h1 className={styles.title}>{title}</h1>}

        <form className={styles.form} onSubmit={onSubmit}>
          {sub && <p className={styles.sub}>{sub}</p>}

          {children}

          {notice && <p className={styles.notice}>{notice}</p>}
          {error && <p className={styles.error}>{error}</p>}

          <AuthButton type="submit" variant="primary" busy={busy}>
            {primaryLabel}
          </AuthButton>

          {secondaryVisible && onSecondary && (
            <AuthButton
              type="button"
              variant="secondary"
              onClick={onSecondary}
            >
              {secondaryLabel}
            </AuthButton>
          )}
        </form>
      </div>
      <footer className={styles.footer}>
        <p>
          © {new Date().getFullYear()} International Legal Partner. All rights
          reserved.
        </p>
      </footer>
    </main>
  );
}