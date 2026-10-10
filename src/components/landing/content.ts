/** Copy for the ILP landing narrative. Kept as data so sections stay layout-only. */

export const IMG = {
  justice:
    "https://images.pexels.com/photos/5668473/pexels-photo-5668473.jpeg?auto=compress&cs=tinysrgb&w=2000",
  scales:
    "https://images.pexels.com/photos/5669602/pexels-photo-5669602.jpeg?auto=compress&cs=tinysrgb&w=2000",
  documents:
    "https://images.pexels.com/photos/7856660/pexels-photo-7856660.jpeg?auto=compress&cs=tinysrgb&w=2000",
};

export const COSTS = [
  {
    figure: "Late",
    title: "Filings compound",
    body: "Penalties and interest grow every week a tax or corporate filing waits.",
  },
  {
    figure: "Lapsed",
    title: "Permits expire silently",
    body: "A residency or vehicle permit that runs out unnoticed can mean starting over.",
  },
  {
    figure: "Fined",
    title: "Not knowing is no defense",
    body: "Governments do not waive fees because the rule was new to you.",
  },
];

export const FEATURES = [
  {
    title: "Smart Compliance Alerts",
    body: "Reminders keyed to your country, municipality, and assets. Answer in one click and we route the follow-up.",
  },
  {
    title: "Reviewed legal updates",
    body: "Law changes in plain language, checked by the local team before they reach you.",
  },
  {
    title: "Jurisdiction templates",
    body: "Versioned checklists and trackers for each country, ready to download.",
  },
  {
    title: "Vetted legal partners",
    body: "When an alert needs judgment, book a lawyer matched to your specialty and language.",
  },
];

export const STEPS = [
  { n: "01", title: "Tell us your country", body: "One short form: where you live and what you own or run." },
  { n: "02", title: "We map your obligations", body: "Local lawyers turn your profile into the deadlines that apply." },
  { n: "03", title: "Alerted before it is due", body: "Reminders arrive ahead of each date. Reply once, we track the rest." },
];

export const COUNTRIES = [
  { code: "CR", name: "Costa Rica", note: "Residency renewals, CCSS, municipal property tax" },
  { code: "PA", name: "Panama", note: "Corporate annual fees, registered agent duties" },
  { code: "MX", name: "Mexico", note: "SAT filings, temporary residency timelines" },
  { code: "ES", name: "Spain", note: "Modelo 720, NIE and residency card renewals" },
  { code: "PT", name: "Portugal", note: "NIF obligations, D7 and golden visa renewals" },
];

export const QUOTES = [
  {
    quote: "I nearly missed a corporate filing that would have cost more than the filing itself. The alert came three weeks out.",
    name: "Mariana Solís",
    role: "Runs two companies in Costa Rica",
  },
  {
    quote: "The alert pointed to the exact obligation and the next step. I stopped digging through government sites.",
    name: "Tomás Herrera",
    role: "Moved to Panama in 2024",
  },
  {
    quote: "My residency renewals run on their own now. When I said I needed help, a lawyer called the same week.",
    name: "Elena Varela",
    role: "Dual citizen, Spain",
  },
];

export const PLANS = [
  {
    name: "Free",
    price: "$0",
    perDay: "Free forever",
    features: ["One country", "Core obligation alerts", "Email reminders"],
    cta: "Start free",
    topic: "Free plan",
    hero: false,
  },
  {
    name: "Pro",
    price: "$168",
    perDay: "$14 a month, about 46¢ a day, billed yearly",
    features: [
      "All five countries",
      "Every obligation category",
      "Advance + deadline-day reminders",
      "Full template library",
      "Priority support",
    ],
    cta: "Get Pro",
    topic: "Pro plan",
    hero: true,
  },
  {
    name: "Concierge",
    price: "Custom",
    perDay: "For families, brokers, and teams",
    features: ["Everything in Pro", "Vetted lawyer consults", "Written compliance plan"],
    cta: "Talk to us",
    topic: "Concierge plan",
    hero: false,
  },
];

export const FAQ = [
  {
    q: "What does ILP actually track?",
    a: "Tax filings, residency and permit renewals, corporate and registry obligations, property taxes, and other country-specific legal deadlines that apply to you.",
  },
  {
    q: "How do you know my deadlines?",
    a: "You tell us your country and situation. Local lawyers maintain the rules that map your profile to the obligations that apply.",
  },
  {
    q: "Is the free plan really free?",
    a: "Yes. One country, core alerts, and email reminders, with no card. Pro adds every country and the full template library.",
  },
  {
    q: "Is this legal advice?",
    a: "No. ILP surfaces deadlines and connects you with vetted lawyers when you need advice. The judgment stays with the lawyer.",
  },
];