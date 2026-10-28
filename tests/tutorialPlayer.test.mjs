// Run: npm test. The tutorial player's controls: the reducer behind play,
// pause, previous and next action, seek and replay (every boundary), the
// labels the controls read out, and the "What happens here" list of every
// tutorial (no empty item, "N. Name: explanation").
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { readFileSync } from "node:fs";

register("./tsResolve.mjs", import.meta.url);

const P = await import("../src/components/tutorial/playerState.ts");
const { computeTimeline } = await import("../src/components/tutorial/timeline.ts");
const { stopIndices } = await import("../src/components/tutorial/sceneUtils.ts");
const { ALL_TUTORIALS } = await import("../src/tutorials/index.ts");
const { PUBLIC_TUTORIALS } = await import("../src/tutorials/public/index.ts");
const EVERY_TUTORIAL = [...ALL_TUTORIALS, ...PUBLIC_TUTORIALS];

// Ops 0..5; actions (stops) at 1, 3, 4. Op 5 is a trailing wait.
const STOPS = [1, 3, 4];
const LAST = 5;
const run = (s, ...actions) => actions.reduce((st, a) => P.playerReducer(st, a), s);
const fresh = () => P.initPlayer(STOPS, LAST, false);

test("player: starts playing before the first action; reduced motion starts on the end frame", () => {
  const s = fresh();
  assert.equal(s.mode, "playing");
  assert.equal(s.at, -1);
  assert.equal(P.actionPosition(s), -1);
  const r = P.initPlayer(STOPS, LAST, true);
  assert.equal(r.mode, "ended");
  assert.equal(P.actionPosition(r), STOPS.length, "the end frame counts every action as done");
  assert.equal(P.playerReducer(r, { type: "play" }), r, "reduced motion never autoplays");
  assert.equal(P.playerReducer(r, { type: "replay" }).mode, "ended", "replay shows the end frame again");
});

test("player: reach follows the demo only while it plays", () => {
  const s = run(fresh(), { type: "reach", at: 3 });
  assert.equal(s.at, 3);
  assert.equal(P.actionPosition(s), 1);
  const paused = run(s, { type: "pause" }, { type: "reach", at: 4 });
  assert.equal(paused.at, 3, "a late tick from the cancelled run is ignored");
});

test("player: pause holds the current action; in the lead-in it holds the first", () => {
  const s = run(fresh(), { type: "reach", at: 3 }, { type: "pause" });
  assert.deepEqual([s.mode, s.at, s.pausedBy], ["paused", 3, "user"]);
  const lead = run(fresh(), { type: "pause" });
  assert.deepEqual([lead.mode, lead.at], ["paused", 1]);
  const done = run(fresh(), { type: "end" }, { type: "pause" });
  assert.equal(done.mode, "ended", "nothing to pause on the end frame");
});

test("player: play resumes after the held action; at the last op or the end it starts over", () => {
  const s = run(fresh(), { type: "reach", at: 3 }, { type: "pause" }, { type: "play" });
  assert.deepEqual([s.mode, s.startFrom, s.pausedBy], ["playing", 4, null]);
  const atLast = run(fresh(), { type: "seek", stop: 99 }, { type: "next" });
  assert.equal(atLast.at, 4, "seek clamps to the last action");
  const fromEnd = run(fresh(), { type: "end" });
  const again = P.playerReducer(fromEnd, { type: "play" });
  assert.deepEqual([again.mode, again.at, again.startFrom], ["playing", -1, 0]);
  assert.equal(again.runKey, fromEnd.runKey + 1, "a new run");
  const trailing = { ...P.initPlayer([1, 5], 5, false) };
  const lastHeld = run(trailing, { type: "seek", stop: 1 }, { type: "play" });
  assert.equal(lastHeld.runKey, trailing.runKey + 1, "resuming past the last op starts over");
});

test("player: next and previous step between actions and stop at the edges", () => {
  let s = run(fresh(), { type: "next" });
  assert.deepEqual([s.mode, s.at], ["paused", 1], "next from the lead-in holds action 1");
  assert.equal(P.canPrev(s), false);
  assert.equal(P.playerReducer(s, { type: "prev" }), s, "no action before the first");
  s = run(s, { type: "next" }, { type: "next" });
  assert.equal(s.at, 4);
  assert.equal(P.canNext(s), false);
  assert.equal(P.playerReducer(s, { type: "next" }), s, "no action after the last");
  s = run(s, { type: "prev" });
  assert.equal(s.at, 3);
  const end = run(fresh(), { type: "end" });
  assert.equal(P.canNext(end), false);
  assert.equal(run(end, { type: "prev" }).at, 4, "previous from the end frame holds the last action");
  const playing = run(fresh(), { type: "reach", at: 3 }, { type: "next" });
  assert.deepEqual([playing.mode, playing.at], ["paused", 4], "next while playing pauses on the next action");
});

test("player: seek jumps to an action and clamps; an empty script ignores it", () => {
  assert.equal(run(fresh(), { type: "seek", stop: 1 }).at, 3);
  assert.equal(run(fresh(), { type: "seek", stop: -4 }).at, 1);
  assert.equal(run(fresh(), { type: "seek", stop: 7 }).at, 4);
  const empty = P.initPlayer([], -1, false);
  assert.equal(P.playerReducer(empty, { type: "seek", stop: 0 }), empty);
  const r = run(P.initPlayer(STOPS, LAST, true), { type: "seek", stop: 0 });
  assert.deepEqual([r.mode, r.at], ["paused", 1], "reduced motion: Show steps holds action 1");
});

test("player: replay restarts from the top from any state", () => {
  for (const s of [fresh(), run(fresh(), { type: "next" }), run(fresh(), { type: "end" })]) {
    const r = P.playerReducer(s, { type: "replay" });
    assert.deepEqual([r.mode, r.at, r.startFrom, r.pausedBy], ["playing", -1, 0, null]);
    assert.equal(r.runKey, s.runKey + 1);
  }
});

test("player: leaving the screen holds the demo and looks unchanged; coming back resumes, a viewer's pause is kept", () => {
  const off = run(fresh(), { type: "reach", at: 3 }, { type: "view", visible: false });
  assert.deepEqual([off.mode, off.pausedBy], ["paused", "view"]);
  assert.equal(P.shownMode(off), "playing", "an off-screen hold shows nothing extra");
  const back = run(off, { type: "view", visible: true });
  assert.deepEqual([back.mode, back.startFrom], ["playing", 4]);
  const user = run(fresh(), { type: "reach", at: 3 }, { type: "pause" }, { type: "view", visible: false }, { type: "view", visible: true });
  assert.deepEqual([user.mode, user.pausedBy], ["paused", "user"], "the viewer's pause survives scrolling away and back");
  assert.equal(P.shownMode(user), "paused");
  const lead = run(fresh(), { type: "view", visible: false });
  assert.equal(lead.mode, "playing", "in the lead-in nothing is held; the run restarts when it returns");
  const taken = run(off, { type: "pause" });
  assert.equal(taken.pausedBy, "user", "pressing Pause while held makes it the viewer's pause");
});

test("player: labels for actions, steps and the position line", () => {
  assert.equal(P.actionLabel(1, 5, "Close task"), "Action 2 of 5: Close task");
  assert.equal(P.stepLabel(1, 4, "Results"), "Step 2 of 4: Results");
  assert.equal(P.positionText({ action: 1, actions: 5, step: 0, steps: 3 }), "Action 2 of 5 · Step 1 of 3");
  assert.equal(P.positionText({ action: -1, actions: 5 }), "Action 1 of 5");
  assert.equal(P.positionText({ action: 5, actions: 5, step: 0, steps: 1 }), "Action 5 of 5", "one step: no step count");
  assert.equal(P.positionText({ action: 0, actions: 0 }), "");
});

test("player: scrubber durations cover the timeline from the first caption to the end", () => {
  const script = [
    { op: "hover", to: "a", explain: "One two three." },
    { op: "click", to: "b", explain: "Four five six." },
    { op: "wait", duration: 300 },
  ];
  const tl = computeTimeline(script);
  const stops = stopIndices(script);
  const d = P.stopDurations(tl, stops);
  assert.equal(d.length, 2);
  assert.ok(d.every((x) => x > 0));
  const first = tl.segments[0].start + tl.segments[0].travel;
  assert.equal(d[0] + d[1], tl.end - first);
});

test("every tutorial: each step lists every action as “N. Name: explanation”, none empty, and names every action", () => {
  for (const tut of EVERY_TUTORIAL) {
    for (const [i, st] of tut.steps.entries()) {
      const where = `${tut.id} › ${st.id}`;
      const items = P.explainItems(st.scene);
      const stops = stopIndices(st.scene.script);
      assert.ok(items.length > 0, `${where}: "What happens here" is empty`);
      items.forEach((it, k) => {
        assert.equal(it.n, k + 1, `${where}: numbered in order`);
        assert.ok(it.name.trim().length > 0, `${where} item ${it.n} has no name`);
        assert.ok(it.explain.trim().split(/\s+/).length >= 3, `${where} item ${it.n} (${it.name}) has no explanation`);
        assert.equal(it.text, `${it.n}. ${it.name}: ${it.explain}`);
        assert.ok(!/[–—]/.test(it.text), `${where} item ${it.n}: no dashes`);
      });
      const names = P.stopNames(st.scene, stops);
      assert.equal(names.length, stops.length);
      names.forEach((n, k) => assert.ok(n && n !== "Action", `${where}: action ${k + 1} has no name for the scrubber`));
      assert.ok(P.stepLabel(i, tut.steps.length, st.title).endsWith(`: ${st.title}`), `${where} step label`);
      assert.ok(st.title.trim(), `${where} has a step title`);
    }
  }
});

test("player markup: no control text runs together when copied", () => {
  const css = readFileSync(new URL("../src/components/tutorial/PlayerControls.module.scss", import.meta.url), "utf8");
  const tsx = readFileSync(new URL("../src/components/tutorial/PlayerControls.tsx", import.meta.url), "utf8");
  assert.match(css, /user-select:\s*none/, "control bars are left out of text selections");
  assert.match(tsx, /role="group"/);
  assert.match(tsx, /aria-label="Demo controls"/);
  assert.match(tsx, /role="radiogroup"/);
  const player = readFileSync(new URL("../src/components/tutorial/ScenePlayer.tsx", import.meta.url), "utf8");
  assert.ok(!/<details/.test(player), "the list is a real disclosure, not a closed <details> whose hidden items copy as empty numbers");
});

test("player controls: previous / next never leave the layout", () => {
  const css = readFileSync(new URL("../src/components/tutorial/PlayerControls.module.scss", import.meta.url), "utf8");
  const tsx = readFileSync(new URL("../src/components/tutorial/PlayerControls.tsx", import.meta.url), "utf8");
  const bar = css.match(/\n\.bar \{[^}]*/)[0];
  assert.match(bar, /border:\s*0/, "the controls bar has no border");
  const extra = [...css.matchAll(/\.extra\s*\{([^}]*)\}/g)].map((m) => m[1]).join("\n");
  assert.ok(extra, "compact extras are styled");
  assert.ok(!/display\s*:|width\s*:|margin/.test(extra), "compact extras hide by fading, never display / width / margin");
  assert.match(extra, /opacity:\s*0/);
  assert.match(css, /\.compact:focus-within \.extra/, "keyboard focus reveals them");
  assert.match(tsx, /label="Previous action"/);
  assert.match(tsx, /label="Next action"/);
});
