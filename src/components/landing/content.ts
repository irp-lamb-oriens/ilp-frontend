/** Copy for the ILP landing narrative. Calm, direct, international. */

/** One claim, repeated as a single CTA across the homepage and every country landing. */
export const CLAIM = "One missed deadline can cost you your life abroad.";
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

export const COSTS = [
  {
    figure: "Penalties",
    title: "A deadline you forgot",
    body: "A DIMEX renewal in Costa Rica, a corporate tax filing in Panama. Miss it and the fine arrives before any reminder does.",
  },
  {
    figure: "Confusion",
    title: "Advice that contradicts itself",
    body: "One lawyer says one thing, a forum says another. You pay for the answer twice and still are not certain.",
  },
  {
    figure: "Lost context",
    title: "Telling your story again",
    body: "Every new lawyer starts from zero. You repeat your situation, your assets, your deadlines, and something always gets dropped.",
  },
];

export const FEATURES = [
  {
    title: "A living legal profile",
    body: "Residency status, property titles, corporate structures, vehicles, and estate preferences in one record that follows you.",
  },
  {
    title: "Transcribed history and summaries",
    body: "Every consultation is recorded, transcribed, and summarized. Recommendations and action items are never lost.",
  },
  {
    title: "A human Customer Success Manager",
    body: "A dedicated CSM handles onboarding, gathers missing context, and manages follow-up so your attorney focuses on judgment.",
  },
  {
    title: "Automated compliance reminders",
    body: "Rule-based alerts for DIMEX renewals, corporate taxes, Marchamo vehicle obligations, and municipal filings.",
  },
];

export const STEPS = [
  {
    n: "01",
    title: "Residency and renewal alerts",
    body: "A DIMEX renewal approaches in Costa Rica. ILP flags the milestone, prepares the brief, and your CSM coordinates a review with your immigration attorney.",
  },
  {
    n: "02",
    title: "Real estate and corporate structuring",
    body: "You buy a property held through a local SRL. Your attorney reviews the closing while ILP logs the entity, RTBF dates, and municipal tax deadlines.",
  },
  {
    n: "03",
    title: "Catching forgotten obligations",
    body: "An annual corporate tax deadline in Panama slips your mind. ILP flags it, drafts the reminder, and coordinates the filing through your attorney.",
  },
];

export const COUNTRIES = [
  { code: "CR", name: "Costa Rica", note: "Residency renewals, CCSS, municipal property tax", live: true },
  { code: "PA", name: "Panama", note: "Corporate annual fees, registered agent duties", live: true },
  { code: "MX", name: "Mexico", note: "SAT filings, temporary residency timelines", live: true },
  { code: "ES", name: "Spain", note: "TIE renewals, modelo filings, IBI", live: true },
  { code: "PT", name: "Portugal", note: "Residence permits, IRS filings, IMI", live: true },
];

export const QUOTES = [
  {
    quote: "I finally have one place where my residency, taxes, and company filings all live together.",
    name: "Mariana Solís",
    role: "Runs two companies in Costa Rica",
  },
  {
    quote: "The reminders are calm and clear. I stopped digging through government sites.",
    name: "Tomás Herrera",
    role: "Moved to Panama in 2024",
  },
  {
    quote: "When I had a real question, a lawyer who understood my situation called the same week.",
    name: "Elena Varela",
    role: "Living in Mexico",
  },
];

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
  topic: string;
  highlight?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "smart-alerts",
    name: "Smart Alerts",
    tagline: "Freebie / Lead Magnet",
    price: "$0",
    unit: "/ month",
    activation: "Optional $5/month premium",
    allowance: "Automated compliance reminders",
    allowanceDetail: "Calendar alerts, legislative updates, and a basic living legal profile.",
    features: [
      "Push notifications and calendar alerts",
      "Basic living legal profile",
      "Template library for common contracts",
      "Legislative change summaries",
    ],
    cta: "Check free",
    topic: "Free deadline check",
  },
  {
    id: "core-membership",
    name: "Core Membership",
    tagline: "Flagship",
    price: "$79.99",
    unit: "/ month",
    activation: "$100 one-time activation",
    allowance: "Up to 60 minutes of consultations a month",
    allowanceDetail: "Up to 3 consultations, 20 minutes each. Unused minutes do not roll over.",
    features: [
      "Everything in Smart Alerts",
      "1-on-1 consultations with vetted local attorneys",
      "Living client legal profile and document vault",
      "Dedicated Customer Success Manager",
      "Transcribed history and AI summaries",
      "Automated compliance reminders",
      "Multi-specialty routing across five practice areas",
      "Up to $100,000 professional liability protection",
    ],
    cta: "Become a member",
    topic: "Membership plan",
    highlight: true,
  },
  {
    id: "enterprise",
    name: "Enterprise & Business",
    tagline: "Corporate",
    price: "$499.99",
    unit: "/ month",
    activation: "$150 one-time activation",
    allowance: "Up to 120 minutes of consultations a month",
    allowanceDetail: "Priority access and same-day scheduling.",
    features: [
      "Everything in Core Membership",
      "Contract review and due diligence coordination",
      "Extended and priority consultations",
      "Multi-entity management (SRL/SA, properties, vehicles)",
      "Labor and corporate compliance tracking",
      "Dedicated project management",
    ],
    cta: "Contact sales",
    topic: "Enterprise plan",
  },
];

/** Backward-compatible alias: the flagship Core plan. */
export const MEMBERSHIP = PLANS[1];

export const ADDONS = [
  {
    title: "Rush / same-day consultations",
    body: "Available on demand when a suitable specialist is free. An additional fee may apply.",
  },
  {
    title: "Individualized legal projects",
    body: "Due diligence, contract drafting, closings, formal opinions, and filings are scoped, quoted, and paid separately.",
  },
];

export const FAQ = [
  {
    q: "What does ILP actually track?",
    a: "Tax filings, residency and permit renewals, corporate and registry obligations, property taxes, and other country-specific legal deadlines that apply to you.",
  },
  {
    q: "How do you know my deadlines?",
    a: "You tell us your country and situation. Local professionals maintain the rules that map your profile to the obligations that apply.",
  },
  {
    q: "What does membership include?",
    a: "Up to 60 minutes of consultations a month, a living legal profile and document vault, a dedicated CSM, transcribed history, automated reminders, and multi-specialty routing.",
  },
  {
    q: "Is this legal advice?",
    a: "Membership covers technical explanations and issue identification. Specific legal work is scoped, quoted, and paid separately. The judgment stays with the lawyer.",
  },
  {
    q: "Which countries are live?",
    a: "Costa Rica, Panama, Mexico, Spain, and Portugal are live today.",
  },
];