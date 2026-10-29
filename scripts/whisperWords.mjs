#!/usr/bin/env node
/**
 * Optional: real word timestamps from the OpenAI transcription API.
 * Not run by the build or the tests. Costs a few cents per landing.
 *
 *   OPENAI_API_KEY=... node scripts/whisperWords.mjs home lawyers csm
 *
 * For each page, sends public/narration/<page>.mp3 to
 * /v1/audio/transcriptions (model whisper-1, response_format verbose_json,
 * timestamp_granularities word and segment) and writes the response to
 * public/narration/<page>.json with "wordsSource": "whisper". The narrator
 * then uses these word times for captions and cue starts instead of the
 * syllable estimate (scripts/estimateWordTimings.mjs leaves such files
 * alone).
 *
 * The key is read from the environment only. It is never printed, logged
 * or written to a file.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const key = process.env.OPENAI_API_KEY;
if (!key) {
  console.error("Set OPENAI_API_KEY in the environment first.");
  process.exit(1);
}

const pages = process.argv.slice(2).length ? process.argv.slice(2) : ["home", "lawyers", "csm"];
for (const page of pages) {
  const audio = path.join(ROOT, "public/narration", `${page}.mp3`);
  if (!existsSync(audio)) {
    console.log(`${page}: no audio, skipped`);
    continue;
  }
  const form = new FormData();
  form.append("file", new Blob([readFileSync(audio)], { type: "audio/mpeg" }), `${page}.mp3`);
  form.append("model", "whisper-1");
  form.append("language", "en");
  form.append("response_format", "verbose_json");
  form.append("timestamp_granularities[]", "word");
  form.append("timestamp_granularities[]", "segment");
  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  if (!res.ok) {
    console.error(`${page}: the API answered ${res.status}`);
    continue;
  }
  const json = await res.json();
  writeFileSync(path.join(ROOT, "public/narration", `${page}.json`), `${JSON.stringify({ ...json, wordsSource: "whisper" }, null, 2)}\n`);
  console.log(`${page}: ${json.words?.length ?? 0} words from Whisper`);
}
