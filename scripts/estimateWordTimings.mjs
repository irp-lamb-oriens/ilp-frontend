#!/usr/bin/env node
/**
 * Estimate word timings for the narration transcripts.
 *
 *   node scripts/estimateWordTimings.mjs            # home, lawyers, csm
 *   node scripts/estimateWordTimings.mjs home
 *
 * Reads public/narration/<page>.json (Whisper segments) and the cue scripts
 * (src/lib/narration/scripts.ts), shares each cue's window out over its
 * words by syllables and pauses (src/lib/narration/wordTiming.ts) and writes
 * them back as top-level "words": [{ word, start, end }] with
 * "wordsSource": "estimated-syllables". Segments stay as they are.
 *
 * A file whose words came from Whisper ("wordsSource" other than
 * "estimated-syllables", or words without that mark) is left alone: real
 * word timestamps always win over the estimate.
 */
import { register } from "node:module";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

register("../tests/tsResolve.mjs", import.meta.url);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { NARRATION } = await import("../src/lib/narration/scripts.ts");
const { cueStartsFromTranscript } = await import("../src/lib/narration/transcript.ts");
const { createWindows, fillWindows, speechEnds } = await import("../src/lib/narration/follow.ts");
const { estimateWords } = await import("../src/lib/narration/wordTiming.ts");

export const ESTIMATED = "estimated-syllables";

/** The JSON with estimated words for one page's script. */
export function withEstimatedWords(json, script) {
  const { cues } = script;
  // Cue times from the segments only, so an older estimate never feeds the next one.
  const segmentsOnly = { segments: json.segments };
  const duration = typeof json.duration === "number" ? json.duration : null;
  const weights = cues.map((c) => c.estimate);
  const { starts, segments } = cueStartsFromTranscript(segmentsOnly, cues.map((c) => c.match), weights, duration);
  const total = duration ?? Math.max(...segments.map((s) => s.end));
  const w = fillWindows(createWindows(cues.length), starts, speechEnds(segments, starts), total);
  const words = cues.flatMap((c, i) => estimateWords(c.read, w.tStart[i], w.tEnd[i]));
  return { ...json, wordsSource: ESTIMATED, words };
}

const pages = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(NARRATION);
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("estimateWordTimings.mjs")) {
  for (const page of pages) {
    const file = path.join(ROOT, "public/narration", `${page}.json`);
    if (!existsSync(file) || !NARRATION[page]) {
      console.log(`${page}: no transcript or no script, skipped`);
      continue;
    }
    const json = JSON.parse(readFileSync(file, "utf8"));
    if (Array.isArray(json.words) && json.words.length && json.wordsSource !== ESTIMATED) {
      console.log(`${page}: has word timestamps from Whisper, left as is`);
      continue;
    }
    const out = withEstimatedWords(json, NARRATION[page]);
    writeFileSync(file, `${JSON.stringify(out, null, 2)}\n`);
    console.log(`${page}: ${out.words.length} words estimated`);
  }
}
