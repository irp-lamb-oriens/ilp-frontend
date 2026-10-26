/** Staff opportunities API (server/API/opportunities). Staff only. */
import { staffApi } from "@/lib/api";
import type { Opportunity, OpportunityStage } from "@/lib/contracts";
import type { StatusTone } from "@/components/ui";

export interface OpportunityRow extends Opportunity {
  memberName: string;
  quote: { id: string; title: string; status: string; totalCents: number; accepted: boolean } | null;
}

export interface OpportunitySummary {
  byStage: Record<OpportunityStage, { count: number; valueCents: number }>;
  open: { count: number; valueCents: number };
  winRate: number | null;
  avgDaysToWin: number | null;
  avgDaysToClose: number | null;
  legalGmvWonCents: number;
  platformRevenueCents: number;
}

export interface OpportunityFilter {
  stage?: string;
  owner?: string;
  area?: string;
  clientId?: string;
  q?: string;
  open?: boolean;
}

export const STAGES: Array<{ id: OpportunityStage; label: string; tone: StatusTone }> = [
  { id: "identified", label: "Identified", tone: "neutral" },
  { id: "quoted", label: "Quoted", tone: "info" },
  { id: "negotiating", label: "Negotiating", tone: "warning" },
  { id: "won", label: "Won", tone: "success" },
  { id: "lost", label: "Lost", tone: "danger" },
];

export const STAGE_LABEL = Object.fromEntries(STAGES.map((s) => [s.id, s.label])) as Record<OpportunityStage, string>;
export const STAGE_TONE = Object.fromEntries(STAGES.map((s) => [s.id, s.tone])) as Record<OpportunityStage, StatusTone>;
export const isClosedStage = (s: OpportunityStage) => s === "won" || s === "lost";

export const AREAS = [
  { value: "corporate", label: "Corporate" },
  { value: "property", label: "Property" },
  { value: "immigration", label: "Immigration" },
  { value: "tax", label: "Tax" },
  { value: "family", label: "Family and estate" },
  { value: "vehicle", label: "Vehicle" },
  { value: "general", label: "General" },
];

/** AREAS plus the given value when it is not one of them (areas copied from a matter). */
export function areaOptions(current?: string) {
  return current && !AREAS.some((a) => a.value === current) ? [...AREAS, { value: current, label: areaLabel(current) }] : AREAS;
}

export function areaLabel(v: string): string {
  return AREAS.find((a) => a.value === v)?.label ?? (v ? v[0].toUpperCase() + v.slice(1).replace(/_/g, " ") : "General");
}

export const SOURCE_LABEL: Record<Opportunity["source"]["kind"], string> = {
  handoff: "Handoff",
  consultation: "Call",
  obligation: "Obligation",
  manual: "Added by staff",
};

function query(f: OpportunityFilter): Record<string, string> {
  const q: Record<string, string> = {};
  if (f.stage) q.stage = f.stage;
  if (f.owner) q.owner = f.owner;
  if (f.area) q.area = f.area;
  if (f.clientId) q.clientId = f.clientId;
  if (f.q) q.q = f.q;
  if (f.open) q.open = "1";
  return q;
}

const BASE = "/api/dashboard/opportunities";

export const oppApi = {
  list: (f: OpportunityFilter = {}) =>
    staffApi.get<{ items: OpportunityRow[]; owners: string[]; areas: string[] }>(BASE, { query: query(f) }),
  summary: (f: OpportunityFilter = {}) => staffApi.get<OpportunitySummary>(`${BASE}/summary`, { query: query(f) }),
  get: (id: string) => staffApi.get<OpportunityRow>(`${BASE}/${encodeURIComponent(id)}`),
  create: (body: Partial<Opportunity>) => staffApi.post<OpportunityRow>(BASE, body),
  update: (id: string, body: Record<string, unknown>) => staffApi.patch<OpportunityRow>(`${BASE}/${encodeURIComponent(id)}`, body),
  move: (id: string, stage: OpportunityStage, outcome?: string) =>
    staffApi.post<OpportunityRow>(`${BASE}/${encodeURIComponent(id)}/stage`, { stage, outcome }),
  linkQuote: (id: string, quoteId: string) => staffApi.post<OpportunityRow>(`${BASE}/${encodeURIComponent(id)}/quote`, { quoteId }),
  backfill: () => staffApi.post<{ created: number }>(`${BASE}/backfill`, {}),
};

export interface MemberQuote {
  quoteId?: string;
  id?: string;
  title?: string;
  status?: string;
  total?: number;
  createdAt?: string;
}

export const quoteIdOf = (q: MemberQuote) => q.quoteId ?? q.id ?? "";

export async function memberQuotes(clientId: string): Promise<MemberQuote[]> {
  const r = await staffApi.get<{ quotes: MemberQuote[] }>(`/api/dashboard/clients/${encodeURIComponent(clientId)}/quotes`);
  return r.quotes ?? [];
}

/** Draft a quote on the member for this opportunity, then link it (identified → quoted). */
export async function draftQuoteFor(o: OpportunityRow): Promise<OpportunityRow> {
  const r = await staffApi.post<{ quote: MemberQuote }>(`/api/dashboard/clients/${encodeURIComponent(o.clientId)}/quotes`, {
    title: o.title.slice(0, 120),
    status: "draft",
    notes: o.nextAction?.what ?? null,
  });
  const id = quoteIdOf(r.quote);
  if (!id) throw new Error("The quote was created but returned no id. Link it from the list.");
  return oppApi.linkQuote(o.id, id);
}

/** Where the source record lives in the staff UI. */
export function sourceHref(o: Pick<Opportunity, "clientId" | "source">): string {
  const member = `/dashboard/members/${encodeURIComponent(o.clientId)}`;
  if (o.source.kind === "handoff" && o.source.id) return `${member}?handoff=${encodeURIComponent(o.source.id)}`;
  return member;
}
