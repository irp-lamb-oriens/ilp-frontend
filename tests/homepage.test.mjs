// Run: npm test. Homepage hero story: the split-up hero copy still reads the
// same as the full sentences, and the page renders the sections in order.
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { readFileSync } from "node:fs";

register("./tsResolve.mjs", import.meta.url);

const { HERO, PROBLEM, WHAT, TUTORIAL_BANDS } = await import("../src/components/landing/content.ts");
const page = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");

test("homepage hero: the problem phrases join back into the full sentence", () => {
  assert.equal(PROBLEM.phrases.join(" "), HERO.why);
  for (const item of PROBLEM.items) {
    assert.ok(HERO.why.toLowerCase().includes(item.toLowerCase()), `"${item}" is named in the problem`);
  }
});

test("homepage hero: what you get keeps the plan facts and words", () => {
  assert.ok(HERO.what.startsWith(HERO.lead), "the hero line is the first sentence of what you get");
  assert.equal(`US$${WHAT.price.toFixed(2)}`, "US$79.99");
  assert.ok(HERO.what.includes(`US$79.99 ${WHAT.unit} ${WHAT.activation}`));
  assert.ok(HERO.what.includes(WHAT.calls.replace(/^Includes/, "includes").replace(/\.$/, "")));
  assert.ok(HERO.what.includes(WHAT.extra));
  assert.equal(HERO.how.length, 4);
});

test("homepage: hero sections come first and in order, the steps own #how-it-works", () => {
  const order = ["<HeroCTA", "<ProblemScroll", "<StepsScroll", "<WhatYouGet", "<CostsMorph", "TUTORIAL_BANDS.check"];
  const at = order.map((tag) => page.indexOf(tag));
  for (const [i, pos] of at.entries()) assert.ok(pos > 0, `page.tsx renders ${order[i]}`);
  assert.deepEqual([...at].sort((a, b) => a - b), at, "sections are in order");
  assert.equal(HERO.howAnchor, "how-it-works");
  const anchors = Object.values(TUTORIAL_BANDS).map((b) => b.anchor);
  assert.ok(!anchors.includes(HERO.howAnchor), "no tutorial band reuses the steps anchor");
  assert.equal(new Set(anchors).size, anchors.length, "band anchors are unique");
});

test("homepage steps: each step has an example screen with its placeholder content", async () => {
  const { HERO_SCREENS, screenRoot, screenText } = await import("../src/components/landing/heroScreens.ts");
  assert.equal(HERO_SCREENS.length, HERO.how.length, "one screen per step");
  const textOf = (i, compact) => screenText(screenRoot(HERO_SCREENS[i], compact)).join("\n");
  const expect = [
    ["Do you own property in Costa Rica?", "may require review", "Annual corporation tax may require review"],
    ["US$79.99", "US$100", "20-minute", "quoted separately", "Join ILP"],
    ["86% complete", "Join on Google Meet", "Book your first call", "20 minutes with Lic. Andrea Vargas"],
    ["Sofía Campos · ILP team", "confirmed after your call", "Your team will confirm", "You · by"],
  ];
  for (const [i, words] of expect.entries()) {
    for (const compact of [false, true]) {
      const all = textOf(i, compact);
      for (const w of words) assert.ok(all.includes(w), `step ${i + 1} (${compact ? "compact" : "wide"}) screen shows "${w}"`);
      assert.ok(!/[–—]/.test(all), `step ${i + 1} screen has no dashes`);
    }
  }
  const hero = readFileSync(new URL("../src/components/landing/HeroStory.tsx", import.meta.url), "utf8");
  assert.ok(hero.includes("Example screen"), "screens are labelled as examples");
  assert.ok(/aria-hidden="true" inert/.test(hero), "screens are hidden from assistive tech and inert");
});

test("homepage steps: step links point at one marker per step, in each layout", async () => {
  const { STEP_COUNT, STEPS_TRACK_VH, stepAnchorId, stepProgress, activeStep, parseStepHash } = await import(
    "../src/components/landing/stepAnchors.ts"
  );
  assert.equal(STEP_COUNT, 4);
  const ids = HERO.how.map((_, i) => stepAnchorId(i));
  assert.deepEqual(ids, ["how-it-works-step-1", "how-it-works-step-2", "how-it-works-step-3", "how-it-works-step-4"]);
  assert.ok(!ids.includes(HERO.howAnchor), "step ids do not clash with #how-it-works");
  for (const [i, id] of ids.entries()) {
    assert.equal(parseStepHash(`#${id}`), i, `#${id} parses to step ${i + 1}`);
    assert.equal(activeStep(stepProgress(i)), i, `step ${i + 1}'s target is inside its own window`);
  }
  assert.equal(stepProgress(0), 0, "step 1 lands where #how-it-works does");
  for (const bad of ["#how-it-works", "#how-it-works-step-0", "#how-it-works-step-5", "#how-it-works-step-x", ""]) {
    assert.equal(parseStepHash(bad), null, `"${bad}" is not a step`);
  }

  const hero = readFileSync(new URL("../src/components/landing/HeroStory.tsx", import.meta.url), "utf8");
  const steps = hero.slice(hero.indexOf("export function StepsScroll"), hero.indexOf("/* ── What you get"));
  const [stacked, pinned] = steps.split("\n  return (\n    <section");
  assert.ok(stacked && pinned, "StepsScroll has a stacked and a pinned branch");
  const idUses = (src) => (src.match(/id=\{stepAnchorId\(i\)\}/g) ?? []).length;
  assert.equal(idUses(stacked), 1, "stacked layout: ids on the step blocks, once");
  assert.ok(/<li key=\{text\} id=\{stepAnchorId\(i\)\}/.test(stacked), "stacked ids sit on the step li");
  assert.equal(idUses(pinned), 1, "pinned layout: ids on the markers, once");
  assert.ok(/<span key=\{text\} id=\{stepAnchorId\(i\)\} className=\{s\.stepAnchor\}/.test(pinned), "pinned ids sit on markers");
  assert.equal((hero.match(/id=\{stepAnchorId\(/g) ?? []).length, 2, "no other element carries a step id");
  assert.ok(hero.includes("href={`#${id}`}") && hero.includes("const id = stepAnchorId(index);"), "rows link to #how-it-works-step-N");
  assert.ok(hero.includes('aria-current={current ? "step" : undefined}'), "the active row is marked");
  assert.ok(hero.includes("focus({ preventScroll: true })"), "focus moves without a second scroll");
  assert.ok(hero.includes("heightVh={STEPS_TRACK_VH}"), "the track height comes from stepAnchors.ts");

  const scss = readFileSync(new URL("../src/components/landing/HeroStory.module.scss", import.meta.url), "utf8");
  assert.ok(scss.includes(`$steps-track-vh: ${STEPS_TRACK_VH};`), "scss track height matches");
  const list = /\$step-anchor-progress: ([^;]+);/.exec(scss)?.[1].split(",").map(Number);
  assert.deepEqual(list, ids.map((_, i) => stepProgress(i)), "scss marker offsets match stepProgress");
  assert.ok(/\.stepLink \{[^}]*min-height: 44px/.test(scss), "rows are at least 44px tall");
});

test("homepage steps: stepScrollY lands step N inside its window", async () => {
  const { stepScrollY, activeStep, STEP_COUNT } = await import("../src/components/landing/stepAnchors.ts");
  const m = { trackTop: 1800, trackHeight: 2400, viewport: 1000 };
  assert.deepEqual([0, 1, 2, 3].map((i) => stepScrollY(m, i)), [1800, 2238, 2588, 2938]);
  for (let i = 0; i < STEP_COUNT; i++) {
    const p = (stepScrollY(m, i) - m.trackTop) / (m.trackHeight - m.viewport);
    assert.equal(activeStep(p), i);
  }
  assert.equal(stepScrollY({ trackTop: 500, trackHeight: 600, viewport: 900 }, 3), 500, "no scroll range: track top");
});
