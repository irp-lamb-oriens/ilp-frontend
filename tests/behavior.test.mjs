// Run: npm test. BEHAVIOR: the per-page collector and the heat map helpers.
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./tsResolve.mjs", import.meta.url);

const B = await import("../src/lib/journey/behavior.ts");
const A = await import("../src/components/dashboard/journeys/behaviorApi.ts");

const btn = { tag: "button", text: "  See my   dates " };

test("behavior: only public pages are measured", () => {
  assert.equal(B.behaviorPath("/Costa-Rica/"), "/costa-rica");
  assert.equal(B.behaviorPath("/"), "/");
  for (const p of ["/dashboard", "/dashboard/journeys", "/status/money", "/lawyer", "/csm/book", "/partners", "/ui", "/r/sara"]) assert.equal(B.behaviorPath(p), null, p);
  assert.deepEqual([B.deviceFor(390), B.deviceFor(820), B.deviceFor(1440)], ["phone", "tablet", "desktop"]);
});

test("behavior: labels never carry a field's value", () => {
  assert.equal(B.labelFor(btn), "button: See my dates");
  assert.equal(B.labelFor({ tag: "a", linkPath: "/pricing" }), "link: /pricing");
  assert.equal(B.labelFor({ tag: "a", external: true, linkPath: null }), "link: another site");
  assert.equal(B.labelFor({ tag: "input", inputType: "email", inputName: "email", text: "mary@example.com" }), "field: email");
  assert.equal(B.labelFor({ tag: "img" }), "img");
  assert.equal(B.isInteractive({ tag: "div", role: "button" }), true);
  assert.equal(B.isInteractive({ tag: "h2" }), false);
});

test("behavior: scroll depth, time on screen per band, clicks as shares of the page", () => {
  const c = B.createCollector("/check");
  assert.equal(c.touched(), false);
  c.see(0, 800, 4000, 1000); // top fifth on screen for a second
  c.see(1200, 800, 4000, 2000);
  c.see(1200, 800, 4000);
  const i = c.click(195, 2000, 390, 4000, btn, 1000);
  assert.equal(i, 0);
  const s = c.summary("phone");
  assert.equal(s.maxScroll, 50);
  assert.equal(s.activeMs, 3000);
  assert.deepEqual(s.dwell.slice(0, 10), [1000, 1000, 1000, 1000, 0, 0, 2000, 2000, 2000, 2000]);
  assert.deepEqual(s.clicks, [{ x: 500, y: 500, el: "button: See my dates", k: "c" }]);
  assert.equal(s.docH, 4000);
  assert.equal(c.touched(), true);
});

test("behavior: the third fast click on one spot is a rage click, once per burst; dead clicks are marked later", () => {
  const c = B.createCollector("/");
  const at = 10_000;
  c.click(100, 100, 1000, 2000, btn, at);
  c.click(104, 102, 1000, 2000, btn, at + 200);
  c.click(101, 99, 1000, 2000, btn, at + 400);
  c.click(102, 100, 1000, 2000, btn, at + 600);
  const slow = c.click(100, 100, 1000, 2000, { tag: "img" }, at + 5000);
  c.dead(slow);
  c.dead(2); // a rage click stays a rage click
  assert.deepEqual(c.summary("desktop").clicks.map((k) => k.k), ["c", "c", "r", "c", "d"]);
  // far apart is not rage
  const d = B.createCollector("/");
  for (let i = 0; i < 4; i++) d.click(100 + i * 200, 100, 1000, 2000, btn, at + i * 100);
  assert.ok(d.summary("desktop").clicks.every((k) => k.k === "c"));
  // never more than MAX_CLICKS
  for (let i = 0; i < 100; i++) d.click(5, 5 + i * 50, 1000, 9000, btn, at + 10_000 + i * 2000);
  assert.equal(d.summary("desktop").clicks.length, B.MAX_CLICKS);
});

test("behavior: page speed is sent with the view, not with its continuation", () => {
  const c = B.createCollector("/pricing");
  c.see(0, 800, 3000, 2000);
  c.vitals({ lcp: 1834.4 });
  c.vitals({ clsDelta: 0.04 });
  c.vitals({ clsDelta: 0.02 });
  c.vitals({ inp: 120 });
  c.vitals({ inp: 80 });
  c.error();
  const s = c.summary("desktop");
  assert.deepEqual([s.lcp, s.cls, s.inp, s.errors, s.cont], [1834, 60, 120, 1, undefined]);
  const again = B.createCollector("/pricing", true);
  again.see(0, 800, 3000, 1500);
  again.vitals({ lcp: 900 });
  const s2 = again.summary("desktop");
  assert.equal(s2.cont, true);
  assert.equal(s2.lcp, undefined);
});

test("heat map helpers: cell positions, square-root heat, where half the views stop", () => {
  assert.deepEqual(A.cellBox(0, 0, { cols: 50, rows: 100 }, 500, 1000), { cx: 5, cy: 5, cw: 10, ch: 10 });
  assert.equal(A.heatOf(25, 100), 0.5);
  assert.equal(A.heatOf(1, 0), 0);
  assert.equal(A.dropBand([1, 0.9, 0.7, 0.45, 0.2]), 3);
  assert.equal(A.dropBand([1, 1, 0.8]), null);
  assert.deepEqual(A.LAYERS.map((l) => l.id), ["clicks", "rage", "dead", "scroll", "attention"]);
});
