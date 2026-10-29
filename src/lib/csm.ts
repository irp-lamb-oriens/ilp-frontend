/**
 * lib/csm.ts — CSM portal client (COMMS-P3): response types, the book scope
 * in the URL (?csm=, ?unassigned=1) and the health pill wording.
 * Server: API/csm/csmRouter.ts. Every call goes through `csmApi` (the CSM
 * session); staff and admins who open /csm sign in there with their staff email.
 */

import { csmApi } from "./api";
import type { CsmContact, CsmPlaybookId, CsmTask, HealthBand, HealthScore, MembershipStatus, Obligation, Opportunity } from "./contracts";
import type { StatusTone } from "@/components/ui";

export type StaffRoleName = "staff" | "csm" | "admin";

export interface CsmMe {
  viewer: string;
  role: StaffRoleName;
  csm: string;
  canSwitch: boolean;
  csms: string[];
}

export interface BookRow {
  clientId: string;
  membershipId: string;
  name: string;
  email: string;
  status: MembershipStatus;
  country: string;
  csmEmail: string | null;
  unassigned: boolean;
  activatedAt: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  completeness: number;
  consultationReady: boolean;
  callsUsed: number;
  callsIncluded: number;
  minutesUsed: number;
  minutesIncluded: number;
  openTasks: number;
  overdueTasks: number;
  lastContactAt: string | null;
  daysSinceContact: number | null;
  deadlines14d: number;
  openQuotes: number;
  lastActivityAt: string | null;
  health: HealthScore;
  healthScore: number;
  healthBand: HealthBand;
  placeholder: boolean;
}

export interface QueueItem extends CsmTask {
  memberName: string;
  overdue: boolean;
  dueToday: boolean;
  health: HealthScore | null;
  placeholder: boolean;
}

export interface NewMember {
  clientId: string;
  name: string;
  activatedAt: string | null;
  health: HealthScore;
  lastContactAt: string | null;
  firstContactDueAt: string | null;
  firstContactOverdue: boolean;
}

export interface TodayResponse {
  csm: string;
  counts: { overdue: number; dueToday: number; later: number; newMembers: number; atRisk: number; firstContactsDue: number };
  queue: QueueItem[];
  newMembers: NewMember[];
  atRisk: BookRow[];
}

export type StepState = "done" | "due" | "overdue" | "waiting";

export interface OnboardingRow {
  clientId: string;
  name: string;
  activatedAt: string | null;
  daysSinceJoin: number;
  firstContact: { state: StepState; at: string | null; dueAt: string | null };
  profile: { state: StepState; completeness: number };
  callBooked: { state: StepState; at: string | null };
  callDone: { state: StepState; at: string | null };
  progress: number;
  health: HealthScore;
}

export interface ReadinessCheck {
  code: "profile" | "question" | "consent" | "lawyer" | "link";
  ok: boolean;
  text: string;
}

export interface CallRow {
  id: string;
  clientId: string;
  name: string;
  scheduledAt: string;
  providerId: string;
  status: string;
  checks?: ReadinessCheck[];
  ready?: boolean;
  missing?: string[];
  rebooked?: boolean;
}

export interface CallsResponse {
  upcoming: CallRow[];
  wrapUp: CallRow[];
  noShows: CallRow[];
  lawyers: Record<string, string>;
}

export interface RiskItem {
  clientId: string;
  name: string;
  detail: string;
  at: string | null;
  health: HealthScore;
}

export interface RiskResponse {
  renewals7d: RiskItem[];
  pastDue: RiskItem[];
  cancelRequested: RiskItem[];
  lowScores: RiskItem[];
  inactive30d: RiskItem[];
}

export interface DeadlineRow {
  id: string;
  clientId: string;
  name: string;
  title: string;
  dueAt: string | null;
  daysLeft: number | null;
  status: Obligation["status"];
  needsDate: boolean;
  area: string;
}

export interface QuoteRow {
  clientId: string;
  name: string;
  quoteId: string;
  title: string;
  cents: number;
  sentAt: string;
  daysWaiting: number;
}

export interface OpportunityRow {
  id: string;
  clientId: string;
  name: string;
  title: string;
  stage: Opportunity["stage"];
  valueCents: number | null;
  nextAction: string | null;
  nextActionDueAt: string | null;
  overdue: boolean;
}

export interface MessageRow {
  id: string;
  kind: "message" | "upload";
  clientId: string;
  name: string;
  at: string;
  text: string;
  answered: boolean;
}

export interface Kpi {
  value: number | null;
  hint: string;
  target?: number;
  unit: "hours" | "percent" | "count";
}

export interface KpisResponse {
  bookSize: number;
  atRisk: number;
  timeToFirstContact: Kpi;
  firstContactInSla: Kpi;
  handoffSla: Kpi;
  bookRetention: Kpi;
  readyIn7Days: Kpi;
  tasksOnTime: Kpi;
  contacts7d: Kpi;
}

export interface Playbook {
  id: CsmPlaybookId;
  title: string;
  when: string;
  steps: string[];
  emailClass: "transactional" | "service" | "marketing";
  email: { subject: string; paragraphs: string[]; cta?: { label: string; path: string } };
  edited?: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export interface MemberCsmView {
  clientId: string;
  csmEmail: string | null;
  mine: boolean;
  health: HealthScore | null;
  row: BookRow | null;
  contacts: CsmContact[];
  email: { optOut: boolean; marketingConsent: boolean | null };
  playbooks: Array<{ id: CsmPlaybookId; title: string; emailClass: Playbook["emailClass"]; subject: string }>;
}

/** Pure: the scope params of the current URL (?csm=, ?unassigned=1) to send with a CSM call. */
export function scopeQuery(search: string | URLSearchParams | null | undefined): Record<string, string> {
  const p = typeof search === "string" || !search ? new URLSearchParams(search ?? "") : search;
  const out: Record<string, string> = {};
  const csm = p.get("csm");
  if (csm) out.csm = csm.trim().toLowerCase();
  if (p.get("unassigned") === "1") out.unassigned = "1";
  return out;
}

/** The scope of this page (read on the client). */
export function currentScope(): Record<string, string> {
  return typeof window === "undefined" ? {} : scopeQuery(window.location.search);
}

/** Pure: keep ?csm= (staff viewing a colleague's book) on links inside the portal. */
export function withScope(href: string, scope: Record<string, string>): string {
  if (!scope.csm) return href;
  return `${href}${href.includes("?") ? "&" : "?"}csm=${encodeURIComponent(scope.csm)}`;
}

/** GET a CSM route with the page's scope. */
export function csmGet<T>(path: string, extra: Record<string, string | undefined> = {}): Promise<T> {
  return csmApi.get<T>(path, { query: { ...currentScope(), ...extra } });
}

/** Pure: the tone of a health band (the pill always says the band in words). */
export const HEALTH_TONE: Record<HealthBand, StatusTone> = {
  healthy: "success",
  watch: "warning",
  at_risk: "danger",
  ended: "neutral",
};

/** Pure: the pill text, e.g. "At risk · 42". */
export function healthLabel(h: Pick<HealthScore, "label" | "score"> | null | undefined): string {
  if (!h) return "No score";
  return h.score === null ? h.label : `${h.label} · ${h.score}`;
}

export const STEP_LABEL: Record<StepState, string> = { done: "Done", due: "To do", overdue: "Late", waiting: "Not yet" };
export const STEP_TONE: Record<StepState, StatusTone> = { done: "success", due: "info", overdue: "danger", waiting: "neutral" };

export const CHANNEL_LABEL: Record<CsmContact["channel"], string> = {
  call: "Phone call",
  video: "Video call",
  email: "Email",
  whatsapp: "WhatsApp",
  message: "Portal message",
  in_person: "In person",
};

export const EMAIL_CLASS_LABEL: Record<Playbook["emailClass"], string> = {
  transactional: "Account email: always sent",
  service: "Service email: not sent to members who unsubscribed",
  marketing: "Marketing email: needs the member's consent",
};
