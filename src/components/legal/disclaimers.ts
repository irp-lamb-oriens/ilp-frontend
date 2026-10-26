/**
 * Disclaimer texts (P6). Wording for counsel review; the long version is on
 * /legal/disclaimer. Wire the short ones where the content is shown:
 *   CHECK_DISCLAIMER  under /check results (W3 file; it already says "general
 *                     information and not legal advice")
 *   AI_DISCLAIMER     the AI assistant in /status/messages (W4 file)
 *   EMAIL_FOOTER      every member email (server/helper/emailTemplates.ts, P2)
 */
export const DISCLAIMER_LONG = [
  "The information ILP shows you, including deadline check results, reminders, articles and AI assistant answers, is general information. It is not legal advice and does not create a lawyer-client relationship.",
  "Findings and reminders say what may require review. Whether something applies to you depends on your exact situation, and laws and dates change. Before you act, or decide not to act, confirm with a licensed lawyer, for example in a membership call.",
  "ILP is not a law firm. Legal advice comes from the independent lawyers in our network.",
];

export const CHECK_DISCLAIMER =
  "These results are general information, not legal advice. Each date may require review; a licensed lawyer can confirm what applies to you.";

export const AI_DISCLAIMER =
  "AI assistant: general information only, and it can be wrong. It is not your lawyer. Your ILP team confirms anything legal.";

export const EMAIL_FOOTER =
  "ILP is a membership service, not a law firm. Reminders and general information in this email are not legal advice; dates may require review by a licensed lawyer.";
