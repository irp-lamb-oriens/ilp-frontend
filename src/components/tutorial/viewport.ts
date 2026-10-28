/**
 * When an inline demo (TutorialEmbed) may play. Pure, so the tests and the
 * component agree on one rule.
 *
 * - Visible share: the part of the scene on screen, measured against the
 *   smaller of its own height and the viewport height, so a scene taller than
 *   a phone screen can still count as fully in view.
 * - Hysteresis: start at 40% visible, stop below 15%. Between the two the
 *   demo keeps doing what it was doing, so it does not flicker at an edge.
 * - A hidden browser tab always stops it.
 *
 * Each embed makes its own controller: there is no shared clock, so one demo
 * coming into view never starts another.
 */

/** Share of the scene that must be on screen to start (or resume) playing. */
export const PLAY_ENTER = 0.4;
/** Below this share a playing demo pauses where it is. */
export const PLAY_LEAVE = 0.15;
/** Start loading the tutorial this far before it reaches the screen (about one viewport). */
export const PRELOAD_MARGIN = "100% 0px";
/** IntersectionObserver thresholds that cover both edges of the hysteresis. */
export const VIEW_THRESHOLDS = [0, 0.05, PLAY_LEAVE, 0.25, PLAY_ENTER, 0.5, 0.6, 0.75, 0.9, 1];

/** Visible share in [0, 1] from heights: on-screen part, the element, the viewport. */
export function visibleShare(onScreen: number, elementHeight: number, viewportHeight: number): number {
  const base = Math.min(elementHeight, viewportHeight > 0 ? viewportHeight : elementHeight);
  if (!(base > 0) || !(onScreen > 0)) return 0;
  return Math.max(0, Math.min(1, onScreen / base));
}

/** Playing or not after a visibility change. `docVisible`: document.visibilityState === "visible". */
export function shouldPlay(wasPlaying: boolean, share: number, docVisible: boolean): boolean {
  if (!docVisible) return false;
  return wasPlaying ? share >= PLAY_LEAVE : share >= PLAY_ENTER;
}

export interface ViewGate {
  /** Feed the latest visible share and tab state; returns whether the demo may play. */
  update(share: number, docVisible: boolean): boolean;
  readonly inView: boolean;
  /** True once the demo has been in view at least once. */
  readonly seen: boolean;
  /** Last visible share fed in. */
  readonly share: number;
  /**
   * Advance the demo clock by `ms`; ignored while not in view. Returns the
   * clock. The player itself runs on timers that stop when the gate closes;
   * this clock is the same rule in a form the tests can drive.
   */
  tick(ms: number): number;
  readonly elapsed: number;
}

/** One gate per embed. */
export function createViewGate(): ViewGate {
  let inView = false;
  let seen = false;
  let share = 0;
  let elapsed = 0;
  return {
    update(nextShare, docVisible) {
      share = nextShare;
      inView = shouldPlay(inView, nextShare, docVisible);
      if (inView) seen = true;
      return inView;
    },
    get inView() {
      return inView;
    },
    get seen() {
      return seen;
    },
    get share() {
      return share;
    },
    tick(ms) {
      if (inView && ms > 0) elapsed += ms;
      return elapsed;
    },
    get elapsed() {
      return elapsed;
    },
  };
}
