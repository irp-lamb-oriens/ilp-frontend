/**
 * schemas/collections.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Document schemas for the ILP data model (frontend mirror).
 *
 * Mirrors the server `schemas/collections/*` files. The frontend consumes
 * these shapes from the dashboard API and public endpoints. Kept in sync with
 * the server copy; the two packages cannot share a module without build
 * config.
 */
import type {
  CalendarSlot,
  Charge,
  ClientNote,
  Extensible,
  IsoTimestamp,
  JourneyStep,
  PendingAction,
  Quote,
  StageRating,
  StatusComment,
} from "./types";

// ── Auth / sessions ────────────────────────────────────────────────────────

export interface DashboardSession extends Extensible {
  email: string;
  createdAt: IsoTimestamp;
  expiresAt: IsoTimestamp;
}

export interface DashboardOtp extends Extensible {
  code: string;
  email: string;
  createdAt: IsoTimestamp;
  expiresAt: IsoTimestamp;
}

export interface ClientStatusSession extends Extensible {
  email: string;
  createdAt: IsoTimestamp;
  expiresAt: IsoTimestamp;
}

export interface ClientStatusOtp extends Extensible {
  code: string;
  email: string;
  createdAt: IsoTimestamp;
  expiresAt: IsoTimestamp;
}

// ── Clients (CRM core) ─────────────────────────────────────────────────────

export interface ConsultationDoc extends Extensible {
  name?: string;
  surname?: string;
  email?: string;
  phone?: string;
  legalArea?: string;
  legalMatter?: string;
  jurisdiction?: string;
  documents?: string[];
  notes?: string;
  serviceType?: string;
  createdAt?: IsoTimestamp;
  updatedAt?: IsoTimestamp;
}

export interface ClientDoc extends Extensible {
  id: string;
  email: string;
  stage: string;
  stageEnteredAt?: IsoTimestamp;
  /** The provider (lawyer) this client is assigned to, if any. */
  assignedProviderId?: string;
  clientFields: Record<string, unknown>;
  consultations: ConsultationDoc[];
  journey: JourneyStep[];
  stageRatings: StageRating[];
  charges: Charge[];
  quotes: Quote[];
  notes: ClientNote[];
  pendingActions: PendingAction[];
  conversations: string[];
  statusChatThread?: string;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface PricingRequestDoc extends Extensible {
  id: string;
  index: number;
  options: unknown[];
  status?: string;
  inferredAreaLabel?: string;
  expectedMarginPct?: number;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface ClientConversationDoc extends Extensible {
  id: string;
  clientId: string;
  messages: unknown[];
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface StatusChatThreadDoc extends Extensible {
  id: string;
  clientId: string;
  comments: StatusComment[];
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

// ── Pipeline / stage config ────────────────────────────────────────────────

export interface StageConfigDoc extends Extensible {
  id: string;
  key: string;
  label: string;
  order: number;
  color?: string;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface StageGateDoc extends Extensible {
  id: string;
  stage: string;
  gate: string;
  condition?: string;
  enabled: boolean;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface OverviewFieldDoc extends Extensible {
  id: string;
  key: string;
  label: string;
  type?: string;
  order?: number;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

// ── Quotes ─────────────────────────────────────────────────────────────────

export interface QuoteTemplateDoc extends Extensible {
  id: string;
  title: string;
  blocks?: unknown[];
  status?: string;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface QuoteLineTemplateDoc extends Extensible {
  id: string;
  label: string;
  amountMinor?: number;
  currency?: string;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface QuoteLabelDoc extends Extensible {
  id: string;
  label: string;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface QuoteServiceTypeDoc extends Extensible {
  id: string;
  label: string;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

// ── Email / automation ─────────────────────────────────────────────────────

export interface EmailQueueDoc extends Extensible {
  id: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  cc?: string[];
  bcc?: string[];
  status: "pending" | "sent" | "dead" | "cancelled";
  attempts: number;
  sentAt?: IsoTimestamp;
  cancelledAt?: IsoTimestamp;
  lastError?: string | null;
  nextAttemptAt?: IsoTimestamp | null;
  createdAt: IsoTimestamp;
}

export interface EmailTemplateDoc extends Extensible {
  id: string;
  emailType: string;
  subject: string;
  body: string;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface StageEmailRuleDoc extends Extensible {
  id: string;
  triggerStage: string;
  emailType: string;
  condition: "always" | "has_email" | "no_email";
  mode: "auto" | "suggest";
  enabled: boolean;
  delayHours: number;
  label: string;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

// ── Content ────────────────────────────────────────────────────────────────

export interface PostDoc extends Extensible {
  id: string;
  kind: "guide" | "post";
  slug: string;
  title: string;
  body?: string;
  country?: string;
  category?: string;
  status?: string;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface UpdateDoc extends Extensible {
  id: string;
  title: string;
  country?: string;
  category?: string;
  summary?: string;
  source?: string;
  status?: string;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface TemplateDoc extends Extensible {
  id: string;
  title: string;
  country?: string;
  category?: string;
  status?: string;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

// ── People / entities ──────────────────────────────────────────────────────

export interface ProviderDoc extends Extensible {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  website?: string;
  country?: string;
  specialties?: unknown;
  /** Legal service areas this provider covers. */
  legalAreas?: string[];
  /** Countries/regions this provider is admitted to practice in. */
  jurisdictions?: string[];
  /** Languages the provider works in. */
  languages?: unknown;
  insurance?: Record<string, unknown>;
  slaStatus?: string;
  status?: "pending" | "vetted" | "active" | "inactive";
  active?: boolean;
  uid?: string;
  /** Operator quality score, 0–5 in half-star steps. Drives assignment priority. */
  score?: number | null;
  vettedAt?: IsoTimestamp;
  createdAt?: IsoTimestamp;
  updatedAt?: IsoTimestamp;
}

export interface ProfileDoc extends Extensible {
  id: string;
  uid?: string;
  email?: string;
  name?: string;
  role?: string;
  createdAt?: IsoTimestamp;
  updatedAt?: IsoTimestamp;
}

export interface VendorDoc extends Extensible {
  id: string;
  name?: string;
  email?: string;
  createdAt?: IsoTimestamp;
  updatedAt?: IsoTimestamp;
}

export interface LeadDoc extends Extensible {
  id: string;
  name?: string;
  email: string;
  country?: string;
  topic?: string;
  consent?: boolean;
  createdAt: IsoTimestamp;
}

export interface ConsultationBookingDoc extends Extensible {
  id: string;
  customerId: string;
  providerId: string;
  slot: CalendarSlot;
  source?: string;
  sourceId?: string | null;
  topic?: string;
  notes?: unknown;
  status: "requested" | "confirmed" | "cancelled";
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

// ── Ops ────────────────────────────────────────────────────────────────────

export interface TaskDoc extends Extensible {
  id: string;
  type?: string;
  title?: string;
  status?: string;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface AlertDoc extends Extensible {
  id: string;
  title?: string;
  description?: string;
  country?: string;
  category?: string;
  deadlineLabel?: string;
  deadlineTs?: number;
  status?: "scheduled" | "dispatched" | "responded" | "needs_help";
  profileId?: string;
  taskId?: string;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface ChatbotThreadDoc extends Extensible {
  id: string;
  clientId?: string;
  messages: unknown[];
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}