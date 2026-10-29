/**
 * Word timings for per-word captions (landing narrator). Plain functions,
 * no DOM, so tests/narration.test.mjs can check them.
 *
 * Without word timestamps from Whisper, each cue's window (from its start to
 * the end of its speech) is shared out over its words: every word gets a
 * share proportional to its English syllable count plus a fixed per-word
 * overhead, punctuation adds a pause after its word (comma 0.25 s, full
 * stop or colon 0.45 s) and so do the script's pause tags ([short pause]
 * 0.5 s, [pause] 1 s). A short lead-in comes first. scripts/
 * estimateWordTimings.mjs writes these into public/narration/<page>.json;
 * real Whisper word times, when the owner adds them, replace the estimate
 * (alignCueWords reads whichever the JSON holds).
 */
import { normalizeTokens, numberWords, type TimedWord } from "./transcript";

export interface WordTime {
  word: string;
  start: number;
  end: number;
}

/** Seconds before the first word of a window. */
export const LEAD_IN = 0.1;
/** Fixed weight of every word, in syllables (onset, transitions). */
export const WORD_OVERHEAD = 0.5;
/** Pause after punctuation (s). */
export const COMMA_PAUSE = 0.25;
export const STOP_PAUSE = 0.45;
/** Pause tags of the ElevenLabs script (s). */
export const TAG_PAUSE: Readonly<Record<string, number>> = { "short pause": 0.5, pause: 1 };
/** Pauses never take more than this share of a window. */
export const MAX_PAUSE_SHARE = 0.4;

/* ── Syllables ───────────────────────────────────────────────── */

/** Words the vowel-group rule gets wrong that the scripts use. */
const SYLLABLE_EXCEPTIONS: Readonly<Record<string, number>> = {
  ninety: 2,
  hundred: 2,
  business: 2,
  people: 2,
  someone: 2,
  everyone: 3,
  experience: 4,
  situation: 4,
  situations: 4,
};

/** Syllables of one plain English word (letters only), by vowel groups. */
export function englishSyllables(input: string): number {
  const w = input.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (SYLLABLE_EXCEPTIONS[w]) return SYLLABLE_EXCEPTIONS[w];
  if (w.length <= 3) return 1;
  let extra = 0;
  if (/[td]ed$/.test(w)) extra++; // need-ed, wait-ed
  if (/(?:s|x|z|ch|sh|c|g)es$/.test(w)) extra++; // box-es, plac-es, pag-es
  const core = w.replace(/(?:[^laeiouy]es|[^laeiouy]ed|[^laeiouy]e)$/, "").replace(/^y/, "");
  const groups = core.match(/[aeiouy]{1,2}/g)?.length ?? 0;
  const hiatus = core.match(/[^cgst]i[aou]/g)?.length ?? 0; // Colom-bi-a, ra-di-o
  return Math.max(1, groups + hiatus + extra);
}

/** Spoken form of a price or number ("US$79.99" -> "seventy nine dollars and ninety nine cents"). */
export function spokenNumbers(text: string): string {
  return text
    .replace(/(?:US)?\$(\d[\d,]*)(?:\.(\d{2}))?/g, (_, whole: string, cents?: string) => {
      const d = `${numberWords(Number(whole.replace(/,/g, "")))} dollars`;
      return cents && Number(cents) ? `${d} and ${numberWords(Number(cents))} cents` : d;
    })
    .replace(/(\d),(?=\d{3}\b)/g, "$1")
    .replace(/\d+(?:\.\d+)?/g, (m) => {
      const [whole, frac] = m.split(".");
      return `${numberWords(Number(whole))}${frac ? ` point ${numberWords(Number(frac))}` : ""}`;
    });
}

/**
 * Syllables of a caption word as spoken: hyphenated and compound words are
 * the sum of their parts, numbers and prices are read as words, and
 * acronyms (ILP, CSM) are spelled out, one syllable a letter (W: three).
 */
export function syllables(word: string): number {
  let total = 0;
  for (const part of spokenNumbers(word).split(/[\s\-–/]+/)) {
    const letters = part.replace(/[^A-Za-z]/g, "");
    if (!letters) continue;
    if (/^[A-Z]{2,}s?$/.test(letters)) {
      for (const ch of letters) if (ch !== "s") total += ch === "W" ? 3 : 1;
      continue;
    }
    total += englishSyllables(letters);
  }
  return Math.max(total ? 1 : 0, total);
}

/* ── Tokens and distribution ─────────────────────────────────── */

export interface SpokenWord {
  word: string;
  syllables: number;
  /** Pause after the word (s). */
  pause: number;
}

const TAG_RE = /\[([a-z][a-z -]*)\]/gi;

/** Words of a script text (tags out, punctuation kept on its word), with syllables and the pause after each. */
export function spokenWords(read: string): SpokenWord[] {
  const out: SpokenWord[] = [];
  for (const piece of read.split(/(\[[a-z][a-z -]*\])/i)) {
    const tag = /^\[([a-z][a-z -]*)\]$/i.exec(piece);
    if (tag) {
      const p = TAG_PAUSE[tag[1].toLowerCase()];
      if (p && out.length) out[out.length - 1].pause += p;
      continue;
    }
    for (const word of piece.replace(TAG_RE, " ").split(/\s+/)) {
      if (!word) continue;
      const pause = /[.!?:]["')\]]?$/.test(word) ? STOP_PAUSE : /[,;]["')\]]?$/.test(word) ? COMMA_PAUSE : 0;
      out.push({ word, syllables: Math.max(1, syllables(word)), pause });
    }
  }
  return out;
}

const round3 = (v: number) => Math.round(v * 1000) / 1000;

/**
 * Word times of a text read in [start, end): a lead-in, then each word a
 * share of the time by syllables plus overhead, with the pauses after
 * punctuation and pause tags in between (scaled down when they would take
 * more than MAX_PAUSE_SHARE). The last word ends at `end`.
 */
export function estimateWords(read: string, start: number, end: number): WordTime[] {
  const words = spokenWords(read);
  const n = words.length;
  if (!n) return [];
  const windowS = Math.max(0.05, end - start);
  const lead = Math.min(LEAD_IN, windowS * 0.1);
  const span = windowS - lead;
  let pauses = 0;
  for (let k = 0; k < n - 1; k++) pauses += words[k].pause;
  const pauseScale = pauses > MAX_PAUSE_SHARE * span ? (MAX_PAUSE_SHARE * span) / pauses : 1;
  const speak = span - pauses * pauseScale;
  const weight = words.reduce((s, w) => s + w.syllables + WORD_OVERHEAD, 0);
  const out: WordTime[] = [];
  let t = start + lead;
  words.forEach((w, k) => {
    const d = (speak * (w.syllables + WORD_OVERHEAD)) / weight;
    const wEnd = k === n - 1 ? end : t + d;
    out.push({ word: w.word, start: round3(t), end: round3(wEnd) });
    t = wEnd + (k < n - 1 ? w.pause * pauseScale : 0);
  });
  return out;
}

/* ── Captions at runtime ─────────────────────────────────────── */

/** The words of a caption, punctuation attached (same split as spokenWords). */
export const captionWords = (caption: string): string[] => caption.split(/\s+/).filter(Boolean);

/**
 * Where caption lines start: break after punctuation once a line has
 * `min` words, and always at `max` words, so a line fits about two lines of
 * the caption box. Returns the first word index of each line.
 */
export function lineStarts(words: readonly string[], max = 12, min = 5): number[] {
  const starts = [0];
  let len = 0;
  for (let k = 0; k < words.length; k++) {
    len++;
    const last = k === words.length - 1;
    if (last) break;
    if (len >= max || (len >= min && /[,.;:!?]["')]?$/.test(words[k]))) {
      starts.push(k + 1);
      len = 0;
    }
  }
  return starts;
}

/** Number of words whose start is at or before t (binary search over sorted starts). */
export function revealedCount(starts: ArrayLike<number>, t: number): number {
  let lo = 0;
  let hi = starts.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (starts[mid] <= t) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** The line (index into lineStarts) that holds word k. */
export function lineOf(lines: readonly number[], k: number): number {
  let i = 0;
  for (let j = 1; j < lines.length; j++) if (lines[j] <= k) i = j;
  return i;
}

/**
 * Start times of a cue's caption words in [start, end). Words found in the
 * transcript's timed words (real Whisper times, or the estimate written into
 * the JSON) take those times; the rest take the syllable estimate. Times
 * never go backwards and stay inside the window.
 */
export function alignCueWords(read: string, words: readonly string[], start: number, end: number, timed: readonly TimedWord[] | null): Float64Array {
  const estimate = estimateWords(read, start, end);
  const out = new Float64Array(words.length);
  let p = 0;
  if (timed) while (p < timed.length && timed[p].start < start - 0.25) p++;
  for (let k = 0; k < words.length; k++) {
    let t = estimate[k]?.start ?? start;
    const first = normalizeTokens(words[k])[0];
    if (timed && first) {
      for (let j = p; j < Math.min(timed.length, p + 4); j++) {
        if (timed[j].start >= end) break;
        if (timed[j].token === first) {
          t = timed[j].start;
          p = j + Math.max(1, normalizeTokens(words[k]).length);
          break;
        }
      }
    }
    out[k] = Math.min(end, Math.max(start, k ? Math.max(out[k - 1], t) : t));
  }
  return out;
}
