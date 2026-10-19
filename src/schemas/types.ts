/**
 * schemas/types.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Shared primitive types for the ILP data model (frontend mirror).
 *
 * Mirrors `server/schemas/types.ts`. The two packages cannot share a module
 * without build config, so this file stays in sync with the server copy.
 */

/** ISO-8601 timestamp string. */
export type IsoTimestamp = string;

/** A Firestore document id. */
export type DocId = string;

/** A document that carries its own id. */
export interface WithId {
  id: DocId;
}

/** Standard audit timestamps. */
export interface Timestamped {
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

/** A document that may carry arbitrary extra fields. */
export interface Extensible {
  [key: string]: unknown;
}

/** A single consultation slot. */
export interface CalendarSlot {
  start: IsoTimestamp;
  end: IsoTimestamp;
  timezone: string;
}

/** A pipeline stage rating (1–5). */
export interface StageRating {
  stage: string;
  rating: number;
  comment?: string;
  createdAt: IsoTimestamp;
}

/** A status-page comment thread entry. */
export interface StatusComment {
  id: DocId;
  author: string;
  authorRole: "client" | "staff";
  body: string;
  createdAt: IsoTimestamp;
}

/** A charge line on a client's project. */
export interface Charge {
  id: DocId;
  label: string;
  amountMinor: number;
  currency: string;
  status: "pending" | "paid" | "void";
  createdAt: IsoTimestamp;
}

/** A quote sent to a client. */
export interface Quote {
  id: DocId;
  title: string;
  lines: Array<{ label: string; amountMinor: number }>;
  totalMinor: number;
  currency: string;
  status: "draft" | "sent" | "accepted" | "declined";
  acceptanceToken?: string;
  createdAt: IsoTimestamp;
}

/** A note attached to a client record. */
export interface ClientNote {
  id: DocId;
  body: string;
  author: string;
  createdAt: IsoTimestamp;
}

/** A pending action on a client record. */
export interface PendingAction {
  id: DocId;
  label: string;
  dueAt?: IsoTimestamp;
}

/** A journey step on a client record. */
export interface JourneyStep {
  stage: string;
  enteredAt: IsoTimestamp;
}