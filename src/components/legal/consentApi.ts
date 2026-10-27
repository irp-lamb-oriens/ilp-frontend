/**
 * Consent records and data-rights calls (P6). Server: server/API/privacy/privacyRouter.ts.
 * Each consent is stored as a ConsentRecord with the version of the document
 * the person saw (versions.ts).
 */
import { downloadFile } from "@/lib/api";
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

/**
 * The consents sent inside POST /api/payments/join (P7): the server records
 * them with the join and refuses a join without Terms and Privacy.
 */
export function joinConsents(marketing: boolean): JoinConsent[] {
  return [
    { kind: "terms", granted: true, version: VERSION_FOR_KIND.terms },
    { kind: "privacy", granted: true, version: VERSION_FOR_KIND.privacy },
    { kind: "marketing_email", granted: marketing, version: VERSION_FOR_KIND.marketing_email },
  ];
}

export interface JoinConsent {
  kind: Extract<ConsentKind, "terms" | "privacy" | "marketing_email">;
  granted: boolean;
  version: string;
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
  /** Fetch the member's JSON export with the Bearer token and save it (AUTH). */
  downloadExport: () => downloadFile("client", "/api/privacy/me/export", "ilp-my-data.json"),
};
