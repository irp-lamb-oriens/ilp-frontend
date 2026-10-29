/**
 * Landing narrator scripts: the three public landings, one ordered list of
 * cues each. Each cue is a short pitch for its section, copied word for word
 * from docs/narration/SCRIPTS.md (the read text may carry ElevenLabs pause
 * tags; captions drop them);
 * tests/narration.test.mjs fails when the two differ and runs the copy
 * rules on the captions.
 *
 * Each cue plays one clip, public/narration/<page>/<file>, and is tied to a
 * section by its DOM id (`anchor`). scroll "jump": the page scrolls to the
 * section as the clip starts. scroll "through": the section is a pinned
 * scroll story, so the page moves from the start of its scroll range to the
 * end while the clip plays (`startAt` is the story's own start offset, a
 * share of the viewport: 0.35 for BeatStory and CostsStory, 0 for
 * MorphStage). See docs/narration/README.md for regenerating a clip.
 *
 * The homepage plays in page order: "What you get" (home-05) sits above
 * "What a missed date can cost you" (home-04) on the page, so it plays
 * first and the narrator never scrolls back up.
 */
import type { ScrollMode } from "./scroll";
import { estimateSeconds, stripBreaks } from "./timing";

export type NarrationPage = "home" | "lawyers" | "csm";

export interface NarrationCue {
  /** Stable id, also the clip name without .mp3 ("home-02-problem"). */
  id: string;
  /** Clip file name in public/narration/<page>/. */
  file: string;
  /** DOM id of the section this cue is about. */
  anchor: string;
  /** The section's name in SCRIPTS.md ("The problem"). */
  section: string;
  /** How the page follows the clip. */
  scroll: ScrollMode;
  /** "through" only: where the story's progress starts, share of the viewport. */
  startAt?: number;
  /** Script as read by the voice, with ElevenLabs pause tags. */
  read: string;
  /** Caption text: the read text without pause tags. */
  text: string;
  /** Timed-fallback length (s) until the clip exists. */
  estimate: number;
}

type CueInput = Omit<NarrationCue, "id" | "text" | "estimate">;

const cue = (c: CueInput): NarrationCue => ({
  ...c,
  id: c.file.replace(/\.mp3$/, ""),
  text: stripBreaks(c.read),
  estimate: estimateSeconds(c.read),
});

const HOME: NarrationCue[] = [
  cue({
    file: "home-01-hero.mp3",
    anchor: "hero",
    section: "hero",
    scroll: "jump",
    read: "ILP keeps the legal side of your life abroad in order, in six countries, for one monthly fee.",
  }),
  cue({
    file: "home-02-problem.mp3",
    anchor: "the-problem",
    section: "The problem",
    scroll: "through",
    startAt: 0,
    read: "Living abroad comes with legal dates written in another language, and nobody sends you a reminder.",
  }),
  cue({
    file: "home-03-how.mp3",
    anchor: "how-it-works",
    section: "How ILP works",
    scroll: "through",
    startAt: 0,
    read: "Start with a free two-minute check, and join when you want a lawyer to look at what it found.",
  }),
  cue({
    file: "home-05-price.mp3",
    anchor: "what-you-get",
    section: "What you get",
    scroll: "jump",
    read: "Next to a typical fifteen hundred dollar retainer, ILP is seventy-nine dollars and ninety-nine cents a month, with your lawyer calls included.",
  }),
  cue({
    file: "home-04-costs.mp3",
    anchor: "costs",
    section: "What a missed date can cost you",
    scroll: "through",
    startAt: 0.35,
    read: "A late filing can bring a fine, and asking around rarely gives you one clear answer.",
  }),
  cue({
    file: "home-06-includes.mp3",
    anchor: "what-the-membership-includes",
    section: "What the membership includes",
    scroll: "through",
    startAt: 0,
    read: "Your lawyer reads your file before each call, so your twenty minutes go straight to your question.",
  }),
  cue({
    file: "home-07-situations.mp3",
    anchor: "real-situations",
    section: "What this looks like in real situations",
    scroll: "through",
    startAt: 0,
    read: "Most questions look like these: a residency card coming up for renewal, or a company tax you had never heard of.",
  }),
  cue({
    file: "home-08-countries.mp3",
    anchor: "countries",
    section: "Six countries, open now",
    scroll: "jump",
    read: "Colombia, Costa Rica, Mexico, Panama, Portugal and Spain are all open, each with lawyers licensed there.",
  }),
  cue({
    file: "home-09-final.mp3",
    anchor: "free-deadline-check",
    section: "Start with the free deadline check",
    scroll: "jump",
    read: "Pick your country and take the free check. It takes about two minutes.",
  }),
];

const LAWYERS: NarrationCue[] = [
  cue({
    file: "lawyers-01-hero.mp3",
    anchor: "lawyers-hero",
    section: "hero",
    scroll: "jump",
    read: "ILP brings you prepared clients and handles the follow-up after each call.",
  }),
  cue({
    file: "lawyers-02-why.mp3",
    anchor: "why-lawyers-join",
    section: "Why lawyers join",
    scroll: "through",
    startAt: 0.35,
    read: "Members arrive with their question written down, and our team does the booking and chasing you would otherwise do unpaid.",
  }),
  cue({
    file: "lawyers-03-how.mp3",
    anchor: "how-it-works-for-lawyers",
    section: "How it works for you",
    scroll: "through",
    startAt: 0.35,
    read: "You set your hours and read a one-screen brief before each call. Afterwards you confirm the summary, and we take it from there.",
  }),
  cue({
    file: "lawyers-04-partnership.mp3",
    anchor: "what-the-partnership-is",
    section: "What the partnership is",
    scroll: "jump",
    read: "Joining is free and you keep your own practice. Work beyond a call is quoted by you and accepted by the member.",
  }),
  cue({
    file: "lawyers-05-final.mp3",
    anchor: "apply",
    section: "Apply to take member calls",
    scroll: "jump",
    read: "The application has seven short steps, and you can save a draft and finish it later.",
  }),
];

const CSM: NarrationCue[] = [
  cue({
    file: "csm-01-hero.mp3",
    anchor: "csm-hero",
    section: "hero",
    scroll: "jump",
    read: "A customer success manager makes sure every lawyer call ends with a next step the member acts on.",
  }),
  cue({
    file: "csm-02-why.mp3",
    anchor: "why-the-role-matters",
    section: "Why the role matters",
    scroll: "through",
    startAt: 0.35,
    read: "Lawyer calls work when the member arrives prepared and someone follows through afterwards, and at ILP that someone is you.",
  }),
  cue({
    file: "csm-03-day.mp3",
    anchor: "how-your-day-works",
    section: "How your day works",
    scroll: "through",
    startAt: 0.35,
    read: "Each morning the portal puts the members who need you most at the top, with a playbook for each situation.",
  }),
  cue({
    file: "csm-04-role.mp3",
    anchor: "what-the-role-is",
    section: "What the role is",
    scroll: "jump",
    read: "You own the relationship with each member, and the lawyer keeps the legal advice.",
  }),
  cue({
    file: "csm-05-final.mp3",
    anchor: "contact",
    section: "Write to the ILP team",
    scroll: "jump",
    read: "There is no online application yet. Write to the ILP team about your client experience and the languages you speak.",
  }),
];

/** The cues of each landing, in play order. */
export const NARRATION: Record<NarrationPage, readonly NarrationCue[]> = {
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

/** Public URL of a cue's clip. */
export const cueUrl = (page: NarrationPage, c: NarrationCue) => `/narration/${page}/${c.file}`;

/** Timed-fallback length of a whole landing (s). */
export const scriptSeconds = (page: NarrationPage) => NARRATION[page].reduce((sum, c) => sum + c.estimate, 0);
