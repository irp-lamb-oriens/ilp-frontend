/**
 * Tiny typed event bus so any CTA on the page can open the hero's lead form
 * with context (e.g. which plan or which deadline the visitor was reading).
 */
export const OPEN_LEAD_EVENT = "ilp:open-lead";

export interface OpenLeadDetail {
  topic?: string;
  country?: string;
}

export function openLeadForm(detail: OpenLeadDetail = {}): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<OpenLeadDetail>(OPEN_LEAD_EVENT, { detail }));
}