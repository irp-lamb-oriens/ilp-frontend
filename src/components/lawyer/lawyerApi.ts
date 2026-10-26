/**
 * Lawyer home data layer (W5). Every screen under /lawyer reads and writes
 * through `lawyerApi`, so the in-memory demo in `@/lib/mocks/w5` can stand in
 * for the server behind the same signatures (NEXT_PUBLIC_W5_MOCKS=1).
 *
 * Server routes: /api/provider/* (W5, server/API/provider/lawyerHomeRoutes.ts)
 * and /api/lawyer/* (W1, server/API/members/membersRouter.ts). Every response
 * is stripped of margins and commercial notes server-side.
 */

import { ApiError, providerApi } from "@/lib/provider";
import type { ConsentState, ConsultationStatus, LegalNextStep } from "@/lib/contracts";
import { w5Mock } from "@/lib/mocks/w5";
import type { LawyerClient } from "./types";

export type { LegalNextStep, ConsentState };

export interface LawyerMe {
  providerId: string;
  email: string;
  name: string | null;
  legalAreas: string[];
  jurisdictions: string[];
}

export interface TodayItem {
  id: string;
  clientId: string;
  clientName: string;
  matterId: string | null;
  matterTitle: string | null;
  area: string | null;
  scheduledAt: string;
  durationMin: number;
  status: ConsultationStatus;
  question: string | null;
  consent: { recording: ConsentState; at?: string };
  summaryStatus: "suggested" | "confirmed" | null;
  handoffId: string | null;
}

export interface BriefMatter {
  id: string;
  title: string;
  area: string;
  stage: string;
  stageLabel: string;
  stageEnteredAt: string;
  nextStep: LegalNextStep | null;
  current: boolean;
}

export interface Brief {
  consultation: {
    id: string;
    clientId: string;
    matterId: string | null;
    scheduledAt: string;
    durationMin: number;
    status: ConsultationStatus;
    question: string | null;
    consent: { recording: ConsentState; at?: string };
    transcript: string | null;
    summary: { text: string; status: "suggested" | "confirmed"; confirmedAt?: string } | null;
    suggestedNextSteps: LegalNextStep[];
    minutesUsed: number | null;
    handoffId: string | null;
  };
  who: { name: string; email: string | null; phone: string | null; nationality: string | null; age: number | null; country: string };
  household: { maritalStatus: string | null; dependents: unknown };
  residency: { status: string | null; expiresAt: string | null };
  assets: {
    property: { owns: boolean; location: string | null };
    company: { has: boolean; type: string | null };
    vehicle: { owns: boolean };
  };
  matters: BriefMatter[];
  obligations: Array<{ id: string; title: string; dueAt?: string; status: string; overdue: boolean }>;
  completeness: { score: number; bySection: Record<string, number>; consultationReady: boolean };
  membership: { minutesLeft: number; callsLeft: number };
  priorSummaries: Array<{ scheduledAt: string; text: string }>;
}

export interface CallRow {
  id: string;
  scheduledAt: string;
  status: ConsultationStatus;
  question: string | null;
  minutesUsed: number | null;
  summary: string | null;
  summaryStatus: "suggested" | "confirmed" | null;
  handoffId: string | null;
}

export interface ClientBrief extends Brief {
  calls: CallRow[];
}

export interface BoardCard {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  area: string;
  country: string;
  stage: string;
  stageEnteredAt: string;
  nextStep: LegalNextStep | null;
  overdueCount: number;
  dueSoonCount: number;
  nextCallAt: string | null;
}

export interface BoardData {
  cards: BoardCard[];
  stages: string[];
  stageLabels: Array<{ id: string; label: string }>;
  total: number;
}

export interface FinancePayment {
  id: string;
  quoteId: string;
  quoteTitle: string | null;
  clientId: string | null;
  clientName: string;
  matterId: string | null;
  matterTitle: string | null;
  amount: number;
  paid: boolean;
  date: string | null;
  note: string | null;
}

export interface FinanceData {
  currency: string;
  totals: { paid: number; pending: number };
  byMatter: Array<{ key: string; title: string; clientName: string; paid: number; pending: number; lastPayoutAt: string | null; nextPayoutAt: string | null }>;
  payments: FinancePayment[];
}

export interface HandoffInput {
  summary: string;
  steps: LegalNextStep[];
  minutesUsed: number;
}

export interface LawyerApi {
  me(): Promise<LawyerMe>;
  today(from: string, to: string): Promise<{ items: TodayItem[] }>;
  brief(consultationId: string): Promise<Brief>;
  clientBrief(clientId: string): Promise<ClientBrief>;
  setConsent(consultationId: string, recording: ConsentState): Promise<void>;
  setCallStatus(consultationId: string, status: ConsultationStatus): Promise<void>;
  saveTranscript(consultationId: string, transcript: string): Promise<void>;
  suggest(consultationId: string, transcript?: string): Promise<{ summary: { text: string; status: "suggested" }; suggestedNextSteps: LegalNextStep[] }>;
  confirmAndHandOff(consultationId: string, input: HandoffInput): Promise<{ handoffId: string }>;
  board(): Promise<BoardData>;
  moveMatter(matterId: string, stage: string): Promise<BoardCard>;
  finance(): Promise<FinanceData>;
  client(clientId: string): Promise<LawyerClient>;
  updateClientField(clientId: string, field: "legalArea" | "legalMatter" | "jurisdiction", value: string): Promise<void>;
  logout(): Promise<void>;
}

const enc = encodeURIComponent;

const realApi: LawyerApi = {
  me: () => providerApi.get<LawyerMe>("/api/provider/me", { on401: "throw" }),
  today: (from, to) => providerApi.get("/api/provider/today", { query: { from, to } }),
  brief: (id) => providerApi.get(`/api/provider/consultations/${enc(id)}/brief`),
  clientBrief: (id) => providerApi.get(`/api/provider/clients/${enc(id)}/brief`),
  async setConsent(id, recording) {
    await providerApi.patch(`/api/lawyer/consultations/${enc(id)}`, { consent: { recording } });
  },
  async setCallStatus(id, status) {
    await providerApi.patch(`/api/lawyer/consultations/${enc(id)}`, { status });
  },
  async saveTranscript(id, transcript) {
    await providerApi.patch(`/api/lawyer/consultations/${enc(id)}`, { transcript });
  },
  suggest: (id, transcript) => providerApi.post(`/api/provider/consultations/${enc(id)}/suggest`, transcript ? { transcript } : {}),
  async confirmAndHandOff(id, input) {
    // 1. Confirm the summary, close the call and record minutes (W1 charges the membership once).
    await providerApi.patch(`/api/lawyer/consultations/${enc(id)}`, {
      summary: { text: input.summary, status: "confirmed" },
      status: "completed",
      minutesUsed: input.minutesUsed,
    });
    // 2. Create the handoff; W1 emits handoff.approved.
    try {
      // Lawyer judgment only: commercialNotes are staff-only and never sent from here.
      const h = await providerApi.post<{ id: string }>("/api/lawyer/handoffs", {
        consultationId: id,
        legalNextSteps: input.steps,
      });
      return { handoffId: h.id };
    } catch (err) {
      const body = err instanceof ApiError ? (err.body as { handoffId?: string } | undefined) : undefined;
      if (err instanceof ApiError && err.status === 409 && body?.handoffId) return { handoffId: body.handoffId };
      throw err;
    }
  },
  board: () => providerApi.get("/api/provider/board"),
  async moveMatter(id, stage) {
    const r = await providerApi.patch<{ card: BoardCard }>(`/api/provider/matters/${enc(id)}/stage`, { stage });
    return r.card;
  },
  finance: () => providerApi.get("/api/provider/finance"),
  client: (id) => providerApi.get(`/api/provider/clients/${enc(id)}`),
  async updateClientField(id, field, value) {
    await providerApi.patch(`/api/provider/clients/${enc(id)}/field`, { field, value });
  },
  logout: () => providerApi.logout(),
};

export const USING_MOCKS = process.env.NEXT_PUBLIC_W5_MOCKS === "1";

export const lawyerApi: LawyerApi = USING_MOCKS ? w5Mock : realApi;

export function errorText(err: unknown, fallback = "Something went wrong. Try again."): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

/** The local calendar day containing `d`, as an ISO window. */
export function dayWindow(d = new Date()): { from: string; to: string } {
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { from: start.toISOString(), to: end.toISOString() };
}

export const WHO_LABEL: Record<LegalNextStep["who"], string> = {
  client: "Member",
  lawyer: "Lawyer",
  ilp: "ILP team",
};

export const AREA_LABEL: Record<string, string> = {
  corporate: "Corporate",
  immigration: "Immigration",
  real_estate: "Real estate",
  property: "Property",
  tax: "Tax",
  vehicle: "Vehicle",
  notary: "Notary",
  other: "Other",
};

export const areaLabel = (a: string | null | undefined) => (a ? AREA_LABEL[a] ?? a.replace(/_/g, " ") : "General");

export const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
export const fmtDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
export const fmtShortDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—";
export const money = (v: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(v);
