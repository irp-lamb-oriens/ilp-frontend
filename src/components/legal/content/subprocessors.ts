import { P } from "../placeholders";

/**
 * Service providers that process personal data for ILP, from a review of the
 * code on 2026-10-26 (server/API/chatbot/intelligence/llm.ts, transcription.ts,
 * helper/storage.ts, helper/calendar.ts, API/payments, config/integrations.ts,
 * docs/LAUNCH_CHECKLIST.md). Entries marked [confirm] depend on deployment
 * choices ILP has not confirmed in writing.
 */
export const SUBPROCESSOR_ROWS: Array<[string, string]> = [
  ["Google Cloud (Firestore, Cloud Storage)", `Database for member records; private storage for uploaded documents; daily backups. Region ${P.firestoreRegion}.`],
  ["Google Workspace (Calendar, Meet, Drive)", "Scheduling calls, Google Meet video calls and Meet transcripts, which are saved in ILP's Workspace Drive."],
  ["OpenRouter", "AI gateway. Sends AI assistant questions, call transcripts for suggested summaries, and uploaded call audio for transcription to the AI model configured by ILP (Google Gemini models by default). United States."],
  ["Google (Gemini API)", "Backup AI model provider, used only when OpenRouter is unavailable and a Gemini key is configured."],
  ["Stripe", "Card payments, subscriptions and the billing portal. ILP never sees or stores full card numbers. [confirm: only when PAYMENTS_MODE=stripe]"],
  [P.emailProvider, "Delivery of sign-in codes, reminders, receipts and other emails (SMTP)."],
  [P.apiHost, "Runs ILP's application server. [confirm: the code is set up for Render]"],
  [P.siteHost, "Serves the ILP website. [confirm: the launch checklist names Netlify]"],
  ["Sentry (optional)", "Error monitoring, only if ILP turns it on. Error reports may include the address of the page and the signed-in email. [confirm]"],
];

/** Not processors of member records, but your browser contacts them. */
export const OTHER_SERVICES_ROWS: Array<[string, string]> = [
  ["Web push services (Google, Mozilla, Apple)", "If you turn on notifications, your browser's push service delivers them. ILP sends the reminder text through it."],
  ["Pexels and flagcdn.com", "Some public pages load photos and flag icons from these sites. Your browser sends them your IP address, like any image request. No cookies are set by ILP for them."],
];
