/**
 * lib/status.ts — client-portal API client.
 *
 * Mirrors lib/api.ts but targets the client-status endpoints and carries the
 * `x-client-token` header (the client_status_sessions token) instead of the
 * customer JWT or the dashboard token.
 */

import { API_URL, ApiError, getDashboardToken } from "./api";

const CLIENT_TOKEN_KEY = "ilp_client_token";

export function getClientToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CLIENT_TOKEN_KEY);
}

export function setClientToken(token: string): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(CLIENT_TOKEN_KEY, token);
  }
}

export function clearClientToken(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(CLIENT_TOKEN_KEY);
  }
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

/** Fetch against the client-status API using the client session token. */
export async function statusFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getClientToken();
  const dashboardToken = getDashboardToken();
  const headers = new Headers(options.headers);
  if (token) headers.set("x-client-token", token);
  if (dashboardToken) headers.set("x-dashboard-token", dashboardToken);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) message = String(data.error);
    } catch {
      // ignore parse failures
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
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

export interface StatusProjectPayload {
  project: StatusProject;
  stages: string[];
  stageLabels: Array<{ id: string; label: string }>;
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