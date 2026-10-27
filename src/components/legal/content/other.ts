import type { LegalSection } from "@/components/LegalPage";
import { P } from "../placeholders";
import { OTHER_SERVICES_ROWS, SUBPROCESSOR_ROWS } from "./subprocessors";
import { DISCLAIMER_LONG } from "../disclaimers";

// ─── Call recording and AI notice ─────────────────────────────────────────
export const RECORDING_INTRO =
  "Recording is optional. A call is recorded only when everyone on it agrees. This page explains how recording, transcripts and AI work at ILP.";

export const RECORDING_SECTIONS: LegalSection[] = [
  {
    heading: "Your choice, every call",
    body: [
      "When you book, we ask whether the call may be recorded. We ask again just before you join, and you can change your answer then. Saying no has no effect on your membership or on the help you get.",
      "Your lawyer must agree too. If someone else joins the call with you, tell them it may be recorded and make sure they agree; if they do not, choose no recording.",
      "You can withdraw your recording consent for future calls at any time on the Your data and privacy page.",
    ],
    links: [{ label: "Your data and privacy (members)", href: "/status/privacy" }],
  },
  {
    heading: "How a recording becomes a transcript",
    list: [
      "Google Meet can produce a transcript, which is saved in ILP's Google Workspace and copied into your file.",
      "Or your lawyer can upload an audio recording. It is sent to our AI transcription provider, and we keep only the text; the audio is not stored.",
      "Without recording consent, no transcript is fetched or created, and no AI summary is drafted.",
    ],
    body: [],
  },
  {
    heading: "AI-suggested summaries, confirmed by your lawyer",
    body: [
      "From a transcript, AI drafts a suggested summary and next steps. It is marked as suggested. Your lawyer reads it, corrects it and confirms it. Only the confirmed next steps appear on your home as next steps. Commercial follow-up, such as a quote, is handled separately by your ILP team.",
    ],
  },
  {
    heading: "The AI assistant",
    body: [
      "In Messages you can ask the AI assistant general questions. Its answers are always labeled AI assistant. It is not your lawyer, it can be wrong, and it does not know everything in your file. Your team confirms anything legal.",
      "Your questions and its answers are kept with your account so your team can see them. To answer, the text is sent to our AI provider. Avoid sharing sensitive details it does not need.",
      "The first time you use it we ask you to read this notice. You can withdraw that agreement on the Your data and privacy page.",
    ],
  },
  {
    heading: "Who can read transcripts and summaries",
    body: ["Your lawyer for that call or matter and your ILP team. Other members and other lawyers cannot."],
  },
  {
    heading: "AI providers",
    body: [
      "OpenRouter routes our requests to the model ILP selects (Google Gemini models by default). Google's Gemini API is a backup. [ILP to confirm the providers' data-retention and training settings for ILP's account.]",
    ],
    links: [{ label: "Service providers (sub-processors)", href: "/legal/subprocessors" }],
  },
  {
    heading: "How long we keep transcripts",
    body: [
      "Transcripts and AI summaries are removed 24 months after your membership ends (proposed, pending counsel), or sooner if you ask us to delete your account.",
    ],
  },
];

// ─── Cookies and browser storage ──────────────────────────────────────────
export const COOKIES_INTRO =
  "ILP uses no advertising cookies and no third-party trackers. Signing in does not use cookies: we use a few browser storage items that the site needs to work, and one optional measurement id that you can allow or refuse.";

export const COOKIES_SECTIONS: LegalSection[] = [
  {
    heading: "Needed for the site to work",
    body: ["These are set only when you use the feature, and they are not used for advertising."],
    rows: [
      ["ilp_client_token, ilp_lawyer_token, ilp_staff_token (browser storage)", "Keep you signed in. A random sign-in token kept in your browser's local storage and sent only to ILP's server over HTTPS. Member sessions last 7 days from your last visit (up to 30 days); lawyer and staff sessions 12 hours. Signing out deletes it from your browser and ends the session on our server."],
      ["ilp_check (this tab only)", "Carries your free-check answers into the join form. Cleared when you close the tab."],
      ["ilp_status_matter, ilp_rating_later (this tab only)", "Remember which matter you were viewing and that you chose to rate a call later."],
      ["ilp_shell_nav_collapsed, ilp_lawyer_board_view", "Remember how you like the menu and the lawyer board laid out."],
      ["ilp_measure_choice", "Remembers your answer about the measurement id below."],
      ["ilp_chatbot_session", "Only if you use the website chat: a random id that keeps your conversation together when you come back. No name or email."],
      ["Service worker and push subscription", "Only if you turn on notifications: lets your browser show deadline reminders."],
    ],
  },
  {
    heading: "Optional: anonymous measurement id",
    body: [
      "If you allow it, we keep a random id (ilp_funnel_id) and the site that sent you (ilp_funnel_src) in your browser, to count how many people move from the free check to joining. No name or email is attached. When you join, the id is linked to your membership so we can count conversions.",
      "If you refuse, or your browser sends the Global Privacy Control signal, we do not store the id. You can change your choice below at any time.",
    ],
  },
  {
    heading: "Why there is no large cookie banner",
    body: [
      "The storage items above are needed for the service you ask for, so we do not ask for consent for them. We ask once, in a small notice, about the optional measurement id. [Counsel: confirm no broader consent banner is required for Costa Rica and US visitors, and whether one is needed if ILP markets to visitors in the EU or UK.]",
    ],
  },
];

// ─── Disclaimer ───────────────────────────────────────────────────────────
export const DISCLAIMER_SECTIONS: LegalSection[] = [
  {
    heading: "General information, not legal advice",
    body: DISCLAIMER_LONG,
  },
  {
    heading: "Where this applies",
    list: [
      "The free deadline check and its results.",
      "Answers from the AI assistant.",
      "Reminders and other emails about dates on your profile.",
      "Articles, guides and templates on this website.",
    ],
    body: [],
  },
];

// ─── Accessibility ────────────────────────────────────────────────────────
export const ACCESSIBILITY_SECTIONS: LegalSection[] = [
  {
    heading: "Our aim",
    body: [
      "We want everyone to be able to use ILP, including people who use screen readers, keyboard navigation, magnification or larger text. We design to the Web Content Accessibility Guidelines (WCAG) 2.1, level AA.",
    ],
  },
  {
    heading: "What we do",
    list: [
      "Readable contrast for body text, and text that can be enlarged.",
      "A visible focus outline on every link, button and field, and full keyboard use.",
      "Touch targets of at least 44 pixels, and member pages built for phones first.",
      "Form labels above fields, with errors written out in words.",
      "Status shown with words, never with color alone.",
      "Less movement when your device asks for reduced motion.",
    ],
    body: [],
  },
  {
    heading: "Known limits",
    body: [
      "ILP has not yet had an independent accessibility audit. Some charts on staff pages and some older public pages may not fully meet the standard. We are working through them.",
    ],
  },
  {
    heading: "Tell us about a problem",
    body: [
      `If something is hard to use, email ${P.supportEmail}. Tell us the page and what happened. We can also send information in another format, or help you by phone or video call.`,
    ],
  },
];

// ─── Sub-processors ───────────────────────────────────────────────────────
export const SUBPROCESSORS_INTRO =
  "These companies process personal information for ILP, only to run the service. We will update this page before adding a provider that handles member data.";

export const SUBPROCESSORS_SECTIONS: LegalSection[] = [
  { heading: "Providers that process member data", body: [], rows: SUBPROCESSOR_ROWS },
  { heading: "Other services your browser may contact", body: [], rows: OTHER_SERVICES_ROWS },
  {
    heading: "Lawyers",
    body: [
      "The lawyers in our network are independent professionals, not ILP's service providers. They receive the information needed for your calls and matters, under their own professional duty of confidentiality.",
    ],
  },
];
