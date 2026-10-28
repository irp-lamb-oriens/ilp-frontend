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
