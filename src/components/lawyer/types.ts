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
  pendingCount: number;
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