/**
 * Response shapes of the staff routes (W1 /api/staff/*, W6 /api/dashboard/staff/*).
 * Records themselves come from @/lib/contracts.
 */
import type {
  Consultation,
  CsmTask,
  Handoff,
  Matter,
  Membership,
  Obligation,
  ProfileSection,
} from "@/lib/contracts";

export type StaffRole = "staff" | "csm" | "admin";

export interface StaffKpis {
  generatedAt: string;
  mrr: { cents: number; activeMembers: number; deltaCents24h: number; deltaCents7d: number };
  retentionM3: { pct: number | null; retained: number; cohort: number };
  consultationReady: { pct: number | null; ready: number; active: number };
  handoffSla: { pct: number | null; within24h: number; total: number };
  overdueTasks: { total: number; mine: number };
  legalGmv30d: { cents: number; quotes: number };
  platformRevenue30d: { cents: number };
}

export interface AttentionItem {
  id: string;
  kind: "matter" | "obligation" | "quote" | "not_ready" | "unassigned";
  clientId: string;
  memberName: string;
  title: string;
  at?: string;
  days: number;
  ref?: string;
}

export interface Attention {
  overdueMatters: AttentionItem[];
  obligationsDue: AttentionItem[];
  quotesUnanswered: AttentionItem[];
  notReady: AttentionItem[];
  unassigned: AttentionItem[];
}

export interface StaffSummary {
  me: string;
  role: StaffRole;
  kpis: StaffKpis;
  attention: Attention;
  /** Placeholder (seed) data: members loaded, and whether the figures above leave it out. */
  placeholder?: { members: number; excluded: boolean };
}

export type QueueTask = CsmTask & {
  /** Placeholder (seed) record. */
  placeholder?: boolean;
  overdue?: boolean;
  memberName?: string;
  membershipStatus?: Membership["status"] | null;
  /** T2: set on "Review lawyer application" tasks; clientId then holds the provider id. */
  subject?: { kind: "lawyer_application"; providerId: string };
};

/** A "Review lawyer application" task (T2): about a lawyer, not a member. */
export function isLawyerApplicationTask(t: Pick<QueueTask, "subject"> | null | undefined): boolean {
  return t?.subject?.kind === "lawyer_application";
}

export interface QueueResponse {
  owner: string;
  tasks: QueueTask[];
  counts: { open: number; overdue: number; dueToday: number };
}

export interface MemberRow {
  clientId: string;
  membershipId: string;
  name: string;
  email: string;
  status: Membership["status"];
  country: string;
  csmEmail: string | null;
  activatedAt: string | null;
  periodEnd: string | null;
  minutesUsed: number;
  minutesIncluded: number;
  callsUsed: number;
  callsIncluded: number;
  completeness: number;
  consultationReady: boolean;
  openTasks: number;
  /** Placeholder (seed) member. */
  placeholder?: boolean;
}

export interface MembersPage {
  items: MemberRow[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
  csms: string[];
}

export interface MemberBundle {
  client: (Record<string, unknown> & { id: string }) | null;
  completeness: { score: number; bySection: Record<ProfileSection, number>; consultationReady: boolean };
  membership: Membership | null;
  minutesLeft: number;
  callsLeft: number;
  matters: Matter[];
  consultations: Consultation[];
  handoffs: Handoff[];
  tasks: CsmTask[];
  obligations: Obligation[];
  nextStep: { what: string; who: string; dueAt?: string; matterId?: string } | null;
}

export interface TimelineEntry {
  id: string;
  kind: "consultation" | "handoff" | "task" | "quote" | "note" | "audit" | "membership";
  at: string;
  title: string;
  body?: string;
  actor?: string;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
  ref?: string;
}

export interface LawyerCapacity {
  id: string;
  name: string;
  email: string;
  legalAreas: string[];
  openMatters: number;
  agingMatters: number;
  callsNext7d: number;
}
