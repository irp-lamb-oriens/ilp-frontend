// Run: npm test. Landing narrator: the cues match docs/narration/SCRIPTS.md
// word for word and pass the copy rules, every cue's section id is in the
// page's markup, the timed fallback (no audio yet) lasts as long as reading
// the script at 150 words a minute, the overlay is offered once per session,
// and a visitor's own scroll pauses the narrator (pure state machine).
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { existsSync, readFileSync } from "node:fs";

register("./tsResolve.mjs", import.meta.url);

const { NARRATION, NARRATION_ROUTES, cueUrl, scriptSeconds } = await import("../src/lib/narration/scripts.ts");
const timing = await import("../src/lib/narration/timing.ts");
const scroll = await import("../src/lib/narration/scroll.ts");
const machine = await import("../src/lib/narration/machine.ts");
const session = await import("../src/lib/narration/session.ts");
const { lintText, lintSource } = await import("../scripts/copyLint.mjs");

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const PAGES = ["home", "lawyers", "csm"];

/** Blocks of SCRIPTS.md: { file, section, read }. */
function parseScripts(md) {
  return [...md.matchAll(/### (\S+\.mp3)\nSection: (.+?)\n\nRead:\n(.+?)\n(?=\n|$)/gs)].map((m) => ({ file: m[1], section: m[2], read: m[3] }));
}

const SCRIPTS_MD = read("docs/narration/SCRIPTS.md");
const BLOCKS = parseScripts(SCRIPTS_MD);
const ALL = PAGES.flatMap((p) => NARRATION[p].map((c) => ({ page: p, ...c })));

test("narration: the repo copy of SCRIPTS.md matches the owner's copy when it is next to the repo", () => {
  const owner = new URL("../../docs/narration/SCRIPTS.md", import.meta.url);
  if (!existsSync(owner)) return;
  assert.equal(SCRIPTS_MD, readFileSync(owner, "utf8"), "copy ../docs/narration/SCRIPTS.md into frontend/docs/narration/ after editing it");
});

test("narration: every SCRIPTS.md block is one cue, read text and captions word for word", () => {
  assert.equal(BLOCKS.length, 19);
  assert.equal(ALL.length, BLOCKS.length, "one cue per block");
  for (const b of BLOCKS) {
    const c = ALL.find((x) => x.file === b.file);
    assert.ok(c, `${b.file} has a cue`);
    assert.equal(c.read, b.read, `${b.file}: read text`);
    assert.equal(c.section, b.section, `${b.file}: section`);
    const caption = b.read.replace(/<break time="[^"]+" \/>/g, " ").replace(/\s+/g, " ").trim();
    assert.equal(c.text, caption, `${b.file}: caption is the read text without break tags`);
    assert.ok(!/[<>]/.test(c.text), `${b.file}: no tags left in the caption`);
    assert.equal(c.id, b.file.replace(/\.mp3$/, ""));
    assert.ok(c.file.startsWith(c.page === "csm" ? "csm-" : `${c.page}-`), `${b.file} belongs to ${c.page}`);
  }
  assert.equal(new Set(ALL.map((c) => c.id)).size, ALL.length, "cue ids are unique");
});

test("narration: captions pass the copy rules", () => {
  for (const c of ALL) assert.deepEqual(lintText(c.text), [], c.id);
  const findings = ["src/components/narration/Narrator.tsx", "src/components/narration/content.ts"].flatMap((f) => lintSource(read(f), f));
  assert.deepEqual(findings, []);
});

test("narration: the homepage plays top to bottom; numbered files elsewhere play in order", () => {
  assert.deepEqual(
    NARRATION.home.map((c) => c.id),
    ["home-01-hero", "home-02-problem", "home-03-how", "home-05-price", "home-04-costs", "home-06-includes", "home-07-situations", "home-08-countries", "home-09-final"],
  );
  for (const p of ["lawyers", "csm"]) {
    const ids = NARRATION[p].map((c) => c.id);
    assert.deepEqual(ids, [...ids].sort());
  }
  assert.equal(cueUrl("home", NARRATION.home[0]), "/narration/home/home-01-hero.mp3");
  assert.deepEqual(NARRATION_ROUTES, { home: "/", lawyers: "/attorneys", csm: "/customer-success" });
});

/* Section ids: each cue's anchor is set in the components its page renders. */
const PAGE_SOURCES = {
  home: [
    "src/components/HeroCTA.tsx",
    "src/components/landing/HeroStory.tsx",
    "src/components/landing/CostsStory.tsx",
    "src/components/landing/StorySections.tsx",
    "src/components/landing/ProofSections.tsx",
    "src/components/landing/content.ts",
  ],
  lawyers: ["src/components/lawyers/LawyersStory.tsx", "src/components/lawyers/LawyersLanding.tsx"],
  csm: ["src/components/customerSuccess/CsmStory.tsx", "src/components/customerSuccess/CsmLanding.tsx"],
};

test("narration: every cue anchor is a section id on its page", async () => {
  const { HERO, COSTS_HEAD } = await import("../src/components/landing/content.ts");
  // Ids that come from content constants rather than literal id="..." attributes.
  const fromContent = { home: new Set([HERO.howAnchor, COSTS_HEAD.anchor]) };
  for (const p of PAGES) {
    const src = PAGE_SOURCES[p].map(read).join("\n");
    for (const c of NARRATION[p]) {
      const literal = src.includes(`id="${c.anchor}"`);
      assert.ok(literal || fromContent[p]?.has(c.anchor), `${c.id}: #${c.anchor} on the ${p} page`);
    }
  }
  assert.ok(read("src/components/landing/HeroStory.tsx").includes(`id={HERO.howAnchor}`));
  assert.ok(read("src/components/landing/CostsStory.tsx").includes(`id={COSTS_HEAD.anchor}`));
  assert.ok(read("src/components/lawyers/LawyersStory.tsx").includes(`id="why-lawyers-join"`));
  // The problem section has its id in both layouts (pinned and stacked).
  assert.equal(read("src/components/landing/HeroStory.tsx").split(`id="the-problem"`).length - 1, 2);
});

test("narration: each landing mounts the narrator for its page", () => {
  assert.match(read("src/app/page.tsx"), /<Narrator page="home" \/>/);
  assert.match(read("src/app/attorneys/page.tsx"), /<Narrator page="lawyers" \/>/);
  assert.match(read("src/app/customer-success/page.tsx"), /<Narrator page="csm" \/>/);
});

test("narration: pinned stories scroll through, the rest jump", () => {
  const through = ALL.filter((c) => c.scroll === "through").map((c) => c.anchor);
  assert.deepEqual(through, [
    "the-problem",
    "how-it-works",
    "costs",
    "what-the-membership-includes",
    "real-situations",
    "why-lawyers-join",
    "how-it-works-for-lawyers",
    "why-the-role-matters",
    "how-your-day-works",
  ]);
  for (const c of ALL) if (c.scroll === "through") assert.equal(typeof c.startAt, "number", c.id);
});

test("narration timing: the fallback reads at 150 words a minute plus pauses", () => {
  const { estimateSeconds, wordCount, breakSeconds, stripBreaks, CUE_PAD, WPM } = timing;
  assert.equal(WPM, 150);
  assert.equal(stripBreaks('One two. <break time="0.4s" /> Three.'), "One two. Three.");
  assert.equal(wordCount('One two. <break time="0.4s" /> Three.'), 3);
  assert.equal(breakSeconds('a <break time="0.4s" /> b <break time="500ms" /> c'), 0.9);
  assert.equal(estimateSeconds("word ".repeat(150).trim()), 60 + CUE_PAD);
  for (const c of ALL) {
    const expected = (wordCount(c.read) / 150) * 60 + breakSeconds(c.read) + CUE_PAD;
    assert.ok(Math.abs(c.estimate - expected) < 0.06, c.id);
    assert.ok(c.estimate > 3 && c.estimate < 15, `${c.id}: ${c.estimate}s`);
  }
  // Short pitches: one or two sentences a clip, about a minute a page.
  for (const c of ALL) assert.ok(timing.captionSegments(c.read).length <= 2, `${c.id}: one or two sentences`);
  assert.deepEqual(PAGES.map((p) => timing.minutesOf(scriptSeconds(p))), [1, 1, 1]);
  assert.equal(timing.aboutMinutes(30), "about 1 minute");
  assert.equal(timing.aboutMinutes(200), "about 3 minutes");
});

test("narration timing: caption lines cover the cue in order and rejoin into the text", () => {
  for (const c of ALL) {
    const segs = timing.captionSegments(c.read);
    assert.equal(segs.map((s) => s.text).join(" "), c.text, c.id);
    assert.equal(segs[0].start, 0);
    assert.equal(segs.at(-1).end, 1);
    for (let i = 1; i < segs.length; i++) assert.ok(segs[i].start >= segs[i - 1].start && Math.abs(segs[i].start - segs[i - 1].end) < 1e-9);
    assert.equal(timing.captionIndexAt(segs, 0), 0);
    assert.equal(timing.captionIndexAt(segs, 1), segs.length - 1);
  }
  // A pause holds the sentence before it on screen a little longer.
  const segs = timing.captionSegments('One two three. <break time="2s" /> Four five six.');
  assert.ok(segs[0].end > 0.5);
});

test("narration scroll: through range and drive", () => {
  const range = scroll.throughRange({ top: 2000, height: 3000, viewport: 800, startAt: 0.35 });
  assert.deepEqual(range, { from: 1720, to: 4200 });
  assert.deepEqual(scroll.throughRange({ top: 100, height: 400, viewport: 800 }), { from: 100, to: 100 }, "a short section does not scroll back");
  const d = 20;
  assert.equal(scroll.throughY(range, 0, d), range.from);
  assert.equal(scroll.throughY(range, scroll.DRIVE_SETTLE_S, d), range.from);
  assert.equal(scroll.throughY(range, d * (1 - scroll.DRIVE_HOLD), d), range.to);
  assert.equal(scroll.throughY(range, d, d), range.to, "holds on the last beat while the voice finishes");
  let prev = -1;
  for (let t = 0; t <= d; t += 0.25) {
    const y = scroll.throughY(range, t, d);
    assert.ok(y >= prev, `monotonic at ${t}`);
    prev = y;
  }
  assert.ok(Math.abs(scroll.driveEase(0.5) - 0.5) < 1e-9);
});

test("narration scroll: what counts as the visitor scrolling", () => {
  const f = scroll.isUserScrollIntent;
  assert.equal(f({ type: "wheel" }), true);
  assert.equal(f({ type: "touchmove" }), true);
  assert.equal(f({ type: "keydown", key: "ArrowDown" }), true);
  assert.equal(f({ type: "keydown", key: " " }), true);
  assert.equal(f({ type: "keydown", key: "PageDown" }), true);
  assert.equal(f({ type: "keydown", key: "Tab" }), false);
  assert.equal(f({ type: "keydown", key: "a" }), false);
  assert.equal(f({ type: "keydown", key: " ", insidePlayer: true }), false, "space on a player button");
  assert.equal(f({ type: "keydown", key: "ArrowDown", editable: true }), false, "typing in a field");
  assert.equal(f({ type: "wheel", insidePlayer: true }), false);
  assert.equal(f({ type: "click" }), false);
});

test("narration machine: start, pause on the visitor's scroll, resume the same cue", () => {
  const { narratorReducer: r, initialNarratorState: s0 } = machine;
  const n = 5;
  let s = r(s0, { type: "user-scroll" }, n);
  assert.equal(s, s0, "scrolling before the narrator starts changes nothing");
  s = r(s0, { type: "start" }, n);
  assert.equal(s.status, "playing");
  assert.equal(s.index, 0);
  assert.equal(s.epoch, 1);
  s = r(s, { type: "next" }, n);
  assert.equal(s.index, 1);
  assert.equal(s.epoch, 2);
  const scrolled = r(s, { type: "user-scroll" }, n);
  assert.equal(scrolled.status, "paused");
  assert.equal(scrolled.pausedBy, "user-scroll");
  assert.equal(r(scrolled, { type: "user-scroll" }, n), scrolled, "more scrolling while paused changes nothing");
  const resumed = r(scrolled, { type: "resume" }, n);
  assert.equal(resumed.status, "playing");
  assert.equal(resumed.index, 1, "resume continues the current cue");
  assert.equal(resumed.epoch, 2, "resume does not restart the cue");
  assert.equal(resumed.pausedBy, null);
  const paused = r(resumed, { type: "toggle" }, n);
  assert.equal(paused.pausedBy, "button");
  assert.equal(r(paused, { type: "toggle" }, n).status, "playing");
});

test("narration machine: next, previous, end and exit", () => {
  const { narratorReducer: r, initialNarratorState: s0 } = machine;
  const n = 3;
  let s = r(s0, { type: "start" }, n);
  s = r(s, { type: "prev" }, n);
  assert.equal(s.index, 0);
  assert.equal(s.epoch, 2, "previous on the first cue restarts it");
  s = r(s, { type: "cue-end" }, n);
  s = r(s, { type: "cue-end" }, n);
  assert.equal(s.index, 2);
  const done = r(s, { type: "cue-end" }, n);
  assert.equal(done.status, "done");
  assert.equal(r(done, { type: "cue-end" }, n), done);
  assert.equal(r(r(s, { type: "pause" }, n), { type: "next" }, n).status, "done", "next on the last cue ends");
  const exited = r(s, { type: "exit" }, n);
  assert.equal(exited.status, "idle");
  assert.equal(r(exited, { type: "start" }, n).epoch, s.epoch + 1, "start again restarts from cue 1");
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
  assert.equal(session.offerSeen("csm", null), true);
  session.resetOfferMemory();
});

test("narration overlay: dialog semantics and no sound before a click", () => {
  const src = read("src/components/narration/Narrator.tsx");
  assert.match(src, /role="dialog"/);
  assert.match(src, /aria-modal="true"/);
  assert.match(src, /e\.key === "Escape"/);
  assert.match(src, /aria-live=\{playing \? "polite" : "off"\}/);
  assert.match(src, /if \(!mounted\) return null;/, "nothing in the server HTML: crawlers read the plain page");
  // play() is only called from the cue effect, which needs status "playing" (a click on Start or the launcher).
  for (const m of src.matchAll(/\.play\(\)/g)) {
    const before = src.slice(Math.max(0, m.index - 200), m.index);
    assert.ok(/status === "playing"|Resume|modeRef\.current === "audio" && a\)/.test(before), "play() only runs while playing");
  }
  const content = read("src/components/narration/content.ts");
  assert.match(content, /start: "Start the experience"/);
  assert.match(content, /read: "Read the page instead"/);
});

test("narration analytics: click target ids are valid journey targets", async () => {
  const { cleanTarget } = await import("../src/lib/journey/sanitize.ts");
  for (const p of PAGES) {
    for (const id of [`narration.start.${p}`, `narration.read.${p}`, `narration.complete.${p}`]) assert.equal(cleanTarget(id), id);
    for (const c of NARRATION[p]) assert.equal(cleanTarget(`narration.exit.${p}.${c.id}`), `narration.exit.${p}.${c.id}`);
  }
});
