import { P } from "../placeholders";

/**
 * Retention periods shown on the legal pages. The numbers match the server
 * defaults (server/API/privacy/policy.ts RETENTION_DEFAULTS, env RETENTION_*);
 * every one is a proposal pending counsel. Change both places together.
 */
export const RETENTION_ROWS: Array<[string, string]> = [
  ["Account, living legal profile, matters, messages, documents", "While you are a member, and until you ask us to delete them. [Counsel: set a maximum period after a membership ends.]"],
  ["Call transcripts and AI summaries", "Removed 24 months after your membership ends (proposed), or sooner if you ask us to delete your account."],
  ["Free deadline check answers (if you never join)", "Deleted 12 months after the check (proposed)."],
  ["Sign-in codes and sessions", "Deleted 1 day after they expire. Codes expire after 10 minutes; member sessions after 7 days without use."],
  ["Copies of emails we sent you", "Deleted 90 days after sending (proposed)."],
  ["Error reports and security-policy reports", "Deleted after 90 days (proposed)."],
  ["Anonymous measurement events", "Deleted after 13 months (proposed)."],
  ["Website chatbot conversations (not signed in)", "Deleted 6 months after the last message (proposed)."],
  ["Invoices and payment records", `Kept for ${P.accountingYears} to meet accounting and tax duties, even after account deletion.`],
  ["Consent records and privacy requests", `Kept for ${P.auditYears} as proof; after account deletion your email in them is replaced by a one-way code.`],
  ["Security audit log (sign-ins, document downloads, staff actions)", `Kept for ${P.auditYears}.`],
  ["Backups", "Daily database backups are deleted automatically after 30 to 90 days."],
];
