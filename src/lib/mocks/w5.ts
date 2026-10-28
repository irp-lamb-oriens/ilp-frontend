/**
 * W5 lawyer-home mock (NEXT_PUBLIC_W5_MOCKS=1). Same signatures as the real
 * `lawyerApi` in components/lawyer/lawyerApi.ts, backed by an in-memory copy
 * of the W1 demo seed for Adriana Mora (demo_prov_mora), plus the one thing
 * the seed does not have yet: a recorded transcript with a suggested summary
 * on today's 10:00 call (see W5 Requests). Never contains margin fields.
 */

import type {
  BoardCard,
  BoardData,
  Brief,
  ClientBrief,
  FinanceData,
  LawyerApi,
  LegalNextStep,
  TodayItem,
} from "@/components/lawyer/lawyerApi";
import type { LawyerClient } from "@/components/lawyer/types";

const DAY = 86_400_000;
const now = () => new Date();
const at = (days: number, h = 9, m = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};
const ago = (days: number) => new Date(Date.now() - days * DAY).toISOString();
const wait = <T>(v: T) => new Promise<T>((r) => setTimeout(() => r(structuredClone(v)), 120));

interface MockMember {
  clientId: string;
  name: string;
  email: string;
  phone: string;
  nationality: string;
  age: number;
  maritalStatus: string;
  dependents: number;
  residency: { status: string; expiresAt: string | null };
  property: { owns: boolean; location: string | null };
  company: { has: boolean; type: string | null };
  vehicle: boolean;
  completeness: number;
  minutesLeft: number;
  callsLeft: number;
  matter: { id: string; title: string; area: string; stage: string; stageEnteredAt: string; nextStep: LegalNextStep | null };
  obligations: Array<{ id: string; title: string; dueAt: string; status: string }>;
}

const MEMBERS: MockMember[] = [
  {
    clientId: "demo_client_hayes",
    name: "Robert James Hayes",
    email: "robert.hayes@example.com",
    phone: "+1 503 555 0141",
    nationality: "US",
    age: 69,
    maritalStatus: "married",
    dependents: 0,
    residency: { status: "pensionado", expiresAt: at(160) },
    property: { owns: true, location: "Tamarindo, Guanacaste" },
    company: { has: true, type: "S.A." },
    vehicle: true,
    completeness: 0.857,
    minutesLeft: 60,
    callsLeft: 3,
    matter: {
      id: "demo_mat_hayes",
      title: "Tamarindo house: S.A. records and title check",
      area: "corporate",
      stage: "legal_review",
      stageEnteredAt: ago(5),
      nextStep: { what: "Send the S.A. legal books and last corporation tax receipt", who: "client", dueAt: at(5) },
    },
    obligations: [
      { id: "obl_hayes_corp", title: "Annual corporation tax (impuesto a las personas jurídicas) may require payment", dueAt: at(97), status: "upcoming" },
      { id: "obl_hayes_prop", title: "Municipal property tax (bienes inmuebles) instalment may be due", dueAt: at(66), status: "upcoming" },
      { id: "obl_hayes_marchamo", title: "Vehicle circulation permit (marchamo) renewal may be due", dueAt: at(66), status: "upcoming" },
      { id: "obl_hayes_rtbf_old", title: "Beneficial ownership declaration (RTBF) may require filing", dueAt: ago(9), status: "upcoming" },
    ],
  },
  {
    clientId: "demo_client_brooks",
    name: "Jennifer Brooks",
    email: "jennifer.brooks@example.com",
    phone: "+1 512 555 0133",
    nationality: "US",
    age: 51,
    maritalStatus: "single",
    dependents: 0,
    residency: { status: "tourist", expiresAt: null },
    property: { owns: true, location: "Dominical, Puntarenas" },
    company: { has: false, type: null },
    vehicle: false,
    completeness: 0.643,
    minutesLeft: 40,
    callsLeft: 2,
    matter: {
      id: "demo_mat_brooks",
      title: "Dominical lot: title and boundary review",
      area: "real_estate",
      stage: "legal_review",
      stageEnteredAt: ago(19),
      nextStep: { what: "Adriana to deliver the title study (estudio registral)", who: "lawyer", dueAt: at(4) },
    },
    obligations: [
      { id: "obl_brooks_prop", title: "Municipal property tax (bienes inmuebles) instalment may be due", dueAt: at(66), status: "upcoming" },
    ],
  },
  {
    clientId: "demo_client_alvarez",
    name: "Daniel Alvarez",
    email: "daniel.alvarez@example.com",
    phone: "+1 305 555 0178",
    nationality: "US",
    age: 58,
    maritalStatus: "married",
    dependents: 2,
    residency: { status: "inversionista", expiresAt: at(410) },
    property: { owns: true, location: "Jacó, Puntarenas" },
    company: { has: true, type: "S.A." },
    vehicle: false,
    completeness: 0.786,
    minutesLeft: 40,
    callsLeft: 2,
    matter: {
      id: "demo_mat_alvarez",
      title: "Jacó condos: S.A. clean-up before sale",
      area: "corporate",
      stage: "quote_sent",
      stageEnteredAt: ago(6),
      nextStep: { what: "Send the S.A. legal books and shareholder register", who: "client", dueAt: at(2) },
    },
    obligations: [
      { id: "obl_alvarez_corp", title: "Annual corporation tax (impuesto a las personas jurídicas) may require payment", dueAt: ago(3), status: "upcoming" },
    ],
  },
];

const HAYES_TRANSCRIPT = `Adriana: Thanks for joining, Robert. I have your file open: the Tamarindo house is held by your S.A., and you asked about good standing.
Robert: Right. I bought the company with the house in 2019 and I don't know what has been filed since.
Adriana: The registry shows the S.A. active, but the corporation tax for 2025 is not showing as paid, and the beneficial ownership declaration was due in April.
Robert: So we're behind?
Adriana: On those two, likely yes. Both can be brought current. I need the legal books and the last tax receipt you have to confirm.
Robert: I can scan the books this week. My wife Linda is also a shareholder, does that matter?
Adriana: It does for the declaration. Please send her passport copy too. Once I see the books I'll tell you exactly what to file before January 31.`;

interface MockCall {
  id: string;
  clientId: string;
  scheduledAt: string;
  durationMin: number;
  status: TodayItem["status"];
  question: string;
  consent: { recording: "pending" | "granted" | "declined"; at?: string };
  transcript: string | null;
  summary: Brief["consultation"]["summary"];
  suggestedNextSteps: LegalNextStep[];
  minutesUsed: number | null;
  handoffId: string | null;
}

const state = {
  calls: [
    {
      id: "demo_con_hayes_1",
      clientId: "demo_client_hayes",
      scheduledAt: at(0, 10),
      durationMin: 20,
      status: "in_progress",
      question: "Is my S.A. in good standing, and what do I need to file before January?",
      consent: { recording: "granted", at: at(0, 10) },
      transcript: HAYES_TRANSCRIPT,
      summary: {
        text: "The S.A. holding the Tamarindo house is active in the registry. The 2025 corporation tax and the April beneficial ownership (RTBF) declaration do not appear as filed. Both can be brought current once the legal books and last tax receipt are reviewed. Linda Hayes is a shareholder and must be included in the RTBF declaration.",
        status: "suggested",
      },
      suggestedNextSteps: [
        { what: "Send scans of the S.A. legal books, the last corporation tax receipt and Linda's passport", who: "client", dueAt: at(4) },
        { what: "Review the books and confirm what must be filed before January 31", who: "lawyer", dueAt: at(9) },
      ],
      minutesUsed: null,
      handoffId: null,
    },
    {
      id: "demo_con_brooks_2",
      clientId: "demo_client_brooks",
      scheduledAt: at(0, 14),
      durationMin: 20,
      status: "booked",
      question: "What did the title study find on the boundary?",
      consent: { recording: "pending" },
      transcript: null,
      summary: null,
      suggestedNextSteps: [],
      minutesUsed: null,
      handoffId: null,
    },
  ] as MockCall[],
  stages: { demo_mat_hayes: "legal_review", demo_mat_brooks: "legal_review", demo_mat_alvarez: "quote_sent" } as Record<string, string>,
  entered: {} as Record<string, string>,
};

const STAGES = [
  { id: "intake", label: "Intake" },
  { id: "scoping", label: "Scoping" },
  { id: "documents", label: "Documents" },
  { id: "legal_review", label: "Legal review" },
  { id: "quote_sent", label: "Quote sent" },
  { id: "filing", label: "Filing" },
  { id: "closed", label: "Closed" },
];
const stageLabel = (id: string) => STAGES.find((s) => s.id === id)?.label ?? id;

const member = (clientId: string) => {
  const m = MEMBERS.find((x) => x.clientId === clientId);
  if (!m) throw new Error("Member not found.");
  return m;
};
const call = (id: string) => {
  const c = state.calls.find((x) => x.id === id);
  if (!c) throw new Error("Consultation not found.");
  return c;
};

function briefFor(c: MockCall): Brief {
  const m = member(c.clientId);
  const horizon = Date.now() + 60 * DAY;
  return {
    consultation: { ...c, matterId: m.matter.id },
    who: { name: m.name, email: m.email, phone: m.phone, nationality: m.nationality, age: m.age, country: "CR" },
    household: { maritalStatus: m.maritalStatus, dependents: m.dependents },
    residency: m.residency,
    assets: { property: m.property, company: m.company, vehicle: { owns: m.vehicle } },
    matters: [{
      ...m.matter,
      stage: state.stages[m.matter.id],
      stageLabel: stageLabel(state.stages[m.matter.id]),
      stageEnteredAt: state.entered[m.matter.id] ?? m.matter.stageEnteredAt,
      current: true,
    }],
    obligations: m.obligations
      .filter((o) => new Date(o.dueAt).getTime() <= horizon)
      .map((o) => ({ ...o, overdue: new Date(o.dueAt) < now() })),
    completeness: { score: m.completeness, bySection: {}, consultationReady: m.completeness >= 0.7 },
    membership: { minutesLeft: m.minutesLeft, callsLeft: m.callsLeft },
    priorSummaries: [],
  };
}

function cardFor(m: MockMember): BoardCard {
  const n = now().toISOString();
  return {
    id: m.matter.id,
    clientId: m.clientId,
    clientName: m.name,
    title: m.matter.title,
    area: m.matter.area,
    country: "CR",
    stage: state.stages[m.matter.id],
    stageEnteredAt: state.entered[m.matter.id] ?? m.matter.stageEnteredAt,
    nextStep: m.matter.nextStep,
    overdueCount: m.obligations.filter((o) => o.dueAt < n).length,
    dueSoonCount: m.obligations.filter((o) => o.dueAt >= n && new Date(o.dueAt).getTime() < Date.now() + 14 * DAY).length,
    nextCallAt: state.calls.find((c) => c.clientId === m.clientId && c.status === "booked")?.scheduledAt ?? null,
  };
}

export const w5Mock: LawyerApi = {
  me: () => wait({ providerId: "demo_prov_mora", email: "adriana.mora@demo.internationallegalpartner.com", name: "Adriana Mora", legalAreas: ["real_estate", "corporate"], jurisdictions: ["Costa Rica"] }),
  today: (from, to) =>
    wait({
      items: state.calls
        .filter((c) => c.scheduledAt >= from && c.scheduledAt < to)
        .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
        .map((c): TodayItem => {
          const m = member(c.clientId);
          return {
            id: c.id,
            clientId: c.clientId,
            clientName: m.name,
            matterId: m.matter.id,
            matterTitle: m.matter.title,
            area: m.matter.area,
            scheduledAt: c.scheduledAt,
            durationMin: c.durationMin,
            status: c.status,
            question: c.question,
            consent: c.consent,
            summaryStatus: c.summary?.status ?? null,
            handoffId: c.handoffId,
          };
        }),
    }),
  brief: async (id) => wait(briefFor(call(id))),
  clientBrief: async (clientId): Promise<ClientBrief> => {
    const c = state.calls.find((x) => x.clientId === clientId);
    const base = c ? briefFor(c) : briefFor({ ...state.calls[0], clientId, id: "" });
    return wait({
      ...base,
      calls: state.calls.filter((x) => x.clientId === clientId).map((x) => ({
        id: x.id, scheduledAt: x.scheduledAt, status: x.status, question: x.question, minutesUsed: x.minutesUsed,
        summary: x.summary?.status === "confirmed" ? x.summary.text : null, summaryStatus: x.summary?.status ?? null, handoffId: x.handoffId,
      })),
    });
  },
  async setConsent(id, recording) {
    call(id).consent = { recording, at: now().toISOString() };
  },
  async setCallStatus(id, status) {
    call(id).status = status;
  },
  async saveTranscript(id, transcript) {
    call(id).transcript = transcript;
  },
  async suggest(id) {
    const c = call(id);
    if (!c.transcript) throw new Error("No transcript yet. Paste one or write the summary yourself.");
    c.summary = c.summary ?? { text: "Draft summary from the transcript.", status: "suggested" };
    return wait({ summary: { text: c.summary.text, status: "suggested" as const }, suggestedNextSteps: c.suggestedNextSteps });
  },
  async confirmAndHandOff(id, input) {
    const c = call(id);
    if (!input.steps.length) throw new Error("At least one next step is required.");
    c.summary = { text: input.summary, status: "confirmed", confirmedAt: now().toISOString() };
    c.status = "completed";
    c.minutesUsed = input.minutesUsed;
    c.handoffId = c.handoffId ?? `hof_mock_${id}`;
    const m = member(c.clientId);
    m.minutesLeft = Math.max(0, m.minutesLeft - input.minutesUsed);
    m.callsLeft = Math.max(0, m.callsLeft - 1);
    m.matter.nextStep = input.steps[0];
    return wait({ handoffId: c.handoffId });
  },
  board: (): Promise<BoardData> =>
    wait({ cards: MEMBERS.map(cardFor), stages: STAGES.map((s) => s.id), stageLabels: STAGES, total: MEMBERS.length }),
  async moveMatter(id, stage) {
    state.stages[id] = stage;
    state.entered[id] = now().toISOString();
    const m = MEMBERS.find((x) => x.matter.id === id);
    if (!m) throw new Error("Matter not found.");
    return wait(cardFor(m));
  },
  finance: (): Promise<FinanceData> => {
    const payments = [
      { id: "pp1", quoteId: "q_alvarez", quoteTitle: "S.A. clean-up before sale", clientId: "demo_client_alvarez", clientName: "Daniel Alvarez", matterId: "demo_mat_alvarez", matterTitle: "Jacó condos: S.A. clean-up before sale", amount: 725, paid: false, date: at(12), note: "First 50% on acceptance" },
      { id: "pp2", quoteId: "q_brooks", quoteTitle: "Title study (estudio registral)", clientId: "demo_client_brooks", clientName: "Jennifer Brooks", matterId: "demo_mat_brooks", matterTitle: "Dominical lot: title and boundary review", amount: 380, paid: true, date: ago(8), note: "Title study" },
      { id: "pp3", quoteId: "q_hayes", quoteTitle: "Registry check", clientId: "demo_client_hayes", clientName: "Robert James Hayes", matterId: "demo_mat_hayes", matterTitle: "Tamarindo house: S.A. records and title check", amount: 160, paid: true, date: ago(15), note: null },
    ];
    const byMatter = payments.map((p) => ({
      key: p.matterId, title: p.matterTitle, clientName: p.clientName,
      paid: p.paid ? p.amount : 0, pending: p.paid ? 0 : p.amount,
      lastPayoutAt: p.paid ? p.date : null, nextPayoutAt: p.paid ? null : p.date,
    }));
    return wait({ currency: "USD", totals: { paid: 540, pending: 725 }, byMatter, payments });
  },
  client: async (clientId): Promise<LawyerClient> => {
    const m = member(clientId);
    const [name, ...rest] = m.name.split(" ");
    return wait({
      id: m.clientId, email: m.email, name, surname: rest.join(" "), phone: m.phone,
      legalArea: m.matter.area, legalMatter: m.matter.title, jurisdiction: "Costa Rica", documents: [],
      stage: state.stages[m.matter.id], stageEnteredAt: m.matter.stageEnteredAt, pendingCount: 0, pendingActions: [],
      notes: [], activityLog: [], quotes: [], charges: [], statusChatThread: [], customFields: {}, source: "demo",
      createdAt: ago(60), lastUpdated: ago(1), transcript: null, transcriptInsights: null,
    });
  },
  async updateClientField() {},
  async logout() {},
};
