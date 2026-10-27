/**
 * components/status/membershipApi.ts — membership billing + cancel (P2).
 *
 * Talks to /api/payments/me/* (server/API/payments/cancel.ts) through the
 * client portal's api client (Bearer token).
 */

import { clientApi } from "@/lib/status";
import type { MembershipStatus } from "@/lib/contracts";

export interface MembershipAccess {
  canBook: boolean;
  inGrace: boolean;
  graceEndsAt?: string;
  message?: string;
}

export interface MembershipBillingView {
  membership: {
    id: string;
    status: MembershipStatus;
    periodStart: string;
    periodEnd: string;
    activatedAt: string | null;
    cancelAtPeriodEnd: boolean;
    cancelledAt: string | null;
    pastDueSince: string | null;
    minutesIncluded: number;
    minutesUsed: number;
    callsIncluded: number;
    callsUsed: number;
    paidBy: "card" | "manual";
  } | null;
  access: MembershipAccess;
  mode: "stripe" | "manual";
  reasons?: Record<string, string>;
}

const BASE = "/api/payments/me";

export const membershipApi = {
  get: () => clientApi.get<MembershipBillingView>(`${BASE}/membership`),
  cancel: (input: { reason?: string; comment?: string }) => clientApi.post<MembershipBillingView>(`${BASE}/cancel`, input),
  undoCancel: () => clientApi.post<MembershipBillingView>(`${BASE}/cancel/undo`),
  billingPortal: () => clientApi.post<{ url: string }>(`${BASE}/billing-portal`),
};
