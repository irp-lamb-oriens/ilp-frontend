/**
 * Whisper transcripts for the landing narrator. Plain functions, no DOM.
 *
 * The owner runs Whisper on each landing's audio and saves the JSON next to
 * it (docs/narration/README.md). Three shapes are read:
 *
 * - openai-whisper CLI and whisperX: { segments: [{ start, end, text,
 *   words?: [{ word, start, end }] }] } (seconds);
 * - OpenAI API verbose_json: { segments: [{ start, end, text }],
 *   words?: [{ word, start, end }] } (seconds);
 * - whisper.cpp -oj: { transcription: [{ offsets: { from, to }, text }] }
 *   (milliseconds; with -ml 1 each entry is about one word).
 *
 * The transcript becomes one stream of normalized words with start times
 * (segments without word times spread their words evenly over the
 * segment). Each cue's opening words are then found in order, allowing one
 * wrong word in matches of three words or more; times must increase from
 * cue to cue. A cue that is not found gets a time between its neighbours,
 * shared out by the cues' caption-only lengths.
 */

export interface TimedWord {
  /** Normalized word (lowercase letters and digits). */
  token: string;
  /** Start time (s). */
  start: number;
}

export interface ParsedTranscript {
  words: TimedWord[];
  /** End of the last segment or word (s), or null. */
  end: number | null;
}

const ONES = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

/** An integer 0..999999 in words ("79" -> "seventy nine"); larger numbers stay digits. */
export function numberWords(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 999_999) return String(n);
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? ` ${ONES[n % 10]}` : "");
  if (n < 1000) return `${ONES[Math.floor(n / 100)]} hundred${n % 100 ? ` ${numberWords(n % 100)}` : ""}`;
  return `${numberWords(Math.floor(n / 1000))} thousand${n % 1000 ? ` ${numberWords(n % 1000)}` : ""}`;
}

/**
 * Words of a text for matching: lowercase, apostrophes dropped, other
 * punctuation and hyphens as spaces, digits spelled out ("2-minute" ->
 * "two minute", "1,500" -> "one thousand five hundred").
 */
export function normalizeTokens(text: string): string[] {
  const t = text
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/(\d),(?=\d{3}\b)/g, "$1")
    .replace(/\d+(?:\.\d+)?/g, (m) => {
      const [whole, frac] = m.split(".");
      return ` ${numberWords(Number(whole))}${frac ? ` point ${numberWords(Number(frac))}` : ""} `;
    })
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  return t ? t.split(" ") : [];
}

type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec => typeof v === "object" && v !== null && !Array.isArray(v);
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

/** "00:00:01,230" or "00:00:01.230" -> 1.23 s. */
function clockSeconds(v: unknown): number | null {
  if (typeof v !== "string") return null;
  const m = /^(\d+):(\d{2}):(\d{2})[.,](\d{1,3})$/.exec(v.trim());
  return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) + Number(m[4].padEnd(3, "0")) / 1000 : null;
}

interface RawWord {
  text: string;
  start: number | null;
  end: number | null;
}
interface RawSegment {
  text: string;
  start: number;
  end: number;
  words: RawWord[] | null;
}

function rawWords(v: unknown): RawWord[] | null {
  if (!Array.isArray(v) || !v.length) return null;
  const out: RawWord[] = [];
  for (const w of v) {
    if (!isRec(w)) continue;
    const text = typeof w.word === "string" ? w.word : typeof w.text === "string" ? w.text : "";
    out.push({ text, start: num(w.start), end: num(w.end) });
  }
  return out.length ? out : null;
}

function rawSegments(json: unknown): RawSegment[] {
  const list: unknown[] = Array.isArray(json)
    ? json
    : isRec(json) && Array.isArray(json.segments)
      ? json.segments
      : isRec(json) && Array.isArray(json.transcription)
        ? json.transcription
        : [];
  const out: RawSegment[] = [];
  for (const s of list) {
    if (!isRec(s)) continue;
    let start = num(s.start);
    let end = num(s.end);
    if (start === null && isRec(s.offsets)) {
      // whisper.cpp: milliseconds
      const from = num(s.offsets.from);
      const to = num(s.offsets.to);
      start = from === null ? null : from / 1000;
      end = to === null ? null : to / 1000;
    }
    if (start === null && isRec(s.timestamps)) {
      start = clockSeconds(s.timestamps.from);
      end = clockSeconds(s.timestamps.to);
    }
    if (start === null) continue;
    out.push({ text: typeof s.text === "string" ? s.text : "", start, end: end ?? start, words: rawWords(s.words) });
  }
  return out;
}

/** Timed words from raw words; a word without a start takes the one before it (or `fallback`). */
function fromRawWords(words: RawWord[], fallback: number): TimedWord[] {
  const out: TimedWord[] = [];
  let last = fallback;
  for (const w of words) {
    const start = w.start ?? last;
    last = start;
    for (const token of normalizeTokens(w.text)) out.push({ token, start });
  }
  return out;
}

/** Read any supported Whisper JSON into a timed word stream. Unknown shapes give no words. */
export function parseTranscript(json: unknown): ParsedTranscript {
  const segments = rawSegments(json);
  let end: number | null = segments.length ? Math.max(...segments.map((s) => s.end)) : null;

  // OpenAI verbose_json with word granularity: top-level words.
  const top = isRec(json) ? rawWords(json.words) : null;
  if (top) {
    const lastEnd = top.reduce((m, w) => Math.max(m, w.end ?? w.start ?? 0), 0);
    end = Math.max(end ?? 0, lastEnd);
    return { words: fromRawWords(top, 0), end };
  }

  const words: TimedWord[] = [];
  for (const s of segments) {
    if (s.words) {
      words.push(...fromRawWords(s.words, s.start));
      continue;
    }
    // Segment level only: spread its words evenly over the segment.
    const tokens = normalizeTokens(s.text);
    const step = tokens.length ? (s.end - s.start) / tokens.length : 0;
    tokens.forEach((token, i) => words.push({ token, start: s.start + i * step }));
  }
  return { words, end };
}

/** Index in `words` where `tokens` start, from `from` on, with at most `tolerance` wrong words; -1 if none. */
function findTokens(words: readonly TimedWord[], tokens: readonly string[], from: number, after: number, tolerance: number): number {
  const n = tokens.length;
  for (let i = from; i + n <= words.length; i++) {
    if (words[i].start <= after) continue;
    let wrong = 0;
    for (let k = 0; k < n && wrong <= tolerance; k++) if (words[i + k].token !== tokens[k]) wrong++;
    if (wrong <= tolerance) return i;
  }
  return -1;
}

/**
 * Start time of each cue's opening words, in order, or null when not found.
 * An exact match is preferred; otherwise one wrong word is allowed when the
 * match has three words or more. Each found time is later than the one
 * before it.
 */
export function findCueStarts(words: readonly TimedWord[], matches: readonly string[]): (number | null)[] {
  let from = 0;
  let after = -Infinity;
  return matches.map((m) => {
    const tokens = normalizeTokens(m);
    if (!tokens.length) return null;
    let i = findTokens(words, tokens, from, after, 0);
    if (i === -1 && tokens.length >= 3) i = findTokens(words, tokens, from, after, 1);
    if (i === -1) return null;
    from = i + tokens.length;
    after = words[i].start;
    return words[i].start;
  });
}

const round2 = (v: number) => Math.round(v * 100) / 100;

/**
 * Fill the cues that were not found. The first cue defaults to 0. A run of
 * missing cues between two known times shares that gap by the cues'
 * lengths (`weights`); after the last known time, they share the gap to
 * `end` when known, else follow their own lengths.
 */
export function fillCueStarts(found: readonly (number | null)[], weights: readonly number[], end: number | null): number[] {
  const out = found.slice();
  if (out.length && out[0] === null) out[0] = 0;
  let p = 0;
  while (p < out.length) {
    let q = p + 1;
    while (q < out.length && out[q] === null) q++;
    if (q > p + 1) {
      const a = out[p] as number;
      const sum = (from: number, to: number) => weights.slice(from, to).reduce((s, w) => s + w, 0);
      let b: number;
      let span: number;
      if (q < out.length) {
        b = out[q] as number;
        span = sum(p, q);
      } else if (end !== null && end > a) {
        b = end;
        span = sum(p, q);
      } else {
        b = a + sum(p, q);
        span = sum(p, q);
      }
      for (let k = p + 1; k < q; k++) out[k] = round2(a + ((b - a) * sum(p, k)) / (span || 1));
    }
    p = q;
  }
  return out as number[];
}

/** Cue start times from a Whisper JSON (any supported shape). */
export function cueStartsFromTranscript(
  json: unknown,
  matches: readonly string[],
  weights: readonly number[],
  duration: number | null = null,
): { starts: number[]; found: (number | null)[] } {
  const { words, end } = parseTranscript(json);
  const found = findCueStarts(words, matches);
  return { starts: fillCueStarts(found, weights, duration ?? end), found };
}
