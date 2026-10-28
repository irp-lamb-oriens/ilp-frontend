/**
 * Copy for the ILP homepage. Every word follows frontend/copy-rules.md and
 * every fact matches docs/PLAN.md (one plan: US$79.99 a month plus a US$100
 * activation, up to three 20-minute calls, 60 minutes; Colombia, Costa Rica,
 * Mexico, Panama, Portugal and Spain all open).
 */

/** One claim shared with the country landings (CountryPage). */
export const CLAIM = "A legal membership for North Americans abroad, open in Colombia, Costa Rica, Mexico, Panama, Portugal and Spain.";
export const CHECK_CTA = "Check your deadlines free";

export const IMG = {
  // Real people in decision-making moments and clean workspaces (no gavels/scales).
  people:
    "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=2000",
  workspace:
    "https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=2000",
  documents:
    "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=2000",
};

/**
 * Hero copy, Golden Circle order: why, how, what. The homepage shows it as
 * four scroll sections (HeroCTA, then ProblemScroll, StepsScroll and
 * WhatYouGet in landing/HeroStory.tsx). `why` and `what` stay the full
 * sentences; PROBLEM and WHAT below split them into the pieces revealed on
 * scroll, and tests/homepage.test.mjs checks the pieces still read the same.
 */
export const HERO = {
  eyebrow: "Legal membership in six countries",
  title: "Keep your legal life abroad on track.",
  /** The one supporting line under the title: the first sentence of `what`. */
  lead: "ILP is a legal membership for North Americans in Colombia, Costa Rica, Mexico, Panama, Portugal and Spain.",
  why: "Living abroad or owning property there comes with legal dates and rules: residency renewals, company filings, property tax, yearly vehicle fees. They are written in Spanish or Portuguese, in a legal system you did not grow up with, and nobody reminds you when one is due.",
  how: [
    "Take the free deadline check. It takes about two minutes and you do not need an account.",
    "Join ILP if you want a lawyer to look at what came up.",
    "Your legal profile is set up, and you book video calls with a lawyer licensed in your country.",
    "After each call, your customer success manager follows up on the next steps.",
  ],
  what: "ILP is a legal membership for North Americans in Colombia, Costa Rica, Mexico, Panama, Portugal and Spain. It costs US$79.99 a month plus a one-time US$100 activation fee, and includes up to three 20-minute video calls a month (60 minutes). Drafting, filings and other legal work are quoted separately, and you decide whether to go ahead.",
  labels: { why: "The problem", how: "How ILP works", what: "What you get" },
  secondary: "See how it works",
  /** Section the secondary button scrolls to (the four steps). */
  howAnchor: "how-it-works",
};

/** "The problem", phrase by phrase. Joined with spaces, the phrases are HERO.why. */
export const PROBLEM = {
  phrases: [
    "Living abroad or owning property there comes with legal dates and rules:",
    "residency renewals, company filings, property tax, yearly vehicle fees.",
    "They are written in Spanish or Portuguese, in a legal system you did not grow up with,",
    "and nobody reminds you when one is due.",
  ],
  /** Labels that light up in turn while the second phrase is read. Decorative. */
  items: ["Residency renewals", "Company filings", "Property tax", "Vehicle fees"],
};

/** "What you get", block by block. Same facts and words as HERO.what. */
export const WHAT = {
  price: 79.99,
  unit: "a month",
  activation: "plus a one-time US$100 activation fee",
  calls: "Includes up to three 20-minute video calls a month (60 minutes).",
  extra: "Drafting, filings and other legal work are quoted separately, and you decide whether to go ahead.",
};

/** Facts strip under the hero. Only facts from docs/PLAN.md. */
export const TRUST = [
  { value: "Free deadline check", label: "About two minutes, no account needed" },
  { value: "US$79.99 a month", label: "Plus a one-time US$100 activation fee" },
  { value: "Up to 3 calls a month", label: "20 minutes each, with a lawyer licensed in your country" },
];

/** The two photo bands. */
export const BANDS = {
  clarity: {
    title: "See what applies to you before it is due.",
    body: "Your profile lists the dates and rules that may apply to your residency, your property, your companies and your car. You can ask your lawyer about any of them before you sign, pay or file anything.",
    alt: "People in a meeting reviewing documents",
  },
  lawyers: {
    title: "A lawyer licensed in your country, when you need one.",
    body: "Each call is with a lawyer licensed in the country your membership covers, who has read your brief first. If your question turns into paid legal work, the lawyer quotes it in writing and you decide whether to go ahead.",
    alt: "A tidy desk with a laptop and papers",
  },
};

/**
 * "What a missed date can cost you": a pinned scroll story on wide screens
 * (CostsStory.tsx). Each cost is one beat: the eyebrow, the title, then the
 * body brightening phrase by phrase, with a small picture beside it.
 */
export const COSTS_HEAD = {
  title: "What a missed date can cost you",
  why: "Each of our six countries has yearly legal dates for residents, property owners and companies, and few of them come with a reminder.",
  /** The key phrase of the lead, underlined once it is read. */
  mark: "few of them come with a reminder",
  anchor: "costs",
};

export const COSTS = [
  {
    id: "fines",
    eyebrow: "Fines",
    title: "A date you did not know about",
    body: "Your residency card, your company's yearly filing, the yearly fee for your car. Each has its own date, and a late one can bring a fine or extra paperwork.",
  },
  {
    id: "doubt",
    eyebrow: "Doubt",
    title: "Answers that do not agree",
    body: "A forum says one thing, a neighbor another, a lawyer a third. You pay for the same question more than once and still are not sure.",
  },
  {
    id: "retelling",
    eyebrow: "Retelling",
    title: "Explaining your situation again",
    body: "Each new lawyer starts from zero. You explain your residency, your house and your company again, and details get lost between conversations.",
  },
] as const;

/**
 * Labels inside the three pictures (decorative, hidden from assistive tech).
 * Only words the beat's own body already says.
 */
export const COSTS_VISUALS = {
  fines: {
    today: "Today",
    /** In the order they pass the today marker; the last one is missed. */
    dates: ["Residency card", "Car fee", "Company filing"],
    late: "Late",
  },
  doubt: {
    answers: [
      { who: "A forum", says: "Yes" },
      { who: "A neighbor", says: "No" },
      { who: "A lawyer", says: "It depends" },
    ],
  },
  retelling: {
    profile: "Your situation",
    lines: ["Residency", "House", "Company"],
    copy: "New lawyer",
  },
};

/** After the third beat: a restatement of the lead, then the way on to the free check. */
export const COSTS_WRAP = {
  line: "Few of these dates come with a reminder.",
  link: "Try the free check",
  href: "#free-check",
};

export const FEATURES_HEAD = {
  title: "What the membership includes",
  why: "Your legal life abroad sits in one place, with a lawyer and a team who already know it when you ask a question.",
};

export const FEATURES = [
  {
    title: "A living legal profile",
    body: "Your residency, property, companies, vehicles and household in one record. Your answers to the free check fill in the first part, and it grows after each call.",
  },
  {
    title: "Calls with a lawyer licensed in your country",
    body: "Up to 60 minutes a month, as 20-minute video calls. Your lawyer reads a brief from your profile before each call, so the time goes to your question.",
  },
  {
    title: "A summary and next steps after every call",
    body: "You get a short written summary and a list of next steps, checked by your lawyer before you see them. Calls are recorded only if you say yes.",
  },
  {
    title: "A customer success manager",
    body: "A person at ILP who sets up your profile, answers account questions and follows up on each next step, so your lawyer's time goes to legal questions.",
  },
  {
    title: "Reminders before your dates",
    body: "Residency renewals, social security payments, property tax, company filings and vehicle fees are listed as dates that may require review, for your country. You hear about them before they are due.",
  },
];

export const STEPS_HEAD = {
  title: "What this looks like in real situations",
  why: "Three common situations, and how a date or a question moves from your list to a call and then to a next step.",
};

export const STEPS = [
  {
    n: "01",
    title: "A residency renewal",
    body: "Your residency card (a DIMEX in Costa Rica, a TIE in Spain) comes up for renewal in a few months, and it is on your list early. You ask about it on a call, your lawyer tells you what to gather, and your customer success manager checks in until it is done.",
  },
  {
    n: "02",
    title: "Buying a house through a company",
    body: "You buy a house in Guanacaste held by a Costa Rican S.R.L. Your lawyer reviews the closing under a quote you accepted. The company's yearly dates, such as the corporation tax and the beneficial-owner declaration, are added to your profile.",
  },
  {
    n: "03",
    title: "A company tax you had not heard of",
    body: "Your company in Costa Rica or Panama owns your car and nothing else. It still has a yearly tax or fee. The free check lists it, and on a call your lawyer explains whether it applies and what to do.",
  },
];

export const COVERAGE_HEAD = {
  title: "Six countries, open now",
  why: "The rules, the dates and the lawyers are local. Each country has its own list of dates from our research, and lawyers licensed there.",
};

/** All six are open (contracts COUNTRIES). Notes name a few of each country's dates from docs/research. */
export const COUNTRIES = [
  { code: "CO", name: "Colombia", note: "Visa registration and cédula de extranjería, the resident visa traspaso, DIAN returns, predial, matrícula mercantil, SOAT", status: "Open now", live: true },
  { code: "CR", name: "Costa Rica", note: "DIMEX renewals, Caja (CCSS), municipal property tax, corporation tax, RTBF, marchamo", status: "Open now", live: true },
  { code: "MX", name: "Mexico", note: "INM card exchange and renewals, SAT filings, predial, fideicomiso fees, refrendo", status: "Open now", live: true },
  { code: "PA", name: "Panama", note: "Residency cards, tasa única, resident agent records, property tax installments, décimo", status: "Open now", live: true },
  { code: "PT", name: "Portugal", note: "AIMA permit renewals, IRS and IMI, IUC, RCBE, domestic staff contributions", status: "Open now", live: true },
  { code: "ES", name: "Spain", note: "TIE and permit renewals, IRPF and Modelo 720, IBI, ITV, household staff", status: "Open now", live: true },
];

export const SCENARIOS_HEAD = {
  title: "Example situations",
  why: "ILP is just opening, so these are made-up examples of common situations, not reviews from real members.",
  label: "Example",
};

/**
 * Example scenarios, clearly labelled. They replace three quotes from named
 * people that were not real members (T1, 2026-10-27).
 */
export const SCENARIOS = [
  {
    title: "A retiree in Atenas with a Costa Rican corporation",
    body: "Her house is held by an S.A. she set up years ago. The free check lists the corporation tax and the beneficial-owner declaration. On her first call, the lawyer explains which ones apply and what the company needs.",
    tag: "Company and property",
  },
  {
    title: "A couple on rentista residency in Grecia",
    body: "Their DIMEX cards come up for renewal next year. The dates sit on their home page, and they use one 20-minute call to ask what to prepare and when to start.",
    tag: "Residency",
  },
  {
    title: "A retired couple in Valencia",
    body: "Their non-lucrative residence permits come up for renewal in the spring, and they hold savings in the US. The dates sit on their home page, and they use a call to ask about the renewal window and the foreign assets declaration.",
    tag: "Residency and tax",
  },
];

/** Kept for older imports. */
export const QUOTES = SCENARIOS;

export interface Plan {
  id: string;
  name: string;
  tagline: string;
  price: string;
  unit: string;
  activation: string;
  allowance: string;
  allowanceDetail: string;
  features: string[];
  cta: string;
  href: string;
  topic?: string;
  highlight?: boolean;
}

export const PRICING_HEAD = {
  title: "What it costs",
  why: "Start with the free check. Pay a monthly fee only if you want a lawyer and a team to help with what it shows.",
};

export const PLANS: Plan[] = [
  {
    id: "free-check",
    name: "Free deadline check",
    tagline: "Free",
    price: "US$0",
    unit: "",
    activation: "No account needed",
    allowance: "A dated list of what may apply to you",
    allowanceDetail: "About two minutes. Colombia, Costa Rica, Mexico, Panama, Portugal or Spain.",
    features: [
      "Questions about your residency, property, companies, vehicles and staff",
      "Dates that may require review, with a short note on each",
      "The list sent to your email, if you want it",
    ],
    cta: "Start the free check",
    href: "/check",
  },
  {
    id: "core-membership",
    name: "ILP membership",
    tagline: "Membership",
    price: "US$79.99",
    unit: "a month",
    activation: "plus a one-time US$100 activation fee",
    allowance: "Up to 60 minutes a month with your lawyer",
    allowanceDetail: "Up to three 20-minute video calls. Unused minutes do not carry over.",
    features: [
      "Video calls with a lawyer licensed in your country",
      "A brief prepared from your profile before each call",
      "A written summary and next steps after each call, checked by your lawyer",
      "A customer success manager who follows up",
      "A living legal profile: residency, property, companies, vehicles and household",
      "Reminders before the dates that apply to you",
    ],
    cta: "Join ILP",
    href: "/join",
    highlight: true,
  },
];

/** The membership plan (PLAN_STANDARD in lib/contracts.ts). */
export const MEMBERSHIP = PLANS[1];

/**
 * Tiers the homepage used to show (a free "Smart Alerts" plan with a US$5
 * premium and a US$499.99 "Enterprise & Business" plan). They are not in
 * docs/PLAN.md or lib/contracts.ts, so the page no longer renders them.
 * Kept here for reference until the offer documents confirm them.
 */
export const UNCONFIRMED_PLANS = [
  { id: "smart-alerts", name: "Smart Alerts", price: "US$0", note: "Optional US$5 a month premium" },
  { id: "enterprise", name: "Enterprise & Business", price: "US$499.99", note: "US$150 one-time activation, 120 minutes a month" },
];

export const ADDONS = [
  {
    title: "Legal work beyond your calls",
    body: "Drafting, filings, closings, formal opinions and representation are scoped by your lawyer and quoted in writing. Nothing starts until you accept, and it is paid separately from the membership.",
  },
  {
    title: "A business or several companies",
    body: "If you run a business or hold several companies, take the free check first. Your customer success manager can then tell you plainly what the membership covers.",
  },
];

export const FAQ_HEAD = {
  title: "Questions people ask before joining",
  why: "Short answers about what ILP does, what it costs and what it does not do.",
};

export const FAQ = [
  {
    q: "What does ILP track for me?",
    a: "Dates and rules that may apply to your life in your country: residency renewals and stay limits, tax returns, property tax, yearly company filings and beneficial-owner records, vehicle fees and inspections, and duties if you employ staff. In Costa Rica that means the DIMEX, the Caja and the marchamo; in Spain the TIE, the IRPF and the IBI; and so on for each country. Each one is listed as something that may require review, because a lawyer confirms what applies to you.",
  },
  {
    q: "How do you know which dates apply to me?",
    a: "You answer a few questions in the free check. Your answers are matched against that country's list of rules, from our research, and the dates that may apply are shown. When you join, the same answers fill in the first part of your legal profile.",
  },
  {
    q: "What does the membership include?",
    a: "Up to 60 minutes a month with a lawyer licensed in your country, as up to three 20-minute video calls. Before each call your lawyer reads a brief from your profile, and after it you get a written summary and next steps. A customer success manager follows up, and your profile and reminders are included. It costs US$79.99 a month plus a one-time US$100 activation fee.",
  },
  {
    q: "Is this legal advice?",
    a: "On a call you talk with a lawyer licensed in your country, and the legal judgment is theirs. ILP organizes the relationship and the follow-up. Work such as drafting, filings or representation is scoped, quoted in writing and paid separately, and it starts only if you accept.",
  },
  {
    q: "Are the calls recorded?",
    a: "Only if you agree. You choose when you book, and you can change your mind when you join the call. Your lawyer must agree too. With a recording, AI drafts the summary and your lawyer checks it before you see it. Saying no changes nothing else about the call.",
  },
  {
    q: "Do unused minutes carry over?",
    a: "No. Each month includes up to 60 minutes across up to three calls, and the count starts again on your renewal date.",
  },
  {
    q: "Which countries can I use ILP in?",
    a: "Colombia, Costa Rica, Mexico, Panama, Portugal and Spain, all open now. The check, the reminders and your lawyer follow the country your membership covers. If no partner lawyer in your country is free yet, your customer success manager tells you and matches you as soon as one is.",
  },
];

/** Tutorials played between the homepage sections, with their lead-ins. */
export const TUTORIAL_BANDS = {
  check: {
    id: "public.check",
    anchor: "free-check",
    title: "Try the free check",
    lead: "Here is the free deadline check: a few short questions, then a dated list of what may apply to you.",
    caption: "The free deadline check, from the first question to the dated list.",
  },
  home: {
    id: "public.member-home",
    anchor: "member-home",
    title: "What your member home looks like",
    lead: "When you sign in as a member, this is the first page you see. It starts with your next step.",
    caption: "A member's home page with example data: next step, minutes left and dates to ask about.",
  },
  call: {
    id: "public.call",
    anchor: "lawyer-call",
    title: "How a call with your lawyer works",
    lead: "From booking a time to the follow-up afterwards, this is what one call looks like.",
    caption: "Booking, the call, the summary and next steps, and the follow-up from your ILP team.",
  },
  pricing: {
    id: "public.pricing",
    anchor: "what-you-pay",
    title: "What you pay and what's included",
    lead: "This is the Money page a member sees: the monthly fee, the calls included and a quote for extra work.",
    caption: "The membership fee, the minutes included and a quote you can accept or decline.",
  },
} as const;

export const FINAL = {
  title: "Start with the free deadline check.",
  sub: "Pick your country, answer a few questions and see the dates that may apply. It takes about two minutes and you do not need an account.",
  pick: "Pick your country",
  soon: "Not yet",
  hint: "The check is free. Membership is US$79.99 a month plus a one-time US$100 activation fee.",
};

export const FOOTER = "International Legal Partner. A legal membership for North Americans living in Colombia, Costa Rica, Mexico, Panama, Portugal or Spain, or owning property there.";
