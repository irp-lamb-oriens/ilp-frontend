// The recorded narration files in public/narration resolve every cue, in order.
import { register } from "node:module";
register("./tsResolve.mjs", import.meta.url);
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const { cueStartsFromTranscript } = await import("../src/lib/narration/transcript.ts");
const scripts = await import("../src/lib/narration/scripts.ts");

const pages = Object.values(scripts).find((v) => v && typeof v === "object" && ("home" in v || "lawyers" in v));

for (const name of ["home", "lawyers", "csm"]) {
  test(`narration assets: ${name} transcript finds every cue`, { skip: !existsSync(`public/narration/${name}.json`) }, () => {
    const json = JSON.parse(readFileSync(`public/narration/${name}.json`, "utf8"));
    const page = pages?.[name];
    assert.ok(page, `no script for ${name}`);
    const matches = page.cues.map((c) => c.match);
    const weights = page.cues.map((c) => c.caption.length);
    const { found } = cueStartsFromTranscript(json, matches, weights, json.duration ?? null);
    assert.ok(found.every((t) => t !== null), `unresolved cues: ${found}`);
    for (let i = 1; i < found.length; i++) assert.ok(found[i] > found[i - 1]);
    assert.ok(existsSync(`public/narration/${name}.mp3`));
  });
}
