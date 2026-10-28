// Run: npm test. Inline demos (TutorialEmbed) play only while their scene is
// in view: 40% to start, under 15% to pause, a hidden tab pauses, and every
// embed has its own gate and clock.
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { readFileSync } from "node:fs";

register("./tsResolve.mjs", import.meta.url);

const { createViewGate, shouldPlay, visibleShare, PLAY_ENTER, PLAY_LEAVE, PRELOAD_MARGIN } = await import("../src/components/tutorial/viewport.ts");
const { computeTimeline, segmentAt, TIMING } = await import("../src/components/tutorial/timeline.ts");

test("viewport: start at 40%, keep playing down to 15%, hysteresis between", () => {
  assert.equal(PLAY_ENTER, 0.4);
  assert.equal(PLAY_LEAVE, 0.15);
  assert.equal(shouldPlay(false, 0, true), false);
  assert.equal(shouldPlay(false, 0.39, true), false);
  assert.equal(shouldPlay(false, 0.4, true), true);
  // Already playing: stays on in the band, stops below 15%.
  assert.equal(shouldPlay(true, 0.39, true), true);
  assert.equal(shouldPlay(true, 0.15, true), true);
  assert.equal(shouldPlay(true, 0.14, true), false);
  // Not playing: the band does not start it.
  assert.equal(shouldPlay(false, 0.2, true), false);
});

test("viewport: a hidden tab always pauses", () => {
  assert.equal(shouldPlay(true, 1, false), false);
  assert.equal(shouldPlay(false, 1, false), false);
  const g = createViewGate();
  assert.equal(g.update(1, true), true);
  assert.equal(g.update(1, false), false);
  assert.equal(g.update(1, true), true);
});

test("viewport: visible share counts against the smaller of element and viewport", () => {
  assert.equal(visibleShare(0, 400, 800), 0);
  assert.equal(visibleShare(200, 400, 800), 0.5);
  // A scene taller than the screen that fills it counts as fully visible.
  assert.equal(visibleShare(700, 1400, 700), 1);
  assert.equal(visibleShare(350, 1400, 700), 0.5);
  assert.equal(visibleShare(10, 0, 700), 0);
});

test("viewport: idle until in view; the clock does not advance while paused", () => {
  const g = createViewGate();
  assert.equal(g.seen, false);
  assert.equal(g.tick(1000), 0, "nothing plays before the first entry");
  g.update(0.3, true);
  assert.equal(g.tick(1000), 0, "30% is not enough to start");
  g.update(0.5, true);
  assert.equal(g.seen, true);
  assert.equal(g.tick(1200), 1200);
  g.update(0.1, true);
  assert.equal(g.tick(5000), 1200, "off screen: holds");
  g.update(0.6, false);
  assert.equal(g.tick(5000), 1200, "hidden tab: holds");
  g.update(0.6, true);
  assert.equal(g.tick(300), 1500, "resumes from where it was");
});

test("viewport: a paused demo resumes on the same action", () => {
  const script = [
    { op: "click", to: "a", explain: "Opens the first thing." },
    { op: "type", to: "b", text: "hello" },
    { op: "click", to: "c" },
  ];
  const tl = computeTimeline(script);
  const g = createViewGate();
  assert.equal(segmentAt(tl, g.elapsed), -1, "first frame: before action 1");
  g.update(1, true);
  g.tick(TIMING.lead + 10);
  assert.equal(segmentAt(tl, g.elapsed), 0, "first entry starts at action 1");
  g.tick(tl.segments[1].start - g.elapsed + 5);
  const at = segmentAt(tl, g.elapsed);
  assert.equal(at, 1);
  g.update(0, true);
  g.tick(60_000);
  g.update(1, true);
  assert.equal(segmentAt(tl, g.elapsed), at);
});

test("viewport: two embeds do not share state", () => {
  const a = createViewGate();
  const b = createViewGate();
  a.update(1, true);
  a.tick(800);
  assert.equal(b.inView, false);
  assert.equal(b.seen, false);
  assert.equal(b.tick(800), 0);
  b.update(1, true);
  b.tick(100);
  a.update(0, true);
  assert.equal(b.inView, true);
  assert.equal(a.elapsed, 800);
  assert.equal(b.elapsed, 100);
});

test("TutorialEmbed: own gate per instance, scene observed, preload about one viewport, plays once", () => {
  const src = readFileSync(new URL("../src/components/tutorial/TutorialEmbed.tsx", import.meta.url), "utf8");
  assert.match(src, /useRef\(createViewGate\(\)\)/);
  assert.match(src, /visibilitychange/);
  assert.match(src, /viewObs\.observe\(stageEl\)/);
  assert.match(src, /loops=\{1\}/);
  assert.equal(PRELOAD_MARGIN, "100% 0px");
  // No module-level shared play state.
  assert.doesNotMatch(src, /^(let|var) /m);
});
