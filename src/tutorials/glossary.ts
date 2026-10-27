/**
 * Plain-language meanings for every word in the tutorials that a newcomer
 * may not know: ILP's business words, Costa Rican legal words, and screen
 * words. One place, so a meaning is written once.
 *
 * Captions reference terms by key (`say(op, label, explain, ["mrr"])`), and
 * `findTerms` also picks up any glossary word a caption uses. The player
 * offers the meaning under the caption ("What's this?") the first time the
 * word appears in a tutorial.
 *
 * Write meanings for someone who has never lived in Costa Rica, never worked
 * at ILP and rarely uses business software: short sentences, everyday words.
 */
import type { TermRef } from "../components/tutorial/types";

export interface GlossaryEntry {
  /** The word as shown. */
  word: string;
  /** One or two short sentences. */
  meaning: string;
  /** How the word appears in captions. Omit for terms used only by key. */
  match?: RegExp;
  /** Group for the /ui glossary list. */
  group: "ILP" | "Costa Rica" | "Money and numbers" | "On the screen";
}

export const GLOSSARY = {
  // ─── ILP ──────────────────────────────────────────────────────────────────
  ilp: {
    word: "ILP",
    meaning: "International Legal Partner. A monthly membership that gives people who live in Costa Rica a local lawyer to talk to and a team that follows up.",
    match: /\bILP\b/,
    group: "ILP",
  },
  member: {
    word: "Member",
    meaning: "A person who pays for an ILP membership. Members are ILP's customers.",
    match: /\bmembers?\b/i,
    group: "ILP",
  },
  membership: {
    word: "Membership",
    meaning: "The monthly plan: US$79.99 a month for up to three 20-minute video calls with a lawyer, plus a team that follows up.",
    match: /\bmemberships?\b/i,
    group: "ILP",
  },
  activationFee: {
    word: "Activation fee",
    meaning: "A one-time payment of US$100 when someone joins. It covers setting up their account and profile.",
    match: /\bactivation fee\b/i,
    group: "ILP",
  },
  csm: {
    word: "CSM",
    meaning: "Customer success manager. The ILP team member who looks after a member: welcomes them, reminds them and follows up after each call.",
    match: /\bCSMs?\b|customer success manager/i,
    group: "ILP",
  },
  ilpTeam: {
    word: "ILP team",
    meaning: "The ILP staff who run the service. They answer messages and handle follow-up, but they do not give legal advice. Lawyers do that.",
    match: /\bILP team\b|\byour team\b/i,
    group: "ILP",
  },
  partnerLawyer: {
    word: "Partner lawyer",
    meaning: "A licensed Costa Rican lawyer who works with ILP. They take the calls and give the legal advice; ILP staff do not.",
    match: /\bpartner lawyers?\b/i,
    group: "ILP",
  },
  matter: {
    word: "Matter",
    meaning: "One legal job for a member, like buying a house or renewing residency. One member can have several at once.",
    match: /\bmatters?\b/i,
    group: "ILP",
  },
  consultation: {
    word: "Consultation",
    meaning: "A video call of up to 20 minutes between a member and a partner lawyer, to ask legal questions.",
    match: /\bconsultations?\b/i,
    group: "ILP",
  },
  consultationReady: {
    word: "Consultation-ready",
    meaning: "The member's profile has enough facts (at least 70% filled in) for the lawyer to give useful advice on a call.",
    match: /\bconsultation-ready\b|\bready for (a|your) lawyer\b/i,
    group: "ILP",
  },
  profile: {
    word: "Living profile",
    meaning: "The facts about a member's legal life in one place: residency, family, property, companies and cars. It is kept up to date over time.",
    match: /\bliving profile\b|\bprofiles?\b/i,
    group: "ILP",
  },
  obligation: {
    word: "Obligation",
    meaning: "Something the law asks you to do by a certain date, like paying a yearly tax or renewing a permit.",
    match: /\bobligations?\b/i,
    group: "ILP",
  },
  nextStep: {
    word: "Next step",
    meaning: "The one thing that should happen next on a matter: what it is, who does it and by when.",
    match: /\bnext steps?\b/i,
    group: "ILP",
  },
  handoff: {
    word: "Handoff",
    meaning: "After a call, the lawyer's confirmed list of next steps, passed to the ILP team so they can follow up and nothing is forgotten.",
    match: /\bhand ?offs?\b|\bhand(s|ed)? (it )?off\b/i,
    group: "ILP",
  },
  brief: {
    word: "Pre-call brief",
    meaning: "One screen the lawyer reads before a call: the member's question and the key facts from their profile.",
    match: /\bbrief\b/i,
    group: "ILP",
  },
  recordingConsent: {
    word: "Recording consent",
    meaning: "The member's yes or no to recording the call. Without a yes, nothing is recorded.",
    match: /\bconsent\b/i,
    group: "ILP",
  },
  transcript: {
    word: "Transcript",
    meaning: "The written text of what was said on a recorded call.",
    match: /\btranscripts?\b/i,
    group: "ILP",
  },
  aiSummary: {
    word: "AI summary",
    meaning: "A short summary of the call drafted by a computer program. The lawyer checks and corrects it before anyone relies on it.",
    match: /\b(AI|suggested) (summary|draft)\b|\bdraft summary\b/i,
    group: "ILP",
  },
  aiAssistant: {
    word: "AI assistant",
    meaning: "A computer program that answers general questions in writing. It is not a lawyer, it can be wrong, and its answers are not legal advice.",
    match: /\bAI assistant\b|\bthe AI\b/i,
    group: "ILP",
  },
  quote: {
    word: "Quote",
    meaning: "A written price for legal work that is not part of the membership, like fixing a company's books. The member can say yes or no.",
    match: /\bquotes?\b|\bquoted\b/i,
    group: "ILP",
  },
  proposal: {
    word: "Proposal",
    meaning: "A quote sent to a member: what work is included, who does it and the price. Nothing is charged until they accept.",
    match: /\bproposals?\b/i,
    group: "ILP",
  },
  opportunity: {
    word: "Opportunity",
    meaning: "A chance to help a member with paid legal work beyond the membership. It is tracked until the member says yes (won) or no (lost).",
    match: /\bopportunit(y|ies)\b/i,
    group: "ILP",
  },
  task: {
    word: "Task",
    meaning: "A job for someone on the team, with an owner and a due date, like 'call Linda about her papers'.",
    match: /\btasks?\b/i,
    group: "ILP",
  },
  stage: {
    word: "Stage",
    meaning: "One step in a process, like 'Legal review' or 'Filing'. Each column on a board is one stage.",
    match: /\bstages?\b/i,
    group: "ILP",
  },
  sla: {
    word: "Time limit (SLA)",
    meaning: "The number of days a matter should stay in one stage at most. After half of it the card warns; after all of it, it says Overdue.",
    match: /\bSLAs?\b|\btime limit for (a|each|this) stage\b/i,
    group: "ILP",
  },
  daysInStage: {
    word: "Days in stage",
    meaning: "How many days a matter has waited in its current step. A high number may mean it is stuck.",
    match: /\bdays in stage\b|\bin stage\b/i,
    group: "ILP",
  },
  privacyRequest: {
    word: "Privacy request",
    meaning: "When a person asks to see, correct, stop a use of, or delete the personal information ILP keeps about them. The law sets a date to answer by.",
    match: /\bprivacy requests?\b|\bdata requests?\b/i,
    group: "ILP",
  },
  personalData: {
    word: "Personal data",
    meaning: "Any information about you as a person: your name, email, documents, call notes and so on.",
    match: /\b(personal )?data\b/i,
    group: "ILP",
  },
  auditLog: {
    word: "Audit record",
    meaning: "A record that nobody can edit of who looked at or changed what, and when. It protects members and the team.",
    match: /\baudit\b/i,
    group: "ILP",
  },
  anonymize: {
    word: "Anonymize",
    meaning: "Remove names and details from a record so it can no longer point to a person, while the rest is kept.",
    match: /\banonymi[sz](e|ed|es|ing)\b/i,
    group: "ILP",
  },
  hash: {
    word: "Hash",
    meaning: "Scramble a value, like an email address, into a code that cannot be turned back, so it no longer shows who it was.",
    match: /\bhash(ed|es|ing)?\b/i,
    group: "ILP",
  },
  emailQueue: {
    word: "Email queue",
    meaning: "Emails the system has written and will send in a few minutes. Until they go, you can read, send or stop them.",
    match: /\bemail queue\b|\bqueued\b/i,
    group: "ILP",
  },
  freeCheck: {
    word: "Free check",
    meaning: "A free online questionnaire on ILP's website that tells people which legal dates may apply to them. Many members start there.",
    match: /\bfree (deadline )?check\b/i,
    group: "ILP",
  },
  lily: {
    word: "Lily",
    meaning: "The name of ILP's AI assistant: a computer program that answers general questions in writing. It is not a lawyer.",
    match: /\bLily\b/,
    group: "ILP",
  },
  crm: {
    word: "CRM",
    meaning: "Customer relationship management: the place where we keep everything about each client and what we did for them.",
    match: /\bCRM\b/,
    group: "ILP",
  },
  legalArea: {
    word: "Legal area",
    meaning: "The kind of law a matter is about: corporate (companies), property, immigration, tax, or family and estate.",
    match: /\blegal areas?\b/i,
    group: "ILP",
  },

  // ─── Costa Rica ───────────────────────────────────────────────────────────
  dimex: {
    word: "DIMEX",
    meaning: "The ID card Costa Rica gives to foreigners who live there legally. It has an expiry date and must be renewed.",
    match: /\bDIMEX\b/,
    group: "Costa Rica",
  },
  residency: {
    word: "Residency",
    meaning: "Permission from Costa Rica to live in the country. It comes in several kinds and must be renewed before it runs out.",
    match: /\bresidency\b|\bresident\b/i,
    group: "Costa Rica",
  },
  pensionado: {
    word: "Pensionado",
    meaning: "A kind of residency for retirees who receive a lifelong pension of at least US$1,000 a month.",
    match: /\bpensionado\b/i,
    group: "Costa Rica",
  },
  rentista: {
    word: "Rentista",
    meaning: "A kind of residency for people with a steady income from savings or investments, at least US$2,500 a month.",
    match: /\brentista\b/i,
    group: "Costa Rica",
  },
  digitalNomad: {
    word: "Digital nomad",
    meaning: "A stay permit for people who work online for employers or clients outside Costa Rica and earn enough from abroad.",
    match: /\bdigital nomads?\b/i,
    group: "Costa Rica",
  },
  company: {
    word: "S.A. or S.R.L.",
    meaning: "Two kinds of Costa Rican company. Many foreigners own their house or car through one, and it has yearly filings even if it earns nothing.",
    match: /\bS\.A\.|\bS\.R\.L\./,
    group: "Costa Rica",
  },
  minuteBooks: {
    word: "Minute books",
    meaning: "A company's official books, where it records its meetings and who owns its shares (the share register).",
    match: /\bminute books?\b|\bshare register\b/i,
    group: "Costa Rica",
  },
  corporationTax: {
    word: "Corporation tax",
    meaning: "A yearly tax most Costa Rican companies must pay, even when they do not earn money.",
    match: /\bcorporat(e|ion) tax\b|\bannual S\.A\. tax\b/i,
    group: "Costa Rica",
  },
  d101: {
    word: "D-101",
    meaning: "The yearly income tax return a company or person files with Costa Rica's tax office.",
    match: /\bD-101\b/,
    group: "Costa Rica",
  },
  rtbf: {
    word: "Beneficial owner filing (RTBF)",
    meaning: "A yearly report to Costa Rica's Central Bank that says which real people own a company.",
    match: /\bRTBF\b|\bbeneficial owners?\b/i,
    group: "Costa Rica",
  },
  marchamo: {
    word: "Marchamo",
    meaning: "The yearly permit and basic insurance every car in Costa Rica needs, paid by December 31.",
    match: /\bmarchamo\b/i,
    group: "Costa Rica",
  },
  titleStudy: {
    word: "Title study",
    meaning: "A lawyer's check of the public property record, to make sure the seller really owns the land and it has no debts or claims.",
    match: /\btitle stud(y|ies)\b/i,
    group: "Costa Rica",
  },
  propertyTransfer: {
    word: "Property transfer",
    meaning: "Moving ownership of a house or land from one person to another, recorded in the National Registry.",
    match: /\bproperty transfer\b|\btitle transfer\b/i,
    group: "Costa Rica",
  },
  registry: {
    word: "National Registry",
    meaning: "Costa Rica's public office that records who owns land, cars and companies.",
    match: /\bregistry\b/i,
    group: "Costa Rica",
  },
  notary: {
    word: "Notary",
    meaning: "In Costa Rica, a lawyer with extra authority to sign official deeds, such as a house sale or a new company.",
    match: /\bnotary\b|\bnotaries\b/i,
    group: "Costa Rica",
  },
  caja: {
    word: "Caja",
    meaning: "Costa Rica's public health care and social security system. Legal residents pay into it every month.",
    match: /\bCaja\b|\bCCSS\b/,
    group: "Costa Rica",
  },
  aguinaldo: {
    word: "Aguinaldo",
    meaning: "A Christmas bonus of about one month's pay that every employer in Costa Rica must pay staff by December 20.",
    match: /\baguinaldo\b/i,
    group: "Costa Rica",
  },
  apostille: {
    word: "Apostille",
    meaning: "An official stamp that makes a document from one country valid in another, like a birth certificate from the US used in Costa Rica.",
    match: /\bapostilles?\b/i,
    group: "Costa Rica",
  },
  costaRicaTime: {
    word: "Costa Rica time",
    meaning: "The clock time in Costa Rica. It never changes for summer, so the difference with your home time can change during the year.",
    match: /\bCosta Rica time\b/i,
    group: "Costa Rica",
  },
  sinpe: {
    word: "SINPE",
    meaning: "Costa Rica's instant bank transfer system. People pay from their bank app with a phone number or account number.",
    match: /\bSINPE\b/,
    group: "Costa Rica",
  },

  // ─── Money and numbers ────────────────────────────────────────────────────
  mrr: {
    word: "MRR",
    meaning: "Monthly recurring revenue: the money all active members pay every month, added up. It is the main sign of how big the business is.",
    match: /\bMRR\b|\bmonthly recurring revenue\b/i,
    group: "Money and numbers",
  },
  arr: {
    word: "ARR",
    meaning: "Annual run rate: this month's MRR times 12. What a year would bring if nothing changed.",
    match: /\bARR\b|\brun rate\b/i,
    group: "Money and numbers",
  },
  revenue: {
    word: "Revenue",
    meaning: "Money that comes in, before any costs are paid.",
    match: /\brevenue\b/i,
    group: "Money and numbers",
  },
  legalFees: {
    word: "Legal fees (GMV)",
    meaning: "What members pay for extra legal work. Most of it goes to the lawyer, so it is counted apart from ILP's own membership money.",
    match: /\blegal fees?\b|\bGMV\b/i,
    group: "Money and numbers",
  },
  margin: {
    word: "Margin",
    meaning: "What is left from a payment after the lawyer and other costs are paid. That part is ILP's.",
    match: /\bmargins?\b/i,
    group: "Money and numbers",
  },
  retention: {
    word: "Retention",
    meaning: "Out of the members who joined, how many are still members some months later. Higher is better.",
    match: /\bretention\b/i,
    group: "Money and numbers",
  },
  churn: {
    word: "Churn",
    meaning: "Members who cancel or stop paying. The opposite of retention.",
    match: /\bchurn\b/i,
    group: "Money and numbers",
  },
  kpi: {
    word: "Key figure (KPI)",
    meaning: "A number the team watches every day to see if the business is healthy, like how many members stay.",
    match: /\bKPIs?\b|\bkey figures?\b/i,
    group: "Money and numbers",
  },
  nps: {
    word: "NPS",
    meaning: "Net Promoter Score. A score from members' answers to 'Would you recommend us?' It goes from -100 to 100; above 50 is very good.",
    match: /\bNPS\b/,
    group: "Money and numbers",
  },
  funnel: {
    word: "Funnel",
    meaning: "The steps people take from first visit to paying member. Fewer people reach each step, so it narrows like a funnel.",
    match: /\bfunnels?\b/i,
    group: "Money and numbers",
  },
  winRate: {
    word: "Win rate",
    meaning: "Out of all offers of paid work that were decided, the share members said yes to.",
    match: /\bwin rate\b/i,
    group: "Money and numbers",
  },
  pipeline: {
    word: "Pipeline",
    meaning: "All the work in progress, grouped by stage, so you can see where each piece is and what is stuck.",
    match: /\bpipelines?\b/i,
    group: "Money and numbers",
  },
  pastDue: {
    word: "Past due",
    meaning: "The payment date has passed and the money has not arrived yet.",
    match: /\bpast due\b/i,
    group: "Money and numbers",
  },
  pendingPayment: {
    word: "Pending payment",
    meaning: "Someone signed up, but their first payment has not arrived yet.",
    match: /\bpending payments?\b/i,
    group: "Money and numbers",
  },
  overdue: {
    word: "Overdue",
    meaning: "Past its due date and still not done.",
    match: /\boverdue\b/i,
    group: "Money and numbers",
  },
  renewal: {
    word: "Renewal",
    meaning: "The day the membership starts a new month and the next payment is due.",
    match: /\brenew(al|als|s)\b/i,
    group: "Money and numbers",
  },
  payout: {
    word: "Payout",
    meaning: "A payment ILP sends to a partner lawyer for their share of the legal work.",
    match: /\bpayouts?\b/i,
    group: "Money and numbers",
  },
  balanceDue: {
    word: "Balance due",
    meaning: "The amount you still have to pay right now.",
    match: /\bbalance( due)?\b/i,
    group: "Money and numbers",
  },
  capacity: {
    word: "Capacity",
    meaning: "How much more work a lawyer can take on right now, judged by their open matters and booked calls.",
    match: /\bcapacity\b/i,
    group: "Money and numbers",
  },

  // ─── On the screen ────────────────────────────────────────────────────────
  dashboard: {
    word: "Dashboard",
    meaning: "The staff screens of ILP. It shows the most important numbers and lists at a glance.",
    match: /\bdashboards?\b/i,
    group: "On the screen",
  },
  portal: {
    word: "Portal",
    meaning: "Your own private part of the ILP website, where you sign in to see your information.",
    match: /\bportals?\b/i,
    group: "On the screen",
  },
  queue: {
    word: "Queue",
    meaning: "A to-do list, sorted so the most urgent job is on top.",
    match: /\bqueue\b/i,
    group: "On the screen",
  },
  board: {
    word: "Board",
    meaning: "A screen with columns, one for each stage, and a card for each item. You move a card to the next column when it moves on.",
    match: /\bboard\b/i,
    group: "On the screen",
  },
  card: {
    word: "Card",
    meaning: "A small box on a board or page that stands for one thing, like one matter or one task.",
    group: "On the screen",
  },
  drag: {
    word: "Drag",
    meaning: "Press on an item, keep holding the mouse button, move it, then let go to drop it in a new place.",
    match: /\bdrag(s|ged|ging)?\b/i,
    group: "On the screen",
  },
  drawer: {
    word: "Side panel",
    meaning: "A panel that slides in from the side to show details, so you do not lose your place on the page behind it.",
    match: /\bdrawers?\b|\bside panel\b/i,
    group: "On the screen",
  },
  tab: {
    word: "Tab",
    meaning: "A label in a row along the top of an area. Clicking it changes what the area below shows.",
    match: /\btabs?\b/i,
    group: "On the screen",
  },
  filter: {
    word: "Filter",
    meaning: "A choice that hides everything that does not match, so the list shows only what you want. Clear it to see everything again.",
    match: /\bfilter(s|ed|ing)?\b/i,
    group: "On the screen",
  },
  chip: {
    word: "Chip",
    meaning: "A small rounded button. Clicking it picks or unpicks one choice.",
    match: /\bchips?\b/i,
    group: "On the screen",
  },
  dropdown: {
    word: "Drop-down list",
    meaning: "A box that opens a short list of choices when you click it. You pick one and it closes.",
    match: /\bdrop-?downs?\b/i,
    group: "On the screen",
  },
  toggle: {
    word: "On/off switch",
    meaning: "A control with two positions. Click once to turn something on, click again to turn it off.",
    match: /\btoggles?\b|\bon\/off\b/i,
    group: "On the screen",
  },
  checkbox: {
    word: "Tick box",
    meaning: "A small square you click to put a tick in it (yes) or take the tick out (no).",
    match: /\btick box(es)?\b|\bcheckbox(es)?\b/i,
    group: "On the screen",
  },
  statusLabel: {
    word: "Status label",
    meaning: "A small colored tag with a word in it, like 'Active' or 'Past due'. The word tells you the state; the color only helps you spot it.",
    match: /\bstatus labels?\b|\btags?\b|\bpills?\b/i,
    group: "On the screen",
  },
  status: {
    word: "Status",
    meaning: "Where something stands right now, like 'Active', 'In review' or 'Done'.",
    match: /\bstatus\b/i,
    group: "On the screen",
  },
  timeline: {
    word: "Timeline",
    meaning: "A list of everything that happened, in date order, with the newest on top.",
    match: /\btimelines?\b/i,
    group: "On the screen",
  },
  confirmation: {
    word: "Confirmation message",
    meaning: "A short note that appears for a few seconds at the bottom of the screen to say something worked.",
    match: /\bconfirmation message\b|\bshort note\b/i,
    group: "On the screen",
  },
  save: {
    word: "Save",
    meaning: "Stores your changes so they are kept. If you leave a page without saving, the changes are lost.",
    match: /\bsav(e|es|ed|ing)\b/i,
    group: "On the screen",
  },
  export: {
    word: "Export",
    meaning: "Download a list as a file, such as a spreadsheet, to open in another program.",
    match: /\bexport(s|ed|ing)?\b/i,
    group: "On the screen",
  },
  sync: {
    word: "Sync",
    meaning: "Keeping two places the same, for example your Google Calendar and ILP, so a change in one shows up in the other.",
    match: /\bsync(s|ed|ing)?\b/i,
    group: "On the screen",
  },
  availability: {
    word: "Availability",
    meaning: "The days and hours you are free to take calls. Members can only book inside them.",
    match: /\bavailability\b/i,
    group: "On the screen",
  },
  slot: {
    word: "Time slot",
    meaning: "One open time on the calendar that someone can book, like Tuesday at 10:30.",
    match: /\bslots?\b/i,
    group: "On the screen",
  },
  blackoutDate: {
    word: "Day off (blackout date)",
    meaning: "A date you are not available at all, like a holiday. No calls can be booked on it.",
    match: /\bblackout( dates?)?\b|\bdays? off\b/i,
    group: "On the screen",
  },
  notification: {
    word: "Notification",
    meaning: "A short message from ILP, by email or on your screen, about something new.",
    match: /\bnotifications?\b/i,
    group: "On the screen",
  },
  videoLink: {
    word: "Video link",
    meaning: "A web address that opens the video call (Google Meet) in your browser. No app is needed on a computer.",
    match: /\bvideo (call )?link\b|\bGoogle Meet\b|\bMeet link\b/i,
    group: "On the screen",
  },
} satisfies Record<string, GlossaryEntry>;

export type TermKey = keyof typeof GLOSSARY;

export const TERM_KEYS = Object.keys(GLOSSARY) as TermKey[];

/** A glossary entry as the player shows it. */
export function termRef(key: TermKey): TermRef {
  const e: GlossaryEntry = GLOSSARY[key];
  return { key, word: e.word, meaning: e.meaning };
}

/**
 * Glossary keys whose word appears in `text`, in order of first appearance.
 * A match inside a longer one is dropped ("ILP team" gives ilpTeam, not ilp).
 */
export function findTerms(text: string): TermKey[] {
  const hits: Array<{ key: TermKey; at: number; end: number }> = [];
  for (const key of TERM_KEYS) {
    const e: GlossaryEntry = GLOSSARY[key];
    if (!e.match) continue;
    const m = e.match.exec(text);
    if (m) hits.push({ key, at: m.index, end: m.index + m[0].length });
  }
  const kept = hits.filter((h) => !hits.some((o) => o !== h && o.at <= h.at && o.end >= h.end && o.end - o.at > h.end - h.at));
  return kept.sort((a, b) => a.at - b.at).map((h) => h.key);
}
