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

export function Muted({ children }: { children: ReactNode }) {
  return <p className={s.muted}>{children}</p>;
}
