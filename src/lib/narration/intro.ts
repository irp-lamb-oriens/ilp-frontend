/**
 * The overlay's start sequence (landing narrator). Pure config and a small
 * controller, so tests/narration.test.mjs can check the order, the timing
 * and that the narration waits for the sequence to end.
 *
 * Timeline (ms from the click), transform and opacity only:
 *   shine  the circle fills with the accent; the glyph turns white part by
 *          part (triangle, arc 1, arc 2), a white copy fading in over it
 *   fade   the whole button fades out, growing to 1.08
 *   clear  the title, the tour name, the length line and "Read the page
 *          instead" slide out, alternating left and right
 *   reveal the overlay's white background fades away (a fade reads cleaner
 *          than two halves sliding apart: no seam down the middle)
 * Only then does the overlay unmount and the narration start. Easing curves
 * are tokens in styles/_variables.scss ($ease-intro-*); the delays and
 * durations here reach the CSS as custom properties.
 */

export interface IntroStep {
  id: string;
  /** Start (ms after the click). */
  at: number;
  /** Duration (ms). */
  dur: number;
}

export const INTRO_STEPS = [
  { id: "fill", at: 0, dur: 140 },
  { id: "tri", at: 40, dur: 160 },
  { id: "arc1", at: 105, dur: 160 },
  { id: "arc2", at: 170, dur: 160 },
  { id: "fade", at: 360, dur: 220 },
  { id: "title", at: 480, dur: 280 },
  { id: "name", at: 530, dur: 280 },
  { id: "detail", at: 580, dur: 280 },
  { id: "read", at: 630, dur: 280 },
  { id: "reveal", at: 700, dur: 300 },
] as const satisfies readonly IntroStep[];

export type IntroStepId = (typeof INTRO_STEPS)[number]["id"];

/** When the last step ends (ms): the narration starts here. */
export const INTRO_TOTAL = Math.max(...INTRO_STEPS.map((s) => s.at + s.dur));

/** Extra wait after INTRO_TOTAL before the timeout fallback finishes the sequence (ms). */
export const INTRO_GRACE = 120;

/** A step by id. */
export const introStep = (id: IntroStepId): IntroStep => INTRO_STEPS.find((s) => s.id === id) as IntroStep;

/** CSS custom properties for a step: --intro-at and --intro-dur. */
export const introVars = (id: IntroStepId): Record<string, string> => {
  const s = introStep(id);
  return { "--intro-at": `${s.at}ms`, "--intro-dur": `${s.dur}ms` };
};

/**
 * Runs the sequence once: start() returns false when it is already running
 * or done (a second click, Escape); finish() runs `onDone` once, from the
 * end of the last transition or from the timeout fallback, whichever comes
 * first.
 */
export function createIntro(
  onDone: () => void,
  setTimer: (fn: () => void, ms: number) => unknown = (fn, ms) => setTimeout(fn, ms),
  clearTimer: (id: unknown) => void = (id) => clearTimeout(id as ReturnType<typeof setTimeout>),
) {
  let state: "idle" | "running" | "done" = "idle";
  let timer: unknown = null;
  const finish = () => {
    if (state !== "running") return;
    state = "done";
    if (timer !== null) clearTimer(timer);
    onDone();
  };
  return {
    start(): boolean {
      if (state !== "idle") return false;
      state = "running";
      timer = setTimer(finish, INTRO_TOTAL + INTRO_GRACE);
      return true;
    },
    finish,
    get state() {
      return state;
    },
  };
}

/** The parts of an audio element the unlock uses. */
export interface UnlockableAudio {
  play(): Promise<void> | void;
  pause(): void;
  getAttribute(name: string): string | null;
  src: string;
}

/**
 * Unlock audio inside the click (the user gesture), for playback that
 * starts after the sequence: set the source, create and resume the analyser
 * graph (`prepare`), then play() and pause() at once. Safari on iOS lets an
 * element that was played inside a gesture play again later from script;
 * an AudioContext resumed inside the gesture stays running. The play
 * promise's AbortError (from the pause) is swallowed.
 */
export function unlockAudio(audio: UnlockableAudio, src: string, prepare: () => void): void {
  if (!audio.getAttribute("src")) audio.src = src;
  prepare();
  try {
    const p = audio.play();
    if (p && typeof p.catch === "function") p.catch(() => undefined);
  } catch {
    // older browsers throw instead of rejecting; the later play() decides
  }
  audio.pause();
}
