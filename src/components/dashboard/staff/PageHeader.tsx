"use client";

import type { ReactNode } from "react";
import { ErrorNotice } from "@/components/ui";
import { useIntroTitleShown } from "./ScreenIntro";
import s from "./staff.module.scss";

/**
 * Page title row used by every /dashboard route (the shell holds no title).
 * Under a ScreenIntro the intro already shows the title, so this renders
 * only the status line ("3 open tasks, 1 overdue") and the page actions.
 */
export function PageHeader({ title, sub, actions }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode }) {
  const introShown = useIntroTitleShown();
  if (introShown) {
    if (!sub && !actions) return null;
    return (
      <div className={s.statusRow}>
        {sub ? (
          <p className={s.status} role="status">
            {sub}
          </p>
        ) : (
          <span />
        )}
        {actions && <div className={s.actions}>{actions}</div>}
      </div>
    );
  }
  return (
    <div className={s.head}>
      <div className={s.headText}>
        <h1 className={s.title}>{title}</h1>
        {sub && <p className={s.sub}>{sub}</p>}
      </div>
      {actions && <div className={s.actions}>{actions}</div>}
    </div>
  );
}

/** A staff page's failure line, as a danger notice with the standard staff fix steps. */
export function ErrorText({ children, onRetry }: { children: ReactNode; onRetry?: () => void }) {
  return (
    <ErrorNotice audience="staff" onRetry={onRetry}>
      {children}
    </ErrorNotice>
  );
}

/**
 * A block heading that says what the block is, with one optional line on
 * what to do with it. h2 by default; pass `level={3}` inside a section.
 */
export function SectionHead({ title, sub, id, level = 2, actions }: { title: ReactNode; sub?: ReactNode; id?: string; level?: 2 | 3; actions?: ReactNode }) {
  const H = level === 3 ? "h3" : "h2";
  return (
    <div className={s.sectionHead}>
      <div className={s.headText}>
        <H id={id} className={s.sectionTitle}>
          {title}
        </H>
        {sub && <p className={s.sectionSub}>{sub}</p>}
      </div>
      {actions && <div className={s.actions}>{actions}</div>}
    </div>
  );
}

/** One line at the top of a tab: what this tab shows and what to do in it. */
export function TabNote({ children }: { children: ReactNode }) {
  return (
    <p className={s.tabNote}>
      <svg className={s.tabNoteIcon} width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.3" />
        <path d="M8 7.25v4M8 4.9v.1" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <span>{children}</span>
    </p>
  );
}

export function Muted({ children }: { children: ReactNode }) {
  return <p className={s.muted}>{children}</p>;
}
