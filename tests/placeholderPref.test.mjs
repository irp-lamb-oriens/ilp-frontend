// Run: npm test. "Exclude placeholder data" (src/lib/placeholderPref.ts): one
// choice for every staff and CSM page, added to each read by lib/api.ts.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SRC = join(dirname(fileURLToPath(import.meta.url)), "..", "src");
const read = (p) => readFileSync(join(SRC, p), "utf8");

// A browser-like storage for the module (it reads window.localStorage).
const store = new Map();
const listeners = [];
globalThis.window = {
  localStorage: { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)) },
  addEventListener: (type, fn) => type === "storage" && listeners.push(fn),
};
const pref = await import("../src/lib/placeholderPref.ts");

test("placeholder choice: off by default, remembered, announced to subscribers", () => {
  pref.resetPlaceholderPref();
  assert.equal(pref.getExcludePlaceholder(), false);
  let calls = 0;
  const off = pref.subscribeExcludePlaceholder(() => calls++);
  pref.setExcludePlaceholder(true);
  assert.equal(pref.getExcludePlaceholder(), true);
  assert.equal(store.get(pref.EXCLUDE_PLACEHOLDER_KEY), "1");
  pref.setExcludePlaceholder(true);
  assert.equal(calls, 1, "no change, no announcement");
  // Another tab turns it off.
  store.set(pref.EXCLUDE_PLACEHOLDER_KEY, "0");
  for (const fn of listeners) fn({ key: pref.EXCLUDE_PLACEHOLDER_KEY });
  assert.equal(pref.getExcludePlaceholder(), false);
  assert.equal(calls, 2);
  off();
  pref.setExcludePlaceholder(true);
  assert.equal(calls, 2, "unsubscribed");
  assert.equal(pref.serverExcludePlaceholder(), false, "the server render never excludes");
});

test("placeholder choice: added to API reads only, never twice, never to sign-in paths", () => {
  pref.setExcludePlaceholder(true);
  assert.equal(pref.withPlaceholderScope("/api/dashboard/staff/summary"), "/api/dashboard/staff/summary?excludePlaceholder=1");
  assert.equal(pref.withPlaceholderScope("/api/staff/matters?limit=20"), "/api/staff/matters?limit=20&excludePlaceholder=1");
  assert.equal(pref.withPlaceholderScope("/api/x?excludePlaceholder=0"), "/api/x?excludePlaceholder=0");
  assert.equal(pref.withPlaceholderScope("/api/dashboard/auth/check"), "/api/dashboard/auth/check");
  assert.equal(pref.withPlaceholderScope("/somewhere/else"), "/somewhere/else");
  pref.setExcludePlaceholder(false);
  assert.equal(pref.withPlaceholderScope("/api/dashboard/staff/summary"), "/api/dashboard/staff/summary");
});

test("placeholder choice: the API client applies it to staff and CSM GETs, and both portal frames show the switch", () => {
  const api = read("lib/api.ts");
  assert.match(api, /role === "staff" \|\| role === "csm"/);
  assert.match(api, /if \(method !== "GET"\) return path;/, "changes are never scoped");
  for (const use of ["localGet<T>(scoped(path, options)", "send(scoped(path, options), options)", 'send(scoped(path, { ...options, method: "GET" })']) {
    assert.ok(api.includes(use), `lib/api.ts: ${use}`);
  }
  for (const frame of ["components/dashboard/staff/StaffSession.tsx", "components/csm/CsmFrame.tsx"]) {
    const src = read(frame);
    assert.match(src, /<PlaceholderDataNotice \/>/, `${frame} shows the notice`);
    assert.match(src, /<PlaceholderScope>\{children\}<\/PlaceholderScope>/, `${frame} re-reads the page when the choice changes`);
  }
});

test("placeholder choice: no staff screen keeps its own copy of the switch or the parameter", () => {
  const walk = (dir) => readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)]));
  const bad = [];
  for (const dir of ["components/dashboard", "components/csm"]) {
    for (const file of walk(join(SRC, dir)).filter((f) => /\.tsx?$/.test(f))) {
      if (file.endsWith("staff/PlaceholderData.tsx")) continue;
      const text = readFileSync(file, "utf8");
      if (/excludePlaceholder|ilp_staff_exclude_placeholder/.test(text)) bad.push(file.slice(SRC.length + 1));
    }
  }
  assert.deepEqual(bad, [], "use the shell switch (staff/PlaceholderData.tsx); lib/api.ts adds the parameter");
});
