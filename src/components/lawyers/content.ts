/**
 * Copy for the lawyers landing (/attorneys) and the partner lawyer
 * application (/lawyers/apply). Every word follows frontend/copy-rules.md.
 * Facts come from docs/PLAN.md and the lawyer portal; anything about the
 * partnership terms that counsel has not confirmed says so.
 */

export const APPLY_HREF = "/lawyers/apply";
export const SIGN_IN_HREF = "/lawyer";

export const LAWYERS_HERO = {
  eyebrow: "For lawyers licensed in Costa Rica",
  title: "Advise ILP members. We prepare each call and handle the follow-up.",
  why: "Many North Americans live in Costa Rica or own property there, and they have legal questions about residency, property, companies and cars. Finding them, booking them and chasing them after a call takes hours that nobody pays for. ILP members pay a monthly membership that includes their calls, they write their question down before booking, and a customer success manager follows up after you speak.",
  how: [
    "Apply online. We check your carné with the Colegio de Abogados y Abogadas de Costa Rica and reply by email.",
    "Set the weekly hours when members can book you, and the legal areas you take.",
    "Before each 20-minute video call, read a one-screen brief with the member's question and profile.",
    "After the call, confirm the suggested summary and next steps. ILP follows up with the member, including quotes for paid work.",
  ],
  what: "ILP is a legal membership for North Americans in Costa Rica: US$79.99 a month, with up to three 20-minute video calls a month with a lawyer licensed in Costa Rica. Partner lawyers are independent lawyers who take those calls through the ILP lawyer portal. Work beyond a call, like a filing or a transfer, is quoted separately and the member decides.",
  labels: { why: "Why lawyers join", how: "How it works for you", what: "What the partnership is" },
  primary: "Apply as a partner lawyer",
  secondary: "See the portal",
  signIn: "Already applied? Sign in",
  imageAlt: "A lawyer reviewing documents at a desk",
  cardTitle: "What you get in the portal",
  cardItems: [
    "Today: your calls in time order",
    "A one-screen brief for every call",
    "Summaries you confirm before members see them",
    "Your hours, days off and legal areas",
    "Your fees for paid work, paid and pending",
  ],
};

export const LAWYER_BANDS = {
  day: {
    id: "public.lawyer-day",
    anchor: "portal",
    title: "Your day in the portal",
    lead: "This is the first page you see when you sign in: today's calls, and the brief for each one.",
    caption: "Today and the one-screen brief, with example members.",
  },
  call: {
    id: "public.lawyer-call",
    anchor: "during-the-call",
    title: "During and after a call",
    lead: "Recording happens only with consent. You confirm the summary, then the customer success manager takes over the follow-up.",
    caption: "Recording consent, the suggested summary you confirm, and the hand-off to ILP.",
  },
  hours: {
    id: "public.lawyer-hours",
    anchor: "hours-and-fees",
    title: "Your hours and your fees",
    lead: "You choose when members can book you and which areas you take. Finance shows your own fees for paid work.",
    caption: "Weekly hours, notice, legal areas and the Finance page. The figures are an example.",
  },
} as const;

export const CHAIN_HEAD = {
  title: "What happens around each call",
  why: "You spend your time on the legal question. Booking, preparation and follow-up are done by the portal and the ILP team.",
};

export const PARTNERSHIP = {
  title: "The partnership, in plain words",
  why: "Read this before you apply. The partner terms are a draft, and ILP's counsel is still reviewing them.",
  facts: [
    { term: "You stay independent", body: "You keep your own practice and your professional duties. ILP does not direct your legal judgment." },
    { term: "Member calls", body: "Members book 20-minute video calls inside your hours. Their membership includes up to three calls a month." },
    { term: "Paid work", body: "If a member needs more than a call, you set the scope and your fee in a quote. The member accepts before work starts." },
    { term: "How you are paid", body: "How fees for calls and for quoted work are set, split and paid is in the partner terms. That part is pending review by ILP's counsel." },
    { term: "Who can apply", body: "Lawyers licensed in Costa Rica and in good standing with the Colegio de Abogados y Abogadas. Most members speak English, so tell us which languages you can hold a call in." },
    { term: "What we check", body: "Your carné with the Colegio, and your notary registration if you are a notary. We email you if something is missing." },
  ],
  termsLink: "Read the draft partner terms",
  termsHref: "/legal/partner-terms",
};

export const LAWYER_FAQ = [
  {
    q: "Do I have to stop working with my own clients?",
    a: "No. ILP calls fit inside the hours you set, and you keep your practice.",
  },
  {
    q: "What happens after I apply?",
    a: "You get an email right away. You can sign in to the lawyer portal and check your hours while we review your application. We email you again when you are approved, and only then can members book you.",
  },
  {
    q: "Do you ask for bank details in the application?",
    a: "No. We ask for payout details after you are approved. The application does not ask for bank details, ID numbers or passwords.",
  },
  {
    q: "Who sees my rates?",
    a: "ILP staff, to prepare quotes with you. Members see the price of a quote, not your hourly rate.",
  },
];

export const LAWYER_FINAL = {
  title: "Apply to take member calls",
  sub: "The application asks about your practice, your areas, your hours and your fees. You can save a draft in this browser and come back to it.",
};
