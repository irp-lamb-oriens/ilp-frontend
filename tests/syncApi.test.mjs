// Run: npm test. SYNC through the API client (src/lib/api.ts): the device copy
// on GET, receipts and retries on changes, the outbox, and sign-out.
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./tsResolve.mjs", import.meta.url);

const store = new Map();
const events = [];
globalThis.window = {
  localStorage: {
    get length() {
      return store.size;
    },
    key: (i) => [...store.keys()][i] ?? null,
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  },
  location: { pathname: "/status", search: "", assign: () => {} },
  dispatchEvent: (e) => events.push(e.detail),
  addEventListener: () => {},
  removeEventListener: () => {},
};

const calls = [];
let reply;
const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "X-ILP-Sync": "1", ...headers } });
globalThis.fetch = async (url, init) => {
  const h = new Headers(init?.headers);
  const call = { url: String(url).replace(/^https?:\/\/[^/]+/, ""), method: init?.method ?? "GET", key: h.get("Idempotency-Key"), body: init?.body };
  calls.push(call);
  return reply(call);
};

const api = await import("../src/lib/api.ts");
const sync = await import("../src/lib/sync/index.ts");
const runtime = await import("../src/lib/sync/runtime.ts");
const { createApiClient, setRoleToken, ApiError } = api;
const client = createApiClient("client");
const gets = () => calls.filter((c) => c.method === "GET").length;
const down = () => {
  throw new TypeError("Failed to fetch");
};
const realNow = Date.now;

beforeEach(() => {
  Date.now = realNow;
  for (const r of ["staff", "lawyer", "client", "csm", "partner"]) api.clearRoleToken(r);
  store.clear();
  calls.length = 0;
  events.length = 0;
  runtime.setServerReceipts(false);
  setRoleToken("client", "tok-anna");
  reply = () => json({ n: calls.length });
});

test("GET: asked twice in a row is one request; asked together is one request; no-store always asks", async () => {
  const [a, b] = await Promise.all([client.get("/api/client-status/me/home"), client.get("/api/client-status/me/home")]);
  const c = await client.get("/api/client-status/me/home");
  assert.deepEqual([a, b, c], [{ n: 1 }, { n: 1 }, { n: 1 }]);
  assert.equal(gets(), 1);
  await client.get("/api/client-status/me/home", { query: { matterId: "m2" } }); // another question
  await client.get("/api/client-status/me/home", { cache: "no-store" });
  await client.get("/api/client-status/me/slots");
  await client.get("/api/client-status/me/slots"); // never kept
  assert.equal(gets(), 5);
});

test("GET: after the fresh window the server is asked again, and a change made elsewhere replaces the copy", async () => {
  await client.get("/api/client-status/me/home");
  Date.now = () => realNow() + 16_000;
  reply = () => json({ changedOnMyPhone: true });
  assert.deepEqual(await client.get("/api/client-status/me/home"), { changedOnMyPhone: true });
  assert.deepEqual(await client.get("/api/client-status/me/home"), { changedOnMyPhone: true });
  assert.equal(gets(), 2);
});

test("GET: server unreachable. The last answer is shown and labelled; a real refusal is not papered over", async () => {
  await client.get("/api/client-status/me/money");
  Date.now = () => realNow() + 60_000;
  reply = down;
  assert.deepEqual(await client.get("/api/client-status/me/money"), { n: 1 });
  reply = () => json({ error: "quota", code: "database_quota" }, 503);
  assert.deepEqual(await client.get("/api/client-status/me/money"), { n: 1 });
  assert.equal(events.filter((e) => e.type === "stale").length, 2);

  reply = down;
  await assert.rejects(client.get("/api/client-status/me/never-seen")); // nothing saved: the error shows
  reply = () => json({ error: "Not allowed" }, 403);
  await assert.rejects(client.get("/api/client-status/me/money"), (e) => e instanceof ApiError && e.status === 403);
  reply = down;
  await assert.rejects(client.get("/api/client-status/me/money")); // the 403 removed the copy

  reply = () => json({ back: true });
  await client.get("/api/client-status/me/home");
  assert.equal(events.at(-1).type, "live");
});

test("session check: always asked, so a revoked session shows at once; the copy only covers an unreachable server", async () => {
  reply = () => json({ viewer: "anna" });
  assert.equal((await client.session("/api/client-status/me")).state, "ready");
  reply = () => json({ error: "No access" }, 403);
  assert.equal((await client.session("/api/client-status/me")).state, "denied");
  reply = () => json({ viewer: "anna" });
  await client.session("/api/client-status/me");
  reply = () => json({ code: "database_quota" }, 503);
  assert.deepEqual(await client.session("/api/client-status/me"), { state: "ready", me: { viewer: "anna" } });
  assert.equal(gets(), 4);
});

test("changes: a change empties the saved answers, for this sign-in only", async () => {
  setRoleToken("lawyer", "tok-lawyer");
  const lawyer = createApiClient("lawyer");
  await client.get("/api/client-status/me/home");
  await lawyer.get("/api/provider/board");
  await client.post("/api/client-status/me/messages", { body: "hi" });
  await client.get("/api/client-status/me/home");
  await lawyer.get("/api/provider/board");
  assert.equal(gets(), 3);

  reply = (c) => (c.method === "PATCH" ? json({ error: "Name is required" }, 400) : json({ ok: 1 }));
  await assert.rejects(client.patch("/api/client-status/me/profile", {}));
  await client.get("/api/client-status/me/home"); // a refused change changed nothing: the copy stays
  assert.equal(gets(), 3);
});

test("changes: no key until the server announces receipts; then one key per change, kept across retries", async () => {
  runtime.setServerReceipts(false);
  store.delete("ilp_sync:receipts");
  reply = () => new Response("{}", { status: 200 }); // an older server: no X-ILP-Sync
  await client.post("/api/client-status/me/messages", { body: "1" });
  assert.equal(calls.at(-1).key, null);

  reply = () => json({ ok: true });
  await client.get("/api/client-status/me/home"); // the server announces receipts
  let fails = 2;
  reply = () => (fails-- > 0 ? down() : json({ saved: true }));
  assert.deepEqual(await client.post("/api/client-status/me/messages", { body: "2" }), { saved: true });
  const posts = calls.filter((c) => c.method === "POST").slice(1);
  assert.equal(posts.length, 3);
  assert.match(posts[0].key, /^c_[a-z0-9]{20,}$/);
  assert.deepEqual(new Set(posts.map((p) => p.key)).size, 1);

  await client.post("/api/client-status/me/messages", { body: "3" });
  assert.notEqual(calls.at(-1).key, posts[0].key);
  await createApiClient("customer").post("/api/leads", { email: "x" }); // signed-out calls carry no key
  assert.equal(calls.at(-1).key, null);
});

test("outbox: unreachable server keeps the change; the next page view sends it with the same key, once", async () => {
  runtime.setServerReceipts(true);
  reply = down;
  const out = await sync.sendOrQueue("client", "PATCH", "/api/client-status/me/profile", { values: { city: "Nosara" } }, "Your details");
  assert.deepEqual(out, { queued: true });
  assert.equal(sync.waitingChanges("client"), 1);
  const key = calls.at(-1).key;
  assert.deepEqual(events.at(-1), { type: "queued", waiting: 1, label: "Your details" });
  // The page still opens from the device copy while the change waits.
  reply = () => json({ city: "Old" });
  await client.get("/api/client-status/me/home");
  reply = down;
  await assert.rejects(client.patch("/api/client-status/me/other", {}));
  assert.deepEqual(await client.get("/api/client-status/me/home"), { city: "Old" });
  assert.equal(events.at(-1).type, "stale");

  await sync.flushOutbox(); // still down: it stays
  assert.equal(sync.waitingChanges("client"), 1);

  calls.length = 0;
  reply = () => json({ completeness: 80 }, 200, { "Idempotency-Replayed": "true" });
  await sync.flushOutbox();
  assert.equal(sync.waitingChanges("client"), 0);
  assert.deepEqual(calls.map((c) => [c.method, c.key === key, c.body]), [["PATCH", true, '{"values":{"city":"Nosara"}}']]);
  assert.deepEqual(events.at(-1), { type: "sent", waiting: 0, label: "Your details" });
  await sync.flushOutbox();
  assert.equal(calls.length, 1);
});

test("outbox: a refusal is reported, a server that answers normally never queues, an old server never queues", async () => {
  runtime.setServerReceipts(true);
  reply = () => json({ error: "City is too long" }, 400);
  await assert.rejects(sync.sendOrQueue("client", "PATCH", "/api/client-status/me/profile", {}, "Your details"), (e) => e.status === 400);
  assert.equal(sync.waitingChanges("client"), 0);

  reply = () => json({ completeness: 90 });
  assert.deepEqual(await sync.sendOrQueue("client", "PATCH", "/api/client-status/me/profile", {}, "Your details"), { queued: false, data: { completeness: 90 } });

  runtime.setServerReceipts(false);
  reply = down;
  await assert.rejects(sync.sendOrQueue("client", "PATCH", "/api/client-status/me/profile", {}, "Your details"));
  assert.equal(sync.waitingChanges("client"), 0);
});

test("sign-out and 401: the device copy and waiting changes of that sign-in are removed; another person never sees them", async () => {
  runtime.setServerReceipts(true);
  await client.get("/api/client-status/me/home");
  reply = down;
  await sync.sendOrQueue("client", "PATCH", "/api/client-status/me/profile", { values: {} }, "Your details");
  assert.ok([...store.keys()].some((k) => k.startsWith("ilp_sync:c:")));
  assert.ok(![...store.entries()].filter(([k]) => k.startsWith("ilp_sync:")).flat().join(" ").includes("tok-anna"));

  reply = () => json({ error: "Session ended" }, 401);
  await assert.rejects(client.get("/api/client-status/me/documents", { on401: "throw" }));
  assert.deepEqual([...store.keys()].filter((k) => k.startsWith("ilp_sync:c:") || k.startsWith("ilp_sync:o:")), []);
  assert.deepEqual(events.at(-1), { type: "lost", count: 1 });

  setRoleToken("client", "tok-ben"); // the next person on this computer
  reply = down;
  await assert.rejects(client.get("/api/client-status/me/home"));
});
