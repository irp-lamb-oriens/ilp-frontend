/**
 * schemas/index.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Central schema registry (frontend mirror). Re-exports every document type
 * and the collection → type map so the dashboard and public surfaces import
 * from one place.
 */
import type {
  DashboardSession,
  DashboardOtp,
  ClientStatusSession,
  ClientStatusOtp,
  ConsultationDoc,
  ClientDoc,
  PricingRequestDoc,
  ClientConversationDoc,
  StatusChatThreadDoc,
  StageConfigDoc,
  StageGateDoc,
  OverviewFieldDoc,
  QuoteTemplateDoc,
  QuoteLineTemplateDoc,
  QuoteLabelDoc,
  QuoteServiceTypeDoc,
  EmailQueueDoc,
  EmailTemplateDoc,
  StageEmailRuleDoc,
  PostDoc,
  UpdateDoc,
  TemplateDoc,
  ProviderDoc,
  ProfileDoc,
  VendorDoc,
  LeadDoc,
  ConsultationBookingDoc,
  TaskDoc,
  AlertDoc,
  ChatbotThreadDoc,
} from "./collections";

export type {
  DashboardSession,
  DashboardOtp,
  ClientStatusSession,
  ClientStatusOtp,
  ConsultationDoc,
  ClientDoc,
  PricingRequestDoc,
  ClientConversationDoc,
  StatusChatThreadDoc,
  StageConfigDoc,
  StageGateDoc,
  OverviewFieldDoc,
  QuoteTemplateDoc,
  QuoteLineTemplateDoc,
  QuoteLabelDoc,
  QuoteServiceTypeDoc,
  EmailQueueDoc,
  EmailTemplateDoc,
  StageEmailRuleDoc,
  PostDoc,
  UpdateDoc,
  TemplateDoc,
  ProviderDoc,
  ProfileDoc,
  VendorDoc,
  LeadDoc,
  ConsultationBookingDoc,
  TaskDoc,
  AlertDoc,
  ChatbotThreadDoc,
};

export * from "./types";