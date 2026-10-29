/** Narrator copy (frontend/copy-rules.md). One title per landing; the rest is shared. */
import type { NarrationPage } from "@/lib/narration/scripts";

export const NARRATOR_TITLE: Record<NarrationPage, string> = {
  home: "International Legal Partner",
  lawyers: "ILP for partner lawyers",
  csm: "Customer success at ILP",
};

export const NARRATOR_COPY = {
  start: "Start the experience",
  read: "Read the page instead",
  /** Overlay line; `about` is "about N minutes". */
  withSound: (about: string) => `A narrated walk through this page, ${about}, with sound.`,
  withCaptions: (about: string) => `A narrated walk through this page, ${about}, with captions. The audio is coming soon.`,
  launcher: "Play narration",
  resume: "Resume",
  pausedByScroll: "Paused while you scroll.",
  audioSoon: "Audio coming soon",
  play: "Play narration",
  pause: "Pause narration",
  prev: "Previous section",
  next: "Next section",
  mute: "Mute",
  unmute: "Unmute",
  captionsOn: "Show captions",
  captionsOff: "Hide captions",
  exit: "Exit",
  exitLabel: "Exit narration",
  player: "Page narration",
  progress: (n: number, total: number, section: string) => `Section ${n} of ${total}: ${section}`,
};
