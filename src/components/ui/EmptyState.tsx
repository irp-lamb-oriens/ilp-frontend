import type { ReactNode } from "react";
import { cx } from "./cx";
import s from "./EmptyState.module.scss";

export interface EmptyStateProps {
  title: string;
  /** What will show here, and how to get it there. */
  body?: ReactNode;
  action?: ReactNode;
  /** Compact variant for inside tables and drawers. */
  compact?: boolean;
  className?: string;
}

/** Says what is missing and what to do next. No illustration, no ghost data. */
export function EmptyState({ title, body, action, compact, className }: EmptyStateProps) {
  return (
    <div className={cx(s.empty, compact && s.compact, className)} role="status">
      <p className={s.title}>{title}</p>
      {body && <p className={s.body}>{body}</p>}
      {action && <div className={s.action}>{action}</div>}
    </div>
  );
}

export default EmptyState;
