/**
 * components/status/api.ts — member home data (W4).
 *
 * Talks to /api/client-status/me/* (server/API/clientStatus/memberHome.ts)
 * through W2's clientApi (Bearer token). With
 * NEXT_PUBLIC_W4_MOCK=1 every call is answered by lib/mocks/w4.ts instead,
 * behind the same signatures, so the pages render with seed-like data and no
 * server.
 */

import { downloadFile } from "@/lib/api";
import { clientApi } from "@/lib/status";
import type { Membership, Obligation, ProfileSection } from "@/lib/contracts";
import { mockMemberApi } from "@/lib/mocks/w4";

// ── Payloads ────────────────────────────────────────────────────────────────

export type Who = "client" | "lawyer" | "ilp";

export interface NextStepView {
  what: string;
  who: Who;
  dueAt?: string;
  matterId?: string;
  source: "matter" | "handoff";
  more: Array<{ what: string; who: Who; dueAt?: string }>;
}

export interface MatterView {
  id: string;
  title: string;
  area: string;
  stage: string;
  stageEnteredAt?: string;
  openedAt?: string;
  closedAt?: string;
  lawyerName: string | null;
  nextStep: NextStepView | null;
}

export interface Capacity {
  minutesLeft: number;
  callsLeft: number;
  minutesBooked: number;
  callsBooked: number;
  minutesAvailable: number;
  callsAvailable: number;
  canBook: boolean;
  reason?: string;
}

export interface CallView {
  id: string;
  matterId?: string;
  scheduledAt: string;
  durationMin?: number;
  question?: string;
  lawyerName?: string | null;
  minutesUsed?: number;
  summary?: string;
}

export interface StageView {
  id: string;
  label: string;
  description: string;
}

export interface MemberHome {
  member: { id: string; name: string; firstName: string; email: string | null };
  membership: Membership | null;
  capacity: Capacity;
  matters: MatterView[];
  generalNextStep: NextStepView | null;
  stages: StageView[];
  upcomingCalls: CallView[];
  pastCalls: CallView[];
  obligations: Obligation[];
  completeness: { score: number; bySection: Record<ProfileSection, number>; consultationReady: boolean };
  /** Profile keys; `countryAnswers` (COUNTRY_ANSWERS_FIELD) is the country answers map. */
  profile: Record<string, string | number | boolean | null | Record<string, string | string[]>>;
  pendingQuestions: string[];
}

export interface SlotsPayload {
  slots: string[];
  lawyerName: string | null;
  lengthMin?: number;
  reason?: string;
  /** COUNTRIES: nobody licensed in the member's country yet; `reason` is the calm notice. */
  matching?: boolean;
  country?: string;
}

export interface MemberDocument {
  id: string;
  matterId?: string;
  category: string;
  fileName: string;
  contentType: string;
  size: number;
  uploadedAt: string;
}

export interface ChargeView {
  id: string;
  label: string;
  date?: string;
  dueDate?: string;
  amountCents: number;
  paidCents: number;
  balanceCents: number;
  status: "paid" | "partially_paid" | "due";
  currency: string;
}

export interface QuoteView {
  id: string;
  title: string;
  status: "awaiting" | "accepted" | "declined";
  totalCents: number | null;
  currency: string;
  scope: string[];
  summary?: string;
  createdAt?: string;
  acceptedAt?: string;
  matterId?: string;
}

export interface MoneyPayload {
  balanceDueCents: number;
  nextDueDate?: string;
  paidCents: number;
  charges: ChargeView[];
  quotes: QuoteView[];
}

export interface ThreadItem {
  id: string;
  kind: "member" | "team" | "ai";
  author: string;
  body: string;
  at: string;
  to?: "team" | "ai";
}

export interface MemberApi {
  home(): Promise<MemberHome>;
  slots(matterId?: string): Promise<SlotsPayload>;
  book(input: { scheduledAt: string; question: string; matterId?: string }): Promise<{ capacity: Capacity }>;
  askLawyer(obligationId: string): Promise<{ addedTo: "call" | "list"; callAt: string | null }>;
  saveProfile(values: Record<string, unknown>): Promise<{ completeness: MemberHome["completeness"]; newObligations?: number }>;
  documents(): Promise<{ items: MemberDocument[]; categories: string[] }>;
  upload(input: { matterId?: string; category: string; fileName: string; contentType: string; dataBase64: string }): Promise<MemberDocument>;
  /** Fetch a document with the member's Bearer token and save it (AUTH). */
  downloadDocument(id: string, fileName?: string): Promise<void>;
  money(): Promise<MoneyPayload>;
  acceptQuote(id: string, fullName: string): Promise<MoneyPayload>;
  messages(): Promise<{ items: ThreadItem[] }>;
  sendMessage(body: string): Promise<{ items: ThreadItem[] }>;
  askAssistant(message: string): Promise<{ items: ThreadItem[] }>;
  logout(): Promise<void>;
}

const BASE = "/api/client-status/me";

const liveApi: MemberApi = {
  // Home throws on 401 so the layout can show the sign-in form in place.
  home: () => clientApi.get<MemberHome>(`${BASE}/home`, { on401: "throw" }),
  slots: (matterId) => clientApi.get<SlotsPayload>(`${BASE}/slots`, { query: { matterId } }),
  book: (input) => clientApi.post(`${BASE}/consultations`, input),
  askLawyer: (id) => clientApi.post(`${BASE}/obligations/${encodeURIComponent(id)}/ask`),
  saveProfile: (values) => clientApi.patch(`${BASE}/profile`, { values }),
  documents: () => clientApi.get(`${BASE}/documents`),
  upload: (input) => clientApi.post(`${BASE}/documents`, input),
  downloadDocument: (id, fileName) => downloadFile("client", `${BASE}/documents/${encodeURIComponent(id)}/file`, fileName),
  money: () => clientApi.get(`${BASE}/money`),
  acceptQuote: (id, fullName) => clientApi.post(`${BASE}/quotes/${encodeURIComponent(id)}/accept`, { fullName, consent: true }),
  messages: () => clientApi.get(`${BASE}/messages`),
  sendMessage: (body) => clientApi.post(`${BASE}/messages`, { body }),
  askAssistant: (message) => clientApi.post(`${BASE}/lily`, { message }),
  logout: () => clientApi.logout(),
};

export const memberApi: MemberApi = process.env.NEXT_PUBLIC_W4_MOCK === "1" ? mockMemberApi : liveApi;
