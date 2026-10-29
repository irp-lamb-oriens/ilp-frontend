/**
 * Landing narrator scripts: the three public landings, one ordered list of
 * cues each. The read text is copied word for word from
 * docs/narration/SCRIPTS.md (ElevenLabs pause tags included);
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
    read: "This is ILP, International Legal Partner. It is a legal membership for North Americans in Colombia, Costa Rica, Mexico, Panama, Portugal and Spain.",
  }),
  cue({
    file: "home-02-problem.mp3",
    anchor: "the-problem",
    section: "The problem",
    scroll: "through",
    startAt: 0,
    read: "If you live in one of those countries, or own property there, you have legal dates to keep. Residency renewals, company filings, property tax and the yearly fee for your car each have their own date. <break time=\"0.4s\" /> The rules are written in Spanish or Portuguese, in a legal system you did not grow up with, and nobody reminds you when one is due.",
  }),
  cue({
    file: "home-03-how.mp3",
    anchor: "how-it-works",
    section: "How ILP works",
    scroll: "through",
    startAt: 0,
    read: "ILP works in four steps. You start with the free deadline check, which takes about two minutes and needs no account. If you want a lawyer to look at what came up, you join. We set up your legal profile, and you book video calls with a lawyer licensed in your country. After each call, your customer success manager follows up on the next steps with you.",
  }),
  cue({
    file: "home-05-price.mp3",
    anchor: "what-you-get",
    section: "What you get",
    scroll: "jump",
    read: "On the page you can see a typical law firm retainer of fifteen hundred dollars next to the ILP membership. ILP costs seventy-nine dollars and ninety-nine cents a month, plus a one-time activation fee of one hundred dollars. That includes up to three twenty-minute video calls a month. Drafting, filings and other legal work are quoted separately, and you decide whether to go ahead.",
  }),
  cue({
    file: "home-04-costs.mp3",
    anchor: "costs",
    section: "What a missed date can cost you",
    scroll: "through",
    startAt: 0.35,
    read: "A missed date can cost you in more than one way. The plainest cost is a fine. Your residency card, your company's yearly filing and your car fee each have a date, and a late one can bring a fine or extra paperwork. <break time=\"0.5s\" /> Then there is doubt. A forum tells you one thing, a neighbor another, and a lawyer a third, so you pay for the same question more than once and still are not sure. <break time=\"0.5s\" /> And every new lawyer starts from zero. You explain your residency, your house and your company again, and details get lost between conversations.",
  }),
  cue({
    file: "home-06-includes.mp3",
    anchor: "what-the-membership-includes",
    section: "What the membership includes",
    scroll: "through",
    startAt: 0,
    read: "Your legal life abroad sits in one place. Your living legal profile holds your residency, your property, your companies, your vehicles and your household, and it grows after each call. Before every call your lawyer reads a brief from that profile, so the twenty minutes go to your question. Afterwards you get a written summary and the next steps, checked by your lawyer. Calls are recorded only if you say yes. <break time=\"0.4s\" /> Reminders reach you before your dates are due.",
  }),
  cue({
    file: "home-07-situations.mp3",
    anchor: "real-situations",
    section: "What this looks like in real situations",
    scroll: "through",
    startAt: 0,
    read: "Take a residency renewal. Your card, a DIMEX in Costa Rica or a TIE in Spain, shows up on your list months ahead. You ask about it on a call, your lawyer tells you what to gather, and your customer success manager checks in until it is done. <break time=\"0.5s\" /> Or say your company in Costa Rica or Panama owns your car and nothing else. It still owes a yearly tax or fee. The free check lists it, and on a call your lawyer explains whether it applies and what to do.",
  }),
  cue({
    file: "home-08-countries.mp3",
    anchor: "countries",
    section: "Six countries, open now",
    scroll: "jump",
    read: "All six countries are open now. Each one has its own list of dates from our research, and lawyers licensed there.",
  }),
  cue({
    file: "home-09-final.mp3",
    anchor: "free-deadline-check",
    section: "Start with the free deadline check",
    scroll: "jump",
    read: "You can begin with the free deadline check. Pick your country, answer a few questions, and you will see the dates that may apply to you. It takes about two minutes.",
  }),
];

const LAWYERS: NarrationCue[] = [
  cue({
    file: "lawyers-01-hero.mp3",
    anchor: "lawyers-hero",
    section: "hero",
    scroll: "jump",
    read: "This page is for lawyers in Colombia, Costa Rica, Mexico, Panama, Portugal and Spain who want to advise ILP members. We prepare each call and handle the follow-up.",
  }),
  cue({
    file: "lawyers-02-why.mp3",
    anchor: "why-lawyers-join",
    section: "Why lawyers join",
    scroll: "through",
    startAt: 0.35,
    read: "Many North Americans live in these countries or own property there, and they have legal questions about residency, property, companies and cars. Finding those clients, booking them and chasing them after a call takes hours that nobody pays for. <break time=\"0.5s\" /> ILP members pay a monthly membership that already includes their calls. They write their question down before they book, and a customer success manager follows up after you speak.",
  }),
  cue({
    file: "lawyers-03-how.mp3",
    anchor: "how-it-works-for-lawyers",
    section: "How it works for you",
    scroll: "through",
    startAt: 0.35,
    read: "Joining takes four steps. You apply online, and we check your licence with the body that issued it, such as the Colegio de Abogados y Abogadas de Costa Rica, or your colegiado number in Spain. We reply by email. <break time=\"0.4s\" /> Next, you set the weekly hours when members can book you, and the legal areas you take. Before each twenty-minute video call, you read a one-screen brief with the member's question and profile. <break time=\"0.4s\" /> After the call, you confirm the suggested summary and next steps. ILP follows up with the member from there, including quotes for paid work.",
  }),
  cue({
    file: "lawyers-04-partnership.mp3",
    anchor: "what-the-partnership-is",
    section: "What the partnership is",
    scroll: "jump",
    read: "Joining is free for lawyers. ILP does not charge you to apply or to use the lawyer portal. Members pay seventy-nine dollars and ninety-nine cents a month for up to three twenty-minute calls with a lawyer licensed in their country. You remain an independent lawyer with your own practice. When a member needs more than a call, like a filing or a transfer, you quote the work and the member decides.",
  }),
  cue({
    file: "lawyers-05-final.mp3",
    anchor: "apply",
    section: "Apply to take member calls",
    scroll: "jump",
    read: "When you are ready, apply as a partner lawyer. The form asks about your practice, your areas, your hours and your fees, and you can save a draft and come back to it later.",
  }),
];

const CSM: NarrationCue[] = [
  cue({
    file: "csm-01-hero.mp3",
    anchor: "csm-hero",
    section: "hero",
    scroll: "jump",
    read: "This page is about customer success at ILP. A customer success manager looks after members from the day they join and makes sure every lawyer call ends with a next step.",
  }),
  cue({
    file: "csm-02-why.mp3",
    anchor: "why-the-role-matters",
    section: "Why the role matters",
    scroll: "through",
    startAt: 0.35,
    read: "ILP members are North Americans who live in Colombia, Costa Rica, Mexico, Panama, Portugal or Spain, or own property there. For seventy-nine dollars and ninety-nine cents a month, they get up to three twenty-minute calls with a lawyer licensed in their country. <break time=\"0.4s\" /> A call helps only when the member arrives prepared and someone makes sure the next steps happen afterwards. That person is the customer success manager, the member's contact at ILP. You run the welcome call, get the profile ready for the first call and send the lawyer's next steps once it ends. You also follow up on quotes and check renewals.",
  }),
  cue({
    file: "csm-03-day.mp3",
    anchor: "how-your-day-works",
    section: "How your day works",
    scroll: "through",
    startAt: 0.35,
    read: "Your day starts with your tasks, late ones first. An email at eight in the morning, Costa Rica time, lists what is late, what is due today, new members and members at risk. <break time=\"0.4s\" /> Every member has a health score from zero to one hundred, with the reasons behind it. A failed payment, weeks without contact or an unanswered quote lower the score, so the members most likely to leave come first. <break time=\"0.4s\" /> Some moments repeat, like a welcome call, a renewal check-in, a failed payment or a missed call. Each one has a playbook with steps in order and an email you send from the member's page. Once a week you look at your own figures, from time to first contact to retention after ninety days.",
  }),
  cue({
    file: "csm-04-role.mp3",
    anchor: "what-the-role-is",
    section: "What the role is",
    scroll: "jump",
    read: "Each member has one customer success manager. Legal advice comes from the member's lawyer, and you make sure the member knows what the lawyer confirmed and what happens next. Your figures describe your own members and are not compared with other managers.",
  }),
  cue({
    file: "csm-05-final.mp3",
    anchor: "contact",
    section: "Write to the ILP team",
    scroll: "jump",
    read: "There is no online application for this role yet. If you have experience looking after clients, write to the ILP team with a short note about it and the languages you speak.",
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
