/**
 * Landing narrator scripts: one continuous ElevenLabs script and one audio
 * file per landing, with a cue per section. Built to equal
 * docs/narration/SCRIPTS.md: the full text with its v3 delivery tags
 * ([warm], [short pause], [pause]) and the cue table (cue id, section,
 * opening words to match). tests/narration.test.mjs fails when they differ
 * and runs the copy rules on the captions.
 *
 * Audio: public/narration/<page>.mp3. Transcript: public/narration/<page>.json
 * (Whisper output, read by lib/narration/transcript.ts). When the audio
 * reaches the time of a cue's opening words, the page scrolls to the cue's
 * section (`anchor`, a DOM id); the section's own animations play as it
 * enters the viewport. The homepage cues follow the page order, so "What you
 * get" (home-price) comes before "What a missed date can cost you"
 * (home-costs).
 */
import { estimateCueSeconds, stripTags } from "./timing";

export type NarrationPage = "home" | "lawyers" | "csm";

export interface NarrationCue {
  /** Cue id from the cue table ("home-problem"). */
  id: string;
  /** DOM id of the section the page scrolls to. */
  anchor: string;
  /** Section name in the cue table. */
  section: string;
  /** Opening words the narrator looks for in the transcript. */
  match: string;
  /** This cue's lines of the ElevenLabs text, delivery tags included. */
  read: string;
  /** Spoken text of the cue (tags stripped): the caption. */
  caption: string;
  /** Caption-only length (s), including the [pause] after it. */
  estimate: number;
}

export interface NarrationScript {
  /** Public URL of the landing's audio. */
  audio: string;
  /** Public URL of the Whisper transcript (JSON). */
  transcript: string;
  /** The full ElevenLabs text, as in SCRIPTS.md. */
  script: string;
  cues: readonly NarrationCue[];
}

type CueInput = Pick<NarrationCue, "id" | "anchor" | "section" | "match" | "read">;

function build(page: NarrationPage, script: string, input: CueInput[]): NarrationScript {
  const cues = input.map((c, i) => ({ ...c, caption: stripTags(c.read), estimate: estimateCueSeconds(c.read, i === input.length - 1) }));
  return { audio: `/narration/${page}.mp3`, transcript: `/narration/${page}.json`, script, cues };
}

const HOME = build(
  "home",
  "[warm] ILP keeps the legal side of your life abroad in order, in six countries, for one monthly fee.\n[pause]\n[calm] Living abroad comes with legal dates written in another language, [short pause] and nobody sends you a reminder.\n[pause]\n[reassuring] Start with a free two-minute check, and join when you want a lawyer to look at what it found.\n[pause]\n[confident] Next to a typical fifteen hundred dollar retainer, ILP is seventy-nine dollars and ninety-nine cents a month, [short pause] with your lawyer calls included.\n[pause]\n[matter-of-fact] A late filing can bring a fine, [short pause] and asking around rarely gives you one clear answer.\n[pause]\n[warm] Your lawyer reads your file before each call, so your twenty minutes go straight to your question.\n[pause]\n[calm] Most questions look like these: a residency card coming up for renewal, [short pause] or a company tax you had never heard of.\n[pause]\n[confident] Colombia, Costa Rica, Mexico, Panama, Portugal and Spain are all open, each with lawyers licensed there.\n[pause]\n[inviting] Pick your country and take the free check. [short pause] It takes about two minutes.",
  [
    {
      id: "home-hero",
      anchor: "hero",
      section: "hero",
      match: "ILP keeps the legal side",
      read: "[warm] ILP keeps the legal side of your life abroad in order, in six countries, for one monthly fee.",
    },
    {
      id: "home-problem",
      anchor: "the-problem",
      section: "The problem",
      match: "Living abroad comes with",
      read: "[calm] Living abroad comes with legal dates written in another language, [short pause] and nobody sends you a reminder.",
    },
    {
      id: "home-how",
      anchor: "how-it-works",
      section: "How ILP works",
      match: "Start with a free",
      read: "[reassuring] Start with a free two-minute check, and join when you want a lawyer to look at what it found.",
    },
    {
      id: "home-price",
      anchor: "what-you-get",
      section: "What you get",
      match: "Next to a typical",
      read: "[confident] Next to a typical fifteen hundred dollar retainer, ILP is seventy-nine dollars and ninety-nine cents a month, [short pause] with your lawyer calls included.",
    },
    {
      id: "home-costs",
      anchor: "costs",
      section: "What a missed date can cost you",
      match: "A late filing can",
      read: "[matter-of-fact] A late filing can bring a fine, [short pause] and asking around rarely gives you one clear answer.",
    },
    {
      id: "home-includes",
      anchor: "what-the-membership-includes",
      section: "What the membership includes",
      match: "Your lawyer reads your file",
      read: "[warm] Your lawyer reads your file before each call, so your twenty minutes go straight to your question.",
    },
    {
      id: "home-situations",
      anchor: "real-situations",
      section: "What this looks like in real situations",
      match: "Most questions look like",
      read: "[calm] Most questions look like these: a residency card coming up for renewal, [short pause] or a company tax you had never heard of.",
    },
    {
      id: "home-countries",
      anchor: "countries",
      section: "Six countries, open now",
      match: "Colombia, Costa Rica, Mexico",
      read: "[confident] Colombia, Costa Rica, Mexico, Panama, Portugal and Spain are all open, each with lawyers licensed there.",
    },
    {
      id: "home-final",
      anchor: "free-deadline-check",
      section: "Start with the free deadline check",
      match: "Pick your country and",
      read: "[inviting] Pick your country and take the free check. [short pause] It takes about two minutes.",
    },
  ],
);

const LAWYERS = build(
  "lawyers",
  "[warm] ILP brings you prepared clients and handles the follow-up after each call.\n[pause]\n[matter-of-fact] Members arrive with their question written down, [short pause] and our team does the booking and chasing you would otherwise do unpaid.\n[pause]\n[calm] You set your hours and read a one-screen brief before each call. [short pause] Afterwards you confirm the summary, and we take it from there.\n[pause]\n[reassuring] Joining is free and you keep your own practice. [short pause] Work beyond a call is quoted by you and accepted by the member.\n[pause]\n[inviting] The application has seven short steps, and you can save a draft and finish it later.",
  [
    {
      id: "lawyers-hero",
      anchor: "lawyers-hero",
      section: "hero",
      match: "ILP brings you prepared",
      read: "[warm] ILP brings you prepared clients and handles the follow-up after each call.",
    },
    {
      id: "lawyers-why",
      anchor: "why-lawyers-join",
      section: "Why lawyers join",
      match: "Members arrive with their",
      read: "[matter-of-fact] Members arrive with their question written down, [short pause] and our team does the booking and chasing you would otherwise do unpaid.",
    },
    {
      id: "lawyers-how",
      anchor: "how-it-works-for-lawyers",
      section: "How it works for you",
      match: "You set your hours",
      read: "[calm] You set your hours and read a one-screen brief before each call. [short pause] Afterwards you confirm the summary, and we take it from there.",
    },
    {
      id: "lawyers-partnership",
      anchor: "what-the-partnership-is",
      section: "What the partnership is",
      match: "Joining is free and",
      read: "[reassuring] Joining is free and you keep your own practice. [short pause] Work beyond a call is quoted by you and accepted by the member.",
    },
    {
      id: "lawyers-final",
      anchor: "apply",
      section: "Apply to take member calls",
      match: "The application has seven",
      read: "[inviting] The application has seven short steps, and you can save a draft and finish it later.",
    },
  ],
);

const CSM = build(
  "csm",
  "[warm] A customer success manager makes sure every lawyer call ends with a next step the member acts on.\n[pause]\n[calm] Lawyer calls work when the member arrives prepared and someone follows through afterwards, [short pause] and at ILP that someone is you.\n[pause]\n[matter-of-fact] Each morning the portal puts the members who need you most at the top, with a playbook for each situation.\n[pause]\n[confident] You own the relationship with each member, [short pause] and the lawyer keeps the legal advice.\n[pause]\n[inviting] There is no online application yet. [short pause] Write to the ILP team about your client experience and the languages you speak.",
  [
    {
      id: "csm-hero",
      anchor: "csm-hero",
      section: "hero",
      match: "A customer success manager",
      read: "[warm] A customer success manager makes sure every lawyer call ends with a next step the member acts on.",
    },
    {
      id: "csm-why",
      anchor: "why-the-role-matters",
      section: "Why the role matters",
      match: "Lawyer calls work when",
      read: "[calm] Lawyer calls work when the member arrives prepared and someone follows through afterwards, [short pause] and at ILP that someone is you.",
    },
    {
      id: "csm-day",
      anchor: "how-your-day-works",
      section: "How your day works",
      match: "Each morning the portal",
      read: "[matter-of-fact] Each morning the portal puts the members who need you most at the top, with a playbook for each situation.",
    },
    {
      id: "csm-role",
      anchor: "what-the-role-is",
      section: "What the role is",
      match: "You own the relationship",
      read: "[confident] You own the relationship with each member, [short pause] and the lawyer keeps the legal advice.",
    },
    {
      id: "csm-final",
      anchor: "contact",
      section: "Write to the ILP team",
      match: "There is no online",
      read: "[inviting] There is no online application yet. [short pause] Write to the ILP team about your client experience and the languages you speak.",
    },
  ],
);

/** The script of each landing. */
export const NARRATION: Record<NarrationPage, NarrationScript> = {
  home: HOME,
  lawyers: LAWYERS,
  csm: CSM,
};

/** Route of each landing. */
export const NARRATION_ROUTES: Record<NarrationPage, string> = {
  home: "/",
  lawyers: "/attorneys",
  csm: "/customer-success",
};

/** Caption-only length of a whole landing (s). */
export const scriptSeconds = (page: NarrationPage) => NARRATION[page].cues.reduce((sum, c) => sum + c.estimate, 0);
