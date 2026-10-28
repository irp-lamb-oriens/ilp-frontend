// Run: npm test. LISTS: NDJSON parser, list state machine, the API list source (docs/workstreams/LISTS.md).
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./tsResolve.mjs", import.meta.url);

const { createNdjsonParser, readNdjson, NdjsonError } = await import("../src/lib/ndjson.ts");
const { listReducer, initialListState, countLabel } = await import("../src/lib/listState.ts");
const { apiListSource, dispatchLines, listParams, memoryListSource } = await import("../src/lib/listSource.ts");

test("NDJSON parser: partial chunks, many lines per chunk, blank lines, last line without newline", () => {
  const p = createNdjsonParser();
  assert.deepEqual(p.push('{"type":"item","item":{"id":"a"}}\n{"type":"it'), [{ type: "item", item: { id: "a" } }]);
  assert.deepEqual(p.push('em","item":{"id":"b"}}\n\n{"type":"item","item":{"id":"c"}}\n{"ty'), [
    { type: "item", item: { id: "b" } },
    { type: "item", item: { id: "c" } },
  ]);
  assert.deepEqual(p.push('pe":"end","hasMore":false}'), []);
  assert.deepEqual(p.flush(), [{ type: "end", hasMore: false }]);
  assert.deepEqual(p.flush(), [], "flush empties the buffer");
  assert.throws(() => createNdjsonParser().push("{nope}\n"), NdjsonError);
});

test("NDJSON parser: multi-byte characters split across chunks", async () => {
  const bytes = new TextEncoder().encode('{"type":"item","item":{"name":"Núñez"}}\n');
  const cut = bytes.indexOf(0xc3) + 1; // inside the two bytes of "ú"
  const body = new ReadableStream({
    start(c) {
      c.enqueue(bytes.slice(0, cut));
      c.enqueue(bytes.slice(cut));
      c.close();
    },
  });
  const out = [];
  for await (const lines of readNdjson(body)) out.push(...lines);
  assert.deepEqual(out, [{ type: "item", item: { name: "Núñez" } }]);
});

const S = (over = {}) => ({ ...initialListState(), ...over });
const run = (state, actions, keyOf) => actions.reduce((s, a) => listReducer(s, a, keyOf), state);

test("list state: a first page replaces the old rows only when its first batch lands", () => {
  let s = run(S(), [
    { type: "start", seq: 1, mode: "replace" },
    { type: "items", seq: 1, items: [{ id: "a" }, { id: "b" }] },
    { type: "end", seq: 1, nextCursor: "c1", hasMore: true, total: 9 },
  ]);
  assert.equal(s.status, "done");
  assert.deepEqual(s.items.map((x) => x.id), ["a", "b"]);
  s = listReducer(s, { type: "start", seq: 2, mode: "replace" });
  assert.equal(s.stale, true, "old rows stay visible, marked stale");
  assert.equal(s.items.length, 2);
  s = listReducer(s, { type: "items", seq: 2, items: [{ id: "z" }] });
  assert.deepEqual(s.items.map((x) => x.id), ["z"]);
  assert.equal(s.stale, false);
  assert.equal(s.status, "streaming");
  s = listReducer(s, { type: "items", seq: 2, items: [{ id: "y" }] });
  assert.deepEqual(s.items.map((x) => x.id), ["z", "y"], "later batches append");
  s = listReducer(s, { type: "end", seq: 2, nextCursor: null, hasMore: false });
  assert.equal(s.total, null, "no total unless the server sends one");
});

test("list state: answers to an older request are ignored (no stale overwrite)", () => {
  let s = run(S(), [{ type: "start", seq: 1, mode: "replace" }, { type: "start", seq: 2, mode: "replace" }]);
  s = listReducer(s, { type: "items", seq: 1, items: [{ id: "old" }] });
  s = listReducer(s, { type: "end", seq: 1, nextCursor: "x", hasMore: true });
  s = listReducer(s, { type: "error", seq: 1, error: "late failure" });
  assert.deepEqual(s.items, []);
  assert.equal(s.status, "loading");
  assert.equal(s.error, null);
  assert.equal(listReducer(s, { type: "start", seq: 1, mode: "append" }), s, "an older sequence cannot restart");
  s = run(s, [{ type: "items", seq: 2, items: [{ id: "new" }] }, { type: "end", seq: 2, nextCursor: null, hasMore: false }]);
  assert.deepEqual(s.items.map((x) => x.id), ["new"]);
});

test("list state: load more appends without duplicates and keeps the total", () => {
  const key = (x) => x.id;
  let s = run(S(), [
    { type: "start", seq: 1, mode: "replace" },
    { type: "items", seq: 1, items: [{ id: "a" }, { id: "b" }] },
    { type: "end", seq: 1, nextCursor: "c", hasMore: true, total: 3 },
    { type: "start", seq: 2, mode: "append" },
  ], key);
  assert.equal(s.stale, false, "load more never marks rows stale");
  s = run(s, [{ type: "items", seq: 2, items: [{ id: "b" }, { id: "c" }] }, { type: "end", seq: 2, nextCursor: null, hasMore: false }], key);
  assert.deepEqual(s.items.map((x) => x.id), ["a", "b", "c"]);
  assert.equal(s.total, 3);
  assert.equal(s.hasMore, false);
});

test("list state: an empty first page clears the rows; errors keep them; cache restore then refresh", () => {
  let s = run(S({ items: [{ id: "a" }], status: "done" }), [{ type: "start", seq: 1, mode: "replace" }, { type: "end", seq: 1, nextCursor: null, hasMore: false }]);
  assert.deepEqual(s.items, []);
  s = run(S({ items: [{ id: "a" }], status: "done" }), [{ type: "start", seq: 1, mode: "append" }, { type: "error", seq: 1, error: "Network down" }]);
  assert.deepEqual(s.items.map((x) => x.id), ["a"]);
  assert.equal(s.error, "Network down");
  s = run(S(), [
    { type: "start", seq: 1, mode: "replace" },
    { type: "restore", seq: 1, snapshot: { items: [{ id: "cached" }], nextCursor: "n", hasMore: true, total: null, meta: { csms: ["x"] } } },
  ]);
  assert.deepEqual(s.items.map((x) => x.id), ["cached"], "the cached first page shows at once");
  assert.equal(s.stale, false);
  s = listReducer(s, { type: "items", seq: 1, items: [{ id: "fresh" }] });
  assert.deepEqual(s.items.map((x) => x.id), ["fresh"], "the fresh answer replaces the cached page");
});

test("count label", () => {
  assert.equal(countLabel(40, 312, true, "members"), "Showing 40 of 312");
  assert.equal(countLabel(40, null, true, "members"), "40 shown, more available");
  assert.equal(countLabel(12, 12, false, "members"), "12 members");
  assert.equal(countLabel(1, null, false, "members"), "1 member");
  assert.equal(countLabel(1, null, false, "opportunities"), "1 opportunity");
});

test("list source: meta, items per chunk, end line; error lines throw after their items", () => {
  const got = { meta: [], items: [] };
  const cb = { onMeta: (m) => got.meta.push(m), onItems: (i) => got.items.push(i) };
  const tail = dispatchLines([{ type: "meta", csms: ["a"] }, { type: "item", item: 1 }, { type: "item", item: 2 }, { type: "end", nextCursor: "n", hasMore: true }], cb);
  assert.deepEqual(got.meta, [{ csms: ["a"] }]);
  assert.deepEqual(got.items, [[1, 2]], "one callback per chunk");
  assert.deepEqual(tail, { nextCursor: "n", hasMore: true, total: null });
  assert.throws(() => dispatchLines([{ type: "item", item: 3 }, { type: "error", error: "Boom" }], cb), /Boom/);
  assert.deepEqual(got.items.at(-1), [3]);
  assert.deepEqual(listParams({ q: " ana ", filters: { status: "active", csm: "" }, sort: "name", dir: "asc", cursor: null, limit: 25 }, { owner: "me" }), {
    owner: "me", status: "active", q: "ana", sort: "name", dir: "asc", limit: 25, stream: 1,
  });
});

function fakeClient(make) {
  const calls = [];
  return { calls, open: async (path, opts) => { calls.push({ path, opts }); return make(opts); } };
}

test("list source: streams NDJSON chunk by chunk and falls back to a JSON page", async () => {
  const enc = new TextEncoder();
  const chunks = ['{"type":"meta","total":3}\n{"type":"item","item":{"id":"a"}}\n{"type":"item","it', 'em":{"id":"b"}}\n', '{"type":"end","nextCursor":"c2","hasMore":true}\n'];
  const client = fakeClient(() => new Response(new ReadableStream({ start(c) { for (const x of chunks) c.enqueue(enc.encode(x)); c.close(); } }), { headers: { "Content-Type": "application/x-ndjson" } }));
  const batches = [];
  const tail = await apiListSource(client, "/api/x")({ q: "", filters: {}, cursor: null, limit: 2, signal: new AbortController().signal }, { onMeta: () => {}, onItems: (i) => batches.push(i.map((x) => x.id)) });
  assert.deepEqual(batches, [["a"], ["b"]], "rows arrive as their chunk completes");
  assert.deepEqual(tail, { nextCursor: "c2", hasMore: true, total: null });
  assert.equal(client.calls[0].opts.query.stream, 1);

  const json = fakeClient(() => new Response(JSON.stringify({ items: [{ id: "x" }], nextCursor: null, hasMore: false, total: 1, owners: ["o"] }), { headers: { "Content-Type": "application/json" } }));
  const meta = [];
  const t2 = await apiListSource(json, "/api/y")({ q: "", filters: {}, cursor: null, limit: 2, signal: new AbortController().signal }, { onMeta: (m) => meta.push(m), onItems: () => {} });
  assert.deepEqual(t2, { nextCursor: null, hasMore: false, total: 1 });
  assert.deepEqual(meta, [{ owners: ["o"] }]);
});

test("list source: an abort stops reading the stream", async () => {
  const enc = new TextEncoder();
  let pulled = 0;
  const ctrl = new AbortController();
  const body = new ReadableStream({
    pull(c) {
      pulled++;
      c.enqueue(enc.encode(`{"type":"item","item":{"id":"${pulled}"}}\n`));
      if (pulled === 2) ctrl.abort();
      if (pulled > 50) c.close();
    },
  });
  const client = fakeClient(() => new Response(body, { headers: { "Content-Type": "application/x-ndjson" } }));
  const tail = await apiListSource(client, "/api/z")({ q: "", filters: {}, cursor: null, limit: 2, signal: ctrl.signal }, { onMeta: () => {}, onItems: () => {} });
  assert.deepEqual(tail, { nextCursor: null, hasMore: false });
  assert.ok(pulled <= 4, `read ${pulled} chunks after the abort`);
});

test("memory source: search, filters, sort and offset cursor for the mocks", async () => {
  const rows = [{ id: "1", name: "Ana Peñas", s: "open" }, { id: "2", name: "Laura Núñez", s: "open" }, { id: "3", name: "Ana Solís", s: "done" }];
  const src = memoryListSource(async () => rows, { search: (r) => [r.name], filters: { s: (r, v) => r.s === v }, sorts: { name: (r) => r.name } });
  const items = [];
  const t = await src({ q: "ana", filters: { s: "open" }, sort: "name", dir: "asc", cursor: null, limit: 5, signal: new AbortController().signal }, { onMeta: () => {}, onItems: (i) => items.push(...i) });
  assert.deepEqual(items.map((r) => r.id), ["1"]);
  assert.equal(t.hasMore, false);
  const page = [];
  const t2 = await src({ q: "", filters: {}, sort: "name", dir: "desc", cursor: null, limit: 2, signal: new AbortController().signal }, { onMeta: () => {}, onItems: (i) => page.push(...i) });
  assert.deepEqual(page.map((r) => r.id), ["2", "3"]);
  assert.equal(t2.nextCursor, "2");
});
