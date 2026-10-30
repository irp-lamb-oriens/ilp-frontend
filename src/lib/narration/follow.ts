/**
 * Scroll that follows the voice (landing narrator). Plain functions, no DOM,
 * no allocation in the per-frame path, so tests/narration.test.mjs can
 * check them.
 *
 * Every narrated section has a scroll range: from its top (topY) to where
 * its bottom meets the bottom of the visible area (endY = bottom minus the
 * viewport, with the narrator bar's height taken off the viewport). Its
 * narration runs from the cue's start (tStart) to the end of its speech
 * (tEnd). In between, the page moves from topY to endY in proportion to the
 * time, with a gentle sine ease at both ends, so pinned beats advance with
 * the voice and the section's last line is reached as its narration ends.
 *
 * Between two cues the page teleports: at the moment the next cue starts it
 * jumps to that section's top in one frame (sections without narration in
 * between are skipped). The jump is masked by a quick fade-through in the
 * page colour (MASK_IN_MS up, the jump while opaque, MASK_OUT_MS down),
 * timed from the cue start so the mask is opaque exactly when the cue
 * starts; TELEPORT_MASK = false gives a raw jump. A section shorter
 * than the visible area has no range: endY = topY, it stays top-aligned for
 * its whole cue (top-aligned rather than centred, so it starts where its
 * heading is, like every other section).
 */

/** Mask the jump between sections with a fade-through (false: a raw jump). */
export const TELEPORT_MASK = true;
/** Fade-through: up (ease-in), then down (ease-out), in ms. */
export const MASK_IN_MS = 110;
export const MASK_OUT_MS = 180;
/** Jumps shorter than this (px) need no mask. */
export const MASK_MIN_JUMP = 2;
/** Speech is taken to end this long before the next cue when the transcript has no better end. */
export const SPEECH_TAIL_S = 0.35;
/** The last cue's speech ends this long before the audio does. */
export const LAST_TAIL_S = 0.3;
/** Ease-in and ease-out for the mask (cubic). */
export const easeInCubic = (p: number) => {
  const c = p <= 0 ? 0 : p >= 1 ? 1 : p;
  return c * c * c;
};
export const easeOutCubic = (p: number) => 1 - easeInCubic(1 - p);

/** easeInOutSine: 0 at 0, 1 at 1, nearly linear in the middle. */
export function easeInOutSine(p: number): number {
  const c = p <= 0 ? 0 : p >= 1 ? 1 : p;
  return (1 - Math.cos(Math.PI * c)) / 2;
}

export interface SectionBox {
  /** Section top in page coordinates (px). */
  top: number;
  /** Section height (px). */
  height: number;
}

export interface ViewportBox {
  /** Visible height (visualViewport height on phones). */
  height: number;
  /** Height reserved at the bottom by the narrator bar (px). */
  reserve: number;
  /** Document height (px). */
  docHeight: number;
}

/** Largest scroll position of the document. */
export const maxScroll = (v: ViewportBox) => Math.max(0, v.docHeight - v.height);

/**
 * Scroll range of a section: topY its top, endY where its bottom meets the
 * top of the narrator bar; both within 0..maxScroll, endY >= topY.
 */
export function sectionRange(s: SectionBox, v: ViewportBox): { topY: number; endY: number } {
  const max = maxScroll(v);
  const topY = Math.min(max, Math.max(0, Math.round(s.top)));
  const visible = Math.max(1, v.height - v.reserve);
  const endY = Math.min(max, Math.max(topY, Math.round(s.top + s.height - visible)));
  return { topY, endY };
}

/** Per-cue time windows, filled in place. */
export interface CueWindows {
  tStart: Float64Array;
  tEnd: Float64Array;
}

export function createWindows(n: number): CueWindows {
  return { tStart: new Float64Array(n), tEnd: new Float64Array(n) };
}

/**
 * Fill the windows from cue starts, optional speech ends (transcript segment
 * ends, or caption-only lengths) and the audio's length. A cue's speech
 * ends at its given end when that is after its start and before the next
 * cue; otherwise SPEECH_TAIL_S before the next cue, and the last one
 * LAST_TAIL_S before the end of the audio.
 */
export function fillWindows(w: CueWindows, starts: readonly number[], ends: readonly (number | null)[] | null, total: number): CueWindows {
  const n = starts.length;
  for (let i = 0; i < n; i++) {
    const a = starts[i];
    const next = i + 1 < n ? starts[i + 1] : total;
    const given = ends?.[i];
    let b: number;
    if (given != null && given > a && given < next) b = given;
    else b = i + 1 < n ? next - SPEECH_TAIL_S : total - LAST_TAIL_S;
    w.tStart[i] = a;
    w.tEnd[i] = Math.max(a + 0.1, b);
  }
  return w;
}

/** Section ranges per cue, filled in place by the component. */
export interface CueRanges {
  topY: Float64Array;
  endY: Float64Array;
}

export function createRanges(n: number): CueRanges {
  return { topY: new Float64Array(n), endY: new Float64Array(n) };
}

/** Progress 0..1 of cue i's narration at time t. */
export function cueProgressAt(w: CueWindows, i: number, t: number): number {
  const a = w.tStart[i];
  const b = w.tEnd[i];
  if (t <= a) return 0;
  if (t >= b) return 1;
  return (t - a) / (b - a);
}

/** Page y while cue i narrates (t inside or after its window). */
export function cueY(r: CueRanges, w: CueWindows, i: number, t: number): number {
  return r.topY[i] + (r.endY[i] - r.topY[i]) * easeInOutSine(cueProgressAt(w, i, t));
}

/** The cue narrating at time t: the last one whose start is at or before t (0 before the first). */
export function cueAt(w: CueWindows, t: number): number {
  let i = 0;
  for (let k = 1; k < w.tStart.length; k++) if (w.tStart[k] <= t) i = k;
  return i;
}

/**
 * Page y at time t: inside the range of the cue that is narrating. After its
 * speech ends it holds at the bottom; at the next cue's start it jumps to
 * that section's top (no glide). Before the first cue: its top.
 */
export function followY(r: CueRanges, w: CueWindows, t: number): number {
  if (!w.tStart.length) return 0;
  return cueY(r, w, cueAt(w, t), t);
}

/**
 * Mask opacity (0..1) at time t: rising over MASK_IN_MS before a cue start
 * (ease-in), opaque at the start, when the page jumps, then falling over
 * MASK_OUT_MS (ease-out). Only for cues after the first and jumps longer
 * than MASK_MIN_JUMP.
 */
export function boundaryMask(r: CueRanges, w: CueWindows, t: number): number {
  const up = MASK_IN_MS / 1000;
  const down = MASK_OUT_MS / 1000;
  for (let k = 1; k < w.tStart.length; k++) {
    const a = w.tStart[k];
    if (t < a - up || t >= a + down) continue;
    const from = cueY(r, w, k - 1, a);
    if (Math.abs(r.topY[k] - from) < MASK_MIN_JUMP) return 0;
    return t < a ? easeInCubic((t - (a - up)) / up) : 1 - easeOutCubic((t - a) / down);
  }
  return 0;
}

/**
 * Resume and seek: the mask rises over MASK_IN_MS while the page holds
 * still, the page jumps to where the time says once it is opaque, then the
 * mask falls over MASK_OUT_MS. `elapsed` in ms since the resume or seek.
 */
export interface ResyncPhase {
  mask: number;
  jumped: boolean;
  done: boolean;
}

export function resyncPhase(elapsed: number, out: ResyncPhase = { mask: 0, jumped: false, done: false }): ResyncPhase {
  if (elapsed < MASK_IN_MS) {
    out.mask = easeInCubic(elapsed / MASK_IN_MS);
    out.jumped = false;
    out.done = false;
  } else if (elapsed - MASK_IN_MS < MASK_OUT_MS) {
    out.mask = 1 - easeOutCubic((elapsed - MASK_IN_MS) / MASK_OUT_MS);
    out.jumped = true;
    out.done = false;
  } else {
    out.mask = 0;
    out.jumped = true;
    out.done = true;
  }
  return out;
}

/** Reduced motion: the top of the cue that is narrating, no movement within it. */
export function jumpY(r: CueRanges, w: CueWindows, t: number): number {
  let i = 0;
  for (let k = 1; k < w.tStart.length; k++) if (w.tStart[k] <= t) i = k;
  return r.topY[i] ?? 0;
}

/**
 * Where a section's speech ends in a transcript: the latest segment end
 * among segments that start inside the cue (from its start to the next
 * cue's start). Null when none.
 */
export function speechEnds(segments: readonly { start: number; end: number }[], starts: readonly number[]): (number | null)[] {
  return starts.map((a, i) => {
    const next = i + 1 < starts.length ? starts[i + 1] : Infinity;
    let end: number | null = null;
    for (const s of segments) if (s.start >= a - 0.05 && s.start < next && (end === null || s.end > end)) end = s.end;
    return end;
  });
}
