import type { ReactNode } from "react";
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

export function ErrorText({ children }: { children: ReactNode }) {
  return (
    <p className={s.error} role="alert">
      {children}
    </p>
  );
}

export function Muted({ children }: { children: ReactNode }) {
  return <p className={s.muted}>{children}</p>;
}
