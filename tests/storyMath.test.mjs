// Run: npm test. Scroll story math (components/motion/story.ts): beat
// enter / hold / exit windows, the staging order of the three copy levels,
// anchors and phrase splitting.
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./tsResolve.mjs", import.meta.url);

const {
  beatRanges,
  beatPhase,
  activeBeat,
  beatParts,
  beatAnchorProgress,
  splitWindow,
  splitPhrases,
  splitMark,
  trackScrollY,
} = await import("../src/components/motion/story.ts");

test("story: three beats share the track end to end, the last one holds", () => {
  const r = beatRanges(3);
  assert.deepEqual(r, [
    [0, 0.116667, 0.266667, 0.333333],
    [0.333333, 0.45, 0.6, 0.666667],
    [0.666667, 0.783333, 1, 1],
  ]);
  for (let i = 0; i < r.length - 1; i++) assert.equal(r[i][3], r[i + 1][0], `beat ${i + 1} exits as beat ${i + 2} enters`);
  for (const [a, b, c, d] of r) assert.ok(a < b && b < c && c <= d, "a < b < c <= d");
  assert.deepEqual(beatRanges(0), []);
  assert.deepEqual(beatRanges(2, { span: 0.8, enter: 0.5, exit: 0.25 })[0], [0, 0.2, 0.3, 0.4]);
});

test("story: beatPhase maps progress to enter, hold and exit", () => {
  const [first, , last] = beatRanges(3);
  assert.deepEqual(beatPhase(0, first), { phase: "enter", t: 0 });
  assert.equal(beatPhase(0.05, first).phase, "enter");
  assert.ok(Math.abs(beatPhase(0.0583335, first).t - 0.5) < 1e-3, "half way through the enter");
  assert.equal(beatPhase(0.2, first).phase, "hold");
  assert.equal(beatPhase(0.3, first).phase, "exit");
  assert.deepEqual(beatPhase(0.5, first), { phase: "after", t: 1 });
  assert.deepEqual(beatPhase(0.5, last), { phase: "before", t: 0 });
  assert.equal(beatPhase(0.9, last).phase, "hold");
  assert.deepEqual(beatPhase(1, last), { phase: "hold", t: 1 }, "the last beat never exits");
});

test("story: one beat is active at a time, and each anchor lands in its own hold", () => {
  const r = beatRanges(3);
  assert.deepEqual([0, 0.2, 0.34, 0.5, 0.7, 1].map((p) => activeBeat(p, r)), [0, 0, 1, 1, 2, 2]);
  for (const [i, range] of r.entries()) {
    const p = beatAnchorProgress(range);
    assert.equal(activeBeat(p, r), i);
    assert.equal(beatPhase(p, range).phase, "hold", `beat ${i + 1} anchor is inside its hold`);
  }
});

test("story: eyebrow, then title, then body, the visual plays through the hold", () => {
  for (const range of beatRanges(3)) {
    const [a, b, c] = range;
    const p = beatParts(range);
    assert.ok(p.rule[0] === a && p.rule[0] <= p.eyebrow[0], "the rule draws first");
    assert.ok(p.eyebrow[0] < p.title[0] && p.title[0] < p.body[0], "eyebrow < title < body");
    assert.ok(p.eyebrow[1] <= b && p.title[1] <= b, "eyebrow and title are in by the hold");
    assert.ok(p.body[1] > b && p.body[1] < c, "the body finishes brightening inside the hold");
    assert.ok(p.visual[0] > a && p.visual[1] === b, "the visual rises during the enter");
    assert.ok(p.timeline[0] < b && p.timeline[1] < c, "the visual timeline ends before the exit");
  }
  assert.deepEqual(splitWindow([0.2, 0.6], 4), [[0.2, 0.3], [0.3, 0.4], [0.4, 0.5], [0.5, 0.6]]);
});

test("story: phrases join back into the sentence, marks split once", () => {
  const text = "Your residency card, your company's yearly filing, the yearly fee for your car. Each has its own date, and a late one can bring a fine or extra paperwork.";
  const parts = splitPhrases(text);
  assert.equal(parts.length, 5);
  assert.equal(parts.join(" "), text);
  assert.deepEqual(splitMark("a b c", "b"), ["a ", "b", " c"]);
  assert.equal(splitMark("a b c", "x"), null);
  assert.equal(splitMark("a b c"), null);
});

test("story: trackScrollY maps progress to a page offset", () => {
  const m = { trackTop: 2000, trackHeight: 3200, viewport: 1000, startAt: 0.35 };
  assert.equal(trackScrollY(m, 0), 1650, "progress 0: the track top at 35% of the viewport");
  assert.equal(trackScrollY(m, 1), 4200, "progress 1: the track bottom at the viewport bottom");
  assert.equal(trackScrollY({ trackTop: 500, trackHeight: 3000, viewport: 1000 }, 0.5), 1500);
  assert.equal(trackScrollY({ trackTop: 500, trackHeight: 3000, viewport: 1000 }, 2), 2500, "clamped");
});
