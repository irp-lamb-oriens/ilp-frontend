// Run: npm test. COMMS-P3: the CSM portal (/csm), the real bell and the
// health score wording: shared contracts, pure helpers and the pages.
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { existsSync, readFileSync } from "node:fs";

register("./tsResolve.mjs", import.meta.url);

const C = await import("../src/lib/contracts.ts");
const CSM = await import("../src/lib/csm.ts");
const N = await import("../src/lib/notifications.ts");
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const DASH = /—|–/;

test("health bands: Healthy 75+, Watch 50 to 74, At risk under 50; pill text always says the band in words", () => {
  assert.deepEqual(C.HEALTH_BANDS.map((b) => [b.id, b.label, b.min]), [["healthy", "Healthy", 75], ["watch", "Watch", 50], ["at_risk", "At risk", 0]]);
  assert.equal(CSM.healthLabel({ label: "At risk", score: 42 }), "At risk · 42");
  assert.equal(CSM.healthLabel({ label: "Ended", score: null }), "Ended");
  assert.equal(CSM.healthLabel(null), "No score");
  assert.deepEqual(CSM.HEALTH_TONE, { healthy: "success", watch: "warning", at_risk: "danger", ended: "neutral" });
  const pill = read("src/components/csm/HealthPill.tsx");
  assert.ok(pill.includes("<StatusPill") && pill.includes("healthLabel(health)"), "a labeled pill, never a bare dot");
});

test("scope in the URL: ?csm= kept on portal links, ?unassigned=1 passed on; nothing else", () => {
  assert.deepEqual(CSM.scopeQuery("?csm=Carla@ILP.legal&unassigned=1&q=x"), { csm: "carla@ilp.legal", unassigned: "1" });
  assert.deepEqual(CSM.scopeQuery(""), {});
  assert.equal(CSM.withScope("/csm/book/m1", { csm: "carla@ilp.legal" }), "/csm/book/m1?csm=carla%40ilp.legal");
  assert.equal(CSM.withScope("/csm/book/m1", {}), "/csm/book/m1");
});

test("bell: links open in the reader's portal; urgent unread first, then newest", () => {
  assert.equal(N.bellHref({ link: "/dashboard/members/m1", clientId: "m1" }, "csm"), "/csm/book/m1");
  assert.equal(N.bellHref({ link: "/csm/book/m1", clientId: "m1" }, "staff"), "/dashboard/members/m1");
  assert.equal(N.bellHref({ link: "/lawyer/work" }, "lawyer"), "/lawyer/work");
  assert.equal(N.bellHref({}, "staff"), null);
  const items = [
    { id: "a", read: true, severity: "urgent", createdAt: "2026-11-03T10:00:00Z" },
    { id: "b", read: false, severity: "info", createdAt: "2026-11-03T12:00:00Z" },
    { id: "c", read: false, severity: "urgent", createdAt: "2026-11-02T10:00:00Z" },
    { id: "d", read: false, severity: "action", createdAt: "2026-11-03T13:00:00Z" },
  ];
  assert.deepEqual(N.sortBell(items).map((i) => i.id), ["c", "d", "b", "a"]);
  const center = read("src/components/shell/NotificationCenter.tsx");
  assert.ok(center.includes("Mark all read") && center.includes("markRead") && center.includes("unread"));
  assert.ok(read("src/components/dashboard/staff/StaffSession.tsx").includes("<StaffBell />"));
  assert.ok(read("src/components/dashboard/routing/StaffBell.tsx").includes("NotificationCenter"));
  assert.ok(read("src/components/lawyer/LawyerGate.tsx").includes("/api/provider/notifications"));
});

const PAGES = ["", "/book", "/book/[id]", "/onboarding", "/calls", "/risk", "/deadlines", "/quotes", "/messages", "/playbooks", "/kpis"];

test("CSM portal: every page and its loading skeleton exist; its own nav and login; CSMs leave /dashboard for /csm", () => {
  for (const p of PAGES) {
    for (const f of ["page.tsx", "loading.tsx"]) assert.ok(existsSync(new URL(`../src/app/csm${p}/${f}`, import.meta.url)), `csm${p}/${f}`);
  }
  const frame = read("src/components/csm/CsmFrame.tsx");
  for (const label of ["Today", "My book", "Onboarding", "Calls", "Renewals and risk", "Deadlines", "Quotes and opportunities", "Messages", "Playbooks", "My KPIs"]) {
    assert.ok(frame.includes(`label: "${label}"`), label);
  }
  assert.ok(frame.includes('role="csm"'), "own login (PortalLogin role csm)");
  const api = read("src/lib/api.ts");
  assert.ok(api.includes('tokenKey: "ilp_csm_token"') && api.includes('loginPath: "/csm"'));
  assert.ok(read("src/components/dashboard/staff/StaffSession.tsx").includes('window.location.replace("/csm")'));
  assert.ok(read("src/components/dashboard/member/MemberPage.tsx").includes("<CsmMemberPanel"), "member page reused with CSM actions");
});

test("CSM intros: what, how (2 to 5 steps), why; tutorial set; no dashes", async () => {
  const { CSM_INTROS } = await import("../src/components/csm/intros.ts");
  for (const [k, i] of Object.entries(CSM_INTROS)) {
    assert.ok(i.what && i.why && i.how.length >= 2 && i.how.length <= 5, k);
    assert.equal(i.tutorialId, "csm.today", k);
    assert.ok(!DASH.test([i.title, i.what, i.why, ...i.how].join(" ")), k);
  }
  for (const p of PAGES.filter((x) => x && x !== "/book/[id]")) {
    assert.match(read(`src/app/csm${p}/page.tsx`), /<CsmScreen intro="/, p);
  }
});

test("member actions: log a contact, send a playbook email, create a task, take an unassigned member", () => {
  const src = read("src/components/csm/CsmMemberPanel.tsx");
  for (const path of ["/contacts", "/email", "/tasks", "/take"]) assert.ok(src.includes(path), path);
  assert.ok(src.includes("turned off ILP emails"), "says why an email will not go");
  assert.deepEqual([...C.CSM_PLAYBOOK_IDS], ["welcome_call", "renewal", "payment_failed", "no_show"]);
});
