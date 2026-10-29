/**
 * Narration timing (landing narrator). Plain functions, no DOM, so
 * tests/narration.test.mjs can check them.
 *
 * A cue's "read" text is the ElevenLabs script with its pause tags
 * (`<break time="0.4s" />`). Captions show it without the tags. Until the
 * audio exists, a cue lasts as long as reading it aloud at WPM words a
 * minute plus its pauses plus CUE_PAD, so the page can be reviewed in
 * caption-only mode with timing close to the real voice.
 */

/** Words a minute of the timed fallback (a calm narrator). */
export const WPM = 150;

/** Silence added at the end of every timed cue (s). */
export const CUE_PAD = 0.6;

const BREAK_RE = /<break\s+time="([\d.]+)\s*(ms|s)"\s*\/>/g;

/** The read text without pause tags, single spaced (the caption text). */
export function stripBreaks(read: string): string {
  return read.replace(BREAK_RE, " ").replace(/\s+/g, " ").trim();
}

/** Total pause time (s) of the break tags in a read text. */
export function breakSeconds(read: string): number {
  let total = 0;
  for (const m of read.matchAll(BREAK_RE)) total += m[2] === "ms" ? Number(m[1]) / 1000 : Number(m[1]);
  return total;
}

/** Spoken words in a text (tags removed). */
export function wordCount(text: string): number {
  const t = stripBreaks(text);
  return t ? t.split(" ").length : 0;
}

const round1 = (v: number) => Math.round(v * 10) / 10;

/** Timed-fallback length of a cue (s): words at WPM, plus pauses, plus CUE_PAD. */
export function estimateSeconds(read: string, wpm = WPM): number {
  return round1((wordCount(read) / wpm) * 60 + breakSeconds(read) + CUE_PAD);
}

/** Whole minutes for the overlay line ("about N minutes"), at least 1. */
export function minutesOf(totalSeconds: number): number {
  return Math.max(1, Math.round(totalSeconds / 60));
}

/** "about 1 minute" / "about 4 minutes". */
export function aboutMinutes(totalSeconds: number): string {
  const n = minutesOf(totalSeconds);
  return `about ${n} ${n === 1 ? "minute" : "minutes"}`;
}

/** One caption line and the share of the cue [start, end) it is shown for. */
export interface CaptionSegment {
  text: string;
  start: number;
  end: number;
}

/**
 * Split a cue into caption lines (sentences) and give each the share of the
 * cue it is read in: its words, plus any pause after it (in word time), so
 * the caption holds through the pause. Shares are cumulative and the last
 * one ends at 1.
 */
export function captionSegments(read: string, wpm = WPM): CaptionSegment[] {
  const wordsPerSecond = wpm / 60;
  const items: { text: string; weight: number }[] = [];
  for (const part of read.split(/(<break\s+time="[\d.]+\s*(?:ms|s)"\s*\/>)/)) {
    if (!part.trim()) continue;
    if (part.startsWith("<break")) {
      const pause = breakSeconds(part) * wordsPerSecond;
      if (items.length) items[items.length - 1].weight += pause;
      continue;
    }
    for (const sentence of stripBreaks(part).split(/(?<=[.?!])\s+/)) {
      if (sentence) items.push({ text: sentence, weight: wordCount(sentence) });
    }
  }
  const total = items.reduce((sum, it) => sum + it.weight, 0) || 1;
  let at = 0;
  return items.map((it, i) => {
    const start = at;
    at += it.weight / total;
    return { text: it.text, start, end: i === items.length - 1 ? 1 : at };
  });
}

/** Index of the caption line shown at cue progress p (0..1). */
export function captionIndexAt(segments: readonly CaptionSegment[], p: number): number {
  if (!segments.length) return -1;
  const i = segments.findIndex((s) => p < s.end);
  return i === -1 ? segments.length - 1 : i;
}
