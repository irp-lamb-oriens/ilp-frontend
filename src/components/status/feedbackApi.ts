/**
 * components/status/feedbackApi.ts — post-call rating + monthly 0-10 (P2).
 * Server: server/API/retention/feedback.ts.
 */

import { clientApi } from "@/lib/status";

export interface PendingCall {
  id: string;
  scheduledAt: string;
  lawyerName: string | null;
}

const BASE = "/api/retention/me/feedback";

export const feedbackApi = {
  pending: () => clientApi.get<{ consultation: PendingCall | null }>(`${BASE}/pending`),
  rateCall: (input: { consultationId: string; score: number; comment?: string }) => clientApi.post<{ ok: boolean }>(`${BASE}/call`, input),
  monthly: (month?: string) =>
    clientApi.get<{ month: string; score: number | null; comment: string | null }>(`${BASE}/monthly`, { query: { m: month } }),
  saveMonthly: (input: { score: number; comment?: string; month?: string }) =>
    clientApi.post<{ ok: boolean; month: string; score: number }>(`${BASE}/monthly`, input),
};
