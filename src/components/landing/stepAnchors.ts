/**
 * Link targets for the four steps of "How ILP works" (HeroStory.tsx). Each
 * step has a fragment id, #how-it-works-step-N. On wide screens the steps
 * pin inside a tall scroll track and the active step follows the scroll
 * progress, so the id sits on a zero-height marker at the scroll offset where
 * step N is clearly active. Stacked (phones, reduced motion) the id sits on
 * the step block itself. Plain math, so tests/homepage.test.mjs can check it.
 */
import { revealAt, zigzag, zigzagDrift, type Side, type Window } from "@/components/motion/storyMath";
import { HERO } from "./content";

export const STEP_COUNT = HERO.how.length;

/** Height of the pinned steps track (MorphStage heightVh). Kept in step with
 * $steps-track-vh in HeroStory.module.scss. */
export const STEPS_TRACK_VH = 240;

/** Fragment id of step i (0-based): "how-it-works-step-1" … "-4". */
export const stepAnchorId = (i: number) => `${HERO.howAnchor}-step-${i + 1}`;

/** The active step (0-based) at scroll progress p in [0, 1]. */
export function activeStep(p: number): number {
  return Math.min(STEP_COUNT - 1, Math.max(0, Math.floor(p * STEP_COUNT)));
}

/**
 * Scroll progress that a link to step i lands on: the start of the track for
 * step 1 (same place as #how-it-works), otherwise a quarter into the step's
 * window, past the crossfade, so its text and example screen are fully shown.
 * Kept in step with $step-anchor-progress in HeroStory.module.scss.
 */
export function stepProgress(i: number): number {
  if (i <= 0) return 0;
  return (Math.min(i, STEP_COUNT - 1) + 0.25) / STEP_COUNT;
}

/**
 * Page scroll offset (px) at which step i is active in the pinned layout.
 * trackTop: the track's top in page coordinates; trackHeight: its height;
 * viewport: window.innerHeight. Progress runs 0 to 1 while the page scrolls
 * from trackTop to trackTop + trackHeight - viewport ("start start" to
 * "end end").
 */
export function stepScrollY(
  m: { trackTop: number; trackHeight: number; viewport: number },
  i: number,
): number {
  const range = Math.max(0, m.trackHeight - m.viewport);
  return Math.round(m.trackTop + stepProgress(i) * range);
}

/** The step (0-based) a URL hash points at, or null ("#how-it-works-step-3" → 2). */
export function parseStepHash(hash: string): number | null {
  const m = new RegExp(`^#?${HERO.howAnchor}-step-(\\d+)$`).exec(hash);
  if (!m) return null;
  const n = Number(m[1]);
  return n >= 1 && n <= STEP_COUNT ? n - 1 : null;
}

/* Example screens of the pinned steps. Step i owns progress [i/N, (i+1)/N].
 * Its screen fades out and finishes moving STEP_SCREEN_GAP before that
 * window ends, and the next screen starts STEP_SCREEN_GAP after it, so two
 * screens are never on stage together. Step 1 is shown from the start, step 4
 * holds to the end. */
export const STEP_SCREEN_GAP = 0.015;
export const STEP_SCREEN_FADE = 0.035;

/** Enter and exit windows of step i's screen (null: none). */
export function stepScreenWindows(i: number): { enter: Window | null; exit: Window | null } {
  const a = i / STEP_COUNT;
  const b = (i + 1) / STEP_COUNT;
  const g = STEP_SCREEN_GAP;
  const f = STEP_SCREEN_FADE;
  return {
    enter: i === 0 ? null : [a + g, a + g + f],
    exit: i === STEP_COUNT - 1 ? null : [b - g - f, b - g],
  };
}

/** Progress through step i's screen: enter 0..1, exit 0..1 (0 when it has none). */
export function stepScreenPhase(p: number, i: number): { enter: number; exit: number } {
  const { enter, exit } = stepScreenWindows(i);
  return { enter: enter ? revealAt(p, enter) : 1, exit: exit ? revealAt(p, exit) : 0 };
}

/** Opacity of step i's screen at progress p: 0 off stage, 1 while its step is read. */
export function stepScreenOpacity(p: number, i: number): number {
  const { enter, exit } = stepScreenPhase(p, i);
  return Math.min(enter, 1 - exit);
}

/** The side each step's screen slides in from, alternating (a Z down the steps). */
export const STEP_SCREEN_SIDES: Side[] = zigzag(STEP_COUNT).map((z) => z.visual);

/** Enter and exit drift (px) of step i's screen. */
export const stepScreenDrift = (i: number) => zigzagDrift(STEP_SCREEN_SIDES[i], "top", 32);
