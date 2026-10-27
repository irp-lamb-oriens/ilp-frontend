/**
 * lib/mocks/w4.ts — in-memory member home for W4 (NEXT_PUBLIC_W4_MOCK=1).
 *
 * Same signatures as the live client in components/status/api.ts, with data
 * shaped like W1's seedDemo member Robert Hayes (Tamarindo house held by an
 * S.A., pensionado residency). Lets the /status pages render and be clicked
 * through with no server. State resets on reload.
 */

import type {
  Capacity,
  MemberApi,
  MemberDocument,
  MemberHome,
  MoneyPayload,
  ThreadItem,
} from "@/components/status/api";
import { PLAN_STANDARD, profileCompleteness } from "@/lib/contracts";

const DAY = 86400_000;
const at = (days: number, hourCR = 10, min = 0) => {
  const d = new Date();
  d.setUTCHours(hourCR + 6, min, 0, 0);
  return new Date(d.getTime() + days * DAY).toISOString();
};
const nextDate = (month: number, day: number) => {
  const y = new Date().getUTCFullYear();
  const d = new Date(Date.UTC(y, month - 1, day, 6));
  return (d.getTime() < Date.now() ? new Date(Date.UTC(y + 1, month - 1, day, 6)) : d).toISOString();
};
const wait = <T,>(v: T, ms = 250) => new Promise<T>((r) => setTimeout(() => r(structuredClone(v)), ms));

const profile: Record<string, string | number | boolean | null> = {
  fullName: "Robert James Hayes",
  email: "robert.hayes@example.com",
  phone: "+1 503 555 0141",
  nationality: "US",
  dateOfBirth: "1957-04-12",
  maritalStatus: "married",
  dependents: 0,
  residencyStatus: "pensionado",
  residencyExpiresAt: at(160).slice(0, 10),
  ownsProperty: true,
  propertyLocation: "Tamarindo, Guanacaste",
  hasCompany: true,
  companyType: "SA",
  ownsVehicle: null,
};

const state = {
  minutesUsed: 0,
  callsUsed: 0,
  booked: [] as Array<{ id: string; scheduledAt: string; question: string }>,
  obligations: [
    { id: "demo_obl_hayes_0", clientId: "demo", country: "CR" as const, ruleId: "CR-corp-tax", title: "Annual corporation tax (impuesto a las personas jurídicas) may require payment", dueAt: nextDate(1, 31), status: "upcoming" as const },
    { id: "demo_obl_hayes_1", clientId: "demo", country: "CR" as const, ruleId: "CR-rtbf", title: "Beneficial ownership declaration (RTBF) may require filing", dueAt: nextDate(4, 30), status: "upcoming" as const },
    { id: "demo_obl_hayes_2", clientId: "demo", country: "CR" as const, ruleId: "CR-property-tax", title: "Municipal property tax (bienes inmuebles) instalment may be due", dueAt: nextDate(12, 31), status: "upcoming" as const },
  ] as MemberHome["obligations"],
  pending: [] as string[],
  documents: [] as MemberDocument[],
  thread: [
    { id: "c1", kind: "team", author: "Mariela Solís (ILP team)", body: "Welcome, Robert. I am your Customer Success Manager. Lucía Mora will review your S.A. records; I will keep you posted on every step.", at: at(-20, 9) },
    { id: "c2", kind: "member", author: "Robert Hayes", body: "Thank you. Where do I find the legal books for the S.A.?", at: at(-19, 15), to: "team" },
    { id: "l1", kind: "member", author: "Robert Hayes", body: "What is the RTBF?", at: at(-3, 18), to: "ai" },
    { id: "l2", kind: "ai", author: "AI assistant", body: "The RTBF is the beneficial ownership register kept by the Central Bank of Costa Rica. Companies file a yearly declaration of who ultimately owns them, usually in April.", at: at(-3, 18, 1) },
  ] as ThreadItem[],
  money: {
    balanceDueCents: 0,
    paidCents: 17999,
    charges: [
      { id: "ch_m1", label: "Membership month 1", date: at(-21), amountCents: 7999, paidCents: 7999, balanceCents: 0, status: "paid", currency: "USD" },
      { id: "ch_act", label: "Activation fee", date: at(-21), amountCents: 10000, paidCents: 10000, balanceCents: 0, status: "paid", currency: "USD" },
    ],
    quotes: [
      { id: "demo_quote_hayes_1", title: "S.A. records clean-up", status: "awaiting", totalCents: 145000, currency: "USD", scope: ["Overdue corporation tax filings (2 years)", "Legal books legalisation and shareholder update"], summary: "Bring your S.A. up to date so the Tamarindo house can be sold or inherited without delays.", createdAt: at(-1) },
    ],
  } as MoneyPayload,
};

function capacity(): Capacity {
  const minutesLeft = PLAN_STANDARD.minutesIncluded - state.minutesUsed;
  const callsLeft = PLAN_STANDARD.callsIncluded - state.callsUsed;
  const minutesBooked = state.booked.length * PLAN_STANDARD.callLengthMin;
  const callsBooked = state.booked.length;
  const minutesAvailable = minutesLeft - minutesBooked;
  const callsAvailable = callsLeft - callsBooked;
  const canBook = callsAvailable > 0 && minutesAvailable >= PLAN_STANDARD.callLengthMin;
  return {
    minutesLeft,
    callsLeft,
    minutesBooked,
    callsBooked,
    minutesAvailable,
    callsAvailable,
    canBook,
    reason: canBook ? undefined : `You have used or booked all ${PLAN_STANDARD.callsIncluded} calls for this month.`,
  };
}

function home(): MemberHome {
  const periodStart = at(-21, 9);
  return {
    member: { id: "demo_client_hayes", name: "Robert Hayes", firstName: "Robert", email: "robert.hayes@example.com" },
    membership: {
      id: "demo_mem_hayes",
      clientId: "demo_client_hayes",
      plan: "standard",
      status: "active",
      country: "CR",
      activatedAt: periodStart,
      periodStart,
      periodEnd: at(9, 9),
      minutesIncluded: 60,
      minutesUsed: state.minutesUsed,
      callsIncluded: 3,
      callsUsed: state.callsUsed,
      createdAt: periodStart,
      updatedAt: periodStart,
    },
    capacity: capacity(),
    matters: [
      {
        id: "demo_matter_hayes",
        title: "Tamarindo house: S.A. records and title check",
        area: "corporate",
        stage: "legal_review",
        stageEnteredAt: at(-5),
        openedAt: periodStart,
        lawyerName: "Lucía Mora",
        nextStep: { what: "Send the S.A. legal books and last corporation tax receipt", who: "client", dueAt: at(5), source: "matter", more: [] },
      },
      {
        id: "demo_matter_hayes_res",
        title: "Pensionado residency renewal",
        area: "immigration",
        stage: "scoping",
        stageEnteredAt: at(-2),
        openedAt: at(-2),
        lawyerName: "Esteban Solís",
        nextStep: { what: "Esteban to confirm which documents the renewal needs", who: "lawyer", dueAt: at(6), source: "matter", more: [] },
      },
    ],
    generalNextStep: null,
    stages: [
      { id: "scoping", label: "Scoping", description: "" },
      { id: "legal_review", label: "Legal Review", description: "" },
      { id: "quote_sent", label: "Quote Sent", description: "" },
      { id: "quote_accepted", label: "Quote Accepted", description: "" },
      { id: "filing", label: "Filing", description: "" },
      { id: "closed", label: "Closed", description: "" },
    ],
    upcomingCalls: state.booked.map((b) => ({ id: b.id, scheduledAt: b.scheduledAt, durationMin: 20, question: b.question, lawyerName: "Lucía Mora" })),
    pastCalls: [],
    obligations: state.obligations,
    completeness: profileCompleteness(profile),
    profile: { ...profile },
    pendingQuestions: [...state.pending],
  };
}

function slots(): string[] {
  const out: string[] = [];
  for (let d = 1; out.length < 40 && d < 14; d++) {
    const day = new Date(at(d, 0));
    const dow = new Date(day.getTime() - 6 * 3600_000).getUTCDay();
    if (dow === 0 || dow === 6) continue;
    for (const [h, m] of [[9, 0], [9, 20], [10, 40], [11, 0], [14, 0], [14, 20], [15, 40]]) out.push(at(d, h, m));
  }
  const taken = new Set(state.booked.map((b) => b.scheduledAt));
  return out.filter((s) => !taken.has(s));
}

export const mockMemberApi: MemberApi = {
  home: () => wait(home()),
  slots: () => wait({ slots: slots(), lawyerName: "Lucía Mora", lengthMin: 20 }),
  book: async ({ scheduledAt, question }) => {
    if (!capacity().canBook) throw new Error(capacity().reason);
    const q = state.pending.length ? `${question}\n\nAlso on my list:\n- ${state.pending.join("\n- ")}` : question;
    state.booked.push({ id: `c${Date.now()}`, scheduledAt, question: q });
    state.pending = [];
    return wait({ capacity: capacity() });
  },
  askLawyer: async (id) => {
    const o = state.obligations.find((x) => x.id === id);
    if (o) o.status = "asked";
    const call = state.booked[0];
    if (call) {
      call.question += `\n- Does this apply to me: ${o?.title}?`;
      return wait({ addedTo: "call" as const, callAt: call.scheduledAt });
    }
    state.pending.push(`Does this apply to me: ${o?.title}?`);
    return wait({ addedTo: "list" as const, callAt: null });
  },
  saveProfile: async (values) => {
    Object.assign(profile, values);
    return wait({ completeness: profileCompleteness(profile) });
  },
  documents: () => wait({ items: state.documents, categories: ["identity", "residency", "property", "company", "vehicle", "tax", "other"] }),
  upload: async (input) => {
    const doc: MemberDocument = {
      id: `doc${Date.now()}`,
      matterId: input.matterId,
      category: input.category,
      fileName: input.fileName,
      contentType: input.contentType,
      size: Math.floor((input.dataBase64.length * 3) / 4),
      uploadedAt: new Date().toISOString(),
    };
    state.documents.unshift(doc);
    return wait(doc);
  },
  downloadDocument: () => Promise.resolve(),
  money: () => wait(state.money),
  acceptQuote: async (id) => {
    const q = state.money.quotes.find((x) => x.id === id);
    if (q) {
      q.status = "accepted";
      q.acceptedAt = new Date().toISOString();
      state.money.charges.unshift({ id: `ch_${id}`, label: q.title, date: q.acceptedAt, amountCents: q.totalCents ?? 0, paidCents: 0, balanceCents: q.totalCents ?? 0, status: "due", currency: "USD" });
      state.money.balanceDueCents += q.totalCents ?? 0;
    }
    return wait(state.money);
  },
  messages: () => wait({ items: state.thread }),
  sendMessage: async (body) => {
    state.thread.push({ id: `m${Date.now()}`, kind: "member", author: "Robert Hayes", body, at: new Date().toISOString(), to: "team" });
    return wait({ items: state.thread });
  },
  askAssistant: async (message) => {
    state.thread.push({ id: `q${Date.now()}`, kind: "member", author: "Robert Hayes", body: message, at: new Date().toISOString(), to: "ai" });
    state.thread.push({ id: `a${Date.now()}`, kind: "ai", author: "AI assistant", body: "In general, Costa Rican companies file a yearly corporation tax return even when inactive. Whether it applies to your S.A. depends on its registration.", at: new Date(Date.now() + 1000).toISOString() });
    return wait({ items: state.thread }, 600);
  },
  logout: async () => undefined,
};
