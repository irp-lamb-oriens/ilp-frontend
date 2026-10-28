import type { LegalSection } from "@/components/LegalPage";
import { PLAN_STANDARD } from "@/lib/contracts";
import { P } from "../placeholders";

const usd = (cents: number) => `US$${(cents / 100).toFixed(2).replace(/\.00$/, "")}`;
const MONTHLY = usd(PLAN_STANDARD.monthlyCents);
const ACTIVATION = usd(PLAN_STANDARD.activationCents);

export const TERMS_TITLE = "Terms of Membership";

export const TERMS_INTRO = `The short version: ILP is a membership that connects you with vetted, independent lawyers in Colombia, Costa Rica, Mexico, Panama, Portugal and Spain. It costs ${MONTHLY} a month plus a one-time ${ACTIVATION} activation, renews every month until you cancel, and you can cancel online at any time. Legal work beyond your calls is quoted separately.`;

export const TERMS_SECTIONS: LegalSection[] = [
  {
    heading: "Who you are agreeing with",
    body: [
      `These terms are an agreement between you and ${P.entity}, ${P.entityType}, ${P.address} ("ILP", "we"). By joining you accept them and the Privacy Policy.`,
    ],
    links: [{ label: "Privacy Policy", href: "/privacy" }],
  },
  {
    heading: "What ILP is, and what it is not",
    body: [
      "ILP is a membership service. It is not a law firm and does not give legal advice. Legal advice comes from independent lawyers licensed in the country your membership covers, whom ILP vets and connects you with. ILP staff and the AI assistant give general information and organize your follow-up; they do not give legal advice.",
      "ILP does not direct a lawyer's legal judgment. Each lawyer is responsible for the advice they give.",
      "Joining ILP does not by itself create a lawyer-client relationship with ILP. A lawyer-client relationship with a lawyer starts [counsel to confirm: when the lawyer accepts your matter, or with each membership call], under that lawyer's professional rules.",
      "[Counsel: confirm how lawyers are paid and that the arrangement meets each country's rules on fee sharing and lawyer independence (Colombia, Costa Rica, Mexico, Panama, Portugal and Spain), then describe it here in one sentence.]",
    ],
  },
  {
    heading: "What your membership includes",
    list: [
      `Up to ${PLAN_STANDARD.minutesIncluded} minutes a month with a vetted lawyer, across up to ${PLAN_STANDARD.callsIncluded} calls of ${PLAN_STANDARD.callLengthMin} minutes each.`,
      "A one-page brief prepared from your profile before each call, so your minutes go to your question.",
      "Follow-up by your ILP team on the next steps after each call.",
      "Reminders before the dates on your profile. They say what may require review; they are not legal advice.",
      "Unused minutes and calls do not roll over to the next month.",
      "Legal work such as filings, drafting or representation is not included. It is quoted separately, and nothing starts until you accept a quote.",
    ],
    body: ["The service covers Colombia, Costa Rica, Mexico, Panama, Portugal and Spain. Your membership covers the country you choose when you join; your ILP team can change it. If no partner lawyer in that country can take your call yet, your ILP team tells you and matches you as soon as one can."],
  },
  {
    heading: "Who can join",
    body: [
      `You must be at least ${P.minAge}, give accurate details and keep your sign-in email secure. A membership is for one person. Do not let someone else use your account.`,
    ],
  },
  {
    heading: "Price and payment",
    body: [
      `The membership costs ${MONTHLY} a month, paid in advance, plus a one-time activation fee of ${ACTIVATION} paid when you join. Card payments are processed by Stripe; if we offer another payment method, our team sends the details. [Counsel: confirm whether taxes such as Costa Rica's IVA apply and how prices are shown.]`,
    ],
  },
  {
    heading: "Automatic renewal",
    body: [
      `Your membership renews automatically every month at ${MONTHLY} until you cancel. On each renewal date we charge the card you used, and we email you a receipt.`,
      "If we change the price, we will email you at least 30 days before it applies, and you can cancel before then. [Counsel: confirm notice periods under the US state automatic-renewal laws that apply.]",
    ],
  },
  {
    heading: "Cancel online at any time",
    body: [
      "You can cancel in your member portal under Money, then Cancel membership. It takes one screen. There is no cancellation fee and you do not need to call anyone.",
      "When you cancel, your membership stays active until the end of the month you already paid for, then stops. You will not be charged again. You can undo the cancellation before that date.",
    ],
    links: [{ label: "Cancel membership (members)", href: "/status/money/cancel" }],
  },
  {
    heading: "Failed payments",
    body: [
      "If a renewal payment fails, we email you and you keep full access for 7 days while you update your card. After that, booking pauses until the payment goes through. If it is not paid, the membership is cancelled.",
    ],
  },
  {
    heading: "Refunds",
    body: [`${P.refundPolicy} Nothing in these terms limits refund rights the law gives you.`],
  },
  {
    heading: "Booking, changes and missed calls",
    list: [
      "Book calls in your member portal. Each call uses 20 minutes and 1 of your monthly calls.",
      "You can change or cancel a call up to 24 hours before it starts, and the minutes return to you.",
      "If you cancel later than that, or do not join within 10 minutes of the start, the call counts as used.",
      "If the lawyer misses the call, or a technical problem on our side stops it, we give the call back. [ILP to confirm this policy.]",
    ],
    body: [],
  },
  {
    heading: "Recording and AI",
    body: [
      "Calls are recorded only if you and your lawyer agree, and you can say no without any effect on your membership. The AI assistant gives general information and can be wrong; your team confirms anything legal.",
    ],
    links: [{ label: "Call recording and AI notice", href: "/legal/recording" }],
  },
  {
    heading: "Legal work beyond your calls",
    body: [
      "If you need more than a call, we send a written quote with the scope, the price and who does the work. Nothing starts until you accept. [Counsel: confirm who you contract with and who invoices for legal work, ILP or the lawyer.]",
    ],
  },
  {
    heading: "Using ILP fairly",
    list: [
      "Give accurate information and upload only documents you are allowed to share.",
      "Treat lawyers and staff with respect.",
      "Do not use ILP for anything unlawful, do not try to access other people's data, and do not copy or scrape the service.",
      "Do not upload harmful files.",
    ],
    body: [],
  },
  {
    heading: "Our part",
    body: [
      "We take reasonable care to run ILP well, to vet the lawyers in our network and to keep your information safe. The service may sometimes be unavailable for maintenance or reasons outside our control. Lawyer availability varies.",
    ],
  },
  {
    heading: "Limits on liability",
    body: [
      `ILP is not responsible for the legal advice of independent lawyers. To the extent the law allows, ILP's total liability to you is limited to ${P.liabilityCap}, and ILP is not liable for indirect or consequential losses. Nothing in these terms limits liability or consumer rights that cannot be limited by law.`,
    ],
  },
  {
    heading: "If we end a membership",
    body: [
      "We may end a membership for a serious breach of these terms, after telling you why by email. [Counsel: confirm notice and any refund on termination by ILP.]",
    ],
  },
  {
    heading: "Changes to these terms",
    body: [
      "Each version has an id shown at the top. We will email you at least 30 days before an important change. If you do not agree, you can cancel before it applies.",
    ],
  },
  {
    heading: "Governing law and disputes",
    body: [`${P.governingLaw}. ${P.disputes}.`],
  },
  {
    heading: "Contact",
    body: [`${P.entity}, ${P.address}. Email ${P.supportEmail}.`],
  },
];
