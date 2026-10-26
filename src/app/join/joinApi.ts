/**
 * Join funnel API (W3): free deadline check, join, membership status.
 * Talks to server/API/leads and server/API/payments. No auth: these are the
 * public routes a visitor uses before they have an account.
 */

import { API_URL, ApiError } from "@/lib/api";
import { PLAN_STANDARD, type LeadFinding } from "@/lib/contracts";

export type CheckAnswers = {
  country: "CR";
  residencyStatus?: "resident" | "applying" | "visitor" | "unsure";
  residencyExpiresAt?: string;
  lastEntryDate?: string;
  ownsProperty?: boolean;
  propertyLocation?: string;
  companyType?: "SA" | "SRL" | "none" | "unsure";
  ownsVehicle?: boolean;
  hasEmployees?: boolean;
};

export interface CheckFinding extends LeadFinding {
  meaning: string;
}

export type PaymentsMode = "stripe" | "manual";

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include", // accept the HttpOnly portal cookie set after joining
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // empty body
  }
  if (!res.ok) {
    const msg = (data as { error?: string } | null)?.error ?? "Something went wrong. Please try again.";
    throw new ApiError(msg, res.status);
  }
  return data as T;
}

export function runCheck(answers: CheckAnswers, email?: string, name?: string) {
  return call<{ findings: CheckFinding[]; saved: boolean; leadId?: string }>(
    "/api/leads/deadline-check",
    { method: "POST", body: JSON.stringify({ answers, email, name }) },
  );
}

export async function getPlan(): Promise<{ mode: PaymentsMode }> {
  try {
    return await call<{ mode: PaymentsMode }>("/api/payments/plan");
  } catch {
    return { mode: "manual" };
  }
}

export interface JoinBody {
  email: string;
  fullName: string;
  phone?: string;
  leadId?: string;
  acceptTerms: boolean;
  /** P2 funnel: anonymous browser id + first-touch source (no PII). */
  anonId?: string;
  source?: string;
}

export function join(body: JoinBody) {
  return call<{ mode: PaymentsMode; token: string; status: string; checkoutUrl?: string }>(
    "/api/payments/join",
    { method: "POST", body: JSON.stringify(body) },
  );
}

export interface JoinStatus {
  status: "pending" | "active" | "past_due" | "cancelled";
  mode: PaymentsMode;
  email: string;
  projectId: string;
  newClient: boolean;
  minutesIncluded: number;
  callsIncluded: number;
  periodEnd?: string;
}

export function joinStatus(token: string) {
  return call<JoinStatus>(`/api/payments/join/${encodeURIComponent(token)}`);
}

export function portalSession(token: string) {
  return call<{ token?: string; loginRequired?: boolean; projectId: string; email: string }>(
    `/api/payments/join/${encodeURIComponent(token)}/portal-session`,
    { method: "POST" },
  );
}

// ─── Check → join hand-over (per-tab, survives a reload) ───────────────────

const KEY = "ilp_check";

export interface StoredCheck {
  answers: CheckAnswers;
  findings: CheckFinding[];
  email?: string;
  leadId?: string;
}

export function saveCheck(v: StoredCheck): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    // storage unavailable: the join form simply starts empty
  }
}

export function loadCheck(): StoredCheck | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoredCheck) : null;
  } catch {
    return null;
  }
}

// ─── Formatting ────────────────────────────────────────────────────────────

export const usd = (cents: number) =>
  `US$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;

export const PRICE = {
  monthly: usd(PLAN_STANDARD.monthlyCents),
  activation: usd(PLAN_STANDARD.activationCents),
  dueToday: usd(PLAN_STANDARD.monthlyCents + PLAN_STANDARD.activationCents),
  minutes: PLAN_STANDARD.minutesIncluded,
  calls: PLAN_STANDARD.callsIncluded,
  callLength: PLAN_STANDARD.callLengthMin,
};

export function longDate(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
