/** Formatting helpers for the staff pages (USD cents, dates, task labels). */
import type { CsmTaskType, MembershipStatus } from "@/lib/contracts";
import type { StatusTone } from "@/components/ui";

const USD = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
const USD0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

/** US$ from integer cents. `whole` drops the cents for large figures. */
export function usd(cents: number, whole = false): string {
  return `US${(whole ? USD0 : USD).format(cents / 100)}`;
}

const DATE = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const DATE_Y = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
const TIME = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

export function shortDate(iso?: string | null): string {
  if (!iso) return "Not set";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "Not set";
  return new Date(t).getFullYear() === new Date().getFullYear() ? DATE.format(t) : DATE_Y.format(t);
}

/** "Today 4:00 PM", "Tomorrow", "Overdue 2 days", "Oct 31". */
export function dueLabel(iso?: string | null, now = new Date()): { text: string; tone: StatusTone } {
  if (!iso) return { text: "No due date", tone: "neutral" };
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return { text: "No due date", tone: "neutral" };
  const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((day(new Date(t)) - day(now)) / 86400000);
  if (t < now.getTime()) {
    const late = Math.max(0, Math.floor((now.getTime() - t) / 86400000));
    return { text: late === 0 ? `Overdue since ${TIME.format(t)}` : `Overdue ${late} day${late === 1 ? "" : "s"}`, tone: "danger" };
  }
  if (diff === 0) return { text: `Today ${TIME.format(t)}`, tone: "warning" };
  if (diff === 1) return { text: `Tomorrow ${TIME.format(t)}`, tone: "info" };
  return { text: shortDate(iso), tone: "neutral" };
}

export const TASK_TYPE_LABEL: Record<CsmTaskType, string> = {
  onboarding: "Onboarding",
  follow_up: "Follow-up",
  missing_document: "Missing document",
  proposal: "Proposal",
  renewal: "Renewal",
  escalation: "Escalation",
  privacy: "Privacy request",
};

export const TASK_TYPE_TONE: Record<CsmTaskType, StatusTone> = {
  onboarding: "info",
  follow_up: "neutral",
  missing_document: "warning",
  proposal: "success",
  renewal: "info",
  escalation: "danger",
  privacy: "warning",
};

export const MEMBERSHIP_LABEL: Record<MembershipStatus, string> = {
  pending: "Pending payment",
  active: "Active",
  past_due: "Past due",
  cancelled: "Cancelled",
};

export const MEMBERSHIP_TONE: Record<MembershipStatus, StatusTone> = {
  pending: "warning",
  active: "success",
  past_due: "danger",
  cancelled: "neutral",
};

export function pct(v: number | null | undefined): string {
  return v == null ? "No data" : `${Number.isInteger(v) ? v : v.toFixed(1)}%`;
}

export function memberName(client: Record<string, unknown> | null | undefined, fallback = "Member"): string {
  if (!client) return fallback;
  const n = [client.name, client.surname].filter((x) => typeof x === "string" && x).join(" ");
  const p = (client.clientFields as Record<string, unknown> | undefined) ?? {};
  return n || (typeof p.fullName === "string" ? p.fullName : "") || (typeof client.email === "string" ? client.email : "") || fallback;
}

/** COMMS-P3: a member's page in the portal being used (/csm/book/<id> on the CSM portal, else /dashboard/members/<id>). */
export function memberHref(clientId: string): string {
  const csm = typeof window !== "undefined" && (window.location.pathname === "/csm" || window.location.pathname.startsWith("/csm/"));
  return `${csm ? "/csm/book" : "/dashboard/members"}/${encodeURIComponent(clientId)}`;
}
