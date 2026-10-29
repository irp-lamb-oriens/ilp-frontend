import type { LegalSection } from "@/components/LegalPage";
import { P } from "../placeholders";
import { RETENTION_ROWS } from "./retention";

export const PRIVACY_TITLE = "Privacy Policy";

export const PRIVACY_INTRO =
  "This policy explains what personal information International Legal Partner (ILP) collects, why, who sees it, how long we keep it and how you control it. It was written with Costa Rica's Law 8968 on the protection of personal data and US state privacy laws in mind. It is not a promise that every law in every place has been reviewed.";

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    heading: "Who we are",
    body: [
      `${P.entity}, ${P.entityType}, registration ${P.registration}, ${P.address} ("ILP", "we") is responsible for the personal information described here.`,
      `Privacy contact: ${P.privacyEmail}. Person responsible for privacy: ${P.dpo}. Costa Rica contact: ${P.crEntity}.`,
    ],
  },
  {
    heading: "What this policy covers",
    body: [
      "Our website, the free deadline check, the member portal, calls booked through ILP, and the emails and notifications we send.",
      "The lawyers in our network are independent professionals. When a lawyer advises you or takes on legal work, they also handle your information under their own professional duties. [Counsel: confirm whether each lawyer acts for ILP or as a separate data controller, and say so here.]",
    ],
  },
  {
    heading: "What we collect",
    body: ["We collect only what you give us or what the service creates while you use it."],
    rows: [
      ["Contact and account", "Name, email, phone or WhatsApp number, sign-in codes (stored only as a one-way hash) and sign-in sessions."],
      ["Free deadline check", "Your country, residency status, property, company, vehicle and staff answers and dates, and your email if you choose to give it."],
      ["Living legal profile", "Identity details (which can include passport or cédula numbers), household and family, immigration and residency, property, companies, vehicles and business details you enter or we record for you."],
      ["Documents", "Files you upload, such as identity documents, deeds and company records."],
      ["Calls", "Date, lawyer, the question you want to ask, your recording choice, and, only if everyone agrees to recording, the transcript, an AI-suggested summary and the summary and next steps your lawyer confirms."],
      ["Messages", "Messages to your ILP team and questions you ask the AI assistant, with its answers."],
      ["Membership and payments", "Plan, dates, minutes and calls used, payment status and Stripe customer and subscription references. Card details go to Stripe, not to us."],
      ["Feedback", "Call ratings, monthly scores and the reason you give if you cancel."],
      ["Security and technical", "Sign-in events and document downloads (audit log), error reports, and your IP address, used briefly to limit abuse. If you turn on notifications, your browser's push address."],
      ["Measurement", "Only if you allow it: a random id kept in your browser, the ILP pages you open and for how long, the steps you reach in the check, join and lawyer application forms, the buttons you press, the form fields that showed an error (never what you typed), which version of a page you saw when we test two, and the site that sent you. No name or email is attached until you join."],
    ],
  },
  {
    heading: "Sensitive information",
    body: [
      "Legal questions can reveal sensitive information, for example about health, family situations or beliefs. Please share it only when your question needs it. We use it only to help with that question. [Counsel: confirm the express-consent wording Law 8968 requires for sensitive data.]",
    ],
  },
  {
    heading: "Why we use it",
    body: ["We ask for your consent when you join, and separately for optional uses. We use your information to:"],
    list: [
      "Run your membership: your profile, reminders before your dates, booking, and follow-up after each call.",
      "Prepare each call: your lawyer gets a one-page brief from your profile and the documents you uploaded.",
      "Record and transcribe a call, only when you and your lawyer agree for that call.",
      "Produce AI-suggested summaries that your lawyer checks and confirms before you see them as next steps.",
      "Answer general questions through the AI assistant, if you use it.",
      "Bill you, keep accounting records and meet legal duties.",
      "Keep accounts secure, investigate misuse and keep an audit trail of who accessed what.",
      "Send news and offers by email, only if you opted in. Service emails about your membership are not marketing.",
      "Measure which pages lead people to join, only if you allow the measurement id.",
    ],
  },
  {
    heading: "Who sees your information",
    body: ["Only the people and services that need it:"],
    list: [
      "The lawyer assigned to your call or matter: your profile, brief, documents, call transcripts and summaries. Lawyers do not see your payment details or ILP's internal commercial notes.",
      "ILP staff and customer success managers, according to their role. Finance details are limited to administrators.",
      "Our service providers (sub-processors), only to run the service for us. See the list below.",
      "Authorities, when the law requires it.",
      "A buyer or successor of ILP's business, under this policy. [Counsel: confirm.]",
    ],
    links: [{ label: "Service providers (sub-processors)", href: "/legal/subprocessors" }],
  },
  {
    heading: "We do not sell your information",
    body: [
      "We do not sell personal information and we do not share it for cross-context behavioral advertising. We do not use advertising cookies or trackers.",
    ],
  },
  {
    heading: "AI and human review",
    body: [
      "We use AI in three places: the AI assistant in your messages, drafting a suggested summary and next steps from a call transcript, and transcribing an uploaded call recording.",
      "AI never makes a decision about you with legal or similar effect. AI answers are labeled as AI and are general information. Your lawyer reviews and confirms every summary and next step before it is shown to you as a next step. Your team confirms anything legal.",
      "To do this, the text or audio is sent to our AI providers (OpenRouter, which routes to the model we choose, Google Gemini by default). [ILP to confirm in writing: the providers' data-retention and training settings for ILP's account, and state them here.]",
    ],
    links: [{ label: "Call recording and AI notice", href: "/legal/recording" }],
  },
  {
    heading: "Call recording and transcripts",
    body: [
      "Calls are recorded only if everyone on the call agrees. We ask you when you book and again before you join, and you can say no without any effect on your membership.",
      "Transcripts come from Google Meet or from a recording your lawyer uploads. We keep the transcript, not the uploaded audio. Only your lawyer and your ILP team can read it.",
    ],
  },
  {
    heading: "International transfers",
    body: [
      `Our database is hosted by Google Cloud in ${P.firestoreRegion}. Our providers process data in the United States and other countries. When you join, you consent to this transfer. We choose providers with contractual and security safeguards. [Counsel: confirm the transfer basis under Law 8968 and its regulation.]`,
    ],
  },
  {
    heading: "How long we keep it",
    body: ["These periods are proposals pending review by counsel. A daily job deletes data when its period ends."],
    rows: RETENTION_ROWS,
  },
  {
    heading: "Your rights",
    body: [
      "You can ask to access your information, correct it, delete it (cancellation) and object to a use of it. You can withdraw any optional consent, download a copy of your data, and ask that a person review anything automated.",
      "Members can do most of this on the Your data and privacy page. Anyone can also email us. We answer within 10 business days [counsel to confirm the Law 8968 timeline]. We may ask you to confirm your identity first. There is no charge.",
    ],
    links: [{ label: "Your data and privacy (members)", href: "/status/privacy" }],
  },
  {
    heading: "Complaints",
    body: [
      `Tell us first at ${P.privacyEmail} so we can fix it. You also have the right to complain to Costa Rica's data protection agency, the Agencia de Protección de Datos de los Habitantes (PRODHAB), or to the privacy regulator or attorney general of your US state.`,
    ],
  },
  {
    heading: "Notice for US residents",
    body: [
      "In the last 12 months we collected these categories: identifiers (name, email, phone); customer records; commercial information (membership and payments); internet activity on our site (only with your permission for measurement); audio and electronic information (call transcripts, with consent); and sensitive personal information (government identity numbers and documents you upload, and your account sign-in).",
      "Sources: you, your lawyer, and our systems. Purposes and recipients are described above. We disclose information to service providers for business purposes only. We do not sell or share it, and we use sensitive information only to provide the service you asked for.",
      "You can ask to know, delete and correct your information, and you will not be treated differently for using these rights. An authorized agent can ask for you with your written permission. Our site honors the Global Privacy Control signal by not setting the measurement id. [Counsel: confirm which state laws apply to ILP and adjust this notice.]",
    ],
  },
  {
    heading: "Children",
    body: [
      `ILP is for adults aged ${P.minAge} and over. If your profile includes household members, such as children, you confirm you are allowed to share their information for this purpose.`,
    ],
  },
  {
    heading: "How we protect it",
    list: [
      "Encrypted connections (HTTPS) everywhere, and encryption at rest in Google Cloud.",
      "Documents in a private storage bucket. Every download is checked and logged.",
      "One-time sign-in codes stored as hashes; sign-in sessions as random tokens kept in your browser and sent only to our server over HTTPS, ending when you sign out or after a set time.",
      "Role-based access for staff and lawyers, and an audit log of sign-ins, downloads and staff actions.",
      "A strict content security policy on our site, and daily backups.",
      "No system is perfectly secure. If a breach affects your information, we will tell you and the authorities as the law requires.",
    ],
    body: ["We protect your information with these measures:"],
  },
  {
    heading: "Changes to this policy",
    body: [
      "Each version has an id shown at the top. If we make an important change, we will email members before it takes effect and ask for consent again where the law requires it.",
    ],
  },
  {
    heading: "Contact",
    body: [`${P.entity}, ${P.address}. Email ${P.privacyEmail}.`],
  },
];
