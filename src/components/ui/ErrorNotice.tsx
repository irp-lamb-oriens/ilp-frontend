"use client";

/**
 * A failure message as a danger Notice with the standard "How to fix this"
 * steps for the person who sees it. Use it for a section that failed to load
 * or an action the server refused; field validation stays on <Field error>.
 */
import type { ReactNode } from "react";
import { Button } from "./Button";
import { Notice, type NoticeFix, type NoticeVariant } from "./Notice";

export type NoticeAudience = "staff" | "lawyer" | "member";

export interface ErrorNoticeProps {
  /** The message from the server or the component (already plain language). */
  children: ReactNode;
  title?: string;
  audience: NoticeAudience;
  /** Shows "Try again" as the direct fix. */
  onRetry?: () => void;
  retryLabel?: string;
  variant?: NoticeVariant;
  /** Announce at once (default true: errors follow something the person did). */
  urgent?: boolean;
  /** Extra steps that come before the standard ones. */
  steps?: string[];
  className?: string;
}

const WHO: Record<NoticeAudience, string> = {
  staff: "If it keeps happening, send the message above and the page address to an ILP admin so they can check the server.",
  lawyer: "If it keeps happening, email your ILP contact with the message above. Your saved work is not lost.",
  member: "If it keeps happening, write to your ILP team from Messages. Nothing you saved before is lost.",
};

/** The standard steps for a failure, for one audience. */
export function errorFix(audience: NoticeAudience, opts: { retry?: boolean; steps?: string[] } = {}): NoticeFix {
  return {
    summary: "Most of the time this is a short connection problem.",
    steps: [
      ...(opts.steps ?? []),
      opts.retry ? "Press Try again." : "Reload the page (the round arrow at the top of your browser).",
      "Check that you are connected to the internet. If you are on a phone, try Wi-Fi.",
      WHO[audience],
    ],
  };
}

export function ErrorNotice({
  children,
  title = "That did not work",
  audience,
  onRetry,
  retryLabel = "Try again",
  variant = "inline",
  urgent = true,
  steps,
  className,
}: ErrorNoticeProps) {
  return (
    <Notice
      tone="danger"
      variant={variant}
      urgent={urgent}
      title={title}
      className={className}
      actions={
        onRetry ? (
          <Button size="sm" variant="secondary" onClick={onRetry}>
            {retryLabel}
          </Button>
        ) : undefined
      }
      fix={errorFix(audience, { retry: !!onRetry, steps })}
    >
      {children}
    </Notice>
  );
}

export default ErrorNotice;
