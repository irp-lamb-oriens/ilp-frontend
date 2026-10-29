/**
 * lib/status.ts — client-portal API client.
 *
 * Wraps `createApiClient("client")`: client-status endpoints, authenticated by
 * the member's Bearer token (localStorage `ilp_client_token`, see api.ts).
 */

import { clearRoleToken, createApiClient, getRoleToken, legacyFetch, setRoleToken } from "./api";

export const clientApi = createApiClient("client");

/** The member session token, or null. */
export function getClientToken(): string | null {
  return getRoleToken("client");
}

/** Store the member session token returned by verify-otp or the join portal-session route. */
export function setClientToken(token?: string, expiresAt?: string | null): void {
  if (token) setRoleToken("client", token, expiresAt);
}

/** Forget the member token (prefer `clientApi.logout()`, which also ends the server session). */
export function clearClientToken(): void {
  clearRoleToken("client");
}

/**
 * Derive the email-normalized project id from a raw email. Mirrors the
 * server's `emailToDocId` (replace `@` and `.` with `_`).
 */
export function emailToProjectId(email: string): string {
  return email.toLowerCase().trim().replace(/[@.]/g, "_");
}

/**
 * Reconstruct the bare email from an email-normalized project id. Mirrors the
 * server's `resolvePrincipalEmail` (last two dot-segments are domain.tld, the
 * rest is the local part).
 */
export function projectIdToEmail(projectId: string): string {
  const dotted = projectId.replace(/_/g, ".");
  const parts = dotted.split(".");
  if (parts.length >= 2) {
    const tld = parts.pop();
    const dom = parts.pop();
    const user = parts.join(".");
    return `${user}@${dom}.${tld}`.toLowerCase().trim();
  }
  return dotted.toLowerCase().trim();
}

/**
 * Client-status API fetch: the member's Bearer token. The staff-token fallback is gone (plan overhaul 2): staff viewing a
 * member's page must use the dashboard's own routes, which audit the access.
 * 401s throw (no redirect) so /status keeps its own login flow.
 */
export function statusFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  return legacyFetch<T>(clientApi, path, options);
}

// ── Typed payloads ───────────────────────────────────────────────────────────

export interface StatusComment {
  id: string;
  author: string;
  authorType: "client" | "staff";
  body: string;
  stage?: string;
  createdAt: string;
  editedAt?: string;
  deleted?: boolean;
}

export interface StageRating {
  rating: 1 | 2 | 3 | 4 | 5;
  note?: string;
  timestamp: string;
  ratedBy: string;
}

export interface StatusProject {
  id: string;
  name: string | null;
  surname: string | null;
  email: string | null;
  legalArea: string | null;
  legalMatter: string | null;
  jurisdiction: string | null;
  documents: unknown;
  stage: string;
  statusComments: StatusComment[];
  stageRatings: Record<string, StageRating>;
  quoteAcceptance: Record<string, unknown> | null;
  lastUpdated: string | null;
  createdAt: string | null;
  viewerIsPrincipal: boolean;
}

export interface ClientField {
  id: string;
  label: string;
  valueType: string;
  options?: string[];
  placeholder?: string;
  editable: boolean;
  value: unknown;
}

export interface StageDetail {
  id: string;
  label: string;
  description: string;
}

export interface StatusProjectPayload {
  project: StatusProject;
  stages: string[];
  stageLabels: Array<{ id: string; label: string }>;
  stageDetails: StageDetail[];
  clientFields: ClientField[];
}

export interface StatusCharge {
  label: string | null;
  date: string | null;
  dueDate: string | null;
  total: number;
  received: number;
  balanceDue: number;
  status: "paid" | "partially_paid" | "sent";
}

export interface StatusChargesPayload {
  charges: StatusCharge[];
  totals: {
    accepted: number;
    charged: number;
    received: number;
    balanceDue: number;
  };
}

export interface StatusQuote {
  id: string;
  title?: string;
  status: "received" | "accepted" | "rejected";
  total?: number;
  currency?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export interface StatusChatMessage {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface LegalPriority {
  id: string;
  country: string;
  category: string;
  title: string;
  description: string;
  dateFieldLabel: string;
  dateFieldHint?: string;
  reminderOffsetsDays: number[];
}

export interface UserDeadline {
  priorityId: string;
  date: string;
  note?: string;
  updatedAt: string;
}

export interface StatusDeadlinesPayload {
  jurisdiction: string | null;
  countryCode: string | null;
  priorities: LegalPriority[];
  deadlines: Record<string, UserDeadline>;
}
