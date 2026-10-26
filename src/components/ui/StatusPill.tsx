import { cx } from "./cx";
import s from "./StatusPill.module.scss";

export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";

export interface StatusPillProps {
  /** Required: state is always spelled out, never a bare colored dot. */
  label: string;
  tone?: StatusTone;
  size?: "md" | "sm";
  className?: string;
  /** Extra context for screen readers, e.g. "Membership status". */
  srPrefix?: string;
}

/** Labeled status pill. Color supports the text, it never replaces it. */
export function StatusPill({ label, tone = "neutral", size = "md", className, srPrefix }: StatusPillProps) {
  return (
    <span className={cx(s.pill, s[tone], s[size], className)}>
      {srPrefix && <span className={s.sr}>{srPrefix}: </span>}
      {label}
    </span>
  );
}

export default StatusPill;
