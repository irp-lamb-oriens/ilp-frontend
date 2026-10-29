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
 * Between two cues the page moves from where the previous section stopped
 * to the next section's top in a short eased transition (TRANSITION_S, or
 * the pause between them when shorter, never under MIN_TRANSITION_S); any
 * section without narration in between is passed over. A section shorter
 * than the visible area has no range: endY = topY, it stays top-aligned for
 * its whole cue (top-aligned rather than centred, so it starts where its
 * heading is, like every other section).
 */

export const TRANSITION_S = 0.5;
export const MIN_TRANSITION_S = 0.25;
/** Speech is taken to end this long before the next cue when the transcript has no better end. */
export const SPEECH_TAIL_S = 0.35;
/** The last cue's speech ends this long before the audio does. */
export const LAST_TAIL_S = 0.3;
/** Re-sync after resume or seek (s). */
export const RESYNC_S = 0.5;

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
  /** When the move from the previous section to this one begins. */
  tMove: Float64Array;
}

export function createWindows(n: number): CueWindows {
  return { tStart: new Float64Array(n), tEnd: new Float64Array(n), tMove: new Float64Array(n) };
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
  for (let i = 0; i < n; i++) {
    if (i === 0) {
      w.tMove[i] = w.tStart[0];
      continue;
    }
    const gap = w.tStart[i] - w.tEnd[i - 1];
    const span = Math.min(TRANSITION_S, Math.max(MIN_TRANSITION_S, gap));
    w.tMove[i] = Math.max(w.tStart[i - 1], w.tStart[i] - span);
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

/**
 * Page y at time t: the section range of the cue that is narrating, or the
 * eased move from the previous section's position to the next section's top
 * just before a cue starts. Before the first cue: its top.
 */
export function followY(r: CueRanges, w: CueWindows, t: number): number {
  const n = w.tStart.length;
  if (!n) return 0;
  let i = 0;
  for (let k = 1; k < n; k++) if (w.tMove[k] <= t) i = k;
  if (i > 0 && t < w.tStart[i]) {
    const from = cueY(r, w, i - 1, w.tMove[i]);
    const k = (t - w.tMove[i]) / (w.tStart[i] - w.tMove[i] || 1);
    return from + (r.topY[i] - from) * easeInOutSine(k);
  }
  return cueY(r, w, i, t);
}

/** Reduced motion: the top of the cue that is narrating, no movement within it. */
export function jumpY(r: CueRanges, w: CueWindows, t: number): number {
  let i = 0;
  for (let k = 1; k < w.tStart.length; k++) if (w.tStart[k] <= t) i = k;
  return r.topY[i] ?? 0;
}

/** Eased re-sync after resume or seek: from `from` toward the live target over RESYNC_S. */
export function resyncY(from: number, target: number, elapsed: number, span = RESYNC_S): number {
  return from + (target - from) * easeInOutSine(elapsed / span);
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
