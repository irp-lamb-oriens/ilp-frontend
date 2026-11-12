// Run: npm test. SYNC: the device copy, the keep/never-keep policy and the outbox.
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./tsResolve.mjs", import.meta.url);

const L = await import("../src/lib/sync/localStore.ts");
const P = await import("../src/lib/sync/policy.ts");
const O = await import("../src/lib/sync/outbox.ts");

/** A localStorage stand-in; `quota` makes setItem throw like a full disk. */
function memoryKV(quota = Infinity) {
  const m = new Map();
  const size = () => [...m.values()].reduce((n, v) => n + v.length, 0);
  return {
    get length() {
      return m.size;
    },
    key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem(k, v) {
      if (size() - (m.get(k)?.length ?? 0) + v.length > quota) throw new Error("QuotaExceededError");
      m.set(k, v);
    },
    removeItem: (k) => void m.delete(k),
    raw: m,
  };
}

const A = L.sessionSpace("client", "token-of-anna");
const B = L.sessionSpace("client", "token-of-ben");

test("sync store: one compartment per sign-in, and the token is never written", () => {
  const kv = memoryKV();
  const store = L.createLocalStore(kv);
  assert.notEqual(A, B);
  assert.equal(store.write(A, "/api/me/home", '{"name":"Anna"}', 1000), "stored");
  assert.equal(store.read(B, "/api/me/home", 1000), null);
  assert.deepEqual(store.read(A, "/api/me/home", 2000), { path: "/api/me/home", at: 1000, body: '{"name":"Anna"}' });
  assert.equal(store.read(A, "/api/me/home?x=1", 2000), null);
  const everything = [...kv.raw.entries()].flat().join(" ");
  assert.ok(!everything.includes("token-of-anna"));
});

test("sync store: the diff. An identical answer only moves its time; a changed one replaces it", () => {
  const store = L.createLocalStore(memoryKV());
  store.write(A, "/api/x", '{"n":1}', 1000);
  assert.equal(store.write(A, "/api/x", '{"n":1}', 5000), "same");
  assert.equal(store.read(A, "/api/x", 5000).at, 5000);
  assert.equal(store.write(A, "/api/x", '{"n":2}', 6000), "stored"); // changed on another device
  assert.equal(store.read(A, "/api/x", 6000).body, '{"n":2}');
});

test("sync store: a change empties the saved answers; sign-out empties everything; sweep clears dead sign-ins", () => {
  const store = L.createLocalStore(memoryKV());
  for (const s of [A, B]) {
    store.write(s, "/api/a", "1", 1);
    store.write(s, "/api/b", "2", 1);
    store.writeOutbox(s, [{ id: "c_1" }]);
  }
  store.expire(B); // a change that may not have arrived: ask again, keep as cover
  assert.deepEqual(store.read(B, "/api/a", 2), { path: "/api/a", at: 1, body: "1", expired: true });
  assert.equal(store.write(B, "/api/a", "1", 2), "same");
  assert.equal(store.read(B, "/api/a", 2).expired, undefined);
  store.invalidate(A);
  assert.equal(store.read(A, "/api/a", 2), null);
  assert.equal(store.readOutbox(A).length, 1); // unsent changes survive a refresh of the answers
  assert.ok(store.read(B, "/api/a", 2));

  assert.equal(store.dropSession(A), 1);
  assert.equal(store.readOutbox(A).length, 0);

  store.sweep([A]); // B's sign-in no longer exists in this browser
  assert.equal(store.read(B, "/api/a", 2), null);
  assert.equal(store.readOutbox(B).length, 0);
  assert.deepEqual(store.stats(), { entries: 0, chars: 0 });
});

test("sync store: limits. Oldest answers go first, big answers are not kept, old answers expire, a full disk never throws", () => {
  const store = L.createLocalStore(memoryKV(), { maxEntries: 3, maxEntryChars: 50, maxChars: 10_000, maxAgeMs: 1000 });
  for (let i = 1; i <= 4; i++) store.write(A, `/api/${i}`, `"${i}"`, i);
  assert.equal(store.read(A, "/api/1", 5), null);
  assert.ok(store.read(A, "/api/4", 5));
  assert.equal(store.stats().entries, 3);
  assert.equal(store.write(A, "/api/big", "x".repeat(51), 5), "skipped");
  assert.equal(store.read(A, "/api/4", 2000), null); // older than maxAgeMs

  const tight = L.createLocalStore(memoryKV(180));
  assert.equal(tight.write(A, "/api/a", "a".repeat(80), 1), "stored");
  assert.equal(tight.write(A, "/api/b", "b".repeat(80), 2), "stored"); // made room by dropping /api/a
  assert.equal(tight.read(A, "/api/a", 3), null);
  assert.equal(tight.write(A, "/api/c", "c".repeat(400), 3), "skipped");

  const none = L.createLocalStore(null); // storage blocked: everything is a miss, nothing throws
  assert.equal(none.write(A, "/api/a", "1"), "skipped");
  assert.equal(none.read(A, "/api/a"), null);
  assert.equal(none.writeOutbox(A, [{ id: "x" }]), false);
});

test("sync policy: what is never kept on the device", () => {
  for (
    const p of [
      "/api/client-status/auth/verify-otp",
      "/api/payments/plan",
      "/api/client-status/me/slots?matterId=1",
      "/api/client-status/me/documents/d1/file",
      "/api/partner/me/payout-details",
      "/api/dashboard/referrals/partners/p1/bank",
      "/api/client-status/me/lily",
      "/api/journey/behavior",
      "/api/download-ticket",
      "/api/dashboard/export",
      "/health/deep",
      "https://elsewhere.example/api/x",
    ]
  ) assert.equal(P.freshFor(p), null, p);
  assert.equal(P.freshFor("/api/client-status/me/home"), P.FRESH_MS);
  assert.equal(P.freshFor("/api/dashboard/clients?page=2"), P.FRESH_MS);
  assert.equal(P.freshFor("/api/dashboard/journeys/behavior/pages?from=2026-11-01"), P.FRESH_REPORT_MS);
  assert.equal(P.freshFor("/api/dashboard/finance/summary"), P.FRESH_REPORT_MS);
  assert.deepEqual([null, 502, 503, 504, 500, 400, 401, 409].map(P.isUnreachable), [true, true, true, true, false, false, false, false]);
});

function outboxWith(results, now = () => 1000) {
  const store = L.createLocalStore(memoryKV());
  const sends = [];
  const events = [];
  const box = O.createOutbox({
    store,
    now,
    emit: (e) => events.push(e),
    send: (item) => {
      sends.push(item.id);
      const r = results.shift() ?? { kind: "sent" };
      return typeof r === "function" ? r() : Promise.resolve(r);
    },
  });
  return { store, sends, events, box };
}
const item = (id, label = "Your details") => ({ id, role: "client", method: "PATCH", path: "/api/me/profile", body: { n: id }, label });

test("outbox: a change leaves only when the server answered; order is kept", async () => {
  const { box, sends, events, store } = outboxWith([{ kind: "sent" }, { kind: "retry" }]);
  for (const id of ["c_1", "c_2", "c_3"]) assert.equal(box.add(A, item(id)), true);
  assert.equal(box.add(A, item("c_1")), true); // the same change twice is one change
  assert.equal(box.waiting(A), 3);

  assert.deepEqual(await box.flush(A), { sent: 1, rejected: 0, waiting: 2 });
  assert.deepEqual(sends, ["c_1", "c_2"]); // c_3 waits behind c_2
  assert.equal(store.readOutbox(A)[0].tries, 1);

  assert.deepEqual(await box.flush(A), { sent: 2, rejected: 0, waiting: 0 });
  assert.deepEqual(sends, ["c_1", "c_2", "c_2", "c_3"]); // same key on the second attempt
  assert.deepEqual(events.map((e) => e.type), ["queued", "queued", "queued", "sent", "sent", "sent"]);
});

test("outbox: refused changes are removed and reported; a thrown sender means try later; old changes expire", async () => {
  let t = 1000;
  const { box, events, sends } = outboxWith([
    { kind: "rejected", reason: "Name is required." },
    () => Promise.reject(new Error("offline")),
  ], () => t);
  box.add(A, item("c_1", "Your name"));
  box.add(A, item("c_2"));
  assert.deepEqual(await box.flush(A), { sent: 0, rejected: 1, waiting: 1 });
  assert.deepEqual(events.at(-1), { type: "rejected", waiting: 1, label: "Your name", reason: "Name is required." });

  t += O.OUTBOX_MAX_AGE_MS + 1;
  assert.deepEqual(await box.flush(A), { sent: 0, rejected: 0, waiting: 0 });
  assert.deepEqual(events.at(-1), { type: "lost", count: 1 });
  assert.equal(sends.length, 2); // the expired change was never sent again
});

test("outbox: two flushes at once send each change once; a full outbox says no; other sign-ins are untouched", async () => {
  let release;
  const { box, sends, store } = outboxWith([() => new Promise((r) => (release = () => r({ kind: "sent" })))]);
  box.add(A, item("c_1"));
  box.add(B, item("c_9"));
  const one = box.flush(A);
  const two = box.flush(A);
  release();
  assert.deepEqual(await one, await two);
  assert.deepEqual(sends, ["c_1"]);
  assert.equal(store.readOutbox(B).length, 1);

  for (let i = 0; i < O.OUTBOX_MAX_ITEMS; i++) box.add(A, item(`c_fill_${i}`));
  assert.equal(box.add(A, item("c_one_too_many")), false);
  assert.match(O.newChangeKey(), /^[A-Za-z0-9_-]{16,80}$/);
  assert.notEqual(O.newChangeKey(), O.newChangeKey());
});
