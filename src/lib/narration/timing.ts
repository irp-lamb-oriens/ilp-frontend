/**
 * Narration timing (landing narrator). Plain functions, no DOM, so
 * tests/narration.test.mjs can check them.
 *
 * The scripts carry ElevenLabs v3 delivery tags: tone tags such as [warm]
 * that are not spoken, and two pause tags. Captions show the text without
 * tags. Until the audio and its transcript exist, the narrator runs in
 * caption-only mode: a cue lasts as long as reading it aloud at WPM words a
 * minute plus its pauses, and each cue but the last is followed by the
 * [pause] that separates sections in the script.
 */

/** Words a minute of the caption-only mode (a calm narrator). */
export const WPM = 150;

/** Seconds of each pause tag. */
export const PAUSE_SECONDS: Readonly<Record<string, number>> = {
  "short pause": 0.5,
  pause: 1,
};

const TAG_RE = /\[([a-z][a-z -]*)\]/gi;

/** The text without delivery tags, single spaced (the caption text). */
export function stripTags(read: string): string {
  return read.replace(TAG_RE, " ").replace(/\s+/g, " ").trim();
}

/** Total pause time (s) of the pause tags in a text. */
export function pauseSeconds(read: string): number {
  let total = 0;
  for (const m of read.matchAll(TAG_RE)) total += PAUSE_SECONDS[m[1].toLowerCase()] ?? 0;
  return total;
}

/** Spoken words in a text (tags removed). */
export function wordCount(text: string): number {
  const t = stripTags(text);
  return t ? t.split(" ").length : 0;
}

const round2 = (v: number) => Math.round(v * 100) / 100;

/** Caption-only length (s) of a text: words at WPM plus its pause tags. */
export function estimateSeconds(read: string, wpm = WPM): number {
  return round2((wordCount(read) / wpm) * 60 + pauseSeconds(read));
}

/** Caption-only length (s) of one cue, plus the section [pause] after it unless it is the last. */
export function estimateCueSeconds(read: string, last: boolean, wpm = WPM): number {
  return round2(estimateSeconds(read, wpm) + (last ? 0 : PAUSE_SECONDS.pause));
}

/** Start times (s) of cues laid end to end, from their lengths. */
export function cumulativeStarts(lengths: readonly number[]): number[] {
  let at = 0;
  return lengths.map((l) => {
    const s = round2(at);
    at += l;
    return s;
  });
}

/** Index of the cue playing at time t (s): the last cue whose start is at or before t. */
export function cueIndexAt(starts: readonly number[], t: number): number {
  let i = 0;
  for (let k = 0; k < starts.length; k++) if (starts[k] <= t + 1e-6) i = k;
  return i;
}

/** Progress (0..1) through cue i at time t, given the cue starts and the total length. */
export function cueProgress(starts: readonly number[], total: number, i: number, t: number): number {
  const a = starts[i] ?? 0;
  const b = i + 1 < starts.length ? starts[i + 1] : total;
  if (b <= a) return t >= a ? 1 : 0;
  return Math.min(1, Math.max(0, (t - a) / (b - a)));
}

/** Whole minutes for the overlay line, at least 1. */
export function minutesOf(totalSeconds: number): number {
  return Math.max(1, Math.round(totalSeconds / 60));
}

/** "about 1 minute" / "about 4 minutes". */
export function aboutMinutes(totalSeconds: number): string {
  const n = minutesOf(totalSeconds);
  return `about ${n} ${n === 1 ? "minute" : "minutes"}`;
}
