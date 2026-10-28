/**
 * Loading-state timing (see docs/workstreams/UX_LOADING.md).
 * The SCSS side lives in styles/_variables.scss ($stagger-step, $stagger-max,
 * $duration-reveal); keep the two in sync when tuning.
 */

/** A skeleton appears only when loading lasts longer than this. */
export const SKELETON_DELAY_MS = 150;
/** Once visible, a skeleton stays at least this long (no flicker). */
export const SKELETON_MIN_MS = 300;
/** Items that mount this long after their <Stagger> scope do not animate (refetches, tab switches, "show more"). */
export const REVEAL_WINDOW_MS = 700;
/** Highest stagger index with its own delay step; later items share it. Mirrors $stagger-max. */
export const STAGGER_MAX = 6;
/** rules.md strong ease-out, as a framer-motion / animate() curve. */
export const EASE_OUT_STRONG = [0.23, 1, 0.32, 1] as const;
/** Accelerating curve for scroll-driven exits only (pinned stories). Mirrors $ease-in-exit. */
export const EASE_IN_EXIT = [0.4, 0, 1, 1] as const;
/** Count-up length for KPI figures, in seconds. */
export const COUNT_UP_S = 0.6;
