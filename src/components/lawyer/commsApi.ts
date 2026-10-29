/**
 * COMMS-P2: the lawyer's Feedback and New work pages. Server routes in
 * server/API/lawyerComms/lawyerCommsRouter.ts. Responses carry only the
 * lawyer's own data: no rating score, no ranking, no member names, no
 * estimated value of offered work.
 */

import { providerApi } from "@/lib/provider";
import type { LawyerFeedbackView, WorkOfferStatus } from "@/lib/contracts";

export interface LawyerFeedbackPage {
  recent: LawyerFeedbackView;
  months: Array<{ month: string; label: string; reviews: number; averageStars: number | null }>;
}

export interface LawyerWorkOffer {
  id: string;
  title: string;
  area: string;
  areaLabel: string;
  country: string;
  countryName: string;
  description: string | null;
  status: WorkOfferStatus;
  offeredAt: string;
  respondBy: string | null;
  respondedAt: string | null;
}

export const getFeedback = () => providerApi.get<LawyerFeedbackPage>("/api/provider/feedback");
export const getWorkOffers = () => providerApi.get<{ offers: LawyerWorkOffer[] }>("/api/provider/work-offers").then((r) => r.offers);
export const respondToOffer = (id: string, action: "accept" | "decline", reason?: string) =>
  providerApi.post<{ offer: LawyerWorkOffer }>(`/api/provider/work-offers/${encodeURIComponent(id)}/respond`, { action, ...(reason ? { reason } : {}) }).then((r) => r.offer);

/** "4.7 of 5" */
export const starsText = (n: number) => `${n.toFixed(1)} of 5`;

export const OFFER_STATUS: Record<WorkOfferStatus, { label: string; tone: "info" | "success" | "neutral" | "warning" }> = {
  offered: { label: "Waiting for your answer", tone: "info" },
  accepted: { label: "You accepted", tone: "success" },
  declined: { label: "You declined", tone: "neutral" },
  taken: { label: "Taken by another lawyer", tone: "neutral" },
  withdrawn: { label: "No longer offered", tone: "neutral" },
};
