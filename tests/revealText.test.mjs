// Run: npm test. RevealText renders each sentence once (no visually hidden
// duplicate that copy and paste or screen readers would read twice), and only
// the homepage problem block starts dim; every other reveal starts at 0.
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

register("./tsResolve.mjs", import.meta.url);
register("./tsxLoader.mjs", import.meta.url);

const React = await import("react");
const { renderToStaticMarkup } = await import("react-dom/server");
const { motionValue } = await import("framer-motion");
const { RevealText, Stage } = await import("../src/components/motion/Story.tsx");
const { REVEAL_DIM_OPACITY, revealOpacity } = await import("../src/components/motion/storyMath.ts");
const { HERO, PROBLEM, WHAT } = await import("../src/components/landing/content.ts");

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src");
const h = React.createElement;

/** textContent of static markup: tags dropped, entities decoded. */
function textOf(html) {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

const count = (hay, needle) => hay.split(needle).length - 1;

const scrubbed = (props) =>
  renderToStaticMarkup(h(RevealText, { ...props, scrub: { progress: motionValue(0), window: [0, 1] } }));
const staged = (props) => renderToStaticMarkup(h(Stage, null, h(RevealText, props)));

const CASES = [
  { name: "problem (dim, parts, windows)", text: HERO.why, parts: PROBLEM.phrases, from: "dim" },
  { name: "what you get", text: WHAT.calls },
  { name: "with a key phrase", text: HERO.why, mark: "nobody reminds you" },
];

test("RevealText: each sentence is in the rendered text exactly once", () => {
  for (const c of CASES) {
    for (const [mode, render] of [["scrubbed", scrubbed], ["staged", staged]]) {
      const html = render(c);
      const text = textOf(html);
      assert.equal(text, c.text, `${c.name} (${mode}): textContent is the sentence, with plain spaces`);
      assert.equal(count(text, c.text), 1, `${c.name} (${mode}): sentence once`);
      for (const m of html.matchAll(/aria-hidden="true"[^>]*>([^<]*)</g)) {
        assert.equal(m[1], "", `${c.name} (${mode}): only empty decoration (the underline) is aria-hidden`);
      }
      assert.ok(!/srOnly/.test(html), `${c.name} (${mode}): no visually hidden copy`);
    }
  }
});

test("RevealText: dim starts every word at the dim opacity in place, hidden at 0 rising", () => {
  const dim = scrubbed({ text: HERO.why, parts: PROBLEM.phrases, from: "dim" });
  const hidden = scrubbed({ text: HERO.why, parts: PROBLEM.phrases });
  const words = HERO.why.split(" ").length;
  assert.equal(count(dim, `opacity:${REVEAL_DIM_OPACITY}`), words, "dim: every word at the base opacity");
  assert.ok(!/translateY\(0\.5em\)/.test(dim), "dim: no rise");
  assert.equal(count(hidden, "opacity:0;"), words, "hidden: every word at 0");
  assert.ok(REVEAL_DIM_OPACITY >= 0.2 && REVEAL_DIM_OPACITY <= 0.35);
  assert.equal(revealOpacity(1, "dim"), 1);
  assert.equal(revealOpacity(0, "dim"), REVEAL_DIM_OPACITY);
  assert.equal(revealOpacity(0), 0);
});

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = path.join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx$/.test(f)) out.push(p);
  }
  return out;
}

test("RevealText: only the homepage problem uses from=\"dim\"; everything else starts hidden", () => {
  const users = walk(SRC)
    .filter((p) => !p.endsWith(path.join("motion", "Story.tsx")))
    .filter((p) => /from="dim"/.test(readFileSync(p, "utf8")));
  assert.deepEqual(users.map((p) => path.relative(SRC, p)), [path.join("components", "landing", "HeroStory.tsx")]);
  const hero = readFileSync(path.join(SRC, "components/landing/HeroStory.tsx"), "utf8");
  const code = hero.split("\n").filter((l) => !/^\s*(\*|\/\*\*|\/\/)/.test(l)).join("\n");
  assert.equal(count(code, 'from="dim"'), 1, "one dim reveal in the hero code");
  const problem = hero.slice(hero.indexOf("export function ProblemScroll"), hero.indexOf("/* ── How ILP works"));
  assert.ok(problem.includes('from="dim"'), "the dim reveal is in ProblemScroll");
  const story = readFileSync(path.join(SRC, "components/motion/Story.tsx"), "utf8");
  assert.ok(/from = "hidden"/.test(story), "RevealText defaults to hidden (0 to 1)");
});

test("stories keep no visually hidden copy of their visible text", () => {
  for (const f of ["components/motion/Story.tsx", "components/motion/BeatStory.tsx", "components/landing/CostsStory.tsx", "components/lawyers/LawyersStory.tsx"]) {
    const src = readFileSync(path.join(SRC, f), "utf8");
    assert.ok(!/srOnly/.test(src), `${f}: no srOnly duplicate`);
  }
  const story = readFileSync(path.join(SRC, "components/motion/Story.tsx"), "utf8");
  const beat = story.slice(story.indexOf("export function Beat("), story.indexOf("/* ── Eyebrow"));
  assert.ok(!/aria-hidden|visibility/.test(beat), "a beat off stage stays readable to screen readers");
});
