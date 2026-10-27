// Run: npm test. Tutorial engine (registry, storage, timeline) and every
// tutorial config: each portal route has one, and every cursor target exists.
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./tsResolve.mjs", import.meta.url);

const { createRegistry, matchTutorial, routeToRegExp, normalizePath } = await import("../src/components/tutorial/registry.ts");
const { createTutorialStore, MAX_SKIPS } = await import("../src/components/tutorial/storage.ts");
const { computeTimeline, typedAt, TIMING } = await import("../src/components/tutorial/timeline.ts");
const { collectIds, missingRefs, endState, describeScene, markers } = await import("../src/components/tutorial/sceneUtils.ts");
const { ALL_TUTORIALS, TUTORIAL_ROUTES } = await import("../src/tutorials/index.ts");

const t = (id, route, extra = {}) => ({ id, version: 1, title: id, route, steps: [], ...extra });

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m };
}

// ─── Registry ───────────────────────────────────────────────────────────────

test("routes: exact paths, dynamic segments, trailing slashes and queries", () => {
  assert.equal(normalizePath("/status/"), "/status");
  assert.equal(normalizePath("/status?welcome=1#x"), "/status");
  assert.equal(normalizePath("/"), "/");
  const re = routeToRegExp("/dashboard/members/[id]");
  assert.ok(re.test("/dashboard/members/abc%40x.com"));
  assert.ok(!re.test("/dashboard/members"));
  assert.ok(!re.test("/dashboard/members/a/b"));
  assert.ok(routeToRegExp("/docs/[...slug]").test("/docs/a/b"));
});

test("registry: most specific route wins, audience filters, RegExp routes work", () => {
  const list = [
    t("members", "/dashboard/members", { audience: ["staff"] }),
    t("member", "/dashboard/members/[id]", { audience: ["staff"] }),
    t("today", "/dashboard", { audience: ["staff"] }),
    t("re", /^\/dashboard\/members\/special$/, { audience: ["staff"] }),
    t("money", "/status/money", { audience: ["client"] }),
    t("cancel", "/status/money/cancel", { audience: ["client"] }),
  ];
  const r = createRegistry(list);
  assert.equal(r.forRoute("/dashboard")?.id, "today");
  assert.equal(r.forRoute("/dashboard/")?.id, "today");
  assert.equal(r.forRoute("/dashboard/members")?.id, "members");
  assert.equal(r.forRoute("/dashboard/members/xyz")?.id, "member");
  assert.equal(r.forRoute("/dashboard/members/special")?.id, "member", "a dynamic string route outranks a RegExp");
  assert.equal(r.forRoute("/status/money/cancel")?.id, "cancel");
  assert.equal(r.forRoute("/status/money", "staff"), undefined, "audience filters");
  assert.equal(r.forRoute("/dashboard/unknown"), undefined);
  assert.equal(matchTutorial(list, "/status/money", "client")?.id, "money");
  assert.deepEqual(r.forRole("client").map((x) => x.id), ["money", "cancel"]);
  assert.throws(() => createRegistry([t("a", "/a"), t("a", "/b")]), /Duplicate tutorial id/);
});

// ─── Storage ────────────────────────────────────────────────────────────────

test("storage: done and dismissed persist per version; a version bump shows it again", () => {
  const mem = memoryStorage();
  const s1 = createTutorialStore(mem);
  assert.equal(s1.shouldAutoStart("x", 1), true);
  s1.markDone("x", 1);
  const s2 = createTutorialStore(mem); // fresh read from storage
  assert.equal(s2.isSeen("x", 1), true);
  assert.equal(s2.shouldAutoStart("x", 1), false);
  assert.equal(s2.isSeen("x", 2), false);
  assert.equal(s2.shouldAutoStart("x", 2), true);
  s2.markDismissed("y", 3);
  assert.equal(createTutorialStore(mem).shouldAutoStart("y", 3), false);
  assert.equal(createTutorialStore(mem).shouldAutoStart("y", 4), true);
});

test("storage: an early close shows it again on a later visit, up to MAX_SKIPS", () => {
  const s = createTutorialStore(memoryStorage());
  s.markSkipped("z", 1);
  assert.equal(s.isSeen("z", 1), false);
  assert.equal(s.shouldAutoStart("z", 1, { skippedThisSession: true }), false, "not again in the same session");
  assert.equal(s.shouldAutoStart("z", 1), true);
  for (let i = 1; i < MAX_SKIPS; i++) s.markSkipped("z", 1);
  assert.equal(s.shouldAutoStart("z", 1), false);
  s.markDone("w", 1);
  s.markSkipped("w", 1);
  assert.equal(s.get("w").state, "done", "skipping never downgrades a finished tutorial");
});

test("storage: reset, the auto-start preference, and blocked or corrupt storage", () => {
  const mem = memoryStorage();
  const s = createTutorialStore(mem);
  s.markDone("a", 1);
  s.markDone("b", 1);
  s.reset("a");
  assert.equal(s.isSeen("a", 1), false);
  assert.equal(s.isSeen("b", 1), true);
  s.reset();
  assert.equal(s.isSeen("b", 1), false);
  s.setAutoStart(false);
  assert.equal(createTutorialStore(mem).shouldAutoStart("c", 1), false);

  const throwing = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
  const b = createTutorialStore(throwing);
  b.markDone("a", 1);
  assert.equal(b.isSeen("a", 1), true, "falls back to memory");

  const corrupt = memoryStorage();
  corrupt.setItem("ilp_tutorials", "{not json");
  assert.equal(createTutorialStore(corrupt).shouldAutoStart("a", 1), true);
  createTutorialStore(null).markDone("a", 1);
});

// ─── Timeline ───────────────────────────────────────────────────────────────

test("timeline: travel, action and settle add up; same-target ops do not travel", () => {
  const script = [
    { op: "move", to: "a" },
    { op: "click", to: "a", then: [{ id: "d", set: { open: true } }] },
    { op: "type", to: "in", text: "hello" },
    { op: "wait", duration: 400 },
    { op: "scroll", to: "x" },
    { op: "drag", to: "card", dest: "col" },
    { op: "hover", to: "col" },
  ];
  const tl = computeTimeline(script);
  const [mv, cl, ty, wt, sc, dr, hv] = tl.segments;
  assert.equal(mv.start, TIMING.lead);
  assert.equal(mv.travel, TIMING.travel);
  assert.equal(mv.action, 0);
  assert.equal(cl.travel, 0, "already on a");
  assert.equal(cl.action, TIMING.click);
  assert.equal(cl.settle, TIMING.settle);
  assert.equal(ty.action, TIMING.typeLead + 5 * TIMING.typeChar);
  assert.equal(wt.travel, 0);
  assert.equal(wt.action, 400);
  assert.equal(sc.travel, 0);
  assert.equal(sc.action, TIMING.scroll);
  assert.equal(dr.action, TIMING.drag);
  assert.equal(dr.settle, TIMING.settle);
  assert.equal(hv.travel, 0, "the drag left the cursor on the column");
  for (let i = 1; i < tl.segments.length; i++) assert.equal(tl.segments[i].start, tl.segments[i - 1].end);
  assert.equal(tl.end, hv.end);
  assert.equal(tl.total, tl.end + TIMING.loopPause);
  assert.deepEqual(computeTimeline([]), { segments: [], end: 0, total: 0 });
});

test("timeline: typing reveals characters over time", () => {
  assert.equal(typedAt("abc", 0), "");
  assert.equal(typedAt("abc", TIMING.typeLead + 1), "a");
  assert.equal(typedAt("abc", TIMING.typeLead + TIMING.typeChar * 1.5), "ab");
  assert.equal(typedAt("abc", 99999), "abc");
});

test("scene utils: ids, end state, markers and the spoken description", () => {
  const root = {
    type: "stack",
    children: [
      { type: "button", id: "go", label: "Close task" },
      { type: "input", id: "in", label: "Outcome" },
      { type: "board", columns: [{ id: "c1", title: "Intake", cards: [{ id: "k", title: "Deed review" }] }, { id: "c2", title: "Filing", cards: [] }] },
      { type: "drawer", id: "d", title: "Task", children: [] },
    ],
  };
  const sc = {
    aspect: "desktop",
    root,
    script: [
      { op: "type", to: "in", text: "Done" },
      { op: "click", to: "go", then: [{ id: "d", set: { open: true } }] },
      { op: "drag", to: "k", dest: "c2" },
    ],
  };
  assert.deepEqual([...collectIds(root).keys()].sort(), ["c1", "c2", "d", "go", "in", "k"]);
  assert.deepEqual(missingRefs(sc), []);
  assert.deepEqual(missingRefs({ ...sc, script: [{ op: "click", to: "nope" }] }), ["nope"]);
  const end = endState(sc.script);
  assert.equal(end.patch.in.value, "Done");
  assert.equal(end.patch.d.open, true);
  assert.equal(end.moves.k, "c2");
  assert.deepEqual(markers(sc).map((m) => m.id), ["in", "go", "k"]);
  assert.match(describeScene(sc), /^The demo types “Done” into “Outcome”\. Then it selects “Close task”\. Then it drags “Deed review” to “Filing”\.$/);
  assert.throws(() => collectIds({ type: "stack", children: [{ type: "text", id: "x", text: "a" }, { type: "text", id: "x", text: "b" }] }), /Duplicate mock id/);
});

// ─── Configs ────────────────────────────────────────────────────────────────

const REQUIRED = {
  staff: ["/dashboard", "/dashboard/members", "/dashboard/members/[id]", "/dashboard/pipeline", "/dashboard/opportunities", "/dashboard/lawyers", "/dashboard/finance", "/dashboard/reports", "/dashboard/settings", "/dashboard/privacy"],
  lawyer: ["/lawyer", "/lawyer/board", "/lawyer/clients", "/lawyer/calls/[id]", "/lawyer/finance", "/lawyer/availability"],
  client: ["/status", "/status/profile", "/status/book", "/status/money", "/status/money/cancel", "/status/messages", "/status/feedback", "/status/privacy"],
};

const sample = (route) => route.replace(/\[[^\]]+\]/g, "sample-id");

test("every portal screen has a tutorial for its role", () => {
  const reg = createRegistry(ALL_TUTORIALS);
  for (const [role, routes] of Object.entries(REQUIRED)) {
    for (const route of routes) {
      const hit = reg.forRoute(sample(route), role);
      assert.ok(hit, `${role} ${route} has no tutorial`);
      assert.equal(hit.route, route, `${role} ${route} resolves to ${hit.route}`);
    }
  }
  assert.deepEqual([...TUTORIAL_ROUTES].sort(), Object.values(REQUIRED).flat().sort());
});

test("every tutorial has 3–6 steps with copy, unique ids, and cursor targets that exist", () => {
  const ids = new Set();
  for (const tut of ALL_TUTORIALS) {
    assert.ok(!ids.has(tut.id), `duplicate ${tut.id}`);
    ids.add(tut.id);
    assert.ok(Number.isInteger(tut.version) && tut.version >= 1, `${tut.id} version`);
    assert.ok(tut.audience?.length, `${tut.id} audience`);
    assert.ok(tut.steps.length >= 3 && tut.steps.length <= 6, `${tut.id} has ${tut.steps.length} steps`);
    const stepIds = new Set();
    for (const st of tut.steps) {
      const where = `${tut.id} › ${st.id}`;
      assert.ok(!stepIds.has(st.id), `duplicate step ${where}`);
      stepIds.add(st.id);
      assert.ok(st.title.trim() && st.body.trim(), `${where} copy`);
      assert.ok(st.body.length <= 320, `${where} body is ${st.body.length} chars; keep it to one or two short sentences`);
      assert.ok(!/!/.test(st.title + st.body), `${where}: no exclamation marks (rules.md voice)`);
      assert.deepEqual(missingRefs(st.scene), [], `${where} targets ids that are not in its scene`);
      assert.ok(st.scene.script?.length, `${where} has no cursor script`);
      assert.ok(describeScene(st.scene) || st.describe, `${where} has nothing to describe for screen readers`);
    }
  }
});

test("every step target has a matching data-tour attribute on a live page", async () => {
  const { readFileSync, readdirSync, statSync } = await import("node:fs");
  const path = await import("node:path");
  const root = new URL("../src/", import.meta.url).pathname;
  const found = new Set();
  const walk = (dir) => {
    for (const f of readdirSync(dir)) {
      const p = path.join(dir, f);
      if (statSync(p).isDirectory()) {
        if (f !== "tutorials") walk(p);
      } else if (p.endsWith(".tsx")) {
        for (const m of readFileSync(p, "utf8").matchAll(/data-tour="([^"]+)"/g)) found.add(m[1]);
      }
    }
  };
  walk(root);
  for (const tut of ALL_TUTORIALS) {
    for (const st of tut.steps) {
      if (st.target) assert.ok(found.has(st.target), `${tut.id} › ${st.id}: no element has data-tour="${st.target}"`);
    }
  }
});
