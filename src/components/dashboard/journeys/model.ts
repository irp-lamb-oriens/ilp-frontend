/**
 * Journeys (staff): pure helpers shared by the views and the tests. Filters
 * and the URL, the date range, number formatting, the "Biggest leaks" list,
 * the plain-language read of an experiment and the experiment form rules.
 * No React here.
 */
import {
  COUNTRY_CODES,
  type CountryCode,
  type ExperimentInput,
  type ExperimentResult,
  type ExperimentStatus,
  FUNNEL_STEPS,
  type FunnelStepId,
  JOURNEY_CHANNELS,
  JOURNEY_DEVICES,
  type JourneyChannel,
  type JourneyDevice,
  type JourneyFunnelRow,
  type JourneyRange,
  type JourneySource,
  type JourneyStuck,
  isFunnelStepId,
  journeyStepLabel,
} from "@/lib/contracts";

// ─── Filters and the URL ────────────────────────────────────────────────────

export type RangeKey = "7" | "28" | "90" | "custom";
export const RANGE_KEYS: readonly RangeKey[] = ["7", "28", "90", "custom"];

export interface JourneyFilterState {
  range: RangeKey;
  from?: string;
  to?: string;
  source?: JourneySource;
  channel?: JourneyChannel;
  country?: CountryCode;
  device?: JourneyDevice;
  experiment?: string;
  variant?: string;
}

export const DEFAULT_FILTERS: JourneyFilterState = { range: "28" };

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const SLUG_RE = /^[a-z0-9][a-z0-9._-]{0,63}$/;

const validDay = (v: string | null): string | undefined => (v && DAY_RE.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`)) ? v : undefined);

/** Filters from a query string. Unknown or invalid values are ignored. */
export function readFilters(params: URLSearchParams): JourneyFilterState {
  const f: JourneyFilterState = { range: "28" };
  const range = params.get("range");
  if (range && (RANGE_KEYS as readonly string[]).includes(range)) f.range = range as RangeKey;
  if (f.range === "custom") {
    let from = validDay(params.get("from"));
    let to = validDay(params.get("to"));
    if (!from || !to) f.range = "28";
    else {
      if (from > to) [from, to] = [to, from];
      f.from = from;
      f.to = to;
    }
  }
  const source = params.get("source");
  if (source === "inbound" || source === "outbound") f.source = source;
  const channel = params.get("channel");
  if (channel && (JOURNEY_CHANNELS as readonly string[]).includes(channel)) f.channel = channel as JourneyChannel;
  const country = params.get("country")?.toUpperCase();
  if (country && (COUNTRY_CODES as readonly string[]).includes(country)) f.country = country as CountryCode;
  const device = params.get("device");
  if (device && (JOURNEY_DEVICES as readonly string[]).includes(device)) f.device = device as JourneyDevice;
  const experiment = params.get("experiment");
  if (experiment && SLUG_RE.test(experiment)) {
    f.experiment = experiment;
    const variant = params.get("variant");
    if (variant && /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(variant)) f.variant = variant;
  }
  return f;
}

/** The query string for filters (defaults left out, stable key order). */
export function filtersToParams(f: JourneyFilterState): URLSearchParams {
  const p = new URLSearchParams();
  if (f.range !== "28") p.set("range", f.range);
  if (f.range === "custom" && f.from && f.to) {
    p.set("from", f.from);
    p.set("to", f.to);
  }
  if (f.source) p.set("source", f.source);
  if (f.channel) p.set("channel", f.channel);
  if (f.country) p.set("country", f.country);
  if (f.device) p.set("device", f.device);
  if (f.experiment) {
    p.set("experiment", f.experiment);
    if (f.variant) p.set("variant", f.variant);
  }
  return p;
}

/** Set one filter; clearing the experiment clears its variant. */
export function withFilter(f: JourneyFilterState, key: keyof JourneyFilterState, value: string | undefined): JourneyFilterState {
  const next: JourneyFilterState = { ...f, [key]: value || undefined } as JourneyFilterState;
  if (key === "range") next.range = (value as RangeKey) || "28";
  if (key === "experiment") delete next.variant;
  if (next.range !== "custom") {
    delete next.from;
    delete next.to;
  }
  return next;
}

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

/** The UTC days the filters cover (both ends included). */
export function rangeOf(f: JourneyFilterState, today: Date = new Date()): JourneyRange {
  if (f.range === "custom" && f.from && f.to) return { from: f.from, to: f.to };
  const days = Number(f.range) || 28;
  const to = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const from = new Date(to.getTime() - (days - 1) * 86_400_000);
  return { from: isoDay(from), to: isoDay(to) };
}

/** Query parameters for GET /api/dashboard/journeys/*. */
export function apiQuery(f: JourneyFilterState, today?: Date): Record<string, string | undefined> {
  const r = rangeOf(f, today);
  return { from: r.from, to: r.to, source: f.source, channel: f.channel, country: f.country, device: f.device, experiment: f.experiment, variant: f.variant };
}

export function rangeLabel(f: JourneyFilterState, today?: Date): string {
  if (f.range === "custom") {
    const r = rangeOf(f, today);
    return `${shortDay(r.from)} to ${shortDay(r.to)}`;
  }
  return `Last ${f.range} days`;
}

// ─── Formatting ─────────────────────────────────────────────────────────────

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function shortDay(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return y && m && d ? `${MONTHS[m - 1]} ${d}` : day;
}

export const count = (n: number): string => Math.round(n).toLocaleString("en-US");

/** 0.4723 → "47.2%". One decimal, trailing ".0" dropped. */
export function pct(x: number | null | undefined): string {
  if (x === null || x === undefined || !Number.isFinite(x)) return "None";
  const v = Math.round(x * 1000) / 10;
  return `${Number.isInteger(v) ? v.toFixed(0) : v.toFixed(1)}%`;
}

/** Signed relative change: 0.124 → "+12.4%". */
export function signedPct(x: number | null | undefined): string {
  if (x === null || x === undefined || !Number.isFinite(x)) return "None";
  return `${x > 0 ? "+" : x < 0 ? "−" : ""}${pct(Math.abs(x))}`;
}

/** A duration in plain words: "48 s", "3.5 min", "2.4 h", "3.1 days". */
export function formatMs(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || !Number.isFinite(ms)) return "None";
  const one = (v: number) => (v >= 10 ? Math.round(v).toString() : (Math.round(v * 10) / 10).toString());
  if (ms < 60_000) return `${Math.max(1, Math.round(ms / 1000))} s`;
  if (ms < 3_600_000) return `${one(ms / 60_000)} min`;
  if (ms < 86_400_000) return `${one(ms / 3_600_000)} h`;
  const d = ms / 86_400_000;
  return `${one(d)} ${d === 1 ? "day" : "days"}`;
}

export const people = (n: number): string => `${count(n)} ${n === 1 ? "person" : "people"}`;

const PAGE_NAMES: Record<string, string> = {
  "/": "the homepage",
  "/check": "the free check",
  "/join": "the join form",
  "/join/welcome": "the welcome page",
  "/pricing": "the pricing page",
  "/how-it-works": "How it works",
  "/attorneys": "the lawyer page",
  "/lawyers/apply": "the lawyer application",
  "/status": "the member portal",
  "/status/deadlines": "the deadlines page",
};

/** A page path in plain words ("the free check"), or the path itself. */
export function pageName(path: string): string {
  return PAGE_NAMES[path] ?? path;
}

/** A field or button id in plain words: "join.email" → "email", "check.claim.terms" → "terms". */
export function targetName(target: string): string {
  const last = target.split(".").pop() ?? target;
  return last.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
}

export const stepLabel = (id: string): string => journeyStepLabel(id);

// ─── Biggest leaks ──────────────────────────────────────────────────────────

/** What people at a step did ("started the free check"). */
const REACHED: Partial<Record<FunnelStepId, string>> = {
  landing_view: "opened the homepage",
  check_start: "started the free check",
  check_finish: "finished the free check",
  results_view: "saw their results",
  deadlines_select: "picked deadlines to keep",
  signup_start: "started a free account",
  account_created: "created a free account",
  join_start: "started joining",
  activation_paid: "became members",
  profile_ready: "made their profile consultation-ready",
  call_booked: "booked a call",
  call_done: "had a call",
  handoff_confirmed: "got next steps confirmed by their lawyer",
  paid_work_accepted: "accepted paid legal work",
  renewed_m2: "renewed for month 2",
};

/** What they did not do next ("finish it"). */
const MISSED: Partial<Record<FunnelStepId, string>> = {
  check_start: "start the free check",
  check_finish: "finish it",
  results_view: "open their results",
  deadlines_select: "pick any deadlines to keep",
  signup_start: "start a free account",
  account_created: "finish creating the account",
  join_start: "start joining",
  activation_paid: "pay the activation fee",
  profile_ready: "complete their profile",
  call_booked: "book a call",
  call_done: "have the call",
  handoff_confirmed: "get confirmed next steps",
  paid_work_accepted: "accept paid legal work",
  renewed_m2: "renew for month 2",
  renewed_m3: "renew for month 3",
};

export interface Leak {
  /** The step people reached. */
  from: FunnelStepId;
  /** The next step they did not reach. */
  to: FunnelStepId;
  lost: number;
  /** lost × how likely someone at `to` was to become a member (1 after paying). */
  score: number;
  text: string;
}

/**
 * The three steps that lose the most value: people lost between two steps,
 * weighted by how close the next step is to a paying member (people who
 * reach `to` and then pay, out of everyone who reaches `to`). A person lost
 * just before paying counts for more than one lost on the homepage.
 */
export function biggestLeaks(rows: JourneyFunnelRow[], stuck: JourneyStuck[] = [], n = 3): Leak[] {
  const byStep = new Map(rows.map((r) => [r.step, r]));
  const paid = byStep.get("activation_paid")?.visitors ?? 0;
  const order = FUNNEL_STEPS.map((s) => s.id as FunnelStepId);
  const payIdx = order.indexOf("activation_paid");
  const leaks: Leak[] = [];
  for (let i = 1; i < rows.length; i++) {
    const prev = rows[i - 1];
    const cur = rows[i];
    const lost = Math.max(0, prev.visitors - cur.visitors);
    if (!lost || !isFunnelStepId(prev.step) || !isFunnelStepId(cur.step)) continue;
    const idx = order.indexOf(cur.step);
    const weight = idx >= payIdx || idx === -1 ? 1 : cur.visitors > 0 ? Math.min(1, paid / cur.visitors) : 0;
    const score = lost * weight;
    if (score <= 0) continue;
    leaks.push({ from: prev.step, to: cur.step, lost, score, text: leakSentence(prev.step, cur.step, lost, stuck.find((s) => s.step === prev.step)) });
  }
  return leaks.sort((a, b) => b.score - a.score || b.lost - a.lost).slice(0, n);
}

/** "412 people started the free check but did not finish it; most left from the free check." */
export function leakSentence(from: FunnelStepId, to: FunnelStepId, lost: number, stuck?: JourneyStuck): string {
  const reached = REACHED[from] ?? `reached ${stepLabel(from).toLowerCase()}`;
  const missed = MISSED[to] ?? `reach ${stepLabel(to).toLowerCase()}`;
  let detail = "";
  const err = stuck?.topFormErrors?.[0];
  const exit = stuck?.topExitPaths?.[0];
  if (err && err.count > 0) detail = `; the field with the most errors was ${targetName(err.target)} (${count(err.count)})`;
  else if (exit && exit.count > 0) detail = `; most left from ${pageName(exit.path)}`;
  return `${people(lost)} ${reached} but did not ${missed}${detail}.`;
}

// ─── Experiments ────────────────────────────────────────────────────────────

export const EXPERIMENT_STATUS_LABEL: Record<ExperimentStatus, string> = {
  draft: "Draft",
  running: "Running",
  paused: "Paused",
  ended: "Ended",
};

export const EXPERIMENT_STATUS_TONE: Record<ExperimentStatus, "neutral" | "info" | "success" | "warning"> = {
  draft: "neutral",
  running: "info",
  paused: "warning",
  ended: "neutral",
};

/** Only admins create, edit, start, pause, end or pick a winner. Everyone on staff reads. */
export function canEditExperiments(role: string | null | undefined): boolean {
  return role === "admin";
}

/** Which actions an experiment in this status allows. */
export function experimentActions(status: ExperimentStatus): Array<"edit" | "start" | "pause" | "end" | "winner"> {
  switch (status) {
    case "draft":
      return ["edit", "start"];
    case "running":
      return ["pause", "end"];
    case "paused":
      return ["edit", "start", "end"];
    case "ended":
      return ["winner"];
  }
}

/** Visitors still needed in the smallest variant before the result can be read. */
export function visitorsNeeded(r: Pick<ExperimentResult, "variants" | "sampleSizeNeeded">): number {
  if (!r.variants.length) return r.sampleSizeNeeded;
  const least = Math.min(...r.variants.map((v) => v.visitors));
  return Math.max(0, r.sampleSizeNeeded - least);
}

/**
 * One plain sentence on what the result says, never more than the data
 * supports. "Very likely" needs enough data and a 95% chance to be best.
 */
export function experimentVerdict(r: Pick<ExperimentResult, "variants" | "sampleSizeNeeded" | "enoughData">): string {
  if (r.variants.length < 2) return "There are not enough versions to compare.";
  const control = r.variants[0];
  const leader = [...r.variants].sort((a, b) => b.probabilityBest - a.probabilityBest)[0];
  const total = r.variants.reduce((s, v) => s + v.visitors, 0);
  if (total === 0) return "No visitors have seen this test yet.";
  const chance = pct(leader.probabilityBest);
  if (!r.enoughData) {
    const more = visitorsNeeded(r);
    const need = more > 0 ? ` About ${count(more)} more visitors per version are needed.` : "";
    if (leader.probabilityBest >= 0.8) {
      return leader.key === control.key
        ? `${control.name} (the current version) is ahead, not yet conclusive.${need}`
        : `${leader.name} is ahead, not yet conclusive.${need}`;
    }
    return `No version is ahead yet.${need}`;
  }
  if (leader.probabilityBest >= 0.95) {
    return leader.key === control.key
      ? `${control.name} (the current version) is very likely the best: a ${chance} chance. The changes did not help.`
      : `${leader.name} is very likely the best: a ${chance} chance it converts more than the others.`;
  }
  if (leader.probabilityBest >= 0.8) return `${leader.name} is ahead (${chance} chance to be best), not yet conclusive.`;
  return "No clear difference between the versions so far.";
}

export const SURFACES = [
  { value: "home.hero", label: "Homepage hero" },
  { value: "/check", label: "Free check" },
  { value: "/join", label: "Join form" },
  { value: "/pricing", label: "Pricing page" },
  { value: "/attorneys", label: "Lawyer page" },
  { value: "/lawyers/apply", label: "Lawyer application" },
] as const;

export function slugify(v: string): string {
  return v.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
}

/** Field errors for the experiment form; empty when it can be saved. Weights are percentages that add up to 100. */
export function validateExperiment(input: Partial<ExperimentInput>): Record<string, string> {
  const e: Record<string, string> = {};
  if (!input.name?.trim()) e.name = "Give the test a name.";
  if (!input.key || !/^[a-z0-9][a-z0-9-]{1,47}$/.test(input.key)) e.key = "Use lowercase letters, numbers and dashes, for example hero-headline.";
  if (!input.hypothesis?.trim() || input.hypothesis.trim().split(/\s+/).length < 5) e.hypothesis = "Write what you expect to change and why, in one sentence.";
  if (!input.surface?.trim()) e.surface = "Choose where the test runs.";
  const vs = input.variants ?? [];
  if (vs.length < 2 || vs.length > 4) e.variants = "A test needs 2 to 4 versions.";
  else {
    const keys = new Set<string>();
    vs.forEach((v, i) => {
      if (!v.name?.trim()) e[`variants.${i}.name`] = "Name this version.";
      if (!/^[a-z0-9][a-z0-9-]{0,31}$/i.test(v.key ?? "")) e[`variants.${i}.key`] = "Use letters, numbers and dashes.";
      else if (keys.has(v.key.toLowerCase())) e[`variants.${i}.key`] = "Each version needs its own key.";
      keys.add((v.key ?? "").toLowerCase());
      if (!Number.isFinite(v.weight) || v.weight <= 0) e[`variants.${i}.weight`] = "Above 0.";
    });
    const sum = vs.reduce((s, v) => s + (Number(v.weight) || 0), 0);
    if (Math.round(sum * 10) / 10 !== 100) e.weights = `The shares add up to ${Math.round(sum * 10) / 10}%. Make them add up to 100%.`;
  }
  if (!input.primaryStep || !isFunnelStepId(input.primaryStep)) e.primaryStep = "Choose the step that counts as a success.";
  if (input.guardrailSteps?.includes(input.primaryStep as FunnelStepId)) e.guardrailSteps = "The success step cannot also be a guardrail.";
  if (input.audience && !["all", "inbound", "outbound"].includes(input.audience)) e.audience = "Choose who sees the test.";
  return e;
}
