/**
 * Scroll story math, shared by the pinned homepage stories (Story.tsx) and
 * checked by tests/storyMath.test.mjs. Plain functions, no DOM, no React.
 *
 * A pinned story is a tall track whose inner stage sticks to the viewport.
 * Its scroll progress p runs 0..1. Each beat owns a window [a, b, c, d] of p:
 *
 *   a..b  enter   eyebrow rule draws, label fades in, title lands, visual rises
 *   b..c  hold    body brightens phrase by phrase, the visual plays its timeline
 *   c..d  exit    the beat lifts out (opacity, translate, scale) for the next
 *
 * The last beat has no exit: it holds to the end of the track (c = d = 1).
 */

export type BeatRange = readonly [a: number, b: number, c: number, d: number];
export type Window = readonly [from: number, to: number];

export interface BeatOptions {
  /** Share of the track the beats use; the rest is a final hold. Default 1. */
  span?: number;
  /** Share of each beat's slice spent entering. Default 0.35. */
  enter?: number;
  /** Share of each beat's slice spent exiting. Default 0.2. */
  exit?: number;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const round = (v: number) => Math.round(v * 1e6) / 1e6;

/** The enter, hold and exit windows of `count` beats laid end to end. */
export function beatRanges(count: number, opts: BeatOptions = {}): BeatRange[] {
  const { span = 1, enter = 0.35, exit = 0.2 } = opts;
  if (count <= 0) return [];
  const slice = span / count;
  return Array.from({ length: count }, (_, i) => {
    const a = i * slice;
    const b = a + slice * enter;
    const last = i === count - 1;
    const c = last ? 1 : a + slice * (1 - exit);
    const d = last ? 1 : a + slice;
    return [round(a), round(b), round(c), round(d)] as const;
  });
}

export type BeatPhase = "before" | "enter" | "hold" | "exit" | "after";

/** Where progress p sits in a beat, and how far through that phase (0..1). */
export function beatPhase(p: number, r: BeatRange): { phase: BeatPhase; t: number } {
  const [a, b, c, d] = r;
  const part = (from: number, to: number) => (to > from ? clamp01((p - from) / (to - from)) : 1);
  if (p < a) return { phase: "before", t: 0 };
  if (p < b) return { phase: "enter", t: part(a, b) };
  if (p < c || c === d) return { phase: "hold", t: part(b, c) };
  if (p < d) return { phase: "exit", t: part(c, d) };
  return { phase: "after", t: 1 };
}

/** The beat that owns progress p: the last one whose window has started. */
export function activeBeat(p: number, ranges: readonly BeatRange[]): number {
  let idx = 0;
  ranges.forEach((r, i) => {
    if (p >= r[0]) idx = i;
  });
  return idx;
}

/** A sub-window of a beat's enter (a..b), from and to as shares of it. */
export function enterWindow(r: BeatRange, from: number, to: number): Window {
  const [a, b] = r;
  return [round(a + (b - a) * from), round(a + (b - a) * to)];
}

/** A sub-window of a beat's hold (b..c), from and to as shares of it. */
export function holdWindow(r: BeatRange, from: number, to: number): Window {
  const [, b, c] = r;
  return [round(b + (c - b) * from), round(b + (c - b) * to)];
}

/**
 * The windows each layer of a beat uses, so every story stages the three
 * copy levels the same way: eyebrow, then title, then body, with the visual
 * rising beside them and playing its own timeline through the hold.
 */
export function beatParts(r: BeatRange) {
  return {
    rule: enterWindow(r, 0, 0.3),
    eyebrow: enterWindow(r, 0.1, 0.4),
    title: enterWindow(r, 0.25, 0.7),
    body: [enterWindow(r, 0.55, 1)[0], holdWindow(r, 0, 0.55)[1]] as Window,
    visual: enterWindow(r, 0.3, 1),
    timeline: [enterWindow(r, 0.8, 1)[0], holdWindow(r, 0, 0.85)[1]] as Window,
  };
}

/** Split [from, to] into n equal, back-to-back windows (phrase i brightens in window i). */
export function splitWindow(w: Window, n: number): Window[] {
  const [from, to] = w;
  const step = n > 0 ? (to - from) / n : 0;
  return Array.from({ length: n }, (_, i) => [round(from + step * i), round(from + step * (i + 1))] as const);
}

/** Where a link to a beat lands: late in its hold, once the body has brightened. */
export function beatAnchorProgress(r: BeatRange): number {
  const [, b, c] = r;
  return round(b + (c - b) * 0.7);
}

/**
 * Page scroll offset (px) for progress p of a track measured from the moment
 * its top reaches `startAt` (a share of the viewport height, 0 = top) until
 * its bottom reaches the viewport bottom.
 */
export function trackScrollY(
  m: { trackTop: number; trackHeight: number; viewport: number; startAt?: number },
  p: number,
): number {
  const startAt = m.startAt ?? 0;
  const start = m.trackTop - m.viewport * startAt;
  const range = Math.max(0, m.trackHeight - m.viewport + m.viewport * startAt);
  return Math.round(start + clamp01(p) * range);
}

/**
 * Split prose into phrases after commas, colons, semicolons and full stops,
 * punctuation kept. Joined with single spaces the phrases are the text again.
 */
export function splitPhrases(text: string): string[] {
  return text
    .split(/(?<=[,.:;])\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Split text around one emphasised phrase (first match). */
export function splitMark(text: string, mark?: string): [before: string, mark: string, after: string] | null {
  if (!mark) return null;
  const at = text.indexOf(mark);
  if (at < 0) return null;
  return [text.slice(0, at), mark, text.slice(at + mark.length)];
}
