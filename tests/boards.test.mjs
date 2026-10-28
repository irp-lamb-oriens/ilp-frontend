// Run: npm test. BOARDS: keyboard moves on the shared board (components/ui/board/boardKeyboard.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./tsResolve.mjs", import.meta.url);

const { boardKeyboardReducer, keyToAction, placeCard, KB_IDLE } = await import("../src/components/ui/board/boardKeyboard.ts");

const ctx = {
  columns: [
    { id: "intake", label: "Intake", count: 3 },
    { id: "review", label: "Review", count: 0 },
    { id: "won", label: "Won", count: 2 },
    { id: "lost", label: "Lost", count: 1 },
  ],
};
const run = (actions, c = ctx, state = KB_IDLE) => {
  const out = [];
  for (const a of actions) {
    const r = boardKeyboardReducer(state, a, c);
    state = r.state;
    out.push(r);
  }
  return { state, out };
};
const lift = { type: "lift", cardId: "m1", cardLabel: "Ana Peñas", from: "intake", index: 1 };

test("Space picks up, arrows choose a column, Space drops: one move, announced", () => {
  const { state, out } = run([lift, { type: "right" }, { type: "down" }, { type: "drop" }]);
  assert.equal(state.mode, "idle");
  assert.match(out[0].announce, /Picked up Ana Peñas in Intake/);
  assert.match(out[1].announce, /Over Review\. Position 1 of 1/);
  assert.equal(out[2].announce, undefined, "an empty column has one place only");
  assert.deepEqual(out[3].move, { cardId: "m1", from: "intake", to: "review", index: 0 });
});

test("up and down choose the place; the card does not count itself in its own column", () => {
  const { state, out } = run([lift, { type: "right" }, { type: "right" }, { type: "down" }, { type: "down" }, { type: "down" }]);
  assert.equal(state.to, "won");
  assert.equal(state.index, 2, "at most after the last of 2 cards");
  assert.match(out[4].announce, /Position 3 of 3 in Won/);
  const back = run([lift, { type: "up" }, { type: "up" }, { type: "down" }, { type: "down" }]);
  assert.equal(back.state.index, 2, "own column: 2 other cards, 3 places");
});

test("columns the card may not enter are skipped; the edges say so", () => {
  const c = { ...ctx, allowed: ["won"] };
  const { state, out } = run([lift, { type: "right" }, { type: "right" }], c);
  assert.equal(state.to, "won", "Review is skipped");
  assert.match(out[2].announce, /last column it can go to/);
  const left = run([lift, { type: "left" }]);
  assert.match(left.out[1].announce, /first column/);
});

test("Escape puts it back; a drop in the same column changes nothing", () => {
  const esc = run([lift, { type: "right" }, { type: "cancel" }]);
  assert.equal(esc.state.mode, "idle");
  assert.equal(esc.out[2].move, undefined);
  assert.match(esc.out[2].announce, /stays in Intake/);
  const same = run([lift, { type: "right" }, { type: "left" }, { type: "drop" }]);
  assert.equal(same.out[3].move, undefined);
  assert.match(same.out[3].announce, /Nothing changed/);
  assert.equal(run([{ type: "right" }]).state.mode, "idle", "arrows do nothing before a lift");
});

test("keys: Space lifts and drops, Enter only drops, arrows only while lifted", () => {
  assert.equal(keyToAction(" ", false), "lift");
  assert.equal(keyToAction(" ", true), "drop");
  assert.equal(keyToAction("Enter", false), null, "Enter still opens the card");
  assert.equal(keyToAction("Enter", true), "drop");
  assert.equal(keyToAction("ArrowLeft", false), null);
  assert.equal(keyToAction("ArrowLeft", true), "left");
  assert.equal(keyToAction("Escape", true), "cancel");
});

test("placeCard: out of every column, into the target at an index", () => {
  const cols = { a: [{ id: "1" }, { id: "2" }], b: [{ id: "3" }] };
  const out = placeCard(cols, { id: "2", moved: true }, "b", (x) => x.id, 1);
  assert.deepEqual(out.a.map((x) => x.id), ["1"]);
  assert.deepEqual(out.b.map((x) => x.id), ["3", "2"]);
  assert.equal(out.b[1].moved, true);
  assert.deepEqual(placeCard(cols, { id: "9" }, "a", (x) => x.id).a.map((x) => x.id), ["9", "1", "2"], "top by default");
});
