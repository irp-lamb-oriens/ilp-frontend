// Run: npm test. JOURNEYS: the browser tracker (privacy, consent, batching),
// experiment assignment and exposure, and the staff module's pure helpers.
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { register } from "node:module";

register("./tsResolve.mjs", import.meta.url);

// ─── A minimal browser ──────────────────────────────────────────────────────
class MemStorage {
  constructor() { this.m = new Map(); }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v) { this.m.set(k, String(v)); }
  removeItem(k) { this.m.delete(k); }
  clear() { this.m.clear(); }
}
const nav = { doNotTrack: null, globalPrivacyControl: false };
Object.defineProperty(globalThis, "navigator", { value: nav, configurable: true, writable: true });
globalThis.window = globalThis;
globalThis.localStorage = new MemStorage();
globalThis.sessionStorage = new MemStorage();
globalThis.location = { search: "", pathname: "/", hostname: "ilp.example.com" };
globalThis.document = { referrer: "", visibilityState: "visible" };
globalThis.innerWidth = 1280;
globalThis.addEventListener ??= () => {};
globalThis.dispatchEvent ??= () => true;

const { track, resetTracker, journeyVisitorId } = await import("../src/lib/journey/tracker.ts");
const { sanitizeEvent, cleanPath, cleanTarget } = await import("../src/lib/journey/sanitize.ts");
const { createQueue } = await import("../src/lib/journey/queue.ts");
const { resolveAttribution } = await import("../src/lib/journey/attribution.ts");
const { nextSession, SESSION_IDLE_MS } = await import("../src/lib/journey/ids.ts");
const X = await import("../src/lib/journey/experiments.ts");
const { setMeasureChoice } = await import("../src/components/legal/preferences.ts");
const M = await import("../src/components/dashboard/journeys/model.ts");

let sent = [];
const transport = (events, opts) => sent.push({ events, beacon: opts.beacon });
const noTimers = { setTimer: () => 1, clearTimer: () => {} };
const allEvents = () => sent.flatMap((b) => b.events);

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  nav.doNotTrack = null;
  nav.globalPrivacyControl = false;
  location.search = "";
  location.pathname = "/";
  document.referrer = "";
  sent = [];
  resetTracker(transport, noTimers);
  X.resetAssignments();
  setMeasureChoice("allow");
});

// ─── Privacy ────────────────────────────────────────────────────────────────
test("tracker never sends free text, emails or field values", () => {
  location.pathname = "/status/ana.lopez@example.com/x";
  location.search = "?email=ana.lopez@example.com&utm_source=Newsletter Nov";
  assert.equal(track.click("Ana Lopez typed this"), false, "a sentence is not a target id");
  assert.equal(track.formError("ana.lopez@example.com"), false, "an email is not a field id");
  assert.equal(track.click("check.join"), false, "nothing but a page view inside a portal");
  location.pathname = "/check";
  assert.equal(track.formError("join.email"), true);
  assert.equal(track.click("home.hero.check"), true);
  track.step("check_start");
  track.flush();
  const json = JSON.stringify(sent);
  assert.ok(!/@/.test(json), "no email anywhere in the payload");
  assert.ok(!/typed this/i.test(json), "no free text");
  for (const e of allEvents()) {
    assert.ok(!e.path.includes("?"), "path has no query string");
    if (e.target) assert.match(e.target, /^[a-z0-9][a-z0-9._-]{0,63}$/);
    assert.deepEqual(Object.keys(e).filter((k) => !["visitorId", "sessionId", "type", "path", "variants", "device", "source", "channel", "utm", "step", "target", "country", "at", "durationMs", "outreachId"].includes(k)), []);
  }
  assert.equal(allEvents().find((e) => e.type === "form_error").target, "join.email");
});

test("sanitize: paths lose ids and queries, server-only steps and emails are dropped", () => {
  assert.equal(cleanPath("/dashboard/members/abc123def4567890?tab=x#y"), "/dashboard/members/:id");
  assert.equal(cleanPath("/status/ana%40example.com"), "/status/:id");
  assert.equal(cleanPath("/join/welcome?t=secret"), "/join/welcome");
  assert.equal(cleanTarget("join.phone"), "join.phone");
  assert.equal(cleanTarget("5551234567"), undefined);
  assert.equal(cleanTarget("hello world"), undefined);
  const base = { visitorId: "abcdefgh12", sessionId: "sessabcd12", path: "/", variants: {}, device: "desktop" };
  assert.equal(sanitizeEvent({ ...base, type: "step", step: "activation_paid" }), null, "the server records payment");
  assert.equal(sanitizeEvent({ ...base, type: "step", step: "check_start" }).step, "check_start");
  assert.equal(sanitizeEvent({ ...base, type: "click", target: "x", utm: { source: "a@b.co" } }).utm?.source, "ab.co", "utm values keep only slug characters");
  assert.equal(sanitizeEvent({ ...base, type: "page_view", name: "Ana" }).name, undefined, "unknown fields are dropped");
});

test("portals: one page view of the portal root per session, nothing else", () => {
  location.pathname = "/dashboard/members/x1";
  assert.equal(track.pageView("/dashboard/members/x1"), true);
  assert.equal(track.pageView("/dashboard/pipeline"), false);
  assert.equal(track.heartbeat(5000), false);
  track.flush();
  assert.deepEqual(allEvents().map((e) => [e.type, e.path]), [["page_view", "/dashboard"]]);
});

// ─── Consent ────────────────────────────────────────────────────────────────
test("nothing is stored or sent without consent, with DNT, GPC or the opt-out", () => {
  const tryAll = () => {
    track.pageView("/");
    track.step("check_start");
    track.click("home.hero.check");
    track.flush(true);
  };
  setMeasureChoice("deny");
  tryAll();
  assert.equal(sent.length, 0, "measurement refused");
  assert.equal(localStorage.getItem("ilp_vid"), null, "no visitor id stored");
  assert.equal(localStorage.getItem("ilp_journey_optout"), "1", "No thanks sets the opt-out");
  assert.equal(journeyVisitorId(), undefined);

  setMeasureChoice("allow");
  nav.doNotTrack = "1";
  tryAll();
  assert.equal(sent.length, 0, "Do Not Track");
  nav.doNotTrack = null;
  nav.globalPrivacyControl = true;
  tryAll();
  assert.equal(sent.length, 0, "Global Privacy Control");
  nav.globalPrivacyControl = false;
  localStorage.setItem("ilp_journey_optout", "1");
  tryAll();
  assert.equal(sent.length, 0, "opted out");
  localStorage.removeItem("ilp_journey_optout");
  tryAll();
  assert.ok(sent.length > 0, "allowed again");
  assert.ok(localStorage.getItem("ilp_vid"));
});

test("forget drops waiting events and the ids", () => {
  track.pageView("/");
  assert.equal(track.waiting(), 1);
  track.forget();
  assert.equal(track.waiting(), 0);
  assert.equal(localStorage.getItem("ilp_vid"), null);
});

// ─── Batching ───────────────────────────────────────────────────────────────
test("queue: flushes at 20 events, on the 5 s timer and on page hide, at most 50 per request", () => {
  const out = [];
  let fire = null;
  const q = createQueue({ transport: (ev, o) => out.push({ n: ev.length, beacon: o.beacon }), setTimer: (fn, ms) => { assert.equal(ms, 5000); fire = fn; return 1; }, clearTimer: () => { fire = null; } });
  const ev = { visitorId: "abcdefgh12", sessionId: "s", type: "page_view", path: "/", variants: {}, device: "phone" };
  for (let i = 0; i < 19; i++) q.push(ev);
  assert.equal(out.length, 0);
  q.push(ev);
  assert.deepEqual(out, [{ n: 20, beacon: false }], "20 waiting: sent");
  q.push(ev);
  assert.ok(fire, "the first waiting event starts the 5 s timer");
  fire();
  assert.deepEqual(out[1], { n: 1, beacon: false });
  const big = createQueue({ transport: (e, o) => out.push({ n: e.length, beacon: o.beacon }), maxWaiting: 1000, setTimer: () => 1, clearTimer: () => {} });
  for (let i = 0; i < 120; i++) big.push(ev);
  big.flush(true);
  assert.deepEqual(out.slice(2), [{ n: 50, beacon: true }, { n: 50, beacon: true }, { n: 20, beacon: true }]);
});

test("sessions: the same id while active, a new one after 30 idle minutes", () => {
  const a = nextSession(null, 1_000, () => "sessionAAAA1");
  assert.equal(nextSession(a, 1_000 + SESSION_IDLE_MS - 1, () => "x").id, "sessionAAAA1");
  assert.equal(nextSession(a, 1_000 + SESSION_IDLE_MS, () => "sessionBBBB2").id, "sessionBBBB2");
});

test("attribution: outreach link is outbound and sticky; utm, search and other sites are inbound", () => {
  const host = "ilp.example.com";
  const o = resolveAttribution({ search: "?o=out_8f2k1x&utm_campaign=CR Retirees", referrer: "", host });
  assert.deepEqual([o.source, o.channel, o.outreachId, o.utm.campaign], ["outbound", "email_outreach", "out_8f2k1x", "cr-retirees"]);
  assert.equal(resolveAttribution({ search: "?utm_source=google", referrer: "", host }, o).source, "outbound", "outbound stays outbound");
  assert.equal(resolveAttribution({ search: "?utm_source=fb&utm_campaign=nov", referrer: "", host }).channel, "campaign");
  assert.equal(resolveAttribution({ search: "", referrer: "https://www.google.com/search?q=x", host }).channel, "organic");
  assert.equal(resolveAttribution({ search: "", referrer: "https://expatforum.example.org/t/1", host }).channel, "referral");
  assert.equal(resolveAttribution({ search: "", referrer: "https://ilp.example.com/pricing", host }).channel, "direct");
});

// ─── Experiments ────────────────────────────────────────────────────────────
test("assignments: one request per session, cached; a variant already shown never changes", async () => {
  let calls = 0;
  const fetcher = async (vid) => {
    calls++;
    assert.match(vid, /^[A-Za-z0-9_-]{8,64}$/);
    return { visitorId: vid, assignments: { "hero-headline": "B" }, experiments: [{ key: "hero-headline", surface: "home.hero", status: "running", audience: "all", variants: [{ key: "A", name: "Current", weight: 50 }, { key: "B", name: "Dates", weight: 50 }] }] };
  };
  const [a, b] = await Promise.all([X.loadAssignments(fetcher), X.loadAssignments(fetcher)]);
  assert.equal(calls, 1, "concurrent callers share one request");
  assert.equal(a, b);
  await X.loadAssignments(fetcher);
  assert.equal(calls, 1, "cached for the session");
  assert.equal(X.controlOf("hero-headline", a), "A");
  assert.deepEqual(X.resolveVariant("hero-headline", a, {}), { variant: "B", control: "A", inExperiment: true });
  // The server answer changes later in the session: what was shown wins.
  const changed = { ...a, assignments: { "hero-headline": "A" } };
  assert.equal(X.resolveVariant("hero-headline", changed, { "hero-headline": "B" }).variant, "B");
  assert.deepEqual(X.resolveVariant("check-length", a, {}), { variant: "A", control: "A", inExperiment: false });
  setMeasureChoice("deny");
  assert.equal(await X.loadAssignments(fetcher), null, "no request without consent");
});

test("exposure: recorded once per experiment, then carried on every event", () => {
  assert.equal(track.exposure("hero-headline", "B"), true);
  assert.equal(track.exposure("hero-headline", "B"), false, "second render: nothing sent");
  track.pageView("/");
  track.flush();
  const ev = allEvents();
  assert.equal(ev.filter((e) => e.target === "exposure.hero-headline").length, 1);
  assert.equal(ev[0].durationMs, 0);
  assert.deepEqual(ev[1].variants, { "hero-headline": "B" });
});

test("useExperiment and the hero: control while loading, 300 ms limit, B copy from content", () => {
  const hook = readFileSync(new URL("../src/lib/journey/useExperiment.ts", import.meta.url), "utf8");
  assert.match(hook, /EXPERIMENT_TIMEOUT_MS = 300/);
  const hero = readFileSync(new URL("../src/components/HeroCTA.tsx", import.meta.url), "utf8");
  assert.match(hero, /useExperiment\("hero-headline"\)/);
  assert.match(hero, /titlePending/, "the slot keeps its size while loading");
  const check = readFileSync(new URL("../src/app/check/page.tsx", import.meta.url), "utf8");
  assert.match(check, /useExperiment\("check-length"/);
  assert.match(check, /!q\.optional/, "variant B skips optional questions");
});

// ─── Staff module ───────────────────────────────────────────────────────────
test("filters round-trip through the URL; bad values are ignored", () => {
  const f = { range: "custom", from: "2026-10-01", to: "2026-10-20", source: "outbound", channel: "email_outreach", country: "PA", device: "phone", experiment: "hero-headline", variant: "B" };
  const qs = M.filtersToParams(f).toString();
  assert.deepEqual(M.readFilters(new URLSearchParams(qs)), f);
  assert.equal(M.filtersToParams({ range: "28" }).toString(), "", "defaults stay out of the URL");
  const bad = M.readFilters(new URLSearchParams("range=custom&from=nope&source=x&country=US&channel=tv&variant=B"));
  assert.deepEqual(bad, { range: "28" });
  assert.deepEqual(M.readFilters(new URLSearchParams("range=custom&from=2026-10-20&to=2026-10-01")), { range: "custom", from: "2026-10-01", to: "2026-10-20" }, "reversed dates are swapped");
  assert.equal(M.withFilter(f, "experiment", "").variant, undefined, "clearing the experiment clears the version");
  assert.deepEqual(M.rangeOf({ range: "7" }, new Date("2026-10-28T15:00:00Z")), { from: "2026-10-22", to: "2026-10-28" });
});

test("biggest leaks: weighted by closeness to paying, written in plain words", () => {
  const row = (step, visitors) => ({ step, label: step, visitors, conversionFromPrev: 0, conversionFromStart: 0, medianMsFromPrev: null, p75MsFromPrev: null, dropOff: 0 });
  const rows = [row("check_start", 2390), row("check_finish", 1978), row("results_view", 1923), row("deadlines_select", 655), row("signup_start", 498), row("account_created", 431), row("join_start", 212), row("activation_paid", 87)];
  const stuck = [{ step: "check_start", label: "", stuckCount: 412, medianDwellMs: 1, topExitPaths: [{ path: "/check", count: 391 }], topFormErrors: [] }];
  const leaks = M.biggestLeaks(rows, stuck);
  assert.equal(leaks.length, 3);
  assert.deepEqual(leaks.map((l) => l.to), ["deadlines_select", "activation_paid", "join_start"]);
  assert.equal(leaks[1].text, "125 people started joining but did not pay the activation fee.");
  assert.equal(M.leakSentence("check_start", "check_finish", 412, stuck[0]), "412 people started the free check but did not finish it; most left from the free check.");
  assert.equal(M.leakSentence("join_start", "activation_paid", 1, { topExitPaths: [], topFormErrors: [{ target: "join.citizenships", count: 64 }] }), "1 person started joining but did not pay the activation fee; the field with the most errors was citizenships (64).");
  for (const l of leaks) assert.ok(!/[–—]/.test(l.text), "no dashes (copy-rules 21)");
});

test("experiments: only admins edit; the read never overclaims", () => {
  assert.equal(M.canEditExperiments("admin"), true);
  assert.equal(M.canEditExperiments("staff"), false);
  assert.equal(M.canEditExperiments("csm"), false);
  assert.equal(M.canEditExperiments(undefined), false);
  assert.deepEqual(M.experimentActions("running"), ["pause", "end"]);
  assert.deepEqual(M.experimentActions("ended"), ["winner"]);
  const v = (key, visitors, p) => ({ key, name: key, visitors, conversions: 0, rate: 0, liftVsControl: null, probabilityBest: p, ci95: [0, 0] });
  const early = { variants: [v("A", 1874, 0.113), v("B", 1911, 0.887)], sampleSizeNeeded: 2860, enoughData: false };
  assert.equal(M.experimentVerdict(early), "B is ahead, not yet conclusive. About 986 more visitors per version are needed.");
  assert.ok(!/winner|proven|wins/i.test(M.experimentVerdict(early)));
  assert.match(M.experimentVerdict({ ...early, enoughData: true, variants: [v("A", 3000, 0.02), v("B", 3000, 0.98)] }), /^B is very likely the best: a 98% chance/);
  assert.equal(M.experimentVerdict({ ...early, enoughData: true, variants: [v("A", 3000, 0.4), v("B", 3000, 0.6)] }), "No clear difference between the versions so far.");
  const view = readFileSync(new URL("../src/components/dashboard/journeys/ExperimentsView.tsx", import.meta.url), "utf8");
  assert.match(view, /canEditExperiments\(staff\.role\)/);
  assert.match(view, /canEdit \? <Button/, "New experiment only for admins");
  const results = readFileSync(new URL("../src/components/dashboard/journeys/ExperimentResultsView.tsx", import.meta.url), "utf8");
  assert.match(results, /const actions = canEdit \? experimentActions/, "start, pause, end and winner only for admins");
});

test("experiment form: 2 to 4 versions, shares add up to 100, distinct keys", () => {
  const ok = { key: "hero-headline", name: "Homepage headline", hypothesis: "A headline naming legal dates gets more check starts.", surface: "home.hero", variants: [{ key: "A", name: "Now", weight: 50 }, { key: "B", name: "Dates", weight: 50 }], primaryStep: "check_start", audience: "all" };
  assert.deepEqual(M.validateExperiment(ok), {});
  assert.match(M.validateExperiment({ ...ok, variants: [{ key: "A", name: "a", weight: 60 }, { key: "B", name: "b", weight: 30 }] }).weights, /add up to 90%/);
  assert.ok(M.validateExperiment({ ...ok, variants: [{ key: "A", name: "a", weight: 50 }, { key: "a", name: "b", weight: 50 }] })["variants.1.key"]);
  assert.ok(M.validateExperiment({ ...ok, variants: [ok.variants[0]] }).variants);
  assert.ok(M.validateExperiment({ ...ok, guardrailSteps: ["check_start"] }).guardrailSteps);
  assert.equal(M.formatMs(48_000), "48 s");
  assert.equal(M.formatMs(3.4 * 86_400_000), "3.4 days");
  assert.equal(M.pct(0.4723), "47.2%");
});
