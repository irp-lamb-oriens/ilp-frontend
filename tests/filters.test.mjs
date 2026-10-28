// Run: npm test. FILTERS: shared list schema, filter params, URL round-trip, saved views, the schema memory source (docs/workstreams/LISTS.md).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { register } from "node:module";

register("./tsResolve.mjs", import.meta.url);

const L = await import("../src/lib/listSchemas.ts");
const { viewsReducer, matchingView, schemaParamKeys, defaultHiddenColumns } = await import("../src/lib/listViews.ts");
const { listUrlParams, readListUrl } = await import("../src/lib/listUrl.ts");
const { schemaMemorySource, schemaFiltersOf } = await import("../src/lib/schemaSource.ts");

const SCHEMA = L.defineListSchema({
  id: "t",
  fields: [
    { key: "name", label: "Name", type: "text", searchable: true, sortable: true },
    { key: "stage", label: "Stage", type: "enum", serverParam: "stage", quick: true },
    { key: "value", label: "Value", type: "number", unit: "cents", sortable: "amount" },
    { key: "due", label: "Due", type: "date", sortable: true },
    { key: "ready", label: "Ready", type: "boolean" },
    { key: "owner", label: "Owner", type: "person", defaultVisible: false },
  ],
});

test("schema validation: unknown field and unknown operator are refused", () => {
  assert.throws(() => L.parseFilterParams(SCHEMA, { "f.nope": "eq:1" }), L.ListSchemaError);
  assert.throws(() => L.parseFilterParams(SCHEMA, { "f.stage": "like:x" }), /Unknown filter operator/);
  assert.throws(() => L.parseFilterParams(SCHEMA, { "f.ready": "in:1" }), /cannot be filtered/);
  assert.throws(() => L.defineListSchema({ id: "x", fields: [{ key: "a", label: "A", type: "date", operators: ["contains"] }] }), L.ListSchemaError);
  assert.equal(L.parseFilterParams(SCHEMA, { stage: "x", q: "y" }).length, 0, "other params are not schema filters");
});

test("filter → query: index param for a single value, f.* for the rest; empty filters dropped", () => {
  assert.deepEqual(
    L.filterParams(SCHEMA, {
      stage: { op: "in", values: ["intake"] },
      value: { op: "range", min: "10000", max: "50000" },
      due: { op: "before", value: "2026-11-01" },
      ready: { op: "boolean", value: false },
      owner: { op: "in", values: [] },
    }),
    { stage: "intake", "f.value": "range:10000..50000", "f.due": "before:2026-11-01", "f.ready": "is:0" },
  );
  assert.deepEqual(L.filterParams(SCHEMA, { stage: { op: "in", values: ["a,b", "c"] } }), { "f.stage": "in:a%2Cb,c" });
});

test("URL round-trip: list state → query string → list state", () => {
  const keys = schemaParamKeys(SCHEMA, ["open"]);
  assert.ok(keys.includes("f.stage") && keys.includes("stage") && keys.includes("open"));
  const state = {
    q: "ana peñas",
    filters: { ...L.filterParams(SCHEMA, { stage: { op: "in", values: ["intake", "review"] }, due: { op: "range", min: "2026-10-01" } }), open: "1" },
    sort: { key: "amount", dir: "desc" },
  };
  const qs = listUrlParams(state, keys).toString();
  const back = readListUrl(new URLSearchParams(qs), keys);
  assert.deepEqual(back, state);
  const filters = L.readFilterParams(SCHEMA, { get: (k) => back.filters[k] ?? null });
  assert.deepEqual(filters, { stage: { op: "in", values: ["intake", "review"] }, due: { op: "range", min: "2026-10-01" } });
  assert.equal(listUrlParams({ q: "", filters: { open: "1" }, sort: undefined }, keys, { filters: { open: "1" } }).toString(), "", "defaults stay out of the URL");
});

test("saved views reducer: save, replace by name, select, rename, delete, Default", () => {
  let s = { views: [], activeId: null };
  const snap = (q, stage) => ({ q, filters: { stage, empty: "" }, sort: { key: "due", dir: "asc" } });
  s = viewsReducer(s, { type: "save", name: "  Intake  ", snapshot: snap("ana", "intake"), id: "v1" });
  assert.equal(s.views.length, 1);
  assert.equal(s.views[0].name, "Intake");
  assert.deepEqual(s.views[0].filters, { stage: "intake" }, "empty params are not stored");
  assert.equal(s.activeId, "v1");
  s = viewsReducer(s, { type: "save", name: "intake", snapshot: snap("", "review"), id: "v2" });
  assert.equal(s.views.length, 1, "same name replaces");
  assert.equal(s.views[0].filters.stage, "review");
  assert.equal(viewsReducer(s, { type: "save", name: "Default", snapshot: snap("", "x") }), s, "Default is reserved");
  s = viewsReducer(s, { type: "save", name: "Mine", snapshot: snap("", "closing"), id: "v3" });
  s = viewsReducer(s, { type: "rename", id: "v3", name: "My closings" });
  assert.equal(s.views[1].name, "My closings");
  s = viewsReducer(s, { type: "select", id: "nope" });
  assert.equal(s.activeId, "v3", "unknown id is ignored");
  s = viewsReducer(s, { type: "delete", id: "v3" });
  assert.equal(s.activeId, null, "deleting the active view falls back to Default");
  const defaults = { q: "", filters: {}, sort: { key: "due", dir: "asc" } };
  assert.equal(matchingView(s, defaults, defaults), null, "defaults are the Default view");
  assert.equal(matchingView(s, { q: "", filters: { stage: "review" }, sort: { key: "due", dir: "asc" } }, defaults)?.id, "v1");
  assert.equal(matchingView(s, { q: "x", filters: {}, sort: undefined }, defaults), undefined, "edited");
  assert.deepEqual(defaultHiddenColumns(SCHEMA, ["name", "owner", "stage"]), ["owner"]);
});

test("schema memory source: filters, search, sort with blanks last, offset pages, schema meta with counts", async () => {
  const rows = [
    { id: "a", name: "Ana Peñas", stage: "intake", value: 12000, due: "2026-10-30", ready: true, owner: "lu" },
    { id: "b", name: "Robert Hayes", stage: "review", value: 50000, ready: false },
    { id: "c", name: "Laura Núñez", stage: "intake", value: 80000, due: "2026-11-03", ready: true, owner: "mo" },
  ];
  const src = schemaMemorySource(SCHEMA, () => rows);
  const run = async (req) => {
    const got = [];
    let meta = null;
    const tail = await src({ q: "", filters: {}, cursor: null, limit: 10, signal: new AbortController().signal, ...req }, { onMeta: (m) => (meta = m), onItems: (i) => got.push(...i) });
    return { ids: got.map((r) => r.id), tail, meta };
  };
  assert.deepEqual((await run({ filters: { stage: "intake" } })).ids, ["a", "c"]);
  assert.deepEqual((await run({ filters: { "f.value": "range:20000.." } })).ids, ["b", "c"]);
  assert.deepEqual((await run({ filters: { "f.owner": "in:__none" } })).ids, ["b"]);
  assert.deepEqual((await run({ q: "nunez" })).ids, ["c"]);
  assert.deepEqual((await run({ sort: "due", dir: "desc" })).ids, ["c", "a", "b"], "blank dates last even descending");
  assert.deepEqual((await run({ sort: "amount", dir: "desc" })).ids, ["c", "b", "a"], "sort by a field's named sort key");
  const p1 = await run({ limit: 2 });
  assert.equal(p1.tail.hasMore, true);
  assert.deepEqual((await run({ limit: 2, cursor: p1.tail.nextCursor })).ids, ["c"]);
  const stage = p1.meta.schema.fields.find((f) => f.key === "stage");
  assert.deepEqual(stage.options.map((o) => [o.value, o.count]), [["intake", 2], ["review", 1]]);
  assert.equal(schemaFiltersOf(SCHEMA, { "f.stage": "bogus" }).length, 0, "a broken URL value is ignored, not thrown");
});

test("the server copy of listSchemas.ts is byte-identical", () => {
  const here = readFileSync(new URL("../src/lib/listSchemas.ts", import.meta.url), "utf8");
  const server = new URL("../../server/schemas/listSchemas.ts", import.meta.url);
  if (existsSync(server)) assert.equal(readFileSync(server, "utf8"), here);
});
