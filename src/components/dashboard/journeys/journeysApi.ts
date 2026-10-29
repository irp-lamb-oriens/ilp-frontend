/**
 * Journeys staff API (GET /api/dashboard/journeys/*, experiments CRUD).
 * While a route answers 404 (the server is not deployed yet), or with
 * NEXT_PUBLIC_JOURNEYS_MOCK=1, the same functions answer from
 * lib/mocks/journeys.ts and say so (`sample: true`), so the screen can show
 * a "sample figures" notice instead of passing them off as real.
 */
import { ApiError, staffApi } from "@/lib/api";
import type {
  Experiment,
  ExperimentInput,
  ExperimentResult,
  JourneyFunnel,
  JourneyOutboundResponse,
  JourneyPagesResponse,
  JourneyPaths,
  JourneyStuckResponse,
  StuckPerson,
  StuckTaskRequest,
} from "@/lib/contracts";
import { type ListSource, apiListSource, memoryListSource } from "@/lib/listSource";
import * as mock from "@/lib/mocks/journeys";

export interface Sampled<T> {
  data: T;
  sample: boolean;
}

type Q = Record<string, string | undefined>;

const BASE = "/api/dashboard/journeys";
const forceMock = process.env.NEXT_PUBLIC_JOURNEYS_MOCK === "1";
let routesMissing = false;
/** Set after any Journeys route answered: a later 404 then means "not found", not "not deployed". */
let routesLive = false;

/** Real route first; the sample when the route is not there (404) or mocks are forced. */
async function withSample<T>(real: () => Promise<T>, sample: () => Promise<T>): Promise<Sampled<T>> {
  if (forceMock || routesMissing) return { data: await sample(), sample: true };
  try {
    const data = await real();
    routesLive = true;
    return { data, sample: false };
  } catch (e) {
    if (e instanceof ApiError && e.status === 404 && !routesLive) {
      routesMissing = true;
      return { data: await sample(), sample: true };
    }
    throw e;
  }
}

/** True once a Journeys route answered 404 and the screens show sample figures. */
export const usingSample = () => forceMock || routesMissing;

export const getFunnel = (q: Q) => withSample(() => staffApi.get<JourneyFunnel>(`${BASE}/funnel`, { query: q }), () => mock.mockFunnel(q));
export const getPaths = (q: Q) => withSample(() => staffApi.get<JourneyPaths>(`${BASE}/paths`, { query: q }), () => mock.mockPaths(q));
export const getStuck = (q: Q) => withSample(() => staffApi.get<JourneyStuckResponse>(`${BASE}/stuck`, { query: q }), () => mock.mockStuck(q));
export const getPages = (q: Q) => withSample(() => staffApi.get<JourneyPagesResponse>(`${BASE}/pages`, { query: q }), () => mock.mockPages(q));
export const getOutbound = (q: Q) => withSample(() => staffApi.get<JourneyOutboundResponse>(`${BASE}/outbound`, { query: q }), () => mock.mockOutbound(q));

const realPeople = apiListSource<StuckPerson>(staffApi, `${BASE}/stuck/people`);
const samplePeople = memoryListSource<StuckPerson>(mock.mockStuckPeople, {
  search: (r) => [r.name, r.csmEmail, r.country],
  sorts: { days: (r) => r.daysStuck, name: (r) => r.name ?? "" },
  filters: {
    step: (r, v) => r.step === v,
    source: (r, v) => r.source === v,
    country: (r, v) => r.country === v,
    days: (r, v) => r.daysStuck >= Number(v),
  },
});

/** Stuck people, a page at a time (helper/listing.ts contract), or the sample list. */
export const stuckPeopleSource: ListSource<StuckPerson> = async (req, cb) => {
  if (forceMock || routesMissing) return samplePeople(req, cb);
  try {
    const tail = await realPeople(req, cb);
    routesLive = true;
    return tail;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404 && !routesLive) {
      routesMissing = true;
      return samplePeople(req, cb);
    }
    throw e;
  }
};

export async function createStuckTask(id: string, body: StuckTaskRequest = {}): Promise<{ taskId: string }> {
  if (usingSample()) {
    const r = await mock.mockStuckTask(id);
    return { taskId: r.task.id };
  }
  const r = await staffApi.post<{ task: { id: string } }>(`${BASE}/stuck/${encodeURIComponent(id)}/task`, body);
  return { taskId: r.task.id };
}

// ─── Experiments ────────────────────────────────────────────────────────────

const EXP = `${BASE}/experiments`;

export const listExperiments = () =>
  withSample(
    async () => {
      const r = await staffApi.get<{ items?: Experiment[]; experiments?: Experiment[] } | Experiment[]>(EXP);
      return Array.isArray(r) ? r : r.items ?? r.experiments ?? [];
    },
    () => mock.mockExperiments(),
  );

export const getExperiment = (id: string) =>
  withSample(
    async () => {
      const r = await staffApi.get<{ experiment?: Experiment } & Partial<Experiment>>(`${EXP}/${encodeURIComponent(id)}`);
      return (r.experiment ?? r) as Experiment;
    },
    () => mock.mockExperiment(id),
  );

export const getExperimentResults = (id: string) =>
  withSample(() => staffApi.get<ExperimentResult>(`${EXP}/${encodeURIComponent(id)}/results`), () => mock.mockExperimentResults(id));

const unwrap = (r: { experiment?: Experiment } & Partial<Experiment>) => (r.experiment ?? r) as Experiment;

export async function saveExperiment(input: ExperimentInput, id?: string): Promise<Experiment> {
  if (usingSample()) return mock.mockSaveExperiment(input, id);
  const r = id
    ? await staffApi.patch<{ experiment?: Experiment } & Partial<Experiment>>(`${EXP}/${encodeURIComponent(id)}`, input)
    : await staffApi.post<{ experiment?: Experiment } & Partial<Experiment>>(EXP, input);
  return unwrap(r);
}

export async function experimentAction(id: string, action: "start" | "pause" | "end" | "winner", winner?: string): Promise<Experiment> {
  if (usingSample()) return mock.mockExperimentAction(id, action, winner);
  const r = await staffApi.post<{ experiment?: Experiment } & Partial<Experiment>>(
    `${EXP}/${encodeURIComponent(id)}/${action}`,
    action === "winner" ? { winner } : {},
  );
  return unwrap(r);
}
