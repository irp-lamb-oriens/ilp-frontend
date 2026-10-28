/**
 * lib/deadlines.ts — DEADLINES: shared helpers for deadline cards.
 *
 * The same cards show the free check's results (/check), the member's own
 * deadlines (/status/deadlines) and the "Add more deadlines" picker. Items
 * come from the server's rules (API/countries/rules) through three routes:
 * the check's findings, GET /api/client-status/me/deadlines and
 * GET /api/client-status/me/deadlines/available.
 */

import type { CountryCode, ObligationSource } from "./contracts";

/** One card: a rule that may apply, with its date when there is one. */
export interface DeadlineCardItem {
  /** Rule id (check and picker) or obligation id (the member's list). */
  id: string;
  area: string;
  title: string;
  meaning: string;
  authority?: string;
  confidence?: "high" | "medium" | "low";
  dueAt?: string;
  windowStartAt?: string;
  dueText?: string;
  /** Picker only: the rule matches the person's answers. */
  matches?: boolean;
}

/** A row on /status/deadlines (server API/members/deadlines.ts DeadlineView). */
export interface DeadlineRow {
  id: string;
  clientId: string;
  country: CountryCode;
  countryName: string;
  ruleId: string;
  title: string;
  area: string;
  meaning: string;
  authority: string;
  status: "upcoming" | "asked" | "handled" | "dismissed";
  source: ObligationSource;
  confidence?: "high" | "medium" | "low";
  dueAt?: string;
  windowStartAt?: string;
  dueText?: string;
  userDueAt?: string | null;
  shownDueAt: string | null;
  suggestedDueAt: string | null;
  hasDate: boolean;
  needsDate: boolean;
  remind: boolean;
  notes?: string;
  group: "soon" | "later" | "needsDate" | "done";
}

export const AREA_LABELS: Record<string, string> = {
  immigration: "Residency and visas",
  property: "Property",
  corporate: "Your company",
  tax: "Taxes",
  vehicle: "Vehicle",
  employment: "People who work for you",
  estate: "Family and estate",
  identity: "IDs and registrations",
  cross_border: "Home-country filings",
};
export const AREA_ORDER = ["immigration", "property", "corporate", "tax", "vehicle", "employment", "estate", "identity", "cross_border"];

/** The rules' titles end "may require review"; the cards show that as a pill instead. */
export function cardTitle(title: string): string {
  const t = title.replace(/[\s,;:.]*\(?\s*may require review\s*\)?\.?\s*$/i, "").trim();
  return t || title;
}

export function longDate(iso?: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

/** The date line of a card: a window, one date, "Ask your lawyer to confirm this date", or "No fixed date". */
export function cardDateLine(i: Pick<DeadlineCardItem, "dueAt" | "windowStartAt" | "confidence">): string {
  if (i.confidence === "low") return "Ask your lawyer to confirm this date";
  if (!i.dueAt) return "No fixed date";
  if (i.windowStartAt && i.windowStartAt.slice(0, 10) < i.dueAt.slice(0, 10)) return `Between ${longDate(i.windowStartAt)} and ${longDate(i.dueAt)}`;
  return longDate(i.dueAt);
}

/** Cards grouped by area, in the fixed area order. */
export function groupByArea<T extends { area: string }>(items: T[]): Array<[string, T[]]> {
  const by = new Map<string, T[]>();
  for (const i of items) by.set(i.area, [...(by.get(i.area) ?? []), i]);
  const rank = (a: string) => (AREA_ORDER.indexOf(a) < 0 ? 99 : AREA_ORDER.indexOf(a));
  return [...by.entries()].sort((a, b) => rank(a[0]) - rank(b[0]));
}

/**
 * The check's starting selection: dated items (their conditions matched
 * your answers) are included; items with no fixed date start skipped, so the
 * person picks the ones that apply.
 */
export function defaultSelection(items: Array<Pick<DeadlineCardItem, "id" | "dueAt" | "confidence">>): Set<string> {
  return new Set(items.filter((i) => !!i.dueAt && i.confidence !== "low").map((i) => i.id));
}

// ─── Check → sign-in hand-over (sessionStorage, per tab) ──────────────────

export const PENDING_DEADLINES_KEY = "ilp_pending_deadlines";

export interface PendingDeadlines {
  email: string;
  country: CountryCode;
  ruleIds: string[];
  claimToken?: string;
  count: number;
  savedAt: string;
}

export function savePendingDeadlines(v: PendingDeadlines): void {
  try {
    window.sessionStorage.setItem(PENDING_DEADLINES_KEY, JSON.stringify(v));
  } catch {
    // storage unavailable: the server already saved the deadlines
  }
}

export function loadPendingDeadlines(): PendingDeadlines | null {
  try {
    const raw = window.sessionStorage.getItem(PENDING_DEADLINES_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as PendingDeadlines;
    // A hand-over older than a day is stale.
    return v && typeof v.email === "string" && Date.now() - Date.parse(v.savedAt) < 86_400_000 ? v : null;
  } catch {
    return null;
  }
}

export function clearPendingDeadlines(): void {
  try {
    window.sessionStorage.removeItem(PENDING_DEADLINES_KEY);
  } catch {
    // nothing to clear
  }
}
