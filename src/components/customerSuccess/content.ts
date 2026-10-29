/**
 * Copy for the customer success landing (/customer-success). Two readers:
 * people considering the customer success manager (CSM) role at ILP, and
 * ILP's own CSMs looking for the way into their portal (/csm). Every word
 * follows frontend/copy-rules.md. Facts come from docs/PLAN.md, the CSM
 * portal (components/csm, COMMS_PLAN.md Phase 3) and the playbooks on the
 * server. There is no online application for the role, so the call to
 * action is an email to the team inbox; nothing here states pay, hours,
 * benefits or hiring terms.
 */

/** The team inbox (server/helper/team.ts TEAM_CC default). Owner: confirm or replace. */
export const CONTACT_EMAIL = "team@internationallegalpartner.com";
export const CONTACT_HREF = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Customer success manager role")}`;
export const SIGN_IN_HREF = "/csm";

export const CSM_HERO = {
  eyebrow: "Customer success for members in Colombia, Costa Rica, Mexico, Panama, Portugal and Spain",
  title: "Look after ILP members from the day they join. Make sure every lawyer call has a next step.",
  why: "ILP members are North Americans who live in Colombia, Costa Rica, Mexico, Panama, Portugal or Spain, or own property there, and pay US$79.99 a month for up to three 20-minute calls a month with a lawyer licensed in their country. A call helps only when the member comes ready and someone makes sure the next steps happen after it. The customer success manager is the member's contact at ILP: the welcome call, a profile ready for the first call, the lawyer's next steps sent after it, quotes followed up and renewals checked.",
  how: [
    "Start each day with your tasks, late ones first. Each task names the member, the job and when it is due, and a daily email at 8:00 am Costa Rica time lists what is late, what is due today, new members and members at risk.",
    "Read each member's health score and the reasons behind it. The score runs from 0 to 100, and a failed payment, weeks without contact or an unanswered quote take points off, so the members most likely to leave come first.",
    "Follow a playbook for the moments that repeat. The welcome call, the renewal check-in, a failed payment and a missed call each have steps in order and an email you send from the member's page.",
    "Check your figures once a week. My KPIs shows time to first contact, follow-ups after a lawyer's handoff, readiness after 7 days and retention after 90 days, for your own members.",
  ],
  what: "ILP is a legal membership for North Americans in six countries, and customer success managers are part of the ILP team. Each member has one CSM. New members go to the CSM with the fewest members, and you can take members who have no CSM yet from the portal. Legal advice comes from the member's lawyer, and you make sure the member knows what the lawyer confirmed and what happens next. After a call the lawyer confirms the legal next steps, and you follow up on quotes and paid work. Your figures describe your own members and are not compared with other CSMs.",
  labels: { why: "Why the role matters", how: "How your day works", what: "What the role is" },
  primary: "Write to us about the role",
  secondary: "See the portal",
  signIn: "Already a CSM? Sign in",
};

/**
 * The hero copy above, split for the scroll sections (CsmStory.tsx). Every
 * piece is cut from CSM_HERO without changing a word:
 * tests/csmLanding.test.mjs joins the pieces back and compares.
 */
export const CSM_INTRO = {
  eyebrowLead: "Customer success for members in",
  countries: ["Colombia,", "Costa Rica,", "Mexico,", "Panama,", "Portugal", "and Spain"],
  titleLead: "Look after ILP members from the day they join.",
  titleKey: "Make sure every lawyer call has a next step.",
};

export const CSM_WHY = {
  anchor: "why-the-role-matters",
  /** One beat per sentence of CSM_HERO.why; `mark` is the phrase to underline. */
  beats: [
    {
      id: "why-csm-members",
      eyebrow: "Who the members are",
      rail: "The members",
      text: "ILP members are North Americans who live in Colombia, Costa Rica, Mexico, Panama, Portugal or Spain, or own property there, and pay US$79.99 a month for up to three 20-minute calls a month with a lawyer licensed in their country.",
      mark: "a lawyer licensed in their country",
      caption: "Example members, with the calls they have left this month.",
    },
    {
      id: "why-csm-between-calls",
      eyebrow: "Where members get lost",
      rail: "Between calls",
      text: "A call helps only when the member comes ready and someone makes sure the next steps happen after it.",
      mark: "the next steps happen after it",
      caption: "An example member's month when nobody owns the follow-up.",
    },
    {
      id: "why-csm-your-part",
      eyebrow: "What a CSM does",
      rail: "Your part",
      text: "The customer success manager is the member's contact at ILP: the welcome call, a profile ready for the first call, the lawyer's next steps sent after it, quotes followed up and renewals checked.",
      mark: "the member's contact at ILP",
      caption: "An example member's first month with a CSM, one step after another.",
    },
  ],
};

/**
 * "How your day works" as four beats. Each step of CSM_HERO.how is its first
 * sentence (the title) and the rest (the body).
 */
export const CSM_HOW = {
  anchor: "how-your-day-works",
  steps: [
    {
      rail: "Today",
      title: "Start each day with your tasks, late ones first.",
      titleMark: "late ones first",
      body: "Each task names the member, the job and when it is due, and a daily email at 8:00 am Costa Rica time lists what is late, what is due today, new members and members at risk.",
      caption: "Example screen: Today, with a late task closed and its outcome written down.",
    },
    {
      rail: "Your members",
      title: "Read each member's health score and the reasons behind it.",
      titleMark: "the reasons behind it",
      body: "The score runs from 0 to 100, and a failed payment, weeks without contact or an unanswered quote take points off, so the members most likely to leave come first.",
      mark: "the members most likely to leave come first",
      caption: "Example screen: My book, lowest score first, with the reasons behind each score.",
    },
    {
      rail: "Playbooks",
      title: "Follow a playbook for the moments that repeat.",
      body: "The welcome call, the renewal check-in, a failed payment and a missed call each have steps in order and an email you send from the member's page.",
      mark: "an email you send from the member's page",
      caption: "Example screen: the welcome email for a new member, sent and logged on the timeline.",
    },
    {
      rail: "Your figures",
      title: "Check your figures once a week.",
      body: "My KPIs shows time to first contact, follow-ups after a lawyer's handoff, readiness after 7 days and retention after 90 days, for your own members.",
      mark: "for your own members",
      caption: "Example screen: My KPIs with the target under each figure. The figures are an example.",
    },
  ],
};

/** CSM_HERO.what as the closing statement: the lead, one large line, then the boundaries of the role. */
export const CSM_WHAT = {
  lead: "ILP is a legal membership for North Americans in six countries, and customer success managers are part of the ILP team.",
  big: "Each member has one CSM.",
  bigMark: "one CSM",
  bigDetail: "New members go to the CSM with the fewest members, and you can take members who have no CSM yet from the portal.",
  lines: [
    { text: "Legal advice comes from the member's lawyer, and you make sure the member knows what the lawyer confirmed and what happens next.", mark: "what happens next" },
    { text: "After a call the lawyer confirms the legal next steps, and you follow up on quotes and paid work.", mark: "you follow up on quotes and paid work" },
    { text: "Your figures describe your own members and are not compared with other CSMs.", mark: "not compared with other CSMs" },
  ],
};

export const CSM_BANDS = {
  day: {
    id: "public.csm-day",
    anchor: "portal",
    title: "Your day in the CSM portal",
    lead: "Today, a member's health score and the line you log after each contact, with example members.",
    caption: "Today, the health score and a logged contact. The members are fictional.",
  },
} as const;

export const ROLE_FACTS = {
  title: "The work, in plain words",
  why: "What the role covers, taken from how the CSM portal works today.",
  facts: [
    { term: "First weeks", body: "Make the first contact within one business day of a member joining, help their profile reach 70% so it is consultation-ready, and book their first call with them." },
    { term: "Around each call", body: "Before a call, check the profile, the question for the lawyer, recording consent, the lawyer and the video link. After it, send the member the next steps the lawyer confirmed within 24 hours." },
    { term: "Quotes and paid work", body: "Follow up on quotes that have waited five days or more, and keep each opportunity's next action and date current." },
    { term: "Renewals and risk", body: "Call the same day a payment fails. Before a renewal, check that the member used their calls and offer one if not." },
    { term: "Messages", body: "Answer what members send, and check that each document they upload is the one you asked for." },
    { term: "Writing it down", body: "Log every call, email and message with one plain line. The lawyer and the rest of the team read it next." },
    { term: "Language", body: "Members are North Americans, and every member email and portal page is in English." },
  ],
};

export const CSM_FAQ = [
  {
    q: "Do customer success managers give legal advice?",
    a: "No. The member's lawyer gives legal advice. You help the member prepare for calls and act on what the lawyer confirmed.",
  },
  {
    q: "Is there an online application?",
    a: "Not yet. The email link at the end of this page goes to the ILP team.",
  },
  {
    q: "Who decides which members I look after?",
    a: "New members go to the CSM with the fewest members. You can also take members who have no CSM yet from My book, and staff can move a member to another CSM.",
  },
  {
    q: "I am already a CSM. Where do I sign in?",
    a: "In the CSM portal, with your ILP email address. We email you a sign-in code.",
  },
];

export const CSM_FINAL = {
  title: "Write to the ILP team",
  sub: "There is no online application for this role yet. Send a short note about your experience looking after clients and the languages you speak.",
};
