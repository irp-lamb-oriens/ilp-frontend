// Run: npm test. PriceAnchor: the struck "Typical law firm retainer US$1,500"
// above "ILP membership US$79.99 a month". The US$1,500 is a comparison, never
// ILP's former price, so no "was", "before", "regular price" or "save" wording;
// one constant; <del> semantics; final state without motion; only transform
// and opacity animate; member landings use it, the lawyer and CSM pages do not.
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { readFileSync } from "node:fs";

register("./tsResolve.mjs", import.meta.url);
register("./tsxLoader.mjs", import.meta.url);

const React = await import("react");
const { renderToStaticMarkup } = await import("react-dom/server");
const { default: PriceAnchor, initialPhase } = await import("../src/components/motion/PriceAnchor.tsx");
const { COMPARISON_RETAINER_USD, PRICE_ANCHOR, PRICE_ANCHOR_SPOKEN, usdLabel } = await import("../src/lib/pricing.ts");
const { PLAN_STANDARD } = await import("../src/lib/contracts.ts");

const h = React.createElement;
const src = (p) => readFileSync(new URL(`../src/${p}`, import.meta.url), "utf8");
const noComments = (code) => code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");
const textOf = (html) => html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
const FORBIDDEN = /\b(was|were|before|regular|regularly|originally|original|save|saves|saving|savings|discount|off|now only|reduced)\b|%/i;

test("price anchor: comparison wording, never a former price", () => {
  assert.equal(PRICE_ANCHOR.compareLabel, "Typical law firm retainer");
  assert.equal(PRICE_ANCHOR.label, "ILP membership");
  for (const [k, v] of Object.entries(PRICE_ANCHOR)) assert.doesNotMatch(v, FORBIDDEN, `${k}: "${v}"`);
  const html = renderToStaticMarkup(h(PriceAnchor, { showCalls: true, still: true }));
  assert.doesNotMatch(textOf(html), FORBIDDEN);
  assert.ok(!/[–—]/.test(textOf(html)), "no dashes");
});

test("price anchor: one constant for the comparison, the plan for our price", () => {
  assert.equal(COMPARISON_RETAINER_USD, 1500);
  assert.equal(PRICE_ANCHOR.compare, usdLabel(COMPARISON_RETAINER_USD));
  assert.equal(PRICE_ANCHOR.compare, "US$1,500");
  assert.equal(PRICE_ANCHOR.price, `US$${(PLAN_STANDARD.monthlyCents / 100).toFixed(2)}`);
  assert.equal(PRICE_ANCHOR.price, "US$79.99");
  const files = ["components/motion/PriceAnchor.tsx", "components/landing/HeroStory.tsx", "components/landing/ProofSections.tsx", "components/landing/content.ts", "app/pricing/page.tsx", "components/join/JoinForm.tsx", "app/check/page.tsx", "app/join/page.tsx"];
  for (const f of files) assert.ok(!/1,?500/.test(noComments(src(f))), `${f} hardcodes the comparison figure`);
  assert.ok(src("lib/pricing.ts").includes("LEGAL:"), "the constant carries the legal note");
});

test("price anchor: struck figure is a <del>, the line is decorative, read once as a sentence", () => {
  const html = renderToStaticMarkup(h(PriceAnchor, { still: true }));
  assert.match(html, /<del class="struck"><span class="struckText">US\$1,500<\/span><span class="strike" aria-hidden="true"><\/span><\/del>/);
  assert.equal(textOf(html), PRICE_ANCHOR_SPOKEN);
  assert.equal(PRICE_ANCHOR_SPOKEN, "Typical law firm retainer US$1,500. ILP membership US$79.99 a month.");
  assert.equal(textOf(html).split("US$79.99").length - 1, 1, "price appears once (no hidden duplicate)");
  assert.equal(textOf(html).split("US$1,500").length - 1, 1);
  assert.ok(!src("components/motion/PriceAnchor.tsx").includes("text-decoration"), "strike is not text-decoration");
});

test("price anchor: all text is in the markup before it plays; reduced motion is the final state", () => {
  const idle = renderToStaticMarkup(h(PriceAnchor, {}));
  assert.match(idle, /data-phase="idle"/);
  assert.equal(textOf(idle), PRICE_ANCHOR_SPOKEN, "space reserved: nothing mounts later");
  const still = renderToStaticMarkup(h(PriceAnchor, { still: true }));
  assert.match(still, /data-phase="done"/);
  assert.equal(initialPhase(true), "done");
  assert.equal(initialPhase(false), "idle");
  const tsx = src("components/motion/PriceAnchor.tsx");
  assert.match(tsx, /useReducedMotion/);
  assert.match(tsx, /if \(reduce \|\| typeof IntersectionObserver === "undefined"\)\s*\{\s*setPhase\("done"\)/);
  assert.match(tsx, /threshold: PRICE_ANCHOR_THRESHOLD/);
  assert.match(tsx, /io\.disconnect\(\)/, "plays once");
  const scss = src("components/motion/PriceAnchor.module.scss");
  const rm = scss.slice(scss.indexOf("@include reduced-motion"));
  assert.ok(rm.length > 30 && /transition: none/.test(rm) && /scaleX\(1\)/.test(rm), "reduced-motion block shows the final state");
});

test("price anchor: only transform and opacity animate, with tokens", () => {
  const scss = src("components/motion/PriceAnchor.module.scss");
  const transitions = [...scss.matchAll(/transition:\s*([^;]+);/g)].map((m) => m[1]).filter((v) => v.trim() !== "none");
  assert.ok(transitions.length >= 6);
  for (const t of transitions) {
    for (const part of t.split(",")) {
      const prop = part.trim().split(/\s+/)[0];
      assert.ok(["opacity", "transform"].includes(prop), `animates ${prop}`);
      assert.match(part, /\$ease-out-strong/, "easing token");
      assert.match(part, /\$duration-/, "duration token");
    }
  }
  // Phase rules change only opacity and transform.
  for (const block of scss.match(/\[data-phase="idle"\] \{[\s\S]*?\n\}/g) ?? []) {
    for (const m of block.matchAll(/([a-z-]+):\s/g)) assert.ok(["opacity", "transform"].includes(m[1]), `idle sets ${m[1]}`);
  }
  assert.match(scss, /background: \$color-strike/);
  assert.ok(!/#[0-9a-f]{3,6}\b/i.test(scss), "no hex in the component");
  assert.match(src("styles/_variables.scss"), /\$color-strike: \$color-error;/);
  assert.match(readFileSync(new URL("../rules.md", import.meta.url), "utf8"), /\$color-strike/);
});

test("price anchor: member landings use it, the lawyer and CSM landings do not", () => {
  for (const f of ["components/landing/HeroStory.tsx", "components/landing/ProofSections.tsx", "app/pricing/page.tsx", "components/join/JoinForm.tsx", "app/check/page.tsx"]) {
    assert.match(src(f), /import PriceAnchor from "@\/components\/motion\/PriceAnchor"/, f);
    assert.match(src(f), /<PriceAnchor\b/, f);
  }
  for (const f of ["app/attorneys/page.tsx", "app/customer-success/page.tsx", "components/lawyers/LawyersStory.tsx", "components/lawyers/content.ts", "components/customerSuccess/CsmStory.tsx", "components/customerSuccess/content.ts"]) {
    assert.ok(!src(f).includes("PriceAnchor"), `${f} must not show the price anchor`);
    assert.ok(!src(f).includes("1,500"), `${f} must not show the comparison`);
  }
});
