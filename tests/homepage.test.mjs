// Run: npm test. Homepage hero story: the split-up hero copy still reads the
// same as the full sentences, and the page renders the sections in order.
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { readFileSync } from "node:fs";

register("./tsResolve.mjs", import.meta.url);

const content = await import("../src/components/landing/content.ts");
const { HERO, PROBLEM, WHAT, TUTORIAL_BANDS } = content;
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
  const order = ["<HeroCTA", "<ProblemScroll", "<StepsScroll", "<WhatYouGet", "<CostsStory", "TUTORIAL_BANDS.check"];
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

test("homepage: every section in order, two pinned stories", () => {
  const order = [
    "<HeroCTA",
    "<ProblemScroll",
    "<StepsScroll",
    "<WhatYouGet",
    "<CostsStory",
    "TUTORIAL_BANDS.check",
    "BANDS.clarity",
    "<FeaturesSticky",
    "TUTORIAL_BANDS.home",
    "<SituationsList",
    "TUTORIAL_BANDS.call",
    "BANDS.lawyers",
    "<CoverageGutenberg",
    "<QuotesWall",
    "<Pricing",
    "TUTORIAL_BANDS.pricing",
    "<FaqSplit",
    "<FinalCta",
  ];
  const at = order.map((tag) => page.indexOf(tag));
  for (const [i, pos] of at.entries()) assert.ok(pos > 0, `page.tsx renders ${order[i]}`);
  assert.deepEqual([...at].sort((a, b) => a - b), at, "sections are in order");
  assert.ok(!page.includes("<CostsMorph") && !page.includes("<StepsPan"), "the old morph and pan are gone");
  const sections = readFileSync(new URL("../src/components/landing/StorySections.tsx", import.meta.url), "utf8");
  assert.ok(!sections.includes("MorphStage"), "real situations is not pinned");
});

test("homepage costs story: three beats with their exact eyebrow, title and body", () => {
  const { COSTS, COSTS_HEAD, COSTS_WRAP, COSTS_VISUALS } = content;
  assert.equal(COSTS_HEAD.title, "What a missed date can cost you");
  assert.equal(
    COSTS_HEAD.why,
    "Each of our six countries has yearly legal dates for residents, property owners and companies, and few of them come with a reminder.",
  );
  assert.deepEqual(
    COSTS.map((c) => [c.eyebrow, c.title, c.body]),
    [
      [
        "Fines",
        "A date you did not know about",
        "Your residency card, your company's yearly filing, the yearly fee for your car. Each has its own date, and a late one can bring a fine or extra paperwork.",
      ],
      [
        "Doubt",
        "Answers that do not agree",
        "A forum says one thing, a neighbor another, a lawyer a third. You pay for the same question more than once and still are not sure.",
      ],
      [
        "Retelling",
        "Explaining your situation again",
        "Each new lawyer starts from zero. You explain your residency, your house and your company again, and details get lost between conversations.",
      ],
    ],
  );
  assert.equal(COSTS_WRAP.link, TUTORIAL_BANDS.check.title, "the wrap-up leads to the free check band");
  assert.equal(COSTS_WRAP.href, `#${TUTORIAL_BANDS.check.anchor}`);
  assert.equal(COSTS_VISUALS.fines.dates.length, 3);
  assert.equal(COSTS_VISUALS.doubt.answers.length, 3);
  assert.deepEqual(COSTS_VISUALS.retelling.lines, ["Residency", "House", "Company"]);

  const src = readFileSync(new URL("../src/components/landing/CostsStory.tsx", import.meta.url), "utf8");
  assert.ok(src.includes('as="h2"') && src.includes('id="costs-title"'), "one h2 for the section");
  assert.ok((src.match(/as="h3"/g) ?? []).length === 2, "an h3 per beat, in the pinned and the staged beat");
  assert.ok(src.includes("<Eyebrow scrub=") && src.includes("<Eyebrow>{cost.eyebrow}</Eyebrow>"), "eyebrows in both layouts");
  assert.ok(src.includes('aria-current={pinned && i === current ? "step" : undefined}'), "the current rail link is marked");
  assert.ok(src.includes('className={s.frame} aria-hidden="true"'), "pictures are hidden from assistive tech");
});

test("homepage costs story: rail anchors, track height and the today strip", async () => {
  const { COSTS } = content;
  const m = await import("../src/components/landing/costsBeats.ts");
  const { activeBeat, beatPhase } = await import("../src/components/motion/storyMath.ts");
  const ids = COSTS.map((_, i) => m.costAnchorId(i));
  assert.deepEqual(ids, ["costs-fines", "costs-doubt", "costs-retelling"]);
  for (const [i, id] of ids.entries()) {
    assert.equal(m.parseCostHash(`#${id}`), i);
    const p = m.costAnchorProgress(i);
    assert.equal(activeBeat(p, m.COSTS_RANGES), i, `#${id} lands on beat ${i + 1}`);
    assert.equal(beatPhase(p, m.COSTS_RANGES[i]).phase, "hold");
  }
  for (const bad of ["#costs", "#costs-x", "", "#how-it-works"]) assert.equal(m.parseCostHash(bad), null);
  const anchors = Object.values(TUTORIAL_BANDS).map((b) => b.anchor);
  for (const id of ["costs", ...ids]) assert.ok(!anchors.includes(id), `${id} is unique on the page`);

  const scss = readFileSync(new URL("../src/components/landing/CostsStory.module.scss", import.meta.url), "utf8");
  assert.ok(scss.includes(`$costs-track-vh: ${m.COSTS_TRACK_VH};`), "scss track height matches");
  const lefts = [...scss.matchAll(/\.dateAt(\d) \{ left: (\d+)%; \}/g)].map((x) => Number(x[2]) / 100);
  assert.deepEqual(lefts, m.FINES_AT, "date positions match FINES_AT");
  const crossings = m.FINES_AT.map((_, i) => m.finesCross(i));
  assert.ok(crossings.every((t, i) => t > 0 && t < 1 && (i === 0 || t > crossings[i - 1])), "each date passes today in turn");

  const src = readFileSync(new URL("../src/components/landing/CostsStory.tsx", import.meta.url), "utf8");
  assert.ok(src.includes("href={`#${costAnchorId(i)}`}"), "rail links point at the beats");
  assert.ok(src.includes("id={costAnchorId(index)}"), "each beat carries its id");
});

test("homepage: every key phrase sits inside one phrase of its line", async () => {
  const { splitPhrases } = await import("../src/components/motion/storyMath.ts");
  const c = content;
  const pairs = [
    [c.COSTS_HEAD.why, c.COSTS_HEAD.mark],
    [c.FEATURES_HEAD.why, c.FEATURES_HEAD.mark],
    [c.STEPS_HEAD.why, c.STEPS_HEAD.mark],
    [c.COVERAGE_HEAD.why, c.COVERAGE_HEAD.mark],
    [c.SCENARIOS_HEAD.why, c.SCENARIOS_HEAD.mark],
    [c.PRICING_HEAD.why, c.PRICING_HEAD.mark],
    [c.FAQ_HEAD.why, c.FAQ_HEAD.mark],
    [c.FINAL.sub, c.FINAL.mark],
    [c.BANDS.clarity.body, c.BANDS.clarity.mark],
    [c.BANDS.lawyers.body, c.BANDS.lawyers.mark],
    ...Object.values(TUTORIAL_BANDS).map((b) => [b.lead, b.mark]),
    ...c.FEATURES.filter((f) => f.mark).map((f) => [f.body, f.mark]),
  ];
  for (const [text, mark] of pairs) {
    assert.ok(mark, `"${text.slice(0, 40)}..." has a key phrase`);
    assert.equal(splitPhrases(text).filter((p) => p.includes(mark)).length, 1, `"${mark}" sits in one phrase`);
  }
  assert.ok(c.FEATURES.some((f) => f.mark === "may require review"), "reminders underline may require review");
});
