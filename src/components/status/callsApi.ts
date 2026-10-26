/**
 * The call itself, member side (P3): book with recording consent, change or
 * cancel (up to 24 h before), confirm consent on the join screen, join.
 * Server: server/API/calls/callsRouter.ts and the booking route in
 * server/API/clientStatus/memberHome.ts.
 *
 * With NEXT_PUBLIC_W4_MOCK=1 booking goes through the W4 mock and the other
 * calls succeed in memory, so the pages still render without a server.
 */

import { clientApi } from "@/lib/status";
import type { ConsentState } from "@/lib/contracts";
import { memberApi, type CallView, type Capacity } from "./api";

export type RecordingChoice = "granted" | "declined";

/** An upcoming call as the home payload sends it (P3 adds the call fields). */
export type UpcomingCall = CallView & {
  status?: string;
  meetUrl?: string | null;
  linkPending?: boolean;
  consent?: { recording: ConsentState; at?: string };
  canChange?: boolean;
};

export interface MemberCallsApi {
  book(input: { scheduledAt: string; question: string; matterId?: string; recordingConsent: RecordingChoice }): Promise<{ capacity: Capacity; consultation?: { meetUrl?: string | null; linkPending?: boolean } }>;
  slotsForChange(consultationId: string): Promise<{ slots: string[] }>;
  reschedule(consultationId: string, scheduledAt: string): Promise<unknown>;
  cancel(consultationId: string): Promise<unknown>;
  consent(consultationId: string, recording: RecordingChoice, where: "booking" | "join"): Promise<unknown>;
}

const BASE = "/api/client-status/me";
const enc = encodeURIComponent;
const MOCK = process.env.NEXT_PUBLIC_W4_MOCK === "1";

const live: MemberCallsApi = {
  book: (input) => clientApi.post(`${BASE}/consultations`, input),
  slotsForChange: (id) => clientApi.get(`${BASE}/consultations/${enc(id)}/slots`),
  reschedule: (id, scheduledAt) => clientApi.post(`${BASE}/consultations/${enc(id)}/reschedule`, { scheduledAt }),
  cancel: (id) => clientApi.post(`${BASE}/consultations/${enc(id)}/cancel`, {}),
  consent: (id, recording, where) => clientApi.post(`${BASE}/consultations/${enc(id)}/consent`, { recording, where }),
};

const mock: MemberCallsApi = {
  book: async (input) => ({
    ...(await memberApi.book({ scheduledAt: input.scheduledAt, question: input.question, matterId: input.matterId })),
    consultation: { meetUrl: null, linkPending: true },
  }),
  slotsForChange: async () => memberApi.slots(),
  reschedule: async () => ({}),
  cancel: async () => ({}),
  consent: async () => ({}),
};

export const memberCalls: MemberCallsApi = MOCK ? mock : live;

/** Join is active from 10 minutes before until 30 minutes after the booked end. */
export function joinState(scheduledAt: string, durationMin = 20, now = Date.now()): "early" | "open" | "over" {
  const s = Date.parse(scheduledAt);
  if (now < s - 10 * 60_000) return "early";
  if (now > s + (durationMin + 30) * 60_000) return "over";
  return "open";
}
