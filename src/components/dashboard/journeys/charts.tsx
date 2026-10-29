"use client";

/**
 * Journeys charts: plain SVG marks inside tables, so every value is also
 * written as text next to its bar (no meaning by color alone). Navy is the
 * base series, the light-blue accent marks the one value being compared,
 * the track is mist. No inline styles: sizes are SVG attributes.
 */
import s from "./journeys.module.scss";

const clamp = (v: number) => (Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0);

/** A horizontal share bar, 0..1. */
export function Bar({ value, tone = "navy" }: { value: number; tone?: "navy" | "accent" | "soft" }) {
  const w = clamp(value) * 100;
  return (
    <svg className={s.bar} viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <rect className={s.barTrack} x="0" y="0" width="100" height="12" rx="2" />
      {w > 0 && <rect className={tone === "accent" ? s.barAccent : tone === "soft" ? s.barSoft : s.barFill} x="0" y="0" width={Math.max(w, 0.8)} height="12" rx="2" />}
    </svg>
  );
}

/** Median (navy) then the extra time up to p75 (light), on a shared scale. */
export function RangeBar({ median, p75, max }: { median: number | null; p75: number | null; max: number }) {
  if (!max || median === null) return <Bar value={0} />;
  const m = clamp(median / max) * 100;
  const p = clamp((p75 ?? median) / max) * 100;
  return (
    <svg className={s.rangeBar} viewBox="0 0 100 14" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <rect className={s.barTrack} x="0" y="0" width="100" height="14" rx="2" />
      {p > m && <rect className={s.barSoft} x="0" y="0" width={p} height="14" rx="2" />}
      <rect className={s.barFill} x="0" y="0" width={Math.max(m, 0.8)} height="14" rx="2" />
    </svg>
  );
}

/** A 95% interval on a shared scale, with the rate marked and the control's rate dashed. */
export function CiBar({ lo, hi, rate, min, max, control, accent }: { lo: number; hi: number; rate: number; min: number; max: number; control: number | null; accent?: boolean }) {
  const span = max - min || 1;
  const x = (v: number) => ((clamp((v - min) / span) * 96) + 2).toFixed(2);
  return (
    <svg className={s.ci} viewBox="0 0 100 22" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      {control !== null && <line className={s.ciControl} x1={x(control)} x2={x(control)} y1="0" y2="22" />}
      <line className={accent ? s.ciLineAccent : s.ciLine} x1={x(lo)} x2={x(hi)} y1="11" y2="11" />
      <rect className={accent ? s.ciMarkAccent : s.ciMark} x={Number(x(rate)) - 1} y="5" width="2" height="12" />
    </svg>
  );
}
