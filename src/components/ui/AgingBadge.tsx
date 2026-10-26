import { StatusPill, type StatusTone } from "./StatusPill";

export type AgingLevel = "ok" | "warn" | "overdue";

export interface AgingBadgeProps {
  /** ISO timestamp the item entered its current stage. */
  since?: string;
  /** Or pass the day count directly. */
  days?: number;
  /** Days at which the badge turns to warning. Default 7. */
  warnAfterDays?: number;
  /** Days at which the badge turns to overdue. Default 14. */
  overdueAfterDays?: number;
  /** Suffix after the count. Default "in stage". */
  suffix?: string;
  /** Reference time, for tests and demos. Default now. */
  now?: Date;
  className?: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function agingDays(since: string, now: Date = new Date()): number {
  const t = Date.parse(since);
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.floor((now.getTime() - t) / DAY_MS));
}

export function agingLevel(days: number, warnAfterDays = 7, overdueAfterDays = 14): AgingLevel {
  if (days >= overdueAfterDays) return "overdue";
  if (days >= warnAfterDays) return "warn";
  return "ok";
}

const TONE: Record<AgingLevel, StatusTone> = { ok: "neutral", warn: "warning", overdue: "danger" };
const WORD: Record<AgingLevel, string> = { ok: "", warn: "Aging", overdue: "Overdue" };

/** Days in stage, with ok / warn / overdue thresholds. Always text, never color alone. */
export function AgingBadge({
  since,
  days: daysProp,
  warnAfterDays = 7,
  overdueAfterDays = 14,
  suffix = "in stage",
  now,
  className,
}: AgingBadgeProps) {
  const days = daysProp ?? (since ? agingDays(since, now) : 0);
  const level = agingLevel(days, warnAfterDays, overdueAfterDays);
  const count = days === 1 ? "1 day" : `${days} days`;
  const label = WORD[level] ? `${WORD[level]} · ${count} ${suffix}` : `${count} ${suffix}`;
  return <StatusPill label={label} tone={TONE[level]} size="sm" className={className} />;
}

export default AgingBadge;
