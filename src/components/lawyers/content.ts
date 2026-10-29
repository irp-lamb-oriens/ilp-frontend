/**
 * Copy for the lawyers landing (/attorneys) and the partner lawyer
 * application (/lawyers/apply). Every word follows frontend/copy-rules.md.
 * Facts come from docs/PLAN.md and the lawyer portal; anything about the
 * partnership terms that counsel has not confirmed says so.
 */

export const APPLY_HREF = "/lawyers/apply";
export const SIGN_IN_HREF = "/lawyer";

export const LAWYERS_HERO = {
  eyebrow: "For lawyers in Colombia, Costa Rica, Mexico, Panama, Portugal and Spain",
  title: "Advise ILP members. We prepare each call and handle the follow-up.",
  why: "Many North Americans live in Colombia, Costa Rica, Mexico, Panama, Portugal or Spain, or own property there, and they have legal questions about residency, property, companies and cars. Finding them, booking them and chasing them after a call takes hours that nobody pays for. ILP members pay a monthly membership that includes their calls, they write their question down before booking, and a customer success manager follows up after you speak.",
  how: [
    "Apply online. We check your licence with the body that issued it (for example your carné with the Colegio de Abogados y Abogadas de Costa Rica, or your colegiado number in Spain) and reply by email.",
    "Set the weekly hours when members can book you, and the legal areas you take.",
    "Before each 20-minute video call, read a one-screen brief with the member's question and profile.",
    "After the call, confirm the suggested summary and next steps. ILP follows up with the member, including quotes for paid work.",
  ],
  what: "ILP is a legal membership for North Americans in six countries. Joining is free for lawyers. ILP does not charge you to apply or to use the lawyer portal. Members pay US$79.99 a month for up to three 20-minute video calls a month with a lawyer licensed in their country. Partner lawyers are independent lawyers who take those calls through the portal. Work beyond a call, like a filing or a transfer, is quoted separately and the member decides.",
  labels: { why: "Why lawyers join", how: "How it works for you", what: "What the partnership is" },
  primary: "Apply as a partner lawyer",
  secondary: "See the portal",
  signIn: "Already applied? Sign in",
};

/**
 * The hero copy above, split for the scroll sections (LawyersStory.tsx).
 * Every piece is cut from LAWYERS_HERO without changing a word:
 * tests/lawyersLanding.test.mjs joins the pieces back and compares.
 */
export const LAWYERS_INTRO = {
  /** Eyebrow: "For lawyers in", then the countries one by one. */
  eyebrowLead: "For lawyers in",
  countries: ["Colombia,", "Costa Rica,", "Mexico,", "Panama,", "Portugal", "and Spain"],
  /** H1: the first sentence, then the promise, underlined. */
  titleLead: "Advise ILP members.",
  titleKey: "We prepare each call and handle the follow-up.",
};

export const LAWYERS_WHY = {
  anchor: "why-lawyers-join",
  /** One beat per sentence of LAWYERS_HERO.why; `mark` is the phrase to underline. */
  beats: [
    {
      id: "why-lawyers-join-members",
      eyebrow: "Who the members are",
      rail: "The members",
      text: "Many North Americans live in Colombia, Costa Rica, Mexico, Panama, Portugal or Spain, or own property there, and they have legal questions about residency, property, companies and cars.",
      mark: "legal questions",
      caption: "Example member questions, one per country.",
    },
    {
      id: "why-lawyers-join-hours",
      eyebrow: "The unpaid part of the work",
      rail: "Unpaid hours",
      text: "Finding them, booking them and chasing them after a call takes hours that nobody pays for.",
      mark: "hours that nobody pays for",
      caption: "An example week of work around calls that nobody bills.",
    },
    {
      id: "why-lawyers-join-membership",
      eyebrow: "What ILP members do",
      rail: "Membership",
      text: "ILP members pay a monthly membership that includes their calls, they write their question down before booking, and a customer success manager follows up after you speak.",
      mark: "a customer success manager follows up",
      caption: "An example member: the question written before booking, then the follow-up note.",
    },
  ],
};

/**
 * "How it works for you" as four beats. Each step of LAWYERS_HERO.how is its
 * first sentence (the title) and the rest (the body, may be empty).
 */
export const LAWYERS_HOW = {
  anchor: "how-it-works-for-lawyers",
  steps: [
    {
      rail: "Apply",
      title: "Apply online.",
      body: "We check your licence with the body that issued it (for example your carné with the Colegio de Abogados y Abogadas de Costa Rica, or your colegiado number in Spain) and reply by email.",
      mark: "reply by email",
      caption: "Example screen: a Costa Rica licence checked with the Colegio, then the reply email.",
    },
    {
      rail: "Your hours",
      title: "Set the weekly hours when members can book you, and the legal areas you take.",
      titleMark: "the legal areas you take",
      body: "",
      caption: "Example screen: weekly hours with Wednesday added, and the legal areas chosen.",
    },
    {
      rail: "The brief",
      title: "Before each 20-minute video call, read a one-screen brief with the member's question and profile.",
      titleMark: "a one-screen brief",
      body: "",
      caption: "Example screen: the brief for a 20-minute call, with the question, profile facts and dates.",
    },
    {
      rail: "After the call",
      title: "After the call, confirm the suggested summary and next steps.",
      body: "ILP follows up with the member, including quotes for paid work.",
      mark: "ILP follows up with the member",
      caption: "Example screen: the summary confirmed, then the customer success manager's follow-up and a quote in progress.",
    },
  ],
};

/**
 * LAWYERS_HERO.what as the closing statement: the lead, then what it costs a
 * lawyer (nothing) in large type, then what members pay and the other facts
 * at body size, so the price never reads as the lawyer's fee.
 */
export const LAWYERS_WHAT = {
  lead: "ILP is a legal membership for North Americans in six countries.",
  free: "Joining is free for lawyers.",
  freeMark: "free for lawyers",
  freeDetail: "ILP does not charge you to apply or to use the lawyer portal.",
  members: "Members pay US$79.99 a month for up to three 20-minute video calls a month with a lawyer licensed in their country.",
  membersMark: "Members pay US$79.99 a month",
  partners: "Partner lawyers are independent lawyers who take those calls through the portal.",
  extra: "Work beyond a call, like a filing or a transfer, is quoted separately and the member decides.",
  extraMark: "the member decides",
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
    lead: "You choose when members can book you and which areas you take. Finance shows the fees paid to you for quoted work.",
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
    { term: "Free to join", body: "There is no fee to apply and no fee to use the lawyer portal. The US$79.99 a month is what members pay for their membership." },
    { term: "Member calls", body: "Members book 20-minute video calls inside your hours. Their membership includes up to three calls a month." },
    { term: "Paid work", body: "If a member needs more than a call, you set the scope and your fee in a quote. The member accepts before work starts." },
    { term: "How you are paid", body: "How fees for calls and for quoted work are set, split and paid is in the partner terms. That part is pending review by ILP's counsel." },
    { term: "Who can apply", body: "Lawyers licensed and in good standing in Colombia (tarjeta profesional), Costa Rica (Colegio carné), Mexico (cédula profesional), Panama (idoneidad), Portugal (Ordem dos Advogados cédula) or Spain (colegiado at a Colegio de Abogados). Most members speak English, so tell us which languages you can hold a call in." },
    { term: "What we check", body: "Your licence with the body that issued it, and your notary registration if you are a notary. We email you if something is missing." },
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
    q: "Do I pay anything to join?",
    a: "No. Applying is free, and so is using the lawyer portal. The US$79.99 a month on this page is what members pay ILP for their membership.",
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
