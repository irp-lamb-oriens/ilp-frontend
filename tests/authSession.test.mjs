// Run: npm test. AUTH (2026-10-29): central session rules in src/lib/api.ts.
// No token, no request; public paths; auth option; token expiry; legacy
// tokens; csm -> staff fallback; 401 handling; the four portal frames.
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { register } from "node:module";

register("./tsResolve.mjs", import.meta.url);

// Browser shims: localStorage, location, fetch.
const store = new Map();
const assigned = [];
globalThis.window = {
  localStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  },
  location: { pathname: "/dashboard", search: "", assign: (u) => assigned.push(u) },
};
const calls = [];
let reply = () => new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
globalThis.fetch = async (url, init) => {
  calls.push({ url: String(url), auth: new Headers(init?.headers).get("Authorization") });
  return reply(String(url));
};
const status = (n, body = { error: "x" }) => () => new Response(JSON.stringify(body), { status: n, headers: { "Content-Type": "application/json" } });

const api = await import("../src/lib/api.ts");
const { createApiClient, setRoleToken, getRoleToken, getSessionToken, isPublicPath, checkSession, ApiError, isLocal401 } = api;

beforeEach(() => {
  store.clear();
  calls.length = 0;
  assigned.length = 0;
  window.location.pathname = "/dashboard";
  for (const r of ["staff", "lawyer", "client", "csm"]) api.clearRoleToken(r);
  reply = status(200, { ok: true });
});

test("no token: no fetch, local ApiError 401, on401 throw", async () => {
  const csm = createApiClient("csm");
  await assert.rejects(csm.get("/api/csm/me", { on401: "throw" }), (e) => e instanceof ApiError && e.status === 401 && e.body.local === true && isLocal401(e));
  for (const r of ["staff", "lawyer", "client"]) {
    await assert.rejects(createApiClient(r).get("/api/x/me", { on401: "throw" }), (e) => e.status === 401);
  }
  assert.equal(calls.length, 0);
  assert.equal(assigned.length, 0);
});

test("no token: on401 redirect still sends the user to the role's login", async () => {
  window.location.pathname = "/lawyer/board";
  await assert.rejects(createApiClient("lawyer").get("/api/provider/board"), (e) => e.status === 401);
  assert.deepEqual(assigned, ["/lawyer?next=%2Flawyer%2Fboard"]);
  assert.equal(calls.length, 0);
});

test("server 401 with a token: token cleared, redirect applied", async () => {
  setRoleToken("lawyer", "law1");
  window.location.pathname = "/lawyer/board";
  reply = status(401);
  await assert.rejects(createApiClient("lawyer").get("/api/provider/board"), (e) => e.status === 401 && !isLocal401(e));
  assert.equal(calls.length, 1);
  assert.equal(getRoleToken("lawyer"), null);
  assert.deepEqual(assigned, ["/lawyer?next=%2Flawyer%2Fboard"]);
});

test("public paths still fetch without a token", async () => {
  for (const p of [
    "/api/dashboard/auth/request-otp",
    "/api/dashboard/auth/verify-otp",
    "/api/provider/auth/request-otp",
    "/api/client-status/auth/verify-otp",
    "/api/payments/join/tok_1/portal-session",
    "/api/payments/join",
    "/api/journey/assign?visitorId=v",
    "/api/public/anything",
    "/api/leads/claim",
  ]) {
    assert.ok(isPublicPath(p), p);
  }
  assert.ok(!isPublicPath("/api/csm/me"));
  assert.ok(!isPublicPath("/api/dashboard/auth/check"));
  assert.ok(!isPublicPath("/api/payments/me/membership"));
  await createApiClient("csm").post("/api/dashboard/auth/request-otp", { email: "a@b.c" }, { on401: "throw" });
  await createApiClient("client").post("/api/client-status/auth/verify-otp", { email: "a@b.c", code: "123456" }, { on401: "throw" });
  assert.equal(calls.length, 2);
  assert.equal(calls[0].auth, null);
});

test("auth option: optional sends without a token; none never sends one; customer defaults to none", async () => {
  await createApiClient("staff").get("/api/dashboard/metrics", { auth: "optional" });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].auth, null);
  setRoleToken("staff", "st1");
  await createApiClient("staff").get("/api/dashboard/metrics", { auth: "none" });
  assert.equal(calls[1].auth, null);
  await createApiClient("staff").get("/api/dashboard/metrics", { auth: "optional" });
  assert.equal(calls[2].auth, "Bearer st1");
  await createApiClient("customer").get("/api/templates");
  assert.equal(calls.length, 4);
});

test("expiry: stored with the token, an expired token is absent and cleared", async () => {
  setRoleToken("client", "c1", new Date(Date.now() + 60_000).toISOString());
  assert.equal(store.get("ilp_client_token_exp") !== undefined, true);
  assert.equal(getRoleToken("client"), "c1");
  setRoleToken("client", "c2", new Date(Date.now() - 1000).toISOString());
  assert.equal(getRoleToken("client"), null);
  assert.equal(store.has("ilp_client_token"), false);
  assert.equal(store.has("ilp_client_token_exp"), false);
  await assert.rejects(createApiClient("client").get("/api/client-status/me/home", { on401: "throw" }), (e) => e.status === 401);
  assert.equal(calls.length, 0);
});

test("legacy token without expiry is used; a new token without expiry drops the old expiry", async () => {
  store.set("ilp_staff_token", "legacy");
  await createApiClient("staff").get("/api/dashboard/metrics");
  assert.equal(calls[0].auth, "Bearer legacy");
  setRoleToken("staff", "a", Date.now() - 1);
  setRoleToken("staff", "b");
  assert.equal(store.has("ilp_staff_token_exp"), false);
  assert.equal(getRoleToken("staff"), "b");
});

test("csm falls back to the staff token; own csm token wins", async () => {
  window.location.pathname = "/csm";
  setRoleToken("staff", "staffTok");
  assert.deepEqual(getSessionToken("csm"), { token: "staffTok", role: "staff" });
  await createApiClient("csm").get("/api/csm/me", { on401: "throw" });
  assert.equal(calls[0].auth, "Bearer staffTok");
  // staffApi on /csm resolves to the CSM session, so it also falls back.
  await createApiClient("staff").get("/api/dashboard/staff/members/m1/timeline");
  assert.equal(calls[1].auth, "Bearer staffTok");
  setRoleToken("csm", "csmTok");
  await createApiClient("csm").get("/api/csm/me");
  assert.equal(calls[2].auth, "Bearer csmTok");
  // Fallbacks are one way: staff never uses the CSM token.
  window.location.pathname = "/dashboard";
  api.clearRoleToken("staff");
  await assert.rejects(createApiClient("staff").get("/api/dashboard/metrics", { on401: "throw" }), (e) => isLocal401(e));
  assert.equal(calls.length, 3);
});

test("401 through the fallback session leaves the staff token alone", async () => {
  window.location.pathname = "/csm";
  setRoleToken("staff", "staffTok");
  reply = status(401);
  const r = await createApiClient("csm").session("/api/csm/me");
  assert.equal(r.state, "anonymous");
  assert.equal(calls.length, 1);
  window.location.pathname = "/dashboard";
  assert.equal(getRoleToken("staff"), "staffTok");
});

test("session(): anonymous without a request, ready, denied on 403, error otherwise", async () => {
  const csm = createApiClient("csm");
  assert.equal(csm.hasSession(), false);
  assert.deepEqual(await csm.session("/api/csm/me"), { state: "anonymous", me: null });
  assert.equal(calls.length, 0);
  setRoleToken("csm", "t");
  reply = status(200, { viewer: "a@b.c" });
  assert.deepEqual((await csm.session("/api/csm/me")).me, { viewer: "a@b.c" });
  reply = status(403);
  assert.equal((await csm.session("/api/csm/me")).state, "denied");
  reply = status(500);
  assert.equal((await csm.session("/api/csm/me")).state, "error");
  assert.equal(getRoleToken("csm"), "t", "403 and 500 keep the token");
  assert.equal(assigned.length, 0, "session checks never redirect");
  // checkSession with requireToken false (demo mocks) runs the loader.
  let ran = 0;
  assert.equal((await checkSession("lawyer", async () => (ran++, { id: 1 }), { requireToken: false })).state, "ready");
  assert.equal((await checkSession("lawyer", async () => (ran++, { id: 1 }))).state, "anonymous");
  assert.equal(ran, 1);
});

test("logout through the fallback ends that session and forgets its token", async () => {
  window.location.pathname = "/csm";
  setRoleToken("staff", "staffTok");
  await createApiClient("csm").logout();
  assert.equal(calls[0].url.endsWith("/api/dashboard/auth/logout"), true);
  assert.equal(calls[0].auth, "Bearer staffTok");
  window.location.pathname = "/dashboard";
  assert.equal(getRoleToken("staff"), null);
});

test("the four portal frames check the session through the shared helper, never /me without a token", () => {
  const read = (f) => readFileSync(new URL(`../${f}`, import.meta.url), "utf8");
  const frames = {
    "src/components/csm/CsmFrame.tsx": 'csmApi.session<CsmMe>("/api/csm/me"',
    "src/components/dashboard/staff/StaffSession.tsx": 'staffApi.session<{ email: string; role?: string }>("/api/dashboard/auth/check")',
    "src/components/lawyer/LawyerGate.tsx": 'checkSession("lawyer", () => lawyerApi.me()',
    "src/components/status/StatusApp.tsx": 'checkSession("client", () => memberApi.home()',
  };
  for (const [f, call] of Object.entries(frames)) {
    const src = read(f);
    assert.ok(src.includes(call), `${f} uses the session helper`);
    assert.ok(!/getRoleToken\(/.test(src), `${f} reads the session through the client, not getRoleToken`);
  }
  // Every sign-in keeps the server's expiry with the token.
  assert.ok(read("src/components/auth/PortalLogin.tsx").includes("setRoleToken(role, res.token, res.expiresAt)"));
  assert.ok(read("src/app/join/welcome/page.tsx").includes('setRoleToken("client", res.token, res.expiresAt)'));
});
