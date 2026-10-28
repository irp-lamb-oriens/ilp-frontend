// Run: npm test. Tutorial engine (registry, storage, timeline) and every
// tutorial config: each portal route has one, and every cursor target exists.
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./tsResolve.mjs", import.meta.url);

const { createRegistry, matchTutorial, routeToRegExp, normalizePath } = await import("../src/components/tutorial/registry.ts");
const { createTutorialStore, MAX_SKIPS } = await import("../src/components/tutorial/storage.ts");
const { computeTimeline, typedAt, readingTime, wordCount, holdFor, TIMING } = await import("../src/components/tutorial/timeline.ts");
const { collectIds, missingRefs, endState, describeScene, markers, captionsOf, firstUseTerms, placeCallout, stateThrough, stopIndices, MAX_TERMS } = await import(
  "../src/components/tutorial/sceneUtils.ts"
);
const { ALL_TUTORIALS, TUTORIAL_ROUTES, CLIENT_TUTORIALS } = await import("../src/tutorials/index.ts");
const { GLOSSARY, TERM_KEYS, findTerms } = await import("../src/tutorials/glossary.ts");
const { PUBLIC_TUTORIALS, HOMEPAGE_TUTORIAL_IDS } = await import("../src/tutorials/public/index.ts");
/** Portal and public tutorials: every content check applies to both. */
const EVERY_TUTORIAL = [...ALL_TUTORIALS, ...PUBLIC_TUTORIALS];

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
  for (const tut of EVERY_TUTORIAL) {
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
  for (const tut of EVERY_TUTORIAL) {
    for (const st of tut.steps) {
      if (st.target) assert.ok(found.has(st.target), `${tut.id} › ${st.id}: no element has data-tour="${st.target}"`);
    }
  }
});

// ─── Captions: timing ───────────────────────────────────────────────────────

const words = (n) => Array.from({ length: n }, (_, i) => `w${i}`).join(" ");

test("captions: reading time is 230 ms a word, clamped to 1.8–6 s", () => {
  assert.equal(TIMING.readPerWord, 230);
  assert.equal(readingTime(undefined), 0);
  assert.equal(readingTime("   "), 0);
  assert.equal(wordCount("  Marks this   job as finished. "), 5);
  assert.equal(readingTime(words(3)), 1800, "short captions get the minimum");
  assert.equal(readingTime(words(10)), 2300);
  assert.equal(readingTime(words(20)), 4600);
  assert.equal(readingTime(words(40)), 6000, "long captions are capped");
});

test("captions: a captioned op holds until it is read, then fades before the next op", () => {
  const ten = words(10);
  const click = { op: "click", to: "a", explain: ten, then: [{ id: "d", set: { open: true } }] };
  // reading 2300 + fade 180 - click 320 - settle 320
  assert.equal(holdFor(click, TIMING.click, TIMING.settle), 2300 + TIMING.captionOut - TIMING.click - TIMING.settle);
  assert.equal(holdFor({ op: "click", to: "a" }, TIMING.click, 0), 0, "no caption, no hold");
  const longType = { op: "type", to: "in", text: "x".repeat(200), explain: ten };
  assert.equal(holdFor(longType, TIMING.typeLead + 200 * TIMING.typeChar, 0), TIMING.captionOut, "a long action still leaves time to fade");

  const tl = computeTimeline([{ op: "hover", to: "a", explain: ten }, { op: "click", to: "b" }]);
  const [hv, cl] = tl.segments;
  assert.equal(hv.hold, readingTime(ten) + TIMING.captionOut - TIMING.hover);
  assert.ok(hv.action + hv.settle + hv.hold - TIMING.captionOut >= readingTime(ten), "visible for the whole reading time");
  assert.equal(hv.end, hv.start + hv.travel + hv.action + hv.settle + hv.hold);
  assert.equal(cl.start, hv.end, "the next op starts after the fade");
  assert.equal(cl.hold, 0);
});

// ─── Captions: scene helpers ────────────────────────────────────────────────

test("captions: list, numbering, paused frames and stops", () => {
  const sc = {
    aspect: "desktop",
    root: { type: "stack", children: [{ type: "button", id: "go", label: "Close task" }, { type: "input", id: "in", label: "Outcome" }, { type: "drawer", id: "d", title: "T", children: [] }] },
    script: [
      { op: "wait", duration: 100, then: [{ id: "d", set: { open: true } }] },
      { op: "type", to: "in", text: "Done", label: "Outcome", explain: "Write what happened." },
      { op: "click", to: "go", label: "Close task", explain: "Marks the job as finished.", then: [{ id: "d", set: { open: false } }] },
    ],
  };
  const caps = captionsOf(sc);
  assert.deepEqual(caps.map((c) => [c.opIndex, c.n, c.id, c.name]), [
    [1, 1, "in", "Outcome"],
    [2, 2, "go", "Close task"],
  ]);
  assert.deepEqual(markers(sc).map((m) => m.n), [1, 2], "markers share the caption numbers");
  assert.deepEqual(stopIndices(sc.script), [1, 2], "a plain wait is not a stop");
  assert.equal(stateThrough(sc.script, 1).patch.in.value, "Done");
  assert.equal(stateThrough(sc.script, 1).patch.d.open, true);
  assert.equal(stateThrough(sc.script, 2).patch.d.open, false);
});

test("captions: a glossary meaning is offered once per tutorial, at most three at a time", () => {
  const term = (key) => ({ key, word: key, meaning: "m" });
  const op = (keys) => ({ op: "hover", to: "x", explain: "e", terms: keys.map(term) });
  const steps = [
    { scene: { script: [op(["a", "b", "c", "d"]), op(["a"])] } },
    { scene: { script: [{ op: "wait" }, op(["d", "b", "e"])] } },
  ];
  const fu = firstUseTerms(steps);
  assert.equal(MAX_TERMS, 3);
  assert.deepEqual(fu[0][0].map((t) => t.key), ["a", "b", "c"]);
  assert.deepEqual(fu[0][1], [], "already explained");
  assert.deepEqual(fu[1][0], []);
  assert.deepEqual(fu[1][1].map((t) => t.key), ["d", "e"], "the one held back shows on its next use");
});

test("captions: the callout goes below, above, right or left of its target and stays inside", () => {
  const area = { width: 600, height: 400 };
  const bubble = { width: 200, height: 80 };
  const inside = (p) => p.x >= 0 && p.y >= 0 && p.x + bubble.width <= area.width && p.y + bubble.height <= area.height;
  const below = placeCallout({ left: 100, top: 40, width: 80, height: 30 }, area, bubble);
  assert.equal(below.side, "below");
  assert.equal(below.y, 40 + 30 + 14);
  const above = placeCallout({ left: 100, top: 330, width: 80, height: 30 }, area, bubble);
  assert.equal(above.side, "above");
  assert.ok(above.y + bubble.height <= 330);
  const tall = { left: 20, top: 10, width: 60, height: 380 };
  assert.equal(placeCallout(tall, area, bubble).side, "right");
  assert.equal(placeCallout({ ...tall, left: 520 }, area, bubble).side, "left");
  const edge = placeCallout({ left: 580, top: 20, width: 20, height: 20 }, area, bubble);
  assert.ok(inside(edge), "clamped at the right edge");
  const huge = placeCallout({ left: 0, top: 0, width: 600, height: 400 }, area, bubble);
  assert.equal(huge.side, "inside");
  assert.ok(inside(huge));
});

// ─── Captions: content ──────────────────────────────────────────────────────

const PASSIVE = new Set(["move", "wait", "scroll"]);
const sentences = (text) => text.split(/[.?!:;]+(?:\s+|$)/).map((x) => x.trim()).filter(Boolean);
const avgSentence = (text) => {
  const ss = sentences(text);
  return ss.length ? wordCount(text) / ss.length : 0;
};
/** Words a beginner should never meet. */
const BANNED = /\b(leverage|utili[sz]e|seamless(ly)?|robust|synergy|endpoint|payload|API|backend|frontend|webhook|SLA breach)\b/i;
/** Jargon that is fine only with its glossary meaning attached. */
const NEEDS_GLOSSARY = { sync: /\bsync/i, mrr: /\bMRR\b/, sla: /\bSLA\b/, nps: /\bNPS\b/, kpi: /\bKPI/, crm: /\bCRM\b/, rtbf: /\bRTBF\b/, legalFees: /\bGMV\b/ };

test("every cursor action has a plain caption of at most 40 words", () => {
  let n = 0;
  for (const tut of EVERY_TUTORIAL) {
    for (const st of tut.steps) {
      for (const op of st.scene.script ?? []) {
        const where = `${tut.id} › ${st.id} › ${op.op} ${typeof op.to === "string" ? op.to : ""}`;
        if (PASSIVE.has(op.op) && !op.explain) continue;
        assert.ok(op.explain?.trim(), `${where} has no explain caption`);
        assert.ok(op.label?.trim(), `${where} has no label`);
        const w = wordCount(op.explain);
        assert.ok(w <= 40, `${where} caption is ${w} words`);
        assert.ok(!/!/.test(op.explain), `${where}: no exclamation marks`);
        n++;
      }
    }
  }
  assert.ok(n > 200, `only ${n} captions`);
});

test("every step plays in under 25 seconds", () => {
  for (const tut of EVERY_TUTORIAL) {
    for (const st of tut.steps) {
      const end = computeTimeline(st.scene.script).end;
      assert.ok(end <= 25_000, `${tut.id} › ${st.id} plays for ${(end / 1000).toFixed(1)} s`);
    }
  }
});

test("captions and step copy read easily: short sentences, no banned words, jargon glossaried", () => {
  for (const tut of EVERY_TUTORIAL) {
    const glossaried = new Set();
    for (const st of tut.steps) {
      const where = `${tut.id} › ${st.id}`;
      assert.ok(avgSentence(st.body) <= 18, `${where} body averages ${avgSentence(st.body).toFixed(1)} words a sentence`);
      assert.ok(!BANNED.test(st.title + " " + st.body), `${where} body uses a banned word: ${(st.title + " " + st.body).match(BANNED)?.[0]}`);
      for (const op of st.scene.script ?? []) {
        if (!op.explain) continue;
        const at = `${where} › ${op.label}`;
        assert.ok(avgSentence(op.explain) <= 18, `${at} averages ${avgSentence(op.explain).toFixed(1)} words a sentence`);
        assert.ok(!BANNED.test(op.explain), `${at} uses a banned word: ${op.explain.match(BANNED)?.[0]}`);
        for (const t of op.terms ?? []) if (t.key) glossaried.add(t.key);
        for (const [key, re] of Object.entries(NEEDS_GLOSSARY)) {
          if (re.test(op.explain)) assert.ok(glossaried.has(key), `${at} uses ${key} without its glossary meaning`);
        }
      }
    }
  }
});

test("member tutorials stay calm: no alarming words", () => {
  const ALARM = /\b(risk|danger|penalt(y|ies)|fined|urgent|warning|overdue|fail(ed|ure)?|must act|immediately)\b/i;
  for (const tut of [...CLIENT_TUTORIALS, ...PUBLIC_TUTORIALS]) {
    for (const st of tut.steps) {
      const copy = [st.title, st.body, ...(st.scene.script ?? []).map((o) => o.explain ?? "")].join(" ");
      assert.ok(!ALARM.test(copy), `${tut.id} › ${st.id}: “${copy.match(ALARM)?.[0]}”`);
    }
  }
});

test("glossary: every referenced key exists and every meaning is plain", () => {
  assert.ok(TERM_KEYS.length >= 60, `glossary has ${TERM_KEYS.length} words`);
  for (const key of TERM_KEYS) {
    const e = GLOSSARY[key];
    assert.ok(e.word && e.meaning, `${key} needs a word and a meaning`);
    assert.ok(wordCount(e.meaning) <= 40, `${key} meaning is ${wordCount(e.meaning)} words`);
    assert.ok(avgSentence(e.meaning) <= 22, `${key} meaning has long sentences`);
    assert.ok(!BANNED.test(e.meaning), `${key} meaning uses a banned word`);
    if (e.match) assert.ok(!e.match.test(""), `${key} pattern matches nothing`);
  }
  for (const tut of EVERY_TUTORIAL) {
    for (const st of tut.steps) {
      for (const op of st.scene.script ?? []) {
        for (const t of [...(op.terms ?? []), ...(op.term ? [op.term] : [])]) {
          if (t.key) assert.ok(t.key in GLOSSARY, `${tut.id} › ${st.id}: unknown glossary key ${t.key}`);
          assert.ok(t.word && t.meaning, `${tut.id} › ${st.id}: term without a meaning`);
        }
      }
    }
  }
  // Every word the captions are expected to explain is in the glossary.
  for (const key of ["member", "membership", "activationFee", "csm", "partnerLawyer", "matter", "obligation", "dimex", "residency", "pensionado", "rentista", "digitalNomad", "company", "corporationTax", "rtbf", "marchamo", "titleStudy", "caja", "aguinaldo", "handoff", "nextStep", "consultation", "recordingConsent", "transcript", "aiSummary", "quote", "opportunity", "pipeline", "stage", "mrr", "retention", "nps", "kpi", "pastDue", "renewal", "blackoutDate", "availability", "slot", "sync", "toggle", "filter", "drawer", "statusLabel", "dashboard", "export", "privacyRequest"]) {
    assert.ok(key in GLOSSARY, `glossary is missing ${key}`);
  }
});

test("glossary: words are found in captions, longest match wins", () => {
  assert.deepEqual(findTerms("Write to your ILP team."), ["ilpTeam"]);
  assert.deepEqual(findTerms("She is consultation-ready."), ["consultationReady"]);
  assert.deepEqual(findTerms("16 days in stage, past the SLA."), ["daysInStage", "sla"]);
  assert.deepEqual(findTerms("Your DIMEX and the marchamo."), ["dimex", "marchamo"]);
  assert.deepEqual(findTerms("Nothing here."), []);
});

// ─── Public tutorials ───────────────────────────────────────────────────────

test("public tutorials need no role or route and never auto-start", () => {
  assert.ok(PUBLIC_TUTORIALS.length >= 1);
  const reg = createRegistry([...ALL_TUTORIALS, ...PUBLIC_TUTORIALS]);
  for (const tut of PUBLIC_TUTORIALS) {
    assert.ok(tut.id.startsWith("public."), `${tut.id} id starts with public.`);
    assert.deepEqual(tut.audience, ["public"], `${tut.id} audience`);
    assert.equal(tut.route, undefined, `${tut.id} has no route`);
    assert.equal(tut.autoStart, "never", `${tut.id} never auto-starts`);
    assert.equal(reg.get(tut.id), tut);
    for (const role of ["staff", "lawyer", "client"]) assert.ok(!reg.forRole(role).includes(tut), `${tut.id} stays out of the ${role} list`);
  }
  assert.ok(!ALL_TUTORIALS.some((t) => t.audience?.includes("public")), "portal list has no public tutorial");
});

test("homepage tutorials: each embedded id is a public tutorial with 3 to 6 steps and captions on every action", () => {
  const byId = new Map(PUBLIC_TUTORIALS.map((t) => [t.id, t]));
  assert.equal(HOMEPAGE_TUTORIAL_IDS.length, 4);
  for (const id of HOMEPAGE_TUTORIAL_IDS) {
    const tut = byId.get(id);
    assert.ok(tut, `${id} is registered in PUBLIC_TUTORIALS`);
    assert.ok(tut.steps.length >= 3 && tut.steps.length <= 6, `${id} has ${tut.steps.length} steps`);
    assert.ok(tut.title && tut.summary, `${id} has a title and summary`);
    for (const st of tut.steps) {
      assert.deepEqual(missingRefs(st.scene), [], `${id} › ${st.id}: every cursor target exists`);
      assert.ok((st.scene.script ?? []).some((op) => op.explain), `${id} › ${st.id} has at least one caption`);
    }
  }
  const ids = PUBLIC_TUTORIALS.map((t) => t.id);
  assert.equal(new Set(ids).size, ids.length, "public tutorial ids are unique");
});

test("homepage tutorials: prices match the plan (US$79.99 a month, US$100 activation, 60 minutes, three 20-minute calls)", () => {
  const copy = PUBLIC_TUTORIALS.flatMap((t) => t.steps.flatMap((st) => [st.title, st.body, ...(st.scene.script ?? []).map((o) => `${o.label ?? ""} ${o.explain ?? ""}`)])).join(" ");
  for (const m of copy.matchAll(/US\$([0-9][0-9,]*(?:\.[0-9]+)?)/g)) {
    assert.ok(["79.99", "100", "100.00", "1,200", "350"].includes(m[1]), `unexpected price US$${m[1]}`);
  }
  assert.ok(!/\b(30|90|120) minutes\b/.test(copy), "minutes match the plan");
});

test("homepage: every tutorial band plays a homepage tutorial, in order, and the page renders each band", async () => {
  const { TUTORIAL_BANDS } = await import("../src/components/landing/content.ts");
  const { readFileSync } = await import("node:fs");
  const bands = Object.entries(TUTORIAL_BANDS);
  assert.deepEqual(bands.map(([, b]) => b.id), [...HOMEPAGE_TUTORIAL_IDS]);
  const page = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");
  for (const [key, b] of bands) {
    assert.ok(page.includes(`TUTORIAL_BANDS.${key}`), `page.tsx renders the ${key} band`);
    assert.ok(b.lead.length > 0 && b.caption.length > 0, `${key} has a lead-in and a caption`);
  }
});

test("lawyers landing tutorials: public, 3 to 6 steps, captions, valid targets, rendered in page order", async () => {
  const { LAWYERS_TUTORIAL_IDS } = await import("../src/tutorials/public/index.ts");
  const { LAWYER_BANDS } = await import("../src/components/lawyers/content.ts");
  const { readFileSync } = await import("node:fs");
  const byId = new Map(PUBLIC_TUTORIALS.map((t) => [t.id, t]));
  assert.equal(LAWYERS_TUTORIAL_IDS.length, 3);
  for (const id of LAWYERS_TUTORIAL_IDS) {
    const tut = byId.get(id);
    assert.ok(tut, `${id} is registered in PUBLIC_TUTORIALS`);
    assert.ok(tut.steps.length >= 3 && tut.steps.length <= 6, `${id} has ${tut.steps.length} steps`);
    for (const st of tut.steps) {
      assert.deepEqual(missingRefs(st.scene), [], `${id} › ${st.id}: every cursor target exists`);
      assert.ok((st.scene.script ?? []).some((op) => op.explain), `${id} › ${st.id} has at least one caption`);
    }
  }
  assert.deepEqual(Object.values(LAWYER_BANDS).map((b) => b.id), [...LAWYERS_TUTORIAL_IDS]);
  const page = readFileSync(new URL("../src/components/lawyers/LawyersLanding.tsx", import.meta.url), "utf8");
  let last = -1;
  for (const key of Object.keys(LAWYER_BANDS)) {
    const at = page.indexOf(`LAWYER_BANDS.${key}}`);
    assert.ok(at > last, `LawyersLanding renders the ${key} band, in order`);
    last = at;
  }
});
