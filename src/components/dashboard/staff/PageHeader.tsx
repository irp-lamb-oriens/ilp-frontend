import type { ReactNode } from "react";
import { ErrorNotice } from "@/components/ui";
import s from "./staff.module.scss";

/** Page title row used by every /dashboard route (the shell holds no title). */
export function PageHeader({ title, sub, actions }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode }) {
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
