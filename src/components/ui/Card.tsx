import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";
import s from "./Card.module.scss";

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title?: ReactNode;
  /** Short mono label above the title. Use sparingly (rules.md section 3). */
  eyebrow?: string;
  /** Right-aligned header slot, e.g. a ghost button. */
  actions?: ReactNode;
  footer?: ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
  /** Mist-tinted surface for secondary content. */
  tone?: "default" | "mist" | "accent";
  as?: "section" | "article" | "div" | "aside";
}

/** White surface, hairline border, flat radius, whisper shadow. */
export function Card({
  title,
  eyebrow,
  actions,
  footer,
  padding = "md",
  tone = "default",
  as: Tag = "section",
  className,
  children,
  ...rest
}: CardProps) {
  const hasHead = title || eyebrow || actions;
  return (
    <Tag className={cx(s.card, s[`pad-${padding}`], s[tone], className)} {...rest}>
      {hasHead && (
        <header className={s.head}>
          <div className={s.headText}>
            {eyebrow && <span className={s.eyebrow}>{eyebrow}</span>}
            {title && <h3 className={s.title}>{title}</h3>}
          </div>
          {actions && <div className={s.actions}>{actions}</div>}
        </header>
      )}
      <div className={s.body}>{children}</div>
      {footer && <footer className={s.footer}>{footer}</footer>}
    </Tag>
  );
}

export default Card;
