// Run: npm test. Landing narrator: the scripts match docs/narration/SCRIPTS.md
// (full ElevenLabs text and cue table) and pass the copy rules, every cue's
// section id is in the page's markup, Whisper transcripts in the three
// common shapes give each cue's start time (in order, one wrong word
// tolerated, missing cues interpolated), the caption-only fallback is timed
// at 150 words a minute plus pause tags, the overlay is offered once per
// session, and a visitor's own scroll pauses the narrator.
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { existsSync, readFileSync } from "node:fs";

register("./tsResolve.mjs", import.meta.url);

const { NARRATION, NARRATION_ROUTES, scriptSeconds } = await import("../src/lib/narration/scripts.ts");
const timing = await import("../src/lib/narration/timing.ts");
const tr = await import("../src/lib/narration/transcript.ts");
const scroll = await import("../src/lib/narration/scroll.ts");
const machine = await import("../src/lib/narration/machine.ts");
const session = await import("../src/lib/narration/session.ts");
const { lintText, lintSource } = await import("../scripts/copyLint.mjs");

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const PAGES = ["home", "lawyers", "csm"];
const ALL = PAGES.flatMap((p) => NARRATION[p].cues.map((c) => ({ page: p, ...c })));

/* ── SCRIPTS.md ──────────────────────────────────────────────── */

const SCRIPTS_MD = read("docs/narration/SCRIPTS.md");

/** Per landing: the ElevenLabs text and the cue table rows. */
function parseScripts(md) {
  const parts = md.split(/^## \d+\. /m).slice(1);
  return parts.map((sec) => {
    const text = sec.split("### ElevenLabs text\n\n")[1].split("\n\n### Cue table")[0].trim();
    const rows = [...sec.split("### Cue table")[1].matchAll(/^\| (\S+) \| (.+?) \| (.+?) \|$/gm)]
      .map((m) => ({ id: m[1], section: m[2], match: m[3] }))
      .filter((r) => r.id !== "Cue" && r.id !== "---");
    const audio = /: (\S+\.mp3)$/m.exec(sec.split("\n")[0])?.[1];
    return { text, rows, audio };
  });
}
const PARSED = Object.fromEntries(parseScripts(SCRIPTS_MD).map((p, i) => [PAGES[i], p]));

test("narration: the repo copy of SCRIPTS.md matches the owner's copy when it is next to the repo", () => {
  const owner = new URL("../../docs/narration/SCRIPTS.md", import.meta.url);
  if (!existsSync(owner)) return;
  assert.equal(SCRIPTS_MD, readFileSync(owner, "utf8"), "copy ../docs/narration/SCRIPTS.md into frontend/docs/narration/ after editing it");
});

test("narration: each landing's script and cue table equal SCRIPTS.md", () => {
  for (const p of PAGES) {
    const n = NARRATION[p];
    const md = PARSED[p];
    assert.equal(n.script, md.text, `${p}: ElevenLabs text`);
    assert.equal(n.audio, `/narration/${md.audio}`, `${p}: audio file`);
    assert.equal(n.transcript, `/narration/${p}.json`);
    assert.deepEqual(n.cues.map((c) => c.id), md.rows.map((r) => r.id), `${p}: cue ids`);
    assert.deepEqual(n.cues.map((c) => c.section), md.rows.map((r) => r.section), `${p}: sections`);
    assert.deepEqual(n.cues.map((c) => c.match), md.rows.map((r) => r.match), `${p}: match words`);
    // The cues' lines, joined by the section [pause], are the whole script.
    assert.equal(n.cues.map((c) => c.read).join("\n[pause]\n"), md.text, `${p}: cues cover the script`);
  }
});

test("narration: captions are the spoken text, tags stripped, and start with the match words", () => {
  for (const c of ALL) {
    assert.equal(c.caption, c.read.replace(/\[[a-z][a-z -]*\]/gi, " ").replace(/\s+/g, " ").trim(), c.id);
    assert.ok(!/[[\]<>]/.test(c.caption), `${c.id}: no tags in the caption`);
    assert.ok(c.caption.startsWith(c.match), `${c.id}: caption starts with "${c.match}"`);
    assert.ok(!/^\d/.test(c.match), `${c.id}: no cue starts with a number`);
  }
  assert.equal(new Set(ALL.map((c) => c.id)).size, ALL.length, "cue ids are unique");
});

test("narration: captions pass the copy rules", () => {
  for (const c of ALL) assert.deepEqual(lintText(c.caption), [], c.id);
  const findings = ["src/components/narration/Narrator.tsx", "src/components/narration/content.ts"].flatMap((f) => lintSource(read(f), f));
  assert.deepEqual(findings, []);
});

test("narration: the homepage cues follow the page order (price before costs)", () => {
  assert.deepEqual(
    NARRATION.home.cues.map((c) => c.id),
    ["home-hero", "home-problem", "home-how", "home-price", "home-costs", "home-includes", "home-situations", "home-countries", "home-final"],
  );
  assert.deepEqual(NARRATION_ROUTES, { home: "/", lawyers: "/attorneys", csm: "/customer-success" });
});

/* ── Anchors ─────────────────────────────────────────────────── */

const PAGE_SOURCES = {
  home: [
    "src/components/HeroCTA.tsx",
    "src/components/landing/HeroStory.tsx",
    "src/components/landing/CostsStory.tsx",
    "src/components/landing/StorySections.tsx",
    "src/components/landing/ProofSections.tsx",
  ],
  lawyers: ["src/components/lawyers/LawyersStory.tsx", "src/components/lawyers/LawyersLanding.tsx"],
  csm: ["src/components/customerSuccess/CsmStory.tsx", "src/components/customerSuccess/CsmLanding.tsx"],
};

test("narration: every cue anchor is a section id on its page", async () => {
  const { HERO, COSTS_HEAD } = await import("../src/components/landing/content.ts");
  const fromContent = { home: new Set([HERO.howAnchor, COSTS_HEAD.anchor]) };
  for (const p of PAGES) {
    const src = PAGE_SOURCES[p].map(read).join("\n");
    for (const c of NARRATION[p].cues) {
      assert.ok(src.includes(`id="${c.anchor}"`) || fromContent[p]?.has(c.anchor), `${c.id}: #${c.anchor} on the ${p} page`);
    }
  }
  assert.ok(read("src/components/landing/HeroStory.tsx").includes(`id={HERO.howAnchor}`));
  assert.ok(read("src/components/landing/CostsStory.tsx").includes(`id={COSTS_HEAD.anchor}`));
  assert.equal(read("src/components/landing/HeroStory.tsx").split(`id="the-problem"`).length - 1, 2, "both layouts");
});

test("narration: each landing mounts the narrator for its page", () => {
  assert.match(read("src/app/page.tsx"), /<Narrator page="home" \/>/);
  assert.match(read("src/app/attorneys/page.tsx"), /<Narrator page="lawyers" \/>/);
  assert.match(read("src/app/customer-success/page.tsx"), /<Narrator page="csm" \/>/);
});

/* ── Caption-only timing ─────────────────────────────────────── */

test("narration timing: 150 words a minute, [short pause] 0.5 s, [pause] 1 s", () => {
  const { estimateSeconds, estimateCueSeconds, wordCount, pauseSeconds, stripTags, WPM } = timing;
  assert.equal(WPM, 150);
  assert.equal(stripTags("[warm] One two, [short pause] three."), "One two, three.");
  assert.equal(wordCount("[matter-of-fact] One two, [short pause] three."), 3);
  assert.equal(pauseSeconds("a [short pause] b [pause] c [warm] d"), 1.5);
  assert.equal(estimateSeconds("word ".repeat(150).trim()), 60);
  assert.equal(estimateCueSeconds("word ".repeat(150).trim(), false), 61, "the section [pause] follows every cue but the last");
  for (const p of PAGES) {
    const cues = NARRATION[p].cues;
    cues.forEach((c, i) => {
      const expected = (wordCount(c.read) / 150) * 60 + pauseSeconds(c.read) + (i < cues.length - 1 ? 1 : 0);
      assert.ok(Math.abs(c.estimate - expected) < 0.01, c.id);
    });
    // The cue lengths add up to the whole script read at the same rate.
    assert.ok(Math.abs(scriptSeconds(p) - estimateSeconds(NARRATION[p].script)) < 0.05, p);
  }
  assert.deepEqual(PAGES.map((p) => timing.minutesOf(scriptSeconds(p))), [1, 1, 1]);
  assert.equal(timing.aboutMinutes(30), "about 1 minute");
  assert.equal(timing.aboutMinutes(200), "about 3 minutes");
});

test("narration timing: cue starts, the cue at a time, progress within a cue", () => {
  const starts = timing.cumulativeStarts([5, 3, 4]);
  assert.deepEqual(starts, [0, 5, 8]);
  assert.equal(timing.cueIndexAt(starts, 0), 0);
  assert.equal(timing.cueIndexAt(starts, 4.99), 0);
  assert.equal(timing.cueIndexAt(starts, 5), 1);
  assert.equal(timing.cueIndexAt(starts, 100), 2);
  assert.equal(timing.cueProgress(starts, 12, 1, 6.5), 0.5);
  assert.equal(timing.cueProgress(starts, 12, 2, 12), 1);
});

/* ── Transcripts ─────────────────────────────────────────────── */

/**
 * A synthetic reading of a landing: each word 0.35 s, a 1 s gap between
 * cues. Returns per-cue segments with word times and the true cue starts.
 */
function reading(page, edit = (words) => words) {
  const segs = [];
  const starts = [];
  let t = 0.2;
  for (const c of NARRATION[page].cues) {
    const words = edit(c.caption.split(" "), c);
    starts.push(Math.round(t * 1000) / 1000);
    const ws = words.map((w) => {
      const item = { word: ` ${w}`, start: Math.round(t * 1000) / 1000, end: Math.round((t + 0.3) * 1000) / 1000 };
      t += 0.35;
      return item;
    });
    segs.push({ start: ws[0].start, end: ws.at(-1).end, text: ` ${words.join(" ")}`, words: ws });
    t += 1;
  }
  return { segs, starts };
}

const weights = (p) => NARRATION[p].cues.map((c) => c.estimate);
const matches = (p) => NARRATION[p].cues.map((c) => c.match);
const close = (a, b, msg) => a.forEach((v, i) => assert.ok(Math.abs(v - b[i]) < 0.011, `${msg} cue ${i}: ${v} vs ${b[i]}`));

test("transcript: openai-whisper CLI JSON (segments with words)", () => {
  for (const p of PAGES) {
    const { segs, starts } = reading(p);
    const json = { text: segs.map((s) => s.text).join(""), segments: segs.map((s, id) => ({ id, ...s })), language: "en" };
    const out = tr.cueStartsFromTranscript(json, matches(p), weights(p));
    close(out.starts, starts, p);
    assert.ok(out.found.every((v) => v !== null), `${p}: every cue found`);
  }
});

test("transcript: OpenAI verbose_json (segment list plus top-level words)", () => {
  const { segs, starts } = reading("home");
  const json = {
    task: "transcribe",
    duration: 60,
    segments: segs.map(({ start, end, text }) => ({ start, end, text })),
    words: segs.flatMap((s) => s.words.map((w) => ({ word: w.word.trim(), start: w.start, end: w.end }))),
  };
  close(tr.cueStartsFromTranscript(json, matches("home"), weights("home")).starts, starts, "verbose_json");
  // Segment granularity only: each cue opens a segment, so its start is the segment start.
  const segOnly = { segments: segs.map(({ start, end, text }) => ({ start, end, text })) };
  close(tr.cueStartsFromTranscript(segOnly, matches("home"), weights("home")).starts, starts, "segments only");
});

test("transcript: whisperX JSON, words without times take the previous time", () => {
  const { segs, starts } = reading("lawyers");
  const json = {
    segments: segs.map((s) => ({
      start: s.start,
      end: s.end,
      text: s.text,
      words: s.words.map((w, i) => (i === 2 ? { word: w.word.trim() } : { word: w.word.trim(), start: w.start, end: w.end, score: 0.9 })),
    })),
    word_segments: [],
  };
  close(tr.cueStartsFromTranscript(json, matches("lawyers"), weights("lawyers")).starts, starts, "whisperX");
});

test("transcript: whisper.cpp -oj -ml 1 (milliseconds, one word per entry)", () => {
  const { segs, starts } = reading("csm");
  const stamp = (s) => {
    const ms = Math.round(s * 1000);
    const pad = (v, n = 2) => String(v).padStart(n, "0");
    return `${pad(Math.floor(ms / 3600000))}:${pad(Math.floor(ms / 60000) % 60)}:${pad(Math.floor(ms / 1000) % 60)},${pad(ms % 1000, 3)}`;
  };
  const transcription = segs.flatMap((s) =>
    s.words.map((w) => ({ timestamps: { from: stamp(w.start), to: stamp(w.end) }, offsets: { from: Math.round(w.start * 1000), to: Math.round(w.end * 1000) }, text: w.word })),
  );
  const json = { systeminfo: "", model: { type: "medium" }, result: { language: "en" }, transcription };
  close(tr.cueStartsFromTranscript(json, matches("csm"), weights("csm")).starts, starts, "whisper.cpp");
  // Only the clock strings: still read.
  const clockOnly = { transcription: transcription.map(({ timestamps, text }) => ({ timestamps, text })) };
  close(tr.cueStartsFromTranscript(clockOnly, matches("csm"), weights("csm")).starts, starts, "whisper.cpp timestamps");
});

test("transcript: one wrong word is tolerated, two are not; missing cues are interpolated", () => {
  // "Living abroad comes with" heard as "Living aboard comes with".
  const misheard = reading("home", (w, c) => (c.id === "home-problem" ? w.map((x) => (x === "abroad" ? "aboard" : x)) : w));
  const out1 = tr.cueStartsFromTranscript({ segments: misheard.segs }, matches("home"), weights("home"));
  close(out1.starts, misheard.starts, "one wrong word");

  // "Start with a free" heard as "Stay with the free": two wrong words, not found.
  const lost = reading("home", (w, c) => (c.id === "home-how" ? ["Stay", "with", "the", ...w.slice(3)] : w));
  const out2 = tr.cueStartsFromTranscript({ segments: lost.segs }, matches("home"), weights("home"));
  const i = NARRATION.home.cues.findIndex((c) => c.id === "home-how");
  assert.equal(out2.found[i], null);
  assert.ok(out2.starts[i] > lost.starts[i - 1] && out2.starts[i] < lost.starts[i + 1], "interpolated between its neighbours");
  close(out2.starts.filter((_, k) => k !== i), lost.starts.filter((_, k) => k !== i), "the others");
});

test("transcript: cue times only increase", () => {
  // Words: B's opening, then A, then B again. A is found at its place; B must come after A.
  const words = tr.normalizeTokens("members arrive with their question. ilp brings you prepared clients. members arrive with their question.").map((token, i) => ({ token, start: i }));
  const found = tr.findCueStarts(words, ["ILP brings you prepared", "Members arrive with their"]);
  assert.deepEqual(found, [5, 10]);
  const reversed = tr.findCueStarts(words.slice(0, 9), ["ILP brings you prepared", "Members arrive with their"]);
  assert.deepEqual(reversed, [5, null], "an opening heard only before the previous cue is not used");
});

test("transcript: normalizing text, numbers and spelled numbers", () => {
  assert.deepEqual(tr.normalizeTokens("Start with a free 2-minute check."), ["start", "with", "a", "free", "two", "minute", "check"]);
  assert.deepEqual(tr.normalizeTokens("US$1,500, isn't it?"), ["us", "one", "thousand", "five", "hundred", "isnt", "it"]);
  assert.deepEqual(tr.normalizeTokens("seventy-nine"), tr.normalizeTokens("79"));
  assert.deepEqual(tr.normalizeTokens("Colombia, Costa Rica, Mexico"), ["colombia", "costa", "rica", "mexico"]);
  assert.equal(tr.numberWords(115), "one hundred fifteen");
  assert.equal(tr.numberWords(20), "twenty");
});

test("transcript: unknown JSON and audio without a transcript share the audio by cue length", () => {
  assert.deepEqual(tr.parseTranscript({ nope: true }), { words: [], segments: [], end: null });
  assert.deepEqual(tr.parseTranscript(null).words, []);
  const w = [2, 1, 1];
  assert.deepEqual(tr.fillCueStarts([0, null, null], w, 40), [0, 20, 30]);
  assert.deepEqual(tr.fillCueStarts([null, null, null], w, null), [0, 2, 3], "no end: own lengths");
  assert.deepEqual(tr.fillCueStarts([0, null, 9], w, 20), [0, 6, 9]);
  const out = tr.cueStartsFromTranscript({}, matches("csm"), weights("csm"), 50);
  assert.equal(out.starts[0], 0);
  assert.ok(out.starts.every((v, i) => i === 0 || v > out.starts[i - 1]));
  assert.ok(out.starts.at(-1) < 50);
});

/* ── Input, state, session ───────────────────────────────────── */

test("narration scroll: what counts as the visitor scrolling", () => {
  const f = scroll.isUserScrollIntent;
  assert.equal(f({ type: "wheel" }), true);
  assert.equal(f({ type: "touchmove" }), true);
  assert.equal(f({ type: "keydown", key: "ArrowDown" }), true);
  assert.equal(f({ type: "keydown", key: " " }), true);
  assert.equal(f({ type: "keydown", key: "Tab" }), false);
  assert.equal(f({ type: "keydown", key: " ", insidePlayer: true }), false, "space on a player button");
  assert.equal(f({ type: "keydown", key: "ArrowDown", editable: true }), false, "typing in a field");
  assert.equal(f({ type: "wheel", insidePlayer: true }), false);
  assert.equal(f({ type: "click" }), false);
});

test("narration machine: time reaches cues, the visitor's scroll pauses, resume keeps the moment", () => {
  const { narratorReducer: r, initialNarratorState: s0 } = machine;
  const n = 5;
  assert.equal(r(s0, { type: "user-scroll" }, n), s0, "nothing to pause before start");
  assert.equal(r(s0, { type: "reach", index: 2 }, n), s0, "time does not move an idle narrator");
  let s = r(s0, { type: "start" }, n);
  assert.deepEqual([s.status, s.index, s.seek], ["playing", 0, 1]);
  s = r(s, { type: "reach", index: 1 }, n);
  assert.deepEqual([s.index, s.seek], [1, 1], "reaching a cue does not seek");
  const scrolled = r(s, { type: "user-scroll" }, n);
  assert.deepEqual([scrolled.status, scrolled.pausedBy], ["paused", "user-scroll"]);
  assert.equal(r(scrolled, { type: "reach", index: 3 }, n), scrolled, "no cue changes while paused");
  const resumed = r(scrolled, { type: "resume" }, n);
  assert.deepEqual([resumed.status, resumed.index, resumed.seek, resumed.pausedBy], ["playing", 1, 1, null], "same cue, same moment");
  assert.equal(r(resumed, { type: "toggle" }, n).pausedBy, "button");
});

test("narration machine: previous and next seek to a cue's start; end and exit", () => {
  const { narratorReducer: r, initialNarratorState: s0 } = machine;
  const n = 3;
  let s = r(s0, { type: "start" }, n);
  s = r(s, { type: "prev" }, n);
  assert.deepEqual([s.index, s.seek], [0, 2], "previous on the first cue restarts it");
  s = r(s, { type: "next" }, n);
  assert.deepEqual([s.index, s.seek], [1, 3]);
  s = r(r(s, { type: "pause" }, n), { type: "next" }, n);
  assert.deepEqual([s.status, s.index], ["playing", 2], "next plays from the next cue");
  assert.equal(r(s, { type: "next" }, n).status, "done", "next on the last cue ends");
  assert.equal(r(s, { type: "end" }, n).status, "done");
  const exited = r(s, { type: "exit" }, n);
  assert.equal(exited.status, "idle");
  assert.equal(r(exited, { type: "start" }, n).index, 0);
  assert.equal(r(s0, { type: "toggle-captions" }, n).captions, false, "captions are on by default");
  assert.equal(r(s0, { type: "toggle-mute" }, n).muted, true);
});

test("narration overlay: offered once per session per landing, storage failures are quiet", () => {
  session.resetOfferMemory();
  const data = new Map();
  const store = { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
  assert.equal(session.offerSeen("home", store), false);
  session.markOfferSeen("home", store);
  assert.equal(data.get("ilp_narration_offer_home"), "1");
  assert.equal(session.offerSeen("home", store), true);
  assert.equal(session.offerSeen("lawyers", store), false, "each landing asks once");
  session.resetOfferMemory();
  assert.equal(session.offerSeen("home", store), true, "read back from sessionStorage");
  session.resetOfferMemory();
  const broken = {
    getItem: () => {
      throw new Error("blocked");
    },
    setItem: () => {
      throw new Error("blocked");
    },
  };
  assert.equal(session.offerSeen("csm", broken), false);
  assert.doesNotThrow(() => session.markOfferSeen("csm", broken));
  assert.equal(session.offerSeen("csm", broken), true, "remembered in memory for this page view");
  session.resetOfferMemory();
});

test("narration overlay and player: dialog semantics, no sound before a click, files", () => {
  const src = read("src/components/narration/Narrator.tsx");
  assert.match(src, /role="dialog"/);
  assert.match(src, /aria-modal="true"/);
  assert.match(src, /e\.key === "Escape"/);
  assert.match(src, /aria-live=\{playing \? "polite" : "off"\}/);
  assert.match(src, /if \(!mounted\) return null;/, "nothing in the server HTML: crawlers read the plain page");
  assert.equal((src.match(/new Audio\(\)/g) ?? []).length, 2, "one playback element plus the metadata probe");
  assert.ok(!/autoplay/i.test(src.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "")), "no autoplay");
  const content = read("src/components/narration/content.ts");
  assert.match(content, /start: "Play the narrated tour"/);
  assert.match(content, /read: "Read the page instead"/);
});

test("narration analytics: click target ids are valid journey targets", async () => {
  const { cleanTarget } = await import("../src/lib/journey/sanitize.ts");
  for (const p of PAGES) {
    for (const id of [`narration.start.${p}`, `narration.read.${p}`, `narration.complete.${p}`]) assert.equal(cleanTarget(id), id);
    for (const c of NARRATION[p].cues) assert.equal(cleanTarget(`narration.exit.${p}.${c.id}`), `narration.exit.${p}.${c.id}`);
  }
});

/* ── Voice wave ──────────────────────────────────────────────── */

const wave = await import("../src/lib/narration/wave.ts");
const graph = await import("../src/lib/narration/audioGraph.ts");

test("wave: bins map to bars over the voice range, log spaced", () => {
  const sr = 48000;
  const edges = wave.bandEdges(wave.WAVE_BARS, sr, wave.FFT_SIZE);
  assert.equal(edges.length, wave.WAVE_BARS + 1);
  const binHz = sr / wave.FFT_SIZE;
  assert.ok(Math.abs(edges[0] * binHz - wave.VOICE_LO) <= binHz, "starts near 80 Hz");
  assert.ok(edges.at(-1) * binHz <= wave.VOICE_HI + binHz * (wave.WAVE_BARS / 2), "ends near the top of the voice range");
  for (let k = 1; k < edges.length; k++) assert.ok(edges[k] > edges[k - 1], "every bar has at least one bin");
  assert.ok(edges.at(-1) <= wave.FFT_SIZE / 2);
  // A 44.1 kHz context with a smaller FFT still gives valid bands.
  const small = wave.bandEdges(24, 44100, 256);
  for (let k = 1; k < small.length; k++) assert.ok(small[k] > small[k - 1] && small[k] <= 128);
});

test("wave: bar heights are normalized 0..1, louder bins give taller bars, the high bands get a lift", () => {
  const edges = wave.bandEdges(wave.WAVE_BARS, 48000, wave.FFT_SIZE);
  const out = new Float32Array(wave.WAVE_BARS);
  wave.mapBars(new Uint8Array(256), edges, out);
  assert.ok(out.every((v) => v === 0), "silence is flat");
  wave.mapBars(new Uint8Array(256).fill(255), edges, out);
  assert.ok(out.every((v) => v === 1), "full scale clamps to 1");
  const mid = new Uint8Array(256).fill(60);
  wave.mapBars(mid, edges, out);
  assert.ok(out.every((v) => v > 0 && v < 1));
  assert.ok(out.at(-1) > out[0], "same energy reads taller in the high bands");
  // Energy only in the bins of bar 10.
  const one = new Uint8Array(256);
  for (let k = edges[10]; k < edges[11]; k++) one[k] = 200;
  wave.mapBars(one, edges, out);
  assert.ok(out[10] > 0.5);
  assert.equal(out[9], 0);
  assert.equal(out[11], 0);
  // Bins above the voice range are ignored.
  const high = new Uint8Array(256);
  high.fill(255, edges.at(-1));
  wave.mapBars(high, edges, out);
  assert.ok(out.every((v) => v === 0));
});

test("wave: easing, settling to the calm line, simulated voice from caption timing", () => {
  const cur = new Float32Array(4).fill(1);
  const flat = new Float32Array(4).fill(wave.FLAT);
  let frames = 0;
  while (wave.easeBars(cur, flat) > wave.SETTLED) frames++;
  assert.ok(frames > 3 && frames < 40, `settles in ${frames} frames`);
  assert.ok(cur.every((v) => Math.abs(v - wave.FLAT) < 0.02));

  const sim = new Float32Array(wave.WAVE_BARS);
  wave.simulatedBars(1.3, 0.8, sim);
  assert.ok(sim.every((v) => v >= 0 && v <= 0.8));
  assert.ok(sim[wave.WAVE_BARS / 2] > sim[0], "taller in the middle");
  wave.simulatedBars(1.3, 0, sim);
  assert.ok(sim.every((v) => v === 0));

  const starts = [0, 6, 13];
  assert.equal(wave.speechLevel(2, starts, 20), 0.8, "speaking");
  assert.equal(wave.speechLevel(5.5, starts, 20), 0.12, "the section pause before the next cue");
  assert.equal(wave.speechLevel(15, starts, 20), 0.8);
  assert.equal(wave.speechLevel(20, starts, 20), 0, "after the end");
  assert.equal(wave.meterLevel([0.2, 0.4]), 0.30000000000000004);
});

test("wave: modes for playing, paused, caption-only and reduced motion", () => {
  assert.equal(wave.waveMode({ playing: true, reduced: false, live: true }), "live");
  assert.equal(wave.waveMode({ playing: true, reduced: false, live: false }), "simulated");
  assert.equal(wave.waveMode({ playing: false, reduced: false, live: true }), "settle");
  assert.equal(wave.waveMode({ playing: true, reduced: true, live: true }), "static");
  assert.equal(wave.waveMode({ playing: false, reduced: true, live: false }), "static");
});

test("wave: the frame loop stops when paused (settled) and when stopped from outside", () => {
  const queue = new Map();
  let next = 1;
  const raf = (cb) => {
    queue.set(next, cb);
    return next++;
  };
  const caf = (id) => queue.delete(id);
  const flush = () => {
    const cbs = [...queue.values()];
    queue.clear();
    cbs.forEach((cb) => cb(0));
  };
  let playing = true;
  const cur = new Float32Array(8).fill(0.9);
  const target = new Float32Array(8);
  let frames = 0;
  const loop = wave.createFrameLoop(() => {
    frames++;
    const mode = wave.waveMode({ playing, reduced: false, live: false });
    if (mode === "settle") wave.fillBars(target, wave.FLAT);
    else wave.simulatedBars(frames / 60, 0.8, target);
    const change = wave.easeBars(cur, target);
    return mode !== "settle" || change > wave.SETTLED;
  }, raf, caf);
  loop.start();
  for (let i = 0; i < 30; i++) flush();
  assert.ok(loop.running, "keeps running while playing");
  assert.equal(frames, 30);
  playing = false;
  for (let i = 0; i < 200 && queue.size; i++) flush();
  assert.equal(loop.running, false, "stops once the wave has settled");
  assert.equal(queue.size, 0, "no frame left queued");
  const settledAt = frames;
  flush();
  assert.equal(frames, settledAt);
  playing = true;
  loop.start();
  flush();
  loop.stop();
  assert.equal(queue.size, 0, "stop (tab hidden) cancels the queued frame");
  assert.equal(loop.running, false);
});

test("wave: the AudioContext is created only by the click on Start, once per element", () => {
  let made = 0;
  const calls = [];
  class FakeCtx {
    constructor() {
      made++;
      this.state = "suspended";
      this.destination = { name: "out" };
    }
    createMediaElementSource(el) {
      calls.push("source");
      return { connect: (n) => calls.push(`source->${n.name}`) };
    }
    createAnalyser() {
      return { name: "analyser", connect: (n) => calls.push(`analyser->${n.name}`) };
    }
    resume() {
      calls.push("resume");
      this.state = "running";
      return Promise.resolve();
    }
  }
  const el = {};
  assert.equal(made, 0);
  const g = graph.voiceGraph(el, FakeCtx);
  assert.equal(made, 1);
  assert.equal(g.analyser.fftSize, wave.FFT_SIZE);
  assert.equal(g.analyser.smoothingTimeConstant, wave.SMOOTHING);
  assert.deepEqual(calls, ["source", "source->analyser", "analyser->out"]);
  assert.equal(graph.voiceGraph(el, FakeCtx), g, "one graph per audio element");
  assert.equal(made, 1);
  graph.resumeGraph(g);
  assert.ok(calls.includes("resume"));
  assert.equal(graph.voiceGraph({}, null), null, "no Web Audio: the audio plays on its own");
  class Broken {
    createMediaElementSource() {
      throw new Error("no");
    }
  }
  assert.equal(graph.voiceGraph({}, Broken), null);

  // In the narrator, the graph is made only inside begin(), the Start and "Play narration" click handler.
  const src = read("src/components/narration/Narrator.tsx");
  const uses = [...src.matchAll(/voiceGraph\(/g)].map((m) => m.index);
  assert.equal(uses.length, 1);
  const beginAt = src.indexOf("const begin = () => {");
  const beginEnd = src.indexOf("const start = () => {");
  assert.ok(uses[0] > beginAt && uses[0] < beginEnd, "created in the click handler");
  assert.ok(!/new (?:window\.)?(?:webkit)?AudioContext/.test(src), "no AudioContext anywhere else in the narrator");
});

test("wave: the control is a labelled toggle button, and pinned stories leave room for the bar", () => {
  const w = read("src/components/narration/VoiceWave.tsx");
  assert.match(w, /<button ref=\{ref\} type="button"/);
  assert.match(w, /aria-label=\{label\}/);
  assert.match(w, /aria-pressed=\{playing\}/);
  assert.match(w, /<canvas ref=\{canvasRef\} className=\{s\.waveCanvas\} aria-hidden="true" \/>/);
  assert.match(w, /devicePixelRatio/);
  assert.match(w, /visibilitychange/);
  assert.match(w, /setInterval\(meter, 250\)/, "reduced motion: a meter at most every 250 ms");
  assert.ok(!/new (?:Float32Array|Uint8Array)\(/.test(w.slice(w.indexOf("const frame = () =>"), w.indexOf("const loop ="))), "no allocation per frame");
  const n = read("src/components/narration/Narrator.tsx");
  assert.match(n, /label=\{playing \? C\.pause : C\.play\}/);
  const content = read("src/components/narration/content.ts");
  assert.match(content, /play: "Play narration"/);
  assert.match(content, /pause: "Pause narration"/);
  const scss = read("src/components/narration/Narrator.module.scss");
  assert.ok(!/blur|box-shadow|glow/.test(scss.replace(/\/\/.*$/gm, "")), "flat");
  assert.match(scss, /\.wave \{[\s\S]*?color: \$color-accent;/);
  for (const f of ["src/components/motion/BeatStory.module.scss", "src/components/landing/CostsStory.module.scss", "src/components/motion/Motion.module.scss"]) {
    assert.match(read(f), /var\(--narrator-reserve, 0px\)/, f);
  }
  assert.match(n, /--narrator-reserve/);
});

/* ── Scroll follows the voice ────────────────────────────────── */

const follow = await import("../src/lib/narration/follow.ts");

test("follow: a section's range is its height minus the visible area above the bar, clamped", () => {
  const view = { height: 800, reserve: 60, docHeight: 10000 };
  // Tall section: ends where its bottom meets the top of the bar.
  assert.deepEqual(follow.sectionRange({ top: 2000, height: 3000 }, view), { topY: 2000, endY: 2000 + 3000 - 740 });
  // Short section: no range, top-aligned.
  assert.deepEqual(follow.sectionRange({ top: 1000, height: 500 }, view), { topY: 1000, endY: 1000 });
  // Exactly one visible area tall: no range.
  assert.deepEqual(follow.sectionRange({ top: 1000, height: 740 }, view), { topY: 1000, endY: 1000 });
  // Near the end of the document: both clamp to the largest scroll.
  assert.deepEqual(follow.sectionRange({ top: 9600, height: 900 }, view), { topY: 9200, endY: 9200 });
  assert.deepEqual(follow.sectionRange({ top: 8000, height: 3000 }, view), { topY: 8000, endY: 9200 });
  // Above the top: clamps to 0.
  assert.deepEqual(follow.sectionRange({ top: -20, height: 400 }, view), { topY: 0, endY: 0 });
  assert.equal(follow.maxScroll({ height: 900, reserve: 0, docHeight: 500 }), 0);
});

test("follow: time windows use the transcript's segment end, else the next start minus a tail; the last ends before the audio", () => {
  const w = follow.createWindows(3);
  follow.fillWindows(w, [0, 6, 13], [5.2, 13, null], 20);
  assert.deepEqual([...w.tStart], [0, 6, 13]);
  assert.equal(w.tEnd[0], 5.2, "segment end before the next cue");
  assert.equal(w.tEnd[1], 13 - follow.SPEECH_TAIL_S, "segment end equal to the next start: tail");
  assert.equal(w.tEnd[2], 20 - follow.LAST_TAIL_S, "last cue");
  // Moves between cues: the pause when shorter than 0.5 s, never under 0.25 s.
  assert.equal(w.tMove[0], 0);
  assert.ok(Math.abs(w.tMove[1] - (6 - 0.5)) < 1e-9, "0.8 s pause: a 0.5 s move");
  assert.ok(Math.abs(w.tMove[2] - (13 - follow.SPEECH_TAIL_S)) < 1e-9, "0.35 s pause: the whole pause");
  follow.fillWindows(w, [0, 6, 13], null, 20);
  assert.ok(Math.abs(w.tEnd[0] - 5.65) < 1e-9);
  // No pause at all: a 0.25 s move that starts just before the cue.
  follow.fillWindows(w, [0, 6, 13], [6, 13, 19.9], 20);
  assert.ok(Math.abs(w.tEnd[0] - 5.65) < 1e-9);
  const ends = follow.speechEnds([{ start: 0, end: 4 }, { start: 4.1, end: 5.5 }, { start: 6, end: 12 }], [0, 6]);
  assert.deepEqual(ends, [5.5, 12]);
});

/** A page: hero (short), a tall pinned story, a short block, a gap of other sections, a tall section. */
function fixture(viewport = { height: 800, reserve: 60, docHeight: 12000 }) {
  const boxes = [
    { top: 0, height: 800 },
    { top: 800, height: 3200 },
    { top: 4000, height: 700 },
    { top: 6500, height: 2600 },
  ];
  const r = follow.createRanges(boxes.length);
  boxes.forEach((b, i) => {
    const g = follow.sectionRange(b, viewport);
    r.topY[i] = g.topY;
    r.endY[i] = g.endY;
  });
  const w = follow.fillWindows(follow.createWindows(4), [0, 4, 12, 16], [3.2, 11.5, 15, null], 24);
  return { r, w, boxes };
}

test("follow: the page is at a section's top when its narration starts and at its end when it ends", () => {
  const { r, w } = fixture();
  for (let i = 0; i < 4; i++) {
    assert.equal(follow.followY(r, w, w.tStart[i]), r.topY[i], `cue ${i} starts at the top`);
    assert.ok(Math.abs(follow.followY(r, w, w.tEnd[i]) - r.endY[i]) < 1e-6, `cue ${i} ends at the bottom`);
  }
  // Halfway through the tall story: halfway down its range (sine ease is symmetric).
  const mid = (w.tStart[1] + w.tEnd[1]) / 2;
  assert.ok(Math.abs(follow.followY(r, w, mid) - (r.topY[1] + r.endY[1]) / 2) < 1e-6);
  // Monotonic inside a cue.
  let prev = -1;
  for (let t = w.tStart[1]; t <= w.tEnd[1]; t += 0.1) {
    const y = follow.followY(r, w, t);
    assert.ok(y >= prev - 1e-9);
    prev = y;
  }
  assert.equal(follow.followY(r, w, 0), 0);
  assert.equal(follow.easeInOutSine(0), 0);
  assert.equal(follow.easeInOutSine(1), 1);
});

test("follow: frame to frame the page never jumps, including across skipped sections", () => {
  const { r, w } = fixture();
  let prev = follow.followY(r, w, 0);
  let maxStep = 0;
  for (let t = 0; t <= 24; t += 1 / 60) {
    const y = follow.followY(r, w, t);
    maxStep = Math.max(maxStep, Math.abs(y - prev));
    prev = y;
  }
  // The longest move: from the short block (4000) over 1800 px of other sections to 6500 in 0.5 s.
  // easeInOutSine peaks at pi/2 times the average speed: 2500 / 0.5 / 60 * pi / 2 = 131 px a frame.
  assert.ok(maxStep < 140, `largest step ${maxStep.toFixed(1)} px`);
  // Reduced motion: tops only, a jump at each cue start.
  assert.equal(follow.jumpY(r, w, 5), r.topY[1]);
  assert.equal(follow.jumpY(r, w, 3.9), r.topY[0]);
});

test("follow: resume and seek ease from where the page is to where the time says", () => {
  assert.equal(follow.resyncY(5000, 1000, 0), 5000);
  assert.equal(follow.resyncY(5000, 1000, follow.RESYNC_S), 1000);
  let prev = 5000;
  for (let e = 0; e <= follow.RESYNC_S; e += 1 / 60) {
    const y = follow.resyncY(5000, 1000, e);
    assert.ok(Math.abs(y - prev) < 4000 / (follow.RESYNC_S * 60) * 1.6 + 1);
    prev = y;
  }
});

test("follow: after a resize the page keeps the same progress through the section", () => {
  const wide = fixture({ height: 900, reserve: 53, docHeight: 12000 });
  const phone = { height: 760, reserve: 120, docHeight: 15000 };
  // On a phone the stacked layout makes the story taller and further down.
  const boxes = [
    { top: 0, height: 760 },
    { top: 760, height: 4100 },
    { top: 4860, height: 900 },
    { top: 8000, height: 3400 },
  ];
  const r = follow.createRanges(4);
  boxes.forEach((b, i) => {
    const g = follow.sectionRange(b, phone);
    r.topY[i] = g.topY;
    r.endY[i] = g.endY;
  });
  const t = 7;
  const p = follow.cueProgressAt(wide.w, 1, t);
  const before = follow.followY(wide.r, wide.w, t);
  const after = follow.followY(r, wide.w, t);
  const share = (y, rr) => (y - rr.topY[1]) / (rr.endY[1] - rr.topY[1]);
  assert.ok(Math.abs(share(before, wide.r) - share(after, r)) < 1e-9, "same share of the range");
  assert.ok(Math.abs(share(after, r) - follow.easeInOutSine(p)) < 1e-9);
});

test("follow: the narrator drives scroll every frame from the time, not from timeupdate", () => {
  const n = read("src/components/narration/Narrator.tsx");
  assert.match(n, /if \(!reduce && stateRef\.current\.status === "playing"\) drive\(\);/);
  assert.match(n, /followY\(rangesRef\.current, winRef\.current, time\(\)\)/);
  assert.match(n, /scrollPageTo\(y, false\)/, "immediate scroll through Lenis");
  assert.match(n, /visualViewport/);
  assert.match(n, /orientationchange/);
  assert.match(n, /new ResizeObserver\(dirty\)/);
  const drive = n.slice(n.indexOf("const drive = () =>"), n.indexOf("/* ── Follow the time"));
  assert.ok(!/new |\[\]|\{\s*\}/.test(drive.replace(/rs\.active = false/, "")), "no allocation per frame");
});

/* ── Word-by-word captions ───────────────────────────────────── */

const wt = await import("../src/lib/narration/wordTiming.ts");

test("word timing: English syllable counts", () => {
  const cases = {
    ILP: 3,
    CSM: 3,
    "seventy-nine": 4,
    "two-minute": 3,
    retainer: 3,
    Colombia: 4,
    Panama: 3,
    Mexico: 3,
    Portugal: 3,
    the: 1,
    table: 2,
    needed: 2,
    boxes: 2,
    places: 2,
    licensed: 2,
    countries: 2,
    lawyer: 2,
    reminder: 3,
    residency: 4,
    "follow-up": 3,
    hundred: 2,
    ninety: 2,
  };
  for (const [word, n] of Object.entries(cases)) assert.equal(wt.syllables(word), n, word);
  assert.ok([2, 3].includes(wt.syllables("every")));
  assert.equal(wt.syllables("ILP,"), 3, "punctuation does not count");
  assert.equal(wt.syllables("US$79.99"), wt.syllables("seventy-nine dollars and ninety-nine cents"), "prices read as words");
  assert.equal(wt.syllables("1,500"), wt.syllables("one thousand five hundred"));
  assert.equal(wt.spokenNumbers("US$100"), "one hundred dollars");
});

test("word timing: a window is shared by syllables and pauses, ends on time, never goes back", () => {
  const read = "[calm] Living abroad comes with legal dates written in another language, [short pause] and nobody sends you a reminder.";
  const words = wt.estimateWords(read, 6, 12.65);
  assert.equal(words.length, 16);
  assert.equal(words[0].word, "Living");
  assert.equal(words[0].start, 6 + wt.LEAD_IN, "a short lead-in");
  assert.equal(words.at(-1).end, 12.65, "the last word ends with the window");
  for (let k = 0; k < words.length; k++) {
    assert.ok(words[k].end > words[k].start, `${words[k].word} has a length`);
    if (k) assert.ok(words[k].start >= words[k - 1].end - 1e-9, "monotonic");
  }
  // The comma plus [short pause] after "language," leaves a gap of 0.75 s.
  const i = words.findIndex((w) => w.word === "language,");
  assert.ok(Math.abs(words[i + 1].start - words[i].end - 0.75) < 0.002);
  // Speaking time plus pauses plus lead-in fill the window.
  const speak = words.reduce((s, w) => s + (w.end - w.start), 0);
  const gaps = words.slice(1).reduce((s, w, k) => s + (w.start - words[k].end), 0);
  assert.ok(Math.abs(speak + gaps + wt.LEAD_IN - 6.65) < 0.01);
  // Longer words take longer.
  const len = (w) => words.find((x) => x.word === w);
  assert.ok(len("reminder.").end - len("reminder.").start > len("you").end - len("you").start);
  // Pauses are capped in a short window.
  const tight = wt.estimateWords("One, two, three, four.", 0, 1);
  assert.equal(tight.at(-1).end, 1);
  assert.ok(tight.every((w) => w.end > w.start));
  assert.deepEqual(wt.estimateWords("", 0, 1), []);
});

test("word timing: lines, revealed words and alignment with transcript words", () => {
  const words = wt.captionWords("Living abroad comes with legal dates written in another language, and nobody sends you a reminder.");
  const lines = wt.lineStarts(words);
  assert.deepEqual(lines, [0, 10], "breaks after the comma");
  assert.ok(wt.lineStarts(wt.captionWords("a b c d e f g h i j k l m n o p")).every((s, i, a) => !i || s - a[i - 1] <= 12));
  const starts = new Float64Array([1, 1.4, 1.9, 2.5]);
  assert.equal(wt.revealedCount(starts, 0.5), 0);
  assert.equal(wt.revealedCount(starts, 1), 1, "a word shows at its start time");
  assert.equal(wt.revealedCount(starts, 2.0), 3);
  assert.equal(wt.revealedCount(starts, 9), 4);
  assert.equal(wt.lineOf([0, 10], 9), 0);
  assert.equal(wt.lineOf([0, 10], 10), 1);

  const read = "[warm] ILP brings you prepared clients and handles the follow-up after each call.";
  const cw = wt.captionWords("ILP brings you prepared clients and handles the follow-up after each call.");
  // Real word times (as Whisper would give: "follow-up" is two tokens) win over the estimate.
  const timed = [];
  const firstAt = [];
  cw.forEach((w) => {
    firstAt.push(0.3 + timed.length * 0.3);
    for (const token of tr.normalizeTokens(w)) timed.push({ token, start: 0.3 + timed.length * 0.3 });
  });
  const aligned = wt.alignCueWords(read, cw, 0, 4.65, timed);
  cw.forEach((w, k) => assert.ok(Math.abs(aligned[k] - firstAt[k]) < 1e-9, w));
  // A misheard word keeps the estimate, and times still never go backwards.
  const misheard = timed.map((t, k) => (k === 3 ? { token: "repaired", start: t.start } : t));
  const a2 = wt.alignCueWords(read, cw, 0, 4.65, misheard);
  for (let k = 1; k < a2.length; k++) assert.ok(a2[k] >= a2[k - 1]);
  // No transcript words: the estimate.
  const est = wt.estimateWords(read, 0, 4.65);
  const a3 = wt.alignCueWords(read, cw, 0, 4.65, null);
  cw.forEach((_, k) => assert.equal(a3[k], est[k].start));
});

test("word timing: the JSON words cover every cue, in order, and read as the captions", async () => {
  const { withEstimatedWords, ESTIMATED } = await import("../scripts/estimateWordTimings.mjs");
  for (const p of PAGES) {
    const file = new URL(`../public/narration/${p}.json`, import.meta.url);
    if (!existsSync(file)) continue;
    const json = JSON.parse(readFileSync(file, "utf8"));
    if (json.wordsSource !== ESTIMATED) continue; // real Whisper words: not ours to check
    const words = json.words;
    const captions = NARRATION[p].cues.map((c) => c.caption).join(" ");
    assert.equal(words.map((w) => w.word).join(" "), captions, `${p}: words are the captions`);
    for (let k = 1; k < words.length; k++) assert.ok(words[k].start >= words[k - 1].end - 1e-9, `${p}: monotonic at ${k}`);
    assert.ok(words.at(-1).end <= json.duration);
    // Every cue's first word starts at its segment's start plus the lead-in.
    const { found } = tr.cueStartsFromTranscript(json, NARRATION[p].cues.map((c) => c.match), NARRATION[p].cues.map((c) => c.estimate), json.duration);
    found.forEach((t, i) => assert.ok(Math.abs(t - (json.segments[i].start + wt.LEAD_IN)) < 0.002, `${p} cue ${i}`));
    // The file is what the script writes today.
    assert.deepEqual(withEstimatedWords({ ...json, words: undefined }, NARRATION[p]).words, words, `${p}: run scripts/estimateWordTimings.mjs`);
  }
});

test("word timing: the caption line is visual only; screen readers get the whole cue once", () => {
  const n = read("src/components/narration/Narrator.tsx");
  assert.match(n, /<p key=\{`live-\$\{cue\.id\}`\} className=\{s\.liveText\} aria-live=\{playing \? "polite" : "off"\}>\s*\{state\.captions \? cue\.caption : ""\}/);
  assert.match(n, /className=\{idle \? `\$\{s\.caption\} \$\{s\.captionIdle\}` : s\.caption\} aria-hidden="true"/);
  assert.equal((n.match(/aria-live=/g) ?? []).length, 1, "one live region");
  assert.match(n, /revealedCount\(starts, time\)/, "binary search over word times");
  const scss = read("src/components/narration/Narrator.module.scss");
  assert.match(scss, /@include reduced-motion \{\s*\.word \{\s*transform: none;/);
  assert.match(read("scripts/whisperWords.mjs"), /process\.env\.OPENAI_API_KEY/);
  assert.ok(!/console\.(log|error)\([^)]*key\b/.test(read("scripts/whisperWords.mjs")), "the key is never printed");
});

/* ── Overlay play button and isotype ─────────────────────────── */

test("overlay: a round play button with the isotype, labelled with what happens", async () => {
  const n = read("src/components/narration/Narrator.tsx");
  assert.match(n, /<button ref=\{startRef\} type="button" className=\{s\.start\} aria-label=\{C\.startLabel\(about, !timedNote\)\} onClick=\{start\}>\s*<Isotype size=\{46\} animated \/>/);
  assert.match(n, /if \(offer\) startRef\.current\?\.focus\(\)/, "focus lands on the play button");
  assert.match(n, /<Isotype size=\{24\} \/>/, "the small Play narration button uses the same glyph");
  const iso = read("src/components/narration/Isotype.tsx");
  assert.match(iso, /aria-hidden="true"/);
  assert.match(iso, /focusable="false"/);
  assert.match(iso, /stroke="currentColor"/);
  const { NARRATOR_COPY: C } = await import("../src/components/narration/content.ts");
  assert.equal(C.startLabel("about 1 minute", true), "Play the narrated tour of this page, about 1 minute, with sound");
  assert.equal(C.withSound("about 2 minutes"), "About 2 minutes, with sound.");
  for (const text of [C.start, C.read, C.withSound("about 1 minute"), C.withCaptions("about 1 minute"), C.startLabel("about 1 minute", true), C.startLabel("about 1 minute", false)]) {
    assert.deepEqual(lintText(text), [], text);
  }
});

test("overlay: the isotype loop stops with reduced motion; motion is transform and opacity only", () => {
  const scss = read("src/components/narration/Narrator.module.scss");
  assert.match(scss, /@include reduced-motion \{\s*\.isoAnimated \{\s*\.isoArc1,\s*\.isoArc2,\s*\.isoChevron \{\s*animation: none;/);
  const keyframes = [...scss.matchAll(/@keyframes [\w-]+ \{([\s\S]*?)\n\}/g)].map((m) => m[1]);
  assert.ok(keyframes.length >= 3);
  for (const k of keyframes) {
    const props = [...k.matchAll(/^\s*([a-z-]+):/gm)].map((m) => m[1]);
    assert.ok(props.every((p) => p === "opacity" || p === "transform"), props.join(","));
  }
  assert.match(scss, /\.start \{[\s\S]*?width: 112px;[\s\S]*?border: 1px solid \$color-accent;[\s\S]*?border-radius: 50%;/);
  assert.match(scss, /width: 96px;/, "phone size");
  assert.match(scss, /outline-offset: 4px;/, "offset focus ring");
  assert.match(scss, /\$narrator-leave: 280ms;/);
  assert.match(read("src/components/narration/Narrator.tsx"), /const LEAVE_MS = 280;/);
});
