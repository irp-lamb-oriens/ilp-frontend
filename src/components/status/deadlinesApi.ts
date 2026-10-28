/**
 * components/status/deadlinesApi.ts — DEADLINES: the person's own deadlines.
 * Server: server/API/clientStatus/memberDeadlines.ts (members and free accounts).
 * With NEXT_PUBLIC_W4_MOCK=1 the list and changes stay in memory.
 */

import { clientApi } from "@/lib/status";
import type { CountryCode } from "@/lib/contracts";
import type { DeadlineCardItem, DeadlineRow } from "@/lib/deadlines";
import { apiListSource, memoryListSource, type ListSource } from "@/lib/listSource";

const BASE = "/api/client-status/me/deadlines";
const MOCK = process.env.NEXT_PUBLIC_W4_MOCK === "1";

export interface PickerPayload {
  country: CountryCode;
  homeCountry: CountryCode;
  items: Array<DeadlineCardItem & { ruleId: string; country: CountryCode }>;
}

export interface DeadlinePatchBody {
  userDueAt?: string | null;
  status?: "upcoming" | "handled";
  remind?: boolean;
  dismissed?: boolean;
  notes?: string;
}

export interface AddResult {
  created: number;
  restored: number;
  kept: number;
  items: DeadlineRow[];
}

// ── In-memory demo (NEXT_PUBLIC_W4_MOCK=1) ──────────────────────────────────
const NOW = Date.now();
const day = (n: number) => new Date(NOW + n * 86_400_000).toISOString();
let mockRows: DeadlineRow[] = [
  mockRow("m1", "CR_VEH_MARCHAMO", "vehicle", "Vehicle circulation permit (marchamo) may require review", day(64), "Every vehicle pays the yearly marchamo before it can be driven in the new year.", "soon"),
  mockRow("m2", "CR_PROP_MUNICIPAL_TAX", "property", "Municipal property tax may require review", day(150), "The municipality bills property tax in quarterly installments.", "later"),
  mockRow("m3", "CR_VEH_RTV", "vehicle", "Vehicle inspection (RTV) may require review", undefined, "The vehicle needs its technical inspection in the month set by the plate's last digit.", "needsDate"),
];
function mockRow(id: string, ruleId: string, area: string, title: string, dueAt: string | undefined, meaning: string, group: DeadlineRow["group"]): DeadlineRow {
  return {
    id, clientId: "demo", country: "CR", countryName: "Costa Rica", ruleId, title, area, meaning, authority: "Ministerio de Hacienda",
    status: "upcoming", source: "check", confidence: "high", dueAt, shownDueAt: dueAt ?? null, suggestedDueAt: dueAt ?? null,
    hasDate: !!dueAt, needsDate: !dueAt, remind: true, group,
  };
}

export const deadlinesSource: ListSource<DeadlineRow> = MOCK
  ? memoryListSource(async () => mockRows.filter((r) => r.status !== "dismissed"), {
    search: (r) => [r.title, r.meaning],
    filters: { area: (r, v) => r.area === v, status: (r, v) => r.status === v, source: (r, v) => r.source === v },
    sorts: { shownDueAt: (r) => r.shownDueAt ?? "9999", title: (r) => r.title },
  })
  : apiListSource<DeadlineRow>(clientApi, BASE);

export const deadlinesApi = {
  available: (country?: CountryCode): Promise<PickerPayload> =>
    MOCK
      ? Promise.resolve({ country: "CR", homeCountry: "CR", items: [] })
      : clientApi.get<PickerPayload>(`${BASE}/available`, { query: { country } }),
  add: (body: { country: CountryCode; ruleIds: string[]; claimToken?: string }): Promise<AddResult> =>
    MOCK
      ? Promise.resolve({ created: 0, restored: 0, kept: body.ruleIds.length, items: [] })
      : clientApi.post<AddResult>(BASE, body),
  patch: (id: string, body: DeadlinePatchBody): Promise<DeadlineRow> => {
    if (!MOCK) return clientApi.patch<DeadlineRow>(`${BASE}/${encodeURIComponent(id)}`, body);
    mockRows = mockRows.map((r) => {
      if (r.id !== id) return r;
      const next: DeadlineRow = { ...r };
      if ("userDueAt" in body) {
        next.userDueAt = body.userDueAt ?? null;
        next.shownDueAt = body.userDueAt ?? r.dueAt ?? null;
        next.hasDate = !!next.shownDueAt;
        next.needsDate = !next.shownDueAt;
      }
      if (body.status) next.status = body.status;
      if (typeof body.remind === "boolean") next.remind = body.remind;
      if (body.dismissed === true) next.status = "dismissed";
      if (body.dismissed === false) next.status = "upcoming";
      if (typeof body.notes === "string") next.notes = body.notes;
      return next;
    });
    return Promise.resolve(mockRows.find((r) => r.id === id)!);
  },
};
