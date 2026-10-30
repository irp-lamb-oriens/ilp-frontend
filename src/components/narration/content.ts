/** Narrator copy (frontend/copy-rules.md). One title per landing; the rest is shared. */
import type { NarrationPage } from "@/lib/narration/scripts";

export const NARRATOR_TITLE: Record<NarrationPage, string> = {
  home: "International Legal Partner",
  lawyers: "ILP for partner lawyers",
  csm: "Customer success at ILP",
};

const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

export const NARRATOR_COPY = {
  start: "Play the narrated tour",
  read: "Read the page instead",
  /** Detail under the play button; `about` is "about N minutes". */
  withSound: (about: string) => `${cap(about)}, with sound.`,
  withCaptions: (about: string) => `${cap(about)}, with captions. The audio is coming soon.`,
  /** The play button's accessible name. */
  startLabel: (about: string, sound: boolean) => `Play the narrated tour of this page, ${about}, ${sound ? "with sound" : "with captions"}`,
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
