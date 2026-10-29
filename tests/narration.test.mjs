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
  assert.deepEqual(tr.parseTranscript({ nope: true }), { words: [], end: null });
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
  assert.match(content, /start: "Start the experience"/);
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
