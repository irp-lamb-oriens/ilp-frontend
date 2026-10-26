/**
 * Shared types for the lawyer inspector. Mirrors `GET /api/provider/clients/:id`
 * after the server strips hidden fields (no margins, no ILP priority rank).
 */

export interface LawyerClient {
  id: string;
  email: string;
  name: string | null;
  surname: string | null;
  phone: string | null;
  legalArea: string | null;
  legalMatter: string | null;
  jurisdiction: string | null;
  documents: Array<{ id?: string; name?: string; kind?: string; uploadedAt?: string }> | null;
  stage: string;
  stageEnteredAt: string | null;
  pendingCount: number;
  pendingActions: Array<Record<string, unknown>>;
  notes: Array<Record<string, unknown>>;
  activityLog: Array<Record<string, unknown>>;
  quotes: Array<Record<string, unknown>>;
  charges: Array<Record<string, unknown>>;
  statusChatThread: Array<Record<string, unknown>>;
  customFields: Record<string, unknown>;
  source: string | null;
  createdAt: string | null;
  lastUpdated: string | null;
  transcript: string | null;
  transcriptInsights: Record<string, unknown> | null;
}

export function displayName(c: LawyerClient): string {
  return [c.name, c.surname].filter(Boolean).join(" ") || c.email;
}

// ── Quotes, as a lawyer sees them: your fee only ─────────────────────────────

/** A fee line. Margin fields are never sent to or accepted from a lawyer. */
export type FeeLine = {
  lineId: string;
  label: string;
  /** The lawyer's fee for this line. */
  amount: number;
  currency: string;
  providerId: string | null;
  notes: string | null;
};

export type QuoteStatus =
  | "draft"
  | "pending_approval"
  | "changes_requested"
  | "approved"
  | "sent_to_client"
  | "client_accepted";

export type LawyerQuote = {
  quoteId: string;
  clientId: string;
  title: string;
  lineItems: FeeLine[];
  currency: string;
  /** Sum of this lawyer's lines (server-computed). */
  yourFee: number;
  notes: string | null;
  status: QuoteStatus;
  comments: Array<Record<string, unknown>>;
  createdAt: string;
  updatedAt: string | null;
};

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: "Draft",
  pending_approval: "Pending approval",
  changes_requested: "Changes requested",
  approved: "Approved",
  sent_to_client: "Sent to member",
  client_accepted: "Accepted",
};
