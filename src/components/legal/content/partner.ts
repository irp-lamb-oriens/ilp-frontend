import type { LegalSection } from "@/components/LegalPage";

/**
 * Draft partner lawyer terms (T2). Linked from the lawyers landing and the
 * application form. Keep PARTNER_TERMS_VERSION equal to the server's
 * (server/API/providers/applyLogic.ts); an application sent with another
 * version is refused. Every point counsel has not confirmed is marked.
 */
export const PARTNER_TERMS_VERSION = "partner-terms-2026-10-27-draft1";

export const PARTNER_TERMS_INTRO =
  "This is a summary of how the partnership between ILP and a partner lawyer would work. It is a draft for ILP's counsel to review, not a signed agreement. Applying does not create a partnership; approval and a signed partner agreement do. [Counsel: confirm that approval plus a signed agreement is the point where the partnership starts.]";

export const PARTNER_TERMS_SECTIONS: LegalSection[] = [
  {
    heading: "Who ILP is and what partner lawyers do",
    body: [
      "ILP is a membership service for North Americans in Costa Rica. It is not a law firm. Members pay a monthly membership that includes up to three 20-minute video calls a month with a lawyer licensed in Costa Rica.",
      "Partner lawyers are independent lawyers who take those calls through the ILP lawyer portal, inside the weekly hours they set. They also quote paid legal work that goes beyond a call.",
    ],
  },
  {
    heading: "Your independence",
    body: [
      "You keep your own practice and your professional duties under the rules of the Colegio de Abogados y Abogadas de Costa Rica. ILP does not direct your legal judgment, and you are responsible for the advice you give.",
      "[Counsel: confirm when the lawyer-client relationship with a member starts (each membership call, or when the lawyer accepts a matter) and how that is explained to members.]",
    ],
  },
  {
    heading: "Calls and the portal",
    list: [
      "Members book 20-minute video calls inside your weekly hours. You can set days off, the notice you need and the most calls in one day.",
      "Before each call you get a one-screen brief with the member's question and facts from their profile.",
      "A call is recorded only when the member agrees. AI-suggested summaries are drafts; you correct and confirm them before the member sees them.",
      "After you confirm, ILP's customer success manager handles the follow-up with the member.",
    ],
    body: [],
  },
  {
    heading: "Paid work and fees",
    body: [
      "When a member needs work beyond a call, you set the scope and your fee in a quote. Nothing starts until the member accepts.",
      "[Counsel: confirm how lawyers are paid for membership calls and for quoted work, who contracts with the member and who invoices for legal work, and that the arrangement meets Costa Rica's rules on fee sharing, referral fees and advertising. Then describe it here.]",
      "ILP collects payout details only after a lawyer is approved, inside the lawyer portal or by a secure method ILP sends. ILP never asks for bank details by email. [ILP to confirm the method.]",
    ],
  },
  {
    heading: "Your information",
    body: [
      "ILP uses the information in your application to review it, to check your carné with the Colegio and your notary registration if you are a notary, to set up your lawyer account and, once you are approved, to show members a short profile (your name, your areas, your languages and your bio). Your rates are seen by ILP staff, not by members.",
      "The privacy policy explains how long information is kept and your rights. [Counsel: confirm whether each partner lawyer is a processor for ILP or a separate controller under Ley 8968, and the data-sharing terms that follow.]",
    ],
    links: [{ label: "Privacy policy", href: "/privacy" }],
  },
  {
    heading: "Ending the partnership",
    body: [
      "[Counsel: set how either side ends the partnership, the notice period, and what happens to booked calls and matters in progress.]",
    ],
  },
];
