// Run: npm test. "Show me on this page" and the step controls (previous /
// next / step segments) live in separate layout regions, siblings in normal
// flow, in the modal and in the inline embed (both render StepNav). No rule
// positions one region over the other, so they can not collide at any width.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(`../src/components/tutorial/${p}`, import.meta.url), "utf8");
const block = (css, sel) => {
  // The rule's own block, not a shared selector list like ".bar,\n.steps".
  const m = css.match(new RegExp(`(?<!,)\\n${sel.replace(".", "\\.")} \\{([\\s\\S]*?)\\n\\}`));
  assert.ok(m, `${sel} is styled`);
  return m[1];
};

test("step nav: actions and controls are sibling regions, actions first", () => {
  const tsx = read("PlayerControls.tsx");
  const nav = tsx.slice(tsx.indexOf("export function StepNav"));
  const wrap = nav.indexOf("s.stepsWrap");
  const actions = nav.indexOf('data-region="step-actions"');
  const controls = nav.indexOf('data-region="step-controls"');
  assert.ok(wrap > 0 && actions > wrap && controls > actions, "wrap > actions row, then the controls nav (keyboard order: Show me, then controls)");
  // The actions row closes before the controls open: siblings, not nested.
  const between = nav.slice(actions, controls);
  assert.match(between, /<\/div>/, "the actions row is closed before the controls start");
  // {extra} is rendered once, in the actions row, never inside the controls.
  const ctrl = nav.slice(controls, nav.indexOf("</nav>"));
  assert.ok(!ctrl.includes("{extra}"), "no step action inside the controls nav");
  assert.equal(nav.split("{extra}").length - 1, 1);
});

test("step nav: no absolute overlap rules on the regions", () => {
  const css = read("PlayerControls.module.scss");
  for (const sel of [".stepsWrap", ".stepActions", ".steps", ".stepEnd"]) {
    const b = block(css, sel);
    assert.ok(!/position\s*:\s*(absolute|fixed|sticky)/.test(b), `${sel} is in normal flow`);
    assert.ok(!/(^|\n)\s*(inset|top|bottom|z-index)\s*:/.test(b), `${sel} is not offset or layered`);
    assert.ok(!/margin[^:]*:\s*-/.test(b), `${sel} has no negative margin`);
  }
  assert.match(block(css, ".stepsWrap"), /flex-direction:\s*column/, "regions stack");
});

test("modal and embed: both use StepNav; the modal's Show me goes through its actions row", () => {
  const modal = read("TutorialModal.tsx");
  const embed = read("TutorialEmbed.tsx");
  assert.match(embed, /<StepNav/);
  assert.match(modal, /<StepNav/);
  const start = modal.indexOf("<StepNav");
  const nav = modal.slice(start, modal.indexOf("/>", modal.indexOf("Show me on this page", start)));
  assert.match(nav, /extra=\{[\s\S]*Show me on this page/, "Show me is passed as a step action");
  const mcss = read("TutorialModal.module.scss");
  assert.ok(!/position\s*:\s*(absolute|fixed)/.test(mcss), "the modal footer adds no positioned layers");
  const ecss = read("TutorialEmbed.module.scss");
  assert.ok(!/\.(steps|stepActions|stepsWrap)/.test(ecss), "the embed does not restyle the step regions");
});
