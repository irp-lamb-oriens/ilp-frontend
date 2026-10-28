/**
 * The call itself (P3): availability settings, no-show, Meet transcript,
 * recording upload, and the join window. Server: server/API/calls/callsRouter.ts.
 *
 * Kept apart from lawyerApi.ts so the W5 mock (`lib/mocks/w5.ts`) keeps its
 * signature; with NEXT_PUBLIC_W5_MOCKS=1 these calls are answered in memory.
 */

import { providerApi } from "@/lib/provider";
import type { LawyerAvailability, LegalNextStep, WeeklyWindow } from "@/lib/contracts";
import { USING_MOCKS } from "./lawyerApi";

export type { WeeklyWindow };

/** The lawyer's settings as GET /api/provider/availability returns them (contracts LawyerAvailability). */
export type AvailabilitySettings = Omit<LawyerAvailability, "id" | "updatedAt"> & {
  updatedAt?: string;
  /** True until the lawyer saves their own hours. */
  isDefault?: boolean;
};

export interface TranscriptResult {
  status: "fetched" | "not_ready" | "no_event" | "no_consent" | "error";
  message?: string;
  source?: string;
  transcript?: string;
  summary?: { text: string; status: "suggested" } | null;
  suggestedNextSteps?: LegalNextStep[];
}

export interface CallsApi {
  availability(): Promise<AvailabilitySettings>;
  saveAvailability(input: Omit<AvailabilitySettings, "providerId" | "timezone" | "updatedAt" | "isDefault"> & { timezone?: string }): Promise<AvailabilitySettings>;
  noShow(consultationId: string): Promise<{ status: string }>;
  meetTranscript(consultationId: string): Promise<TranscriptResult>;
  uploadRecording(consultationId: string, file: { fileName: string; contentType: string; dataBase64: string }): Promise<TranscriptResult>;
}

const enc = encodeURIComponent;

const realCalls: CallsApi = {
  availability: () => providerApi.get("/api/provider/availability"),
  saveAvailability: (input) => providerApi.put("/api/provider/availability", input),
  noShow: (id) => providerApi.post(`/api/provider/consultations/${enc(id)}/no-show`, {}),
  meetTranscript: (id) => providerApi.post(`/api/provider/consultations/${enc(id)}/meet-transcript`, {}),
  uploadRecording: (id, file) => providerApi.post(`/api/provider/consultations/${enc(id)}/upload-recording`, file),
};

// ── Demo mode ───────────────────────────────────────────────────────────────

const weekdays = (start: string, end: string): WeeklyWindow[] =>
  ([1, 2, 3, 4, 5] as const).map((day) => ({ day, start, end }));

let mockAvailability: AvailabilitySettings = {
  providerId: "demo_lawyer_mora",
  timezone: "America/Costa_Rica",
  weekly: [...weekdays("08:30", "12:00"), ...weekdays("13:30", "16:30")].sort((a, b) => a.day - b.day),
  blackoutDates: ["2026-12-24", "2026-12-25"],
  minLeadHours: 18,
  maxCallsPerDay: 6,
  specialties: ["real_estate", "corporate"],
  calendarId: null,
  isDefault: false,
};

const pause = () => new Promise((r) => setTimeout(r, 250));

const mockCalls: CallsApi = {
  async availability() {
    await pause();
    return { ...mockAvailability };
  },
  async saveAvailability(input) {
    await pause();
    mockAvailability = { ...mockAvailability, ...input, updatedAt: new Date().toISOString(), isDefault: false };
    return { ...mockAvailability };
  },
  async noShow() {
    await pause();
    return { status: "no_show" };
  },
  async meetTranscript() {
    await pause();
    return { status: "not_ready", message: "Meet has not attached a transcript to the calendar event yet. It usually appears a few minutes after the call ends." };
  },
  async uploadRecording() {
    await pause();
    return { status: "error", message: "Recording upload needs the server (demo mode)." };
  },
};

export const callsApi: CallsApi = USING_MOCKS ? mockCalls : realCalls;

// ── Pure helpers (mirror server/API/calls/callLogic.ts) ─────────────────────

export const JOIN_OPENS_MIN = 10;
export const NO_SHOW_WAIT_MIN = 10;

/** Join is active from 10 minutes before until 30 minutes after the booked end. */
export function joinState(scheduledAt: string, durationMin: number, now = Date.now()): "early" | "open" | "over" {
  const s = Date.parse(scheduledAt);
  if (now < s - JOIN_OPENS_MIN * 60_000) return "early";
  if (now > s + ((durationMin || 20) + 30) * 60_000) return "over";
  return "open";
}

/** The lawyer may mark a no-show once they have waited 10 minutes. */
export const noShowAllowed = (scheduledAt: string, now = Date.now()) =>
  now >= Date.parse(scheduledAt) + NO_SHOW_WAIT_MIN * 60_000;

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Read a File as base64 (no data: prefix). */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).replace(/^data:[^,]*,/, ""));
    r.onerror = () => reject(new Error("Could not read that file."));
    r.readAsDataURL(file);
  });
}
