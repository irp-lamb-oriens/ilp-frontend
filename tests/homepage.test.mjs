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
