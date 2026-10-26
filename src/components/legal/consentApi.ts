/**
 * Consent records and data-rights calls (P6). Server: server/API/privacy/privacyRouter.ts.
 * Each consent is stored as a ConsentRecord with the version of the document
 * the person saw (versions.ts).
 */
import { API_URL } from "@/lib/api";
import { clientApi } from "@/lib/status";
import type { ConsentKind, PrivacyRequest, PrivacyRequestKind } from "@/lib/contracts";
import { LEGAL_VERSIONS } from "./versions";

export type ConsentSource = "join" | "booking" | "join_call" | "settings" | "lily" | "privacy_page";

export const VERSION_FOR_KIND: Record<ConsentKind, string> = {
  terms: LEGAL_VERSIONS.terms,
  privacy: LEGAL_VERSIONS.privacy,
  recording: LEGAL_VERSIONS.recording,
  ai_assistant: LEGAL_VERSIONS.recording,
  marketing_email: LEGAL_VERSIONS.privacy,
};

/** At join, before payment: tied to the join session token, not to a sign-in. */
export async function recordJoinConsents(joinToken: string, marketing: boolean): Promise<void> {
  const consents = [
    { kind: "terms", granted: true, version: VERSION_FOR_KIND.terms },
    { kind: "privacy", granted: true, version: VERSION_FOR_KIND.privacy },
    { kind: "marketing_email", granted: marketing, version: VERSION_FOR_KIND.marketing_email },
  ];
  const res = await fetch(`${API_URL}/api/privacy/consents/join`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ joinToken, consents }),
  });
  if (!res.ok) throw new Error(`Consent not recorded (${res.status})`);
}

/** A signed-in member gives or withdraws one consent. */
export function recordConsent(kind: ConsentKind, granted: boolean, source: ConsentSource, consultationId?: string) {
  return clientApi.post<{ consent: { kind: ConsentKind; granted: boolean; at: string; version: string }; upcomingCallsUpdated: number }>(
    "/api/privacy/me/consents",
    { kind, granted, source, version: VERSION_FOR_KIND[kind], consultationId },
  );
}

export interface ConsentState {
  granted: boolean;
  at: string;
  version: string;
  source: string;
}

export interface PrivacyMe {
  versions: Record<string, string>;
  consents: Partial<Record<ConsentKind, ConsentState>>;
  requests: Array<Pick<PrivacyRequest, "id" | "kind" | "status" | "dueAt" | "createdAt" | "completedAt">>;
  responseDays: number;
}

export const privacyApi = {
  me: () => clientApi.get<PrivacyMe>("/api/privacy/me"),
  request: (kind: Exclude<PrivacyRequestKind, "export">, note?: string) =>
    clientApi.post<{ request: PrivacyRequest; existing?: boolean }>("/api/privacy/me/requests", { kind, note }),
  exportUrl: () => clientApi.url("/api/privacy/me/export"),
};
