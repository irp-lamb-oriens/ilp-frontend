/** Plain-language formatting for the member home. Costa Rica time throughout. */

import type { Who } from "./api";

const TZ = "America/Costa_Rica";

export function dateLong(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: TZ });
}

export function dateShort(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const sameYear = d.getUTCFullYear() === new Date().getUTCFullYear();
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", ...(sameYear ? {} : { year: "numeric" }), timeZone: TZ });
}

export function timeOfDay(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ });
}

export function dayKey(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: TZ });
}

/** Whole days from today (CR) to the date; negative when past. */
export function daysUntil(iso?: string | null): number | null {
  if (!iso) return null;
  const a = new Date(dayKey(new Date().toISOString()));
  const b = new Date(dayKey(iso));
  return Math.round((b.getTime() - a.getTime()) / 86400_000);
}

/** "today", "tomorrow", "in 5 days", "3 days ago" — or a date beyond two weeks. */
export function relativeDue(iso?: string | null): string {
  const n = daysUntil(iso);
  if (n === null) return "";
  if (n === 0) return "today";
  if (n === 1) return "tomorrow";
  if (n === -1) return "yesterday";
  if (n < 0) return `${-n} days ago`;
  if (n <= 14) return `in ${n} days`;
  if (n <= 60) return `in ${Math.round(n / 7)} weeks`;
  return `in ${Math.round(n / 30)} months`;
}

export function money(cents: number | null | undefined, currency = "USD"): string {
  if (cents === null || cents === undefined) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);
}

export function whoLabel(who: Who, lawyerName?: string | null): string {
  if (who === "client") return "You";
  if (who === "lawyer") return lawyerName ? lawyerName : "Your lawyer";
  return "Your ILP team";
}

/** Plain-language copy for the pipeline stage ids (stageDefaults.ts). */
export const STAGE_COPY: Record<string, { label: string; body: string }> = {
  scoping: { label: "Understanding your situation", body: "We work out what applies to you and which documents are needed." },
  legal_review: { label: "Lawyer review", body: "Your lawyer is reviewing your situation and documents." },
  quote_sent: { label: "Proposal ready", body: "Paid legal work is suggested. Read the proposal and accept it if you want to go ahead." },
  quote_accepted: { label: "Work agreed", body: "You accepted the proposal. Your team is getting started." },
  filing: { label: "Work in progress", body: "Your lawyer is preparing or filing the paperwork." },
  closed: { label: "Done", body: "This matter is complete. Ask us anytime if something changes." },
};

export function stageCopy(id: string, fallback?: { label: string; description?: string }) {
  return STAGE_COPY[id] ?? { label: fallback?.label ?? id, body: fallback?.description ?? "" };
}

export const AREA_LABEL: Record<string, string> = {
  corporate: "Company",
  property: "Property",
  immigration: "Residency",
  vehicle: "Vehicle",
  tax: "Tax",
  family: "Family",
};

export function areaLabel(area?: string): string {
  if (!area) return "";
  return AREA_LABEL[area] ?? area.charAt(0).toUpperCase() + area.slice(1);
}
