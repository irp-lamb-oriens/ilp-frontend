/**
 * Link targets for the four steps of "How ILP works" (HeroStory.tsx). Each
 * step has a fragment id, #how-it-works-step-N. On wide screens the steps
 * pin inside a tall scroll track and the active step follows the scroll
 * progress, so the id sits on a zero-height marker at the scroll offset where
 * step N is clearly active. Stacked (phones, reduced motion) the id sits on
 * the step block itself. Plain math, so tests/homepage.test.mjs can check it.
 */
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
