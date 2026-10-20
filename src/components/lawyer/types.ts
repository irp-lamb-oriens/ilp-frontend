/**
 * Shared types for the lawyer client-inspector tabs.
 *
 * Mirrors the widened `LawyerClient` shape returned by
 * `GET /api/provider/clients` and `GET /api/provider/clients/:id`.
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
  documents: string[] | null;
  stage: string;
  stageEnteredAt: string | null;
  rankIndex: number | null;
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

// ── Quote editor types ────────────────────────────────────────────────────────

export type QuoteLineItem = {
  lineId: string;
  label: string;
  amount: number;
  marginPct: number;
  marginMode: "pct" | "flat";
  marginFlat: number | null;
  currency: string;
  providerId: string | null;
  notes: string | null;
};

export type QuoteGroup = {
  groupId: string;
  title: string;
  labelId: string | null;
  role: "required" | "optional" | "fixed";
  description: string | null;
  lineItems: QuoteLineItem[];
};

export type QuoteStatus =
  | "draft"
  | "pending_approval"
  | "changes_requested"
  | "approved"
  | "sent_to_client"
  | "client_accepted";

export type Quote = {
  quoteId: string;
  clientId: string;
  title: string;
  lineItems: QuoteLineItem[];
  lineGroups: QuoteGroup[] | null;
  currency: string;
  total: number;
  costSubtotal: number;
  earnings: number;
  serviceType: string | null;
  templateId: string | null;
  defaultMarginPct: number;
  clientDescription: string | null;
  paymentSchedule: number[] | null;
  providerIds: string[];
  providerSnapshots: Array<Record<string, unknown>>;
  notes: string | null;
  status: QuoteStatus;
  approvals: Array<Record<string, unknown>>;
  comments: Array<Record<string, unknown>>;
  changeLog: Array<Record<string, unknown>>;
  clientVisible: boolean;
  sentToClientAt: string | null;
  clientToken: string | null;
  clientAcceptedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
};

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: "Draft",
  pending_approval: "Pending approval",
  changes_requested: "Changes requested",
  approved: "Approved",
  sent_to_client: "Sent to client",
  client_accepted: "Accepted",
};
