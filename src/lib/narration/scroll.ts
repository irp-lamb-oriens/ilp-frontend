/**
 * Narrator scroll math (landing narrator). Plain functions, no DOM.
 *
 * "jump" cues scroll to their section once, as the clip starts. "through"
 * cues sit on a pinned scroll story (MorphStage, BeatStory, CostsStory): the
 * narrator first lands on the start of the story's scroll range, then moves
 * the page across that range while the clip plays, so the story's beats
 * advance with the voice. The range is the one the story itself reads its
 * progress from: from the moment its top reaches `startAt` of the viewport
 * (0 = top) until its bottom reaches the viewport bottom.
 */

export type ScrollMode = "jump" | "through";

export interface ScrollRange {
  from: number;
  to: number;
}

/** Scroll range (page px) of a section for a "through" cue. */
export function throughRange(m: { top: number; height: number; viewport: number; startAt?: number }): ScrollRange {
  const from = Math.max(0, Math.round(m.top - m.viewport * (m.startAt ?? 0)));
  const to = Math.max(from, Math.round(m.top + m.height - m.viewport));
  return { from, to };
}

/**
 * Eased linear progress: linear through the middle, slower at both ends, so
 * the page eases into and out of the drive. Monotonic, 0 at 0, 1 at 1.
 */
export function driveEase(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return c - (0.5 * Math.sin(2 * Math.PI * c)) / (2 * Math.PI);
}

/**
 * Seconds at the start of a "through" clip spent landing on the range start
 * (the eased jump) before the drive begins, and the share of the clip at the
 * end that holds on the last beat while the voice finishes.
 */
export const DRIVE_SETTLE_S = 1.0;
export const DRIVE_HOLD = 0.1;

/** Drive progress (0..1) at `time` s into a clip of `duration` s. */
export function driveProgress(time: number, duration: number, settle = DRIVE_SETTLE_S, hold = DRIVE_HOLD): number {
  const end = Math.max(settle + 0.1, duration * (1 - hold));
  return driveEase((time - settle) / (end - settle));
}

/** Page y for a "through" cue at `time` s into a clip of `duration` s. */
export function throughY(range: ScrollRange, time: number, duration: number): number {
  return Math.round(range.from + driveProgress(time, duration) * (range.to - range.from));
}

/** Keys that scroll the page when focus is not in a field. */
export const SCROLL_KEYS: ReadonlySet<string> = new Set([
  "ArrowUp",
  "ArrowDown",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  " ",
  "Spacebar",
]);

/** An input event, reduced to what decides whether the visitor took over the scroll. */
export interface InputLike {
  type: string;
  key?: string;
  /** The event started inside the narrator's own controls. */
  insidePlayer?: boolean;
  /** The event target is a text field, select or editable element. */
  editable?: boolean;
}

/**
 * True when the visitor is scrolling the page themselves: a wheel or a touch
 * drag anywhere outside the player, or a scroll key outside the player and
 * outside a field. The narrator then pauses (audio and auto-scroll).
 */
export function isUserScrollIntent(e: InputLike): boolean {
  if (e.insidePlayer) return false;
  if (e.type === "wheel" || e.type === "touchmove") return true;
  if (e.type === "keydown") return !e.editable && !!e.key && SCROLL_KEYS.has(e.key);
  return false;
}
