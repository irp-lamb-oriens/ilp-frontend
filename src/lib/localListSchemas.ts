/**
 * FILTERS: field schemas of the lists the browser pages itself (one member's
 * records, settings, small reports). Lists served by the API use
 * LIST_SCHEMAS in lib/listSchemas.ts, shared with the server.
 */

import { defineListSchema, DOCUMENT_CATEGORY_OPTIONS, PRIVACY_KIND_OPTIONS, TASK_TYPE_OPTIONS, type ListOption } from "./listSchemas";

const opts = (pairs: Array<[string, string]>): ListOption[] => pairs.map(([value, label]) => ({ value, label }));

export const LOCAL_SCHEMAS = {
  /** Staff member page: open tasks. */
  memberTasks: defineListSchema({
    id: "staff-member-tasks",
    fields: [
      { key: "title", label: "Task", type: "text", searchable: true, sortable: true },
      { key: "type", label: "Type", type: "enum", options: TASK_TYPE_OPTIONS, quick: true },
      { key: "dueAt", label: "Due", type: "date", sortable: true, quick: true },
      { key: "overdue", label: "Overdue", type: "boolean" },
    ],
  }),
  /** Staff member page: open quotes. */
  memberQuotes: defineListSchema({
    id: "staff-member-quotes",
    fields: [
      { key: "title", label: "Quote", type: "text", searchable: true, sortable: true },
      { key: "status", label: "Status", type: "enum", quick: true },
      { key: "totalCents", label: "Total", type: "number", unit: "cents", sortable: true },
      { key: "createdAt", label: "Created", type: "date", sortable: true },
    ],
  }),
  /** Staff and lawyer: a member's documents. */
  memberFiles: defineListSchema({
    id: "member-files",
    fields: [
      { key: "fileName", label: "File", type: "text", searchable: true, sortable: true },
      { key: "category", label: "Kind", type: "enum", options: DOCUMENT_CATEGORY_OPTIONS, quick: true },
      { key: "matter", label: "Matter", type: "enum", quick: true },
      { key: "uploadedAt", label: "Added", type: "date", sortable: true },
      { key: "size", label: "Size (bytes)", type: "number", sortable: true },
    ],
  }),
  /** Admin: sales report, one row per completed or open project. */
  salesProjects: defineListSchema({
    id: "staff-sales-projects",
    fields: [
      { key: "label", label: "Project", type: "text", searchable: true, sortable: true },
      { key: "kind", label: "Source record", type: "enum", options: opts([["quote", "Quote"], ["client", "Client"], ["invoice", "Invoice"]]), quick: true },
      { key: "complete", label: "Payments complete", type: "boolean", quick: true },
      { key: "completedAt", label: "Completed", type: "date", sortable: true, quick: true },
      { key: "source", label: "Completion signal", type: "enum", searchable: true, defaultVisible: false },
      { key: "contractValue", label: "Contract value", type: "number", sortable: true },
      { key: "collected", label: "Collected", type: "number", sortable: true },
      { key: "outstanding", label: "Outstanding", type: "number", sortable: true },
      { key: "margin", label: "Margin", type: "number", sortable: true },
    ],
  }),
  /** Reports: where free checks come from. */
  pmfSources: defineListSchema({
    id: "staff-pmf-sources",
    fields: [
      { key: "source", label: "Source", type: "text", searchable: true, sortable: true },
      { key: "checks", label: "Checks", type: "number", sortable: true },
      { key: "paid", label: "Paid", type: "number", sortable: true },
    ],
  }),
  /** Privacy request drawer: what a deletion would do per collection. */
  privacyPlan: defineListSchema({
    id: "staff-privacy-plan",
    fields: [
      { key: "collection", label: "Collection", type: "text", searchable: true, sortable: true },
      { key: "action", label: "Action", type: "enum", options: opts([["delete", "Delete"], ["anonymize", "Anonymize"], ["keep", "Keep"], ["pseudonymize_email", "Hash email"]]), quick: true },
      { key: "count", label: "Records", type: "number", sortable: true },
      { key: "why", label: "Why", type: "text", searchable: true, defaultVisible: false },
    ],
  }),
  /** Lawyer finance: fees per matter. */
  lawyerFeesByMatter: defineListSchema({
    id: "lawyer-fees-by-matter",
    fields: [
      { key: "title", label: "Matter", type: "text", searchable: true, sortable: true },
      { key: "clientName", label: "Member", type: "text", searchable: true, sortable: true },
      { key: "paid", label: "Paid", type: "number", sortable: true },
      { key: "pending", label: "Pending", type: "number", sortable: true, quick: true },
      { key: "nextPayoutAt", label: "Next payout", type: "date", sortable: true, quick: true },
    ],
  }),
  /** Lawyer inspector: calls with this member. */
  lawyerCalls: defineListSchema({
    id: "lawyer-inspector-calls",
    fields: [
      { key: "scheduledAt", label: "When", type: "date", sortable: true, quick: true },
      { key: "status", label: "Status", type: "enum", options: opts([["booked", "Booked"], ["in_progress", "In progress"], ["completed", "Completed"], ["no_show", "No-show"], ["cancelled", "Cancelled"]]), quick: true },
      { key: "summaryStatus", label: "Summary", type: "enum", options: opts([["suggested", "Suggested, not confirmed"], ["confirmed", "Confirmed"], ["__none", "No summary"]]) },
      { key: "handedOff", label: "Handed off", type: "boolean" },
      { key: "question", label: "Question", type: "text", searchable: true },
      { key: "summary", label: "Summary text", type: "text", searchable: true },
    ],
  }),
  /** Lawyer inspector: notes on the member. */
  lawyerNotes: defineListSchema({
    id: "lawyer-inspector-notes",
    fields: [
      { key: "text", label: "Note", type: "text", searchable: true },
      { key: "author", label: "Author", type: "person", quick: true },
      { key: "createdAt", label: "Written", type: "date", sortable: true, quick: true },
    ],
  }),
  /** Lawyer inspector: fee quotes. */
  lawyerQuotes: defineListSchema({
    id: "lawyer-inspector-quotes",
    fields: [
      { key: "title", label: "Quote", type: "text", searchable: true, sortable: true },
      { key: "status", label: "Status", type: "enum", quick: true },
      { key: "fee", label: "Your fee", type: "number", sortable: true },
      { key: "createdAt", label: "Created", type: "date", sortable: true, quick: true },
    ],
  }),
  /** Lawyer inspector: legal deadlines from the country catalog. */
  lawyerDeadlines: defineListSchema({
    id: "lawyer-inspector-deadlines",
    fields: [
      { key: "title", label: "Deadline", type: "text", searchable: true, sortable: true },
      { key: "category", label: "Category", type: "enum", quick: true },
      { key: "hasDate", label: "Date set", type: "boolean", quick: true },
      { key: "date", label: "Date", type: "date", sortable: true },
      { key: "description", label: "Description", type: "text", searchable: true },
    ],
  }),
  /** Member Money: proposals and charges in one list. */
  memberMoney: defineListSchema({
    id: "member-money",
    fields: [
      { key: "title", label: "Item", type: "text", searchable: true, sortable: true },
      { key: "kind", label: "Kind", type: "enum", options: opts([["proposal", "Proposal"], ["charge", "Charge"]]), quick: true },
      { key: "status", label: "Status", type: "enum", options: opts([["paid", "Paid"], ["partially_paid", "Partly paid"], ["due", "To pay"], ["accepted", "Accepted"], ["declined", "Declined"]]), quick: true },
      { key: "date", label: "Date", type: "date", sortable: true },
      { key: "amountCents", label: "Amount", type: "number", unit: "cents", sortable: true },
    ],
  }),
  /** Member privacy center: the member's own requests. */
  memberPrivacyRequests: defineListSchema({
    id: "member-privacy-requests",
    fields: [
      { key: "kind", label: "Request", type: "enum", options: PRIVACY_KIND_OPTIONS, quick: true },
      { key: "status", label: "Status", type: "enum", options: opts([["received", "Received"], ["in_review", "In review"], ["completed", "Done"], ["refused", "Refused"]]), quick: true },
      { key: "createdAt", label: "Received", type: "date", sortable: true },
      { key: "dueAt", label: "Answer by", type: "date", sortable: true },
    ],
  }),
} as const;
