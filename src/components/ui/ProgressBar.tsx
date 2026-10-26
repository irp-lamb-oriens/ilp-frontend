import { cx } from "./cx";
import s from "./ProgressBar.module.scss";

export interface ProgressBarProps {
  /** Visible label, e.g. "Profile complete". */
  label: string;
  /** 0..1 fraction, or a raw value with `max`. */
  value: number;
  max?: number;
  /** Replace the default "47%" readout, e.g. "40 of 60 min left". */
  valueText?: string;
  tone?: "accent" | "success" | "warning";
  className?: string;
}

/**
 * Labelled progress bar with a percentage readout. Native <progress>, so no
 * inline width style is needed (rules.md section 10).
 */
export function ProgressBar({ label, value, max = 1, valueText, tone = "accent", className }: ProgressBarProps) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const pct = Math.round(ratio * 100);
  const text = valueText ?? `${pct}%`;
  return (
    <div className={cx(s.wrap, className)}>
      <div className={s.row}>
        <span className={s.label}>{label}</span>
        <span className={s.value}>{text}</span>
      </div>
      <progress
        className={cx(s.track, s[tone])}
        value={pct}
        max={100}
        aria-label={label}
        aria-valuetext={text}
      >
        {text}
      </progress>
    </div>
  );
}

export default ProgressBar;
