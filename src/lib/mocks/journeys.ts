/**
 * Journeys sample data (JOURNEYS). Stands in for GET /api/dashboard/journeys/*
 * while those routes are not live (404) or with NEXT_PUBLIC_JOURNEYS_MOCK=1.
 * Same shapes as the contract; figures scale with the date range and the
 * filters so the screens behave like the real thing. Every record says
 * `placeholder: true` where the contract has the field.
 */
import {
  type Experiment,
  type ExperimentInput,
  type ExperimentResult,
  FUNNEL_STEPS,
  type FunnelStepId,
  type JourneyFunnel,
  type JourneyFunnelRow,
  type JourneyOutboundResponse,
  type JourneyPagesResponse,
  type JourneyPaths,
  type JourneyRange,
  type JourneyStuckResponse,
  type StuckPerson,
} from "@/lib/contracts";

type Q = Record<string, string | undefined>;

const BASE_28: Record<string, [number, number]> = {
  // step: [inbound, outbound] distinct visitors in 28 days
  landing_view: [6128, 712],
  check_start: [2047, 343],
  check_finish: [1669, 309],
  results_view: [1622, 301],
  deadlines_select: [538, 117],
  signup_start: [401, 97],
  account_created: [344, 87],
  join_start: [161, 51],
  activation_paid: [63, 24],
  profile_ready: [47, 18],
  call_booked: [43, 16],
  call_done: [36, 14],
  handoff_confirmed: [30, 11],
  paid_work_accepted: [12, 5],
  renewed_m2: [10, 4],
  renewed_m3: [8, 4],
};

/** Median and p75 minutes from the previous step. */
const MINUTES: Record<string, [number, number]> = {
  check_start: [0.9, 3.1],
  check_finish: [2.3, 3.8],
  results_view: [0.1, 0.2],
  deadlines_select: [3.4, 7.9],
  signup_start: [0.6, 1.4],
  account_created: [4.2, 26],
  join_start: [2880, 8640],
  activation_paid: [11, 47],
  profile_ready: [1490, 4310],
  call_booked: [610, 2280],
  call_done: [4390, 8930],
  handoff_confirmed: [380, 1310],
  paid_work_accepted: [8760, 20160],
  renewed_m2: [43200, 43200],
  renewed_m3: [43200, 43200],
};

const DAY = 86_400_000;

function days(q: Q): number {
  if (!q.from || !q.to) return 28;
  return Math.max(1, Math.round((Date.parse(`${q.to}T00:00:00Z`) - Date.parse(`${q.from}T00:00:00Z`)) / DAY) + 1);
}

function range(q: Q): JourneyRange {
  const to = q.to ?? new Date().toISOString().slice(0, 10);
  const from = q.from ?? new Date(Date.parse(`${to}T00:00:00Z`) - 27 * DAY).toISOString().slice(0, 10);
  return { from, to };
}

/** Share of traffic kept by the non-source filters. */
function narrow(q: Q): number {
  let k = 1;
  if (q.country) k *= ({ CR: 0.34, MX: 0.23, PA: 0.17, CO: 0.11, ES: 0.09, PT: 0.06 } as Record<string, number>)[q.country] ?? 0.1;
  if (q.device) k *= ({ phone: 0.57, desktop: 0.36, tablet: 0.07 } as Record<string, number>)[q.device] ?? 0.3;
  if (q.channel) k *= ({ organic: 0.41, direct: 0.19, referral: 0.12, campaign: 0.15, email_outreach: 0.08, import: 0.03, csm_call: 0.02 } as Record<string, number>)[q.channel] ?? 0.1;
  if (q.experiment) k *= q.variant ? 0.5 : 1;
  return k;
}

function rows(q: Q, source?: "inbound" | "outbound"): JourneyFunnelRow[] {
  const scale = (days(q) / 28) * narrow(q);
  const out: JourneyFunnelRow[] = [];
  let first = 0;
  let prev = 0;
  FUNNEL_STEPS.forEach((s, i) => {
    const [ib, ob] = BASE_28[s.id];
    const raw = source === "inbound" ? ib : source === "outbound" ? ob : ib + ob;
    const v = Math.max(0, Math.round(raw * scale));
    const visitors = i === 0 ? v : Math.min(v, prev);
    if (i === 0) first = visitors;
    const m = MINUTES[s.id];
    out.push({
      step: s.id,
      label: s.label,
      visitors,
      conversionFromPrev: i === 0 ? 1 : prev ? visitors / prev : 0,
      conversionFromStart: first ? visitors / first : 0,
      medianMsFromPrev: i === 0 || !m ? null : m[0] * 60_000,
      p75MsFromPrev: i === 0 || !m ? null : m[1] * 60_000,
      dropOff: i === 0 ? 0 : prev - visitors,
    });
    prev = visitors;
  });
  return out;
}

const later = <T>(v: T) => new Promise<T>((r) => setTimeout(() => r(structuredClone(v)), 180));

export function mockFunnel(q: Q): Promise<JourneyFunnel> {
  const source = q.source === "inbound" || q.source === "outbound" ? q.source : undefined;
  return later({
    funnel: "member" as const,
    range: range(q),
    filters: {},
    rows: rows(q, source),
    bySource: { inbound: rows(q, "inbound"), outbound: rows(q, "outbound") },
  });
}

export function mockPaths(q: Q): Promise<JourneyPaths> {
  const k = (days(q) / 28) * narrow(q) * (q.source === "outbound" ? 0.11 : q.source === "inbound" ? 0.89 : 1);
  const n = (v: number) => Math.max(0, Math.round(v * k));
  return later({
    range: range(q),
    filters: {},
    steps: [
      ["landing_view", "check_start", 1891],
      ["check_start", "check_finish", 1978],
      ["check_finish", "results_view", 1923],
      ["results_view", "deadlines_select", 655],
      ["results_view", "join_start", 97],
      ["deadlines_select", "signup_start", 498],
      ["signup_start", "account_created", 431],
      ["account_created", "join_start", 115],
      ["join_start", "activation_paid", 87],
      ["activation_paid", "profile_ready", 65],
      ["activation_paid", "call_booked", 21],
      ["profile_ready", "call_booked", 38],
      ["call_booked", "call_done", 50],
      ["call_done", "handoff_confirmed", 41],
      ["handoff_confirmed", "paid_work_accepted", 17],
    ].map(([from, to, v]) => ({ from: String(from), to: String(to), visitors: n(Number(v)) })),
    pages: [
      ["(entry)", "/", 4890],
      ["(entry)", "/check", 1206],
      ["(entry)", "/costa-rica", 611],
      ["(entry)", "/pricing", 287],
      ["(entry)", "/attorneys", 233],
      ["/", "/check", 1534],
      ["/", "/pricing", 702],
      ["/", "/how-it-works", 488],
      ["/pricing", "/check", 241],
      ["/pricing", "/join", 119],
      ["/costa-rica", "/check", 352],
      ["/check", "/join", 212],
      ["/check", "/status/deadlines", 431],
      ["/how-it-works", "/check", 203],
      ["/attorneys", "/lawyers/apply", 61],
    ].map(([from, to, v]) => ({ from: String(from), to: String(to), visitors: n(Number(v)) })),
    exits: [
      ["/", 3011],
      ["/check", 822],
      ["/pricing", 431],
      ["/costa-rica", 205],
      ["/join", 118],
      ["/attorneys", 141],
      ["/lawyers/apply", 37],
    ].map(([path, c]) => ({ path: String(path), count: n(Number(c)) })),
  });
}

export function mockStuck(q: Q): Promise<JourneyStuckResponse> {
  const r = rows(q, q.source === "inbound" || q.source === "outbound" ? q.source : undefined);
  const exits: Partial<Record<FunnelStepId, { path: string; count: number }[]>> = {
    landing_view: [{ path: "/", count: 3011 }, { path: "/pricing", count: 431 }],
    check_start: [{ path: "/check", count: 391 }],
    results_view: [{ path: "/check", count: 412 }, { path: "/pricing", count: 66 }],
    deadlines_select: [{ path: "/check", count: 104 }],
    account_created: [{ path: "/status/deadlines", count: 188 }, { path: "/pricing", count: 47 }],
    join_start: [{ path: "/join", count: 118 }],
  };
  const errors: Partial<Record<FunnelStepId, { target: string; count: number }[]>> = {
    deadlines_select: [{ target: "check.claim.privacy", count: 87 }, { target: "check.claim.email", count: 41 }],
    join_start: [{ target: "join.citizenships", count: 64 }, { target: "join.phone", count: 38 }, { target: "join.legalcountry", count: 12 }],
  };
  const dwell: Partial<Record<FunnelStepId, number>> = { landing_view: 41_000, check_start: 96_000, results_view: 133_000, deadlines_select: 58_000, account_created: 3.4 * DAY, join_start: 6.2 * 60_000, activation_paid: 2.6 * DAY };
  return later({
    range: range(q),
    filters: {},
    steps: r.slice(0, -1).map((row, i) => ({
      step: row.step,
      label: row.label,
      stuckCount: Math.max(0, row.visitors - r[i + 1].visitors),
      medianDwellMs: dwell[row.step] ?? (row.medianMsFromPrev ?? 60_000) * 1.4,
      topExitPaths: exits[row.step] ?? [],
      topFormErrors: errors[row.step] ?? [],
    })),
  });
}

const NAMES = [
  "Margaret Ellison", "Douglas Pruitt", "Linda Okafor", "Raymond Castellanos", "Patricia Wendt", "Gregory Lindqvist", "Susan Abernathy",
  "Thomas Kowalczyk", "Carol Hennessey", "Richard Baptiste", "Deborah Vance", "Kenneth Morales", "Barbara Szabo", "Steven Hollis",
  "Janet Fairbanks", "Paul Nakamura", "Karen Delacroix", "Mark Whitfield", "Nancy Albrecht", "Dennis Oyelaran", "Sharon McAllister",
  "Gary Lindgren", "Donna Esposito", "Larry Achterberg",
];
const STUCK_AT: FunnelStepId[] = ["account_created", "results_view", "join_start", "activation_paid", "deadlines_select", "profile_ready", "call_done"];
const COUNTRIES = ["CR", "MX", "PA", "CR", "CO", "ES", "PT", "CR"] as const;
const CSMS = ["andrea.solis@ilp.example.com", "mateo.rojas@ilp.example.com", undefined];

let peopleRows: StuckPerson[] | null = null;
export function mockStuckPeople(): Promise<StuckPerson[]> {
  if (!peopleRows) {
    peopleRows = NAMES.map((name, i) => {
      const d = 2 + ((i * 7) % 26);
      const step = STUCK_AT[i % STUCK_AT.length];
      const member = ["activation_paid", "profile_ready", "call_done"].includes(step);
      return {
        id: member ? `client:demo_${i}` : `lead:demo_${i}`,
        ...(member ? { clientId: `demo_${i}` } : { leadId: `demo_${i}` }),
        name,
        step,
        since: new Date(Date.now() - d * DAY).toISOString(),
        daysStuck: d,
        source: i % 4 === 1 ? "outbound" : "inbound",
        country: COUNTRIES[i % COUNTRIES.length],
        csmEmail: member || i % 3 === 0 ? CSMS[i % 2] : undefined,
        placeholder: true,
      } satisfies StuckPerson;
    });
  }
  return later(peopleRows);
}

export function mockStuckTask(id: string): Promise<{ task: { id: string } }> {
  const taskId = `task_demo_${id.replace(/[^a-z0-9]/gi, "")}`;
  peopleRows = (peopleRows ?? []).map((p) => (p.id === id ? { ...p, openTaskId: taskId } : p));
  return later({ task: { id: taskId } });
}

export function mockPages(q: Q): Promise<JourneyPagesResponse> {
  const k = (days(q) / 28) * narrow(q) * (q.source === "outbound" ? 0.11 : q.source === "inbound" ? 0.89 : 1);
  const P: Array<[string, number, number, number, number]> = [
    // path, views, median s, p75 s, exit rate
    ["/", 7412, 38, 94, 0.406],
    ["/check", 2911, 142, 251, 0.282],
    ["/pricing", 1288, 51, 117, 0.335],
    ["/how-it-works", 702, 66, 148, 0.214],
    ["/costa-rica", 893, 47, 121, 0.23],
    ["/mexico", 512, 44, 103, 0.262],
    ["/join", 371, 318, 641, 0.318],
    ["/status/deadlines", 446, 97, 212, 0.177],
    ["/attorneys", 402, 72, 166, 0.351],
    ["/lawyers/apply", 118, 412, 788, 0.314],
    ["/templates", 236, 29, 63, 0.483],
  ];
  return later({
    range: range(q),
    filters: {},
    pages: P.map(([path, views, med, p75, exitRate]) => ({ path, views: Math.max(0, Math.round(views * k)), medianMs: med * 1000, p75Ms: p75 * 1000, exitRate })),
  });
}

export function mockOutbound(q: Q): Promise<JourneyOutboundResponse> {
  const k = days(q) / 28;
  const R: Array<[string, "email_outreach" | "import" | "csm_call", number, number, number, number, number, number]> = [
    ["cr-retirees-nov", "email_outreach", 412, 231, 88, 61, 27, 9],
    ["mx-property-owners", "email_outreach", 298, 141, 47, 33, 12, 4],
    ["pa-residency-renewals", "email_outreach", 187, 109, 41, 29, 14, 6],
    ["expo-boquete-import", "import", 143, 0, 0, 22, 11, 3],
    ["csm-callbacks-oct", "csm_call", 64, 0, 0, 19, 13, 2],
  ];
  return later({
    range: range(q),
    rows: R.filter((r) => !q.channel || r[1] === q.channel).map(([campaign, channel, sent, opened, clicked, checkStarted, accountCreated, activationPaid]) => {
      const n = (v: number) => Math.round(v * k);
      return { campaign, channel, sent: n(sent), opened: n(opened), clicked: n(clicked), checkStarted: n(checkStarted), accountCreated: n(accountCreated), activationPaid: n(activationPaid), revenueCents: n(activationPaid) * 17999 };
    }),
  });
}

// ─── Experiments ────────────────────────────────────────────────────────────

let experiments: Experiment[] = [
  {
    id: "exp_hero_headline",
    key: "hero-headline",
    name: "Homepage headline",
    hypothesis: "A headline that names legal dates will get more visitors to start the free check than the general promise.",
    surface: "home.hero",
    variants: [
      { key: "A", name: "Current headline", weight: 50 },
      { key: "B", name: "Legal dates headline", weight: 50 },
    ],
    primaryStep: "check_start",
    guardrailSteps: ["activation_paid"],
    audience: "all",
    status: "running",
    startedAt: new Date(Date.now() - 12 * DAY).toISOString(),
    createdBy: "admin@ilp.example.com",
    createdAt: new Date(Date.now() - 14 * DAY).toISOString(),
    updatedAt: new Date(Date.now() - 12 * DAY).toISOString(),
    placeholder: true,
  },
  {
    id: "exp_check_length",
    key: "check-length",
    name: "Shorter free check",
    hypothesis: "Skipping the optional questions will let more people finish the check without lowering how many keep deadlines.",
    surface: "/check",
    variants: [
      { key: "A", name: "Every question", weight: 50 },
      { key: "B", name: "Required questions only", weight: 50 },
    ],
    primaryStep: "check_finish",
    guardrailSteps: ["deadlines_select", "account_created"],
    audience: "all",
    status: "draft",
    createdBy: "admin@ilp.example.com",
    createdAt: new Date(Date.now() - 2 * DAY).toISOString(),
    updatedAt: new Date(Date.now() - 2 * DAY).toISOString(),
    placeholder: true,
  },
];

export function mockExperiments(): Promise<Experiment[]> {
  return later(experiments);
}

export function mockExperiment(id: string): Promise<Experiment> {
  const e = experiments.find((x) => x.id === id);
  return e ? later(e) : Promise.reject(Object.assign(new Error("Experiment not found."), { status: 404 }));
}

export function mockSaveExperiment(input: ExperimentInput, id?: string): Promise<Experiment> {
  const now = new Date().toISOString();
  if (id) {
    experiments = experiments.map((e) => (e.id === id ? { ...e, ...input, updatedAt: now } : e));
    return mockExperiment(id);
  }
  const e: Experiment = { ...input, id: `exp_${input.key.replace(/-/g, "_")}_${experiments.length + 1}`, status: "draft", createdBy: "you", createdAt: now, updatedAt: now, placeholder: true };
  experiments = [e, ...experiments];
  return later(e);
}

export function mockExperimentAction(id: string, action: "start" | "pause" | "end" | "winner", winner?: string): Promise<Experiment> {
  const now = new Date().toISOString();
  experiments = experiments.map((e) => {
    if (e.id !== id) return e;
    if (action === "start") return { ...e, status: "running", startedAt: e.startedAt ?? now, updatedAt: now };
    if (action === "pause") return { ...e, status: "paused", updatedAt: now };
    if (action === "end") return { ...e, status: "ended", endedAt: now, updatedAt: now };
    return { ...e, winner, updatedAt: now };
  });
  return mockExperiment(id);
}

export function mockExperimentResults(id: string): Promise<ExperimentResult> {
  if (id === "exp_hero_headline") {
    return later({
      experimentId: id,
      variants: [
        { key: "A", name: "Current headline", visitors: 1874, conversions: 497, rate: 0.2652, liftVsControl: null, probabilityBest: 0.113, ci95: [0.2456, 0.2858], guardrails: [{ step: "activation_paid", rate: 0.0123 }] },
        { key: "B", name: "Legal dates headline", visitors: 1911, conversions: 551, rate: 0.2883, liftVsControl: 0.0871, probabilityBest: 0.887, ci95: [0.2684, 0.309], guardrails: [{ step: "activation_paid", rate: 0.0115 }] },
      ],
      sampleSizeNeeded: 2860,
      enoughData: false,
      srmWarning: false,
    });
  }
  const e = experiments.find((x) => x.id === id);
  return later({
    experimentId: id,
    variants: (e?.variants ?? []).map((v, i) => ({ key: v.key, name: v.name, visitors: 0, conversions: 0, rate: 0, liftVsControl: i === 0 ? null : null, probabilityBest: 0, ci95: [0, 0] as [number, number] })),
    sampleSizeNeeded: 2860,
    enoughData: false,
    srmWarning: false,
  });
}
