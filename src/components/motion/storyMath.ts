/**
 * Scroll story math, shared by the pinned homepage stories (Story.tsx) and
 * checked by tests/storyMath.test.mjs. Plain functions, no DOM, no React.
 *
 * A pinned story is a tall track whose inner stage sticks to the viewport.
 * Its scroll progress p runs 0..1. Each beat owns a window [a, b, c, d] of p:
 *
 *   a..b  enter   eyebrow rule draws, then the label, the title lands, the
 *                 visual slides in from its side, words appear 0 to 1
 *   b..c  hold    the last words land, the visual plays its timeline
 *   c..d  exit    the beat fades to 0 and drifts toward its corner
 *
 * Beats never overlap: beat N reaches opacity 0 at d, then a short empty gap,
 * then beat N+1 starts at its a. The last beat has no exit (c = d = 1).
 */

import { EASE_IN_EXIT, EASE_OUT_STRONG } from "@/components/ui/loadingTiming";

export type BeatRange = readonly [a: number, b: number, c: number, d: number];
export type Window = readonly [from: number, to: number];

export interface BeatOptions {
  /** Share of the track the beats use; the rest is a final hold. Default 1. */
  span?: number;
  /** Share of each beat's slice spent entering. Default 0.3. */
  enter?: number;
  /** Share of each beat's slice spent exiting. Default 0.16. */
  exit?: number;
  /** Empty share between one beat's exit and the next one's enter. Default 0.08. */
  gap?: number;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const round = (v: number) => Math.round(v * 1e6) / 1e6;

/**
 * The enter, hold and exit windows of `count` beats laid end to end. Half the
 * gap sits at each side of the boundary between two slices, so beat N's exit
 * ends strictly before beat N+1's enter starts.
 */
export function beatRanges(count: number, opts: BeatOptions = {}): BeatRange[] {
  const { span = 1, enter = 0.3, exit = 0.16, gap = 0.08 } = opts;
  if (count <= 0) return [];
  const slice = span / count;
  const half = (slice * gap) / 2;
  return Array.from({ length: count }, (_, i) => {
    const first = i === 0;
    const last = i === count - 1;
    const a = i * slice + (first ? 0 : half);
    const b = a + slice * enter;
    const d = last ? 1 : (i + 1) * slice - half;
    const c = last ? 1 : d - slice * exit;
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
 * copy levels the same way: the eyebrow rule draws, then its label, then the
 * title lands, then the body appears word by word (about one phrase per 5% of
 * the beat), the visual slides in beside them and plays its own timeline only
 * after the title has landed.
 */
export function beatParts(r: BeatRange, phrases = 4) {
  const [a, b] = r;
  const title = enterWindow(r, 0.3, 0.75);
  const bodyFrom = enterWindow(r, 0.65, 0.65)[0];
  const perPhrase = (b - a) / 6; // enter is 30% of a slice: a phrase per 5% of the slice
  const bodyTo = Math.min(
    holdWindow(r, 0, 0.7)[1],
    Math.max(holdWindow(r, 0, 0.1)[1], bodyFrom + perPhrase * Math.max(1, phrases)),
  );
  return {
    rule: enterWindow(r, 0, 0.25),
    eyebrow: enterWindow(r, 0.25, 0.5),
    title,
    body: [bodyFrom, round(bodyTo)] as Window,
    visual: enterWindow(r, 0.45, 1),
    timeline: [title[1], holdWindow(r, 0, 0.85)[1]] as Window,
  };
}

/**
 * Layer windows for a beat whose copy has up to three levels, each staged
 * after the one above it has landed: the eyebrow rule draws and its label
 * fades in (tertiary), then the title appears word by word (secondary), then
 * the body appears word by word, starting only once the title is complete,
 * then the visual's caption (tertiary, the text equivalent of the visual).
 * The visual slides in while the title appears and plays its timeline from
 * the moment the title has landed. Without a title the body takes its place.
 * Every window ends inside the beat's hold, before beatAnchorProgress().
 */
export function beatLayers(r: BeatRange, opts: { title: boolean; bodyPhrases: number }) {
  const [a, b] = r;
  const rule = enterWindow(r, 0, 0.2);
  const eyebrow = enterWindow(r, 0.2, 0.4);
  const title: Window | null = opts.title ? enterWindow(r, 0.4, 1) : null;
  const bodyFrom = title ? title[1] : enterWindow(r, 0.4, 0.4)[0];
  const perPhrase = (b - a) / 6;
  const latest = holdWindow(r, 0, 0.55)[1];
  const earliest = title ? holdWindow(r, 0, 0.2)[1] : holdWindow(r, 0, 0.35)[1];
  const bodyTo = opts.bodyPhrases > 0 ? Math.min(latest, Math.max(earliest, bodyFrom + perPhrase * opts.bodyPhrases)) : bodyFrom;
  const capTo = holdWindow(r, 0, 0.7)[1];
  return {
    rule,
    eyebrow,
    title,
    body: [round(bodyFrom), round(bodyTo)] as Window,
    visual: enterWindow(r, 0.5, 1),
    timeline: [title ? title[1] : round(bodyFrom), holdWindow(r, 0, 0.85)[1]] as Window,
    caption: [round(bodyTo), round(Math.max(bodyTo, capTo))] as Window,
  };
}

/** Split [from, to] into n equal, back-to-back windows (phrase i appears in window i). */
export function splitWindow(w: Window, n: number): Window[] {
  const [from, to] = w;
  const step = n > 0 ? (to - from) / n : 0;
  return Array.from({ length: n }, (_, i) => [round(from + step * i), round(from + step * (i + 1))] as const);
}

/**
 * Word windows inside each part's window: word j of a part with n words
 * appears over [from + j*step, from + (j + overlap)*step], so words start in
 * reading order, each takes the same time, and the last one lands at the
 * part's end. Returns one list of windows per part.
 */
export function wordWindows(parts: readonly Window[], counts: readonly number[], overlap = 3): Window[][] {
  return parts.map(([from, to], k) => {
    const n = Math.max(0, counts[k] ?? 0);
    if (n === 0) return [];
    const step = (to - from) / (n - 1 + overlap);
    return Array.from({ length: n }, (_, j) => [round(from + j * step), round(from + (j + overlap) * step)] as const);
  });
}

/** How far progress p is through window w, 0..1 (0 before, 1 after). */
export function revealAt(p: number, [from, to]: Window): number {
  if (to <= from) return p >= from ? 1 : 0;
  return clamp01((p - from) / (to - from));
}

/**
 * Where a revealed word starts. "hidden": opacity 0 (the default; stories
 * with beats that share a stage). "dim": the whole line shows from the start
 * at REVEAL_DIM_OPACITY and brightens in place (the homepage problem block).
 */
export type RevealFrom = "hidden" | "dim";

/** Base opacity of a `from="dim"` line before its words are read (the pre-0-to-1 value). */
export const REVEAL_DIM_OPACITY = 0.22;

/** Opacity of a word at reveal progress k (0..1). */
export function revealOpacity(k: number, from: RevealFrom = "hidden"): number {
  const base = from === "dim" ? REVEAL_DIM_OPACITY : 0;
  return base + (1 - base) * k;
}

/** A cubic-bezier easing as a plain function of t in 0..1 (CSS semantics). */
export function bezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let lo = 0;
    let hi = 1;
    let t = x;
    for (let i = 0; i < 40; i++) {
      const v = sx(t);
      if (Math.abs(v - x) < 1e-7) break;
      if (v < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return sy(t);
  };
}

/** Strong ease-out for anything entering (rules.md token). */
export const easeEnter = bezier(...EASE_OUT_STRONG);
/** Ease-in for a beat leaving the stage (scroll-driven exits only). */
export const easeExit = bezier(...EASE_IN_EXIT);

/** Share of the exit (c..d) over which a leaving beat fades to 0; the drift runs to d. */
export const EXIT_FADE = 0.7;

/**
 * Opacity of a beat's wrapper at progress p: 0 before a, 1 from a through the
 * hold (its layers bring themselves in from 0), 1 to 0 over the first
 * EXIT_FADE of the exit, 0 from there on. The last beat never fades.
 */
export function beatOpacity(p: number, r: BeatRange): number {
  const [a, , c, d] = r;
  if (p < a) return 0;
  if (c >= d || p <= c) return 1;
  const t = revealAt(p, [c, c + (d - c) * EXIT_FADE]);
  return 1 - t;
}

/** How far a beat has drifted on its exit, 0..1, eased in. 0 for the last beat. */
export function beatExit(p: number, r: BeatRange): number {
  const [, , c, d] = r;
  if (c >= d) return 0;
  return easeExit(revealAt(p, [c, d]));
}

/* ── Gutenberg zigzag ───────────────────────────────────────────── */

export type Side = "start" | "end";
export interface ZigzagSlot {
  /** Column the text sits in (top row). */
  text: Side;
  /** Column the visual sits in (bottom row), always the other one. */
  visual: Side;
}

/**
 * Z-pattern placement of `count` beats: text top left and visual bottom right,
 * then text top right and visual bottom left, and so on. Consecutive beats
 * never share a region, so the eye travels in a Z from beat to beat.
 */
export function zigzag(count: number): ZigzagSlot[] {
  return Array.from({ length: count }, (_, i) =>
    i % 2 === 0 ? { text: "start", visual: "end" } : { text: "end", visual: "start" },
  );
}

export interface Drift {
  x: number;
  y: number;
}

/**
 * Where a layer comes from and goes to (px), for its column and row: it
 * enters from its own outer side and leaves toward its own corner (top row
 * up, bottom row down), so each beat's exit and the next one's enter move
 * along the Z.
 */
export function zigzagDrift(side: Side, row: "top" | "bottom", distance = 40): { enter: Drift; exit: Drift } {
  const dir = side === "start" ? -1 : 1;
  const up = row === "top" ? -1 : 1;
  return {
    enter: { x: dir * distance, y: 0 },
    exit: { x: dir * distance * 0.6, y: up * distance * 0.6 },
  };
}

/** Where a link to a beat lands: late in its hold, once the body has appeared. */
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
