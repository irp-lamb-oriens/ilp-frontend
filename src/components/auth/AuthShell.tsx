"use client";

import type { FormEvent, ReactNode } from "react";
import Image from "next/image";
import AuthButton from "./AuthButton";
import styles from "./authShell.module.scss";
import { Notice, type NoticeFix } from "@/components/ui";

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
  busyLabel?: string;
  onSubmit: (e: FormEvent) => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  secondaryVisible?: boolean;
  brand?: BrandProps;
}

/** Steps shown under any sign-in failure (wrong code, expired code, too many tries, no connection). */
const SIGN_IN_FIX: NoticeFix = {
  steps: [
    "Check that the email address is the one ILP has for you, with no typing mistake.",
    "Codes expire after 10 minutes and work once. If yours is older, press Send a new code or Use a different email and send again.",
    "Look for the code email in your spam or promotions folder.",
    "After several wrong tries, wait a few minutes before you try again.",
    "Still stuck? Write to the ILP person who invited you, or reply to any ILP email.",
  ],
};

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
  busyLabel,
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

          {notice && <Notice tone="success" variant="inline" title={notice} />}
          {error && (
            <Notice tone="danger" variant="inline" urgent title={error} fix={SIGN_IN_FIX} />
          )}

          <AuthButton
            type="submit"
            variant="primary"
            busy={busy}
            busyLabel={busyLabel}
          >
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