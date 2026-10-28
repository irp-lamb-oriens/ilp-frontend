/**
 * Pure time helpers for TimeInput, TimeRangeInput and WeeklyHoursEditor.
 * No imports and only erasable TypeScript, so `node --test tests/` can load
 * this file directly (Node 22 type stripping).
 *
 * Values are always 24-hour "HH:MM" strings (what <input type="time"> uses
 * and what the API stores). "24:00" is allowed only as the end of a range
 * ("until midnight"). Display is 12-hour with AM/PM ("8:30 AM"), the format
 * members and lawyers both read on booking pages.
 */

export const MINUTES_PER_DAY = 24 * 60;

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** True for "00:00"–"23:59"; with allowEndOfDay also "24:00". */
export function isTimeValue(v: string | null | undefined, allowEndOfDay = false): v is string {
  if (!v) return false;
  return HHMM.test(v) || (allowEndOfDay && v === "24:00");
}

/** "08:30" → 510. NaN for anything else. */
export function timeToMinutes(v: string): number {
  if (!isTimeValue(v, true)) return NaN;
  const [h, m] = v.split(":").map(Number);
  return h * 60 + m;
}

/** 510 → "08:30". Clamped to 0..1440 ("24:00"). */
export function minutesToTime(min: number): string {
  const m = Math.max(0, Math.min(MINUTES_PER_DAY, Math.round(min)));
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** "13:30" → "1:30 PM"; "00:00" → "12:00 AM"; "24:00" → "12:00 AM (end of day)". Empty for invalid. */
export function formatTime12(v: string | null | undefined): string {
  if (!isTimeValue(v, true)) return "";
  if (v === "24:00") return "12:00 AM (end of day)";
  const min = timeToMinutes(v);
  const h24 = Math.floor(min / 60);
  const m = min % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${h24 < 12 ? "AM" : "PM"}`;
}

/** 210 → "3 h 30 min"; 45 → "45 min". Null for zero or less. */
export function formatDuration(minutes: number): string | null {
  if (!Number.isFinite(minutes) || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? (m ? `${h} h ${m} min` : `${h} h`) : `${m} min`;
}

/** Short form for labels: "08:30"–"12:00" → "8:30 AM to 12:00 PM". */
export function formatRange12(start: string, end: string, joiner = " to "): string {
  return `${formatTime12(start)}${joiner}${formatTime12(end).replace(" (end of day)", "")}`;
}

/**
 * What someone typed → "HH:MM", or null if it is not a time.
 * Accepts "8", "830", "0830", "8:30", "8.30", "8h30", "8:30p", "8:30 pm",
 * "20:30", "2030", "noon", "midnight". Without AM/PM, 13–23 and 0 read as
 * 24-hour; 7–11 read as morning, 12 as noon and 1–6 as afternoon (business
 * hours: nobody means 3 AM). "24:00"/"midnight" only when allowEndOfDay.
 */
export function parseTimeInput(text: string, allowEndOfDay = false): string | null {
  const t = text.trim().toLowerCase().replace(/\s+/g, "");
  if (!t) return null;
  if (t === "noon") return "12:00";
  if (t === "midnight") return allowEndOfDay ? "24:00" : "00:00";
  const m = /^(\d{1,2})(?:[:.h]?(\d{2}))?(a|am|a\.m\.|p|pm|p\.m\.)?$/.exec(t);
  if (!m) return null;
  let h = Number(m[1]);
  const min = m[2] ? Number(m[2]) : 0;
  const suffix = m[3] ? m[3][0] : null;
  if (min > 59) return null;
  if (suffix) {
    if (h < 1 || h > 12) return null;
    if (suffix === "a") h = h === 12 ? 0 : h;
    else h = h === 12 ? 12 : h + 12;
  } else if (h === 24 && min === 0) {
    return allowEndOfDay ? "24:00" : null;
  } else if (h > 23) {
    return null;
  } else if (m[1].length === 1 || (m[1].length === 2 && m[1][0] !== "0")) {
    // Bare hour without a leading zero: business-hours guess for 1–6.
    if (h >= 1 && h <= 6) h += 12;
  }
  return minutesToTime(h * 60 + min);
}

/** Add `delta` minutes and snap to the step grid, staying inside [min, max]. */
export function stepTime(v: string, deltaSteps: number, stepMinutes = 15, min = "00:00", max = "23:59"): string {
  const lo = timeToMinutes(min);
  const hi = timeToMinutes(max);
  const cur = isTimeValue(v, true) ? timeToMinutes(v) : lo;
  let next: number;
  if (deltaSteps > 0) next = Math.floor(cur / stepMinutes) * stepMinutes + deltaSteps * stepMinutes;
  else next = Math.ceil(cur / stepMinutes) * stepMinutes + deltaSteps * stepMinutes;
  return minutesToTime(Math.max(lo, Math.min(hi, next)));
}

/** Every step from min to max, for the TimeInput list. */
export function timeOptions(stepMinutes = 15, min = "00:00", max = "23:59"): string[] {
  const out: string[] = [];
  const lo = timeToMinutes(min);
  const hi = timeToMinutes(max);
  for (let m = Math.ceil(lo / stepMinutes) * stepMinutes; m <= hi; m += stepMinutes) out.push(minutesToTime(m));
  return out;
}

/** Whole calls that fit in one window (the server books back to back from the start). */
export function slotCount(start: string, end: string, slotMinutes = 20): number {
  const d = timeToMinutes(end) - timeToMinutes(start);
  if (!Number.isFinite(d) || d <= 0) return 0;
  return Math.floor(d / slotMinutes);
}

/** Plain-language problem with one range, or null. */
export function rangeError(start: string, end: string, minMinutes = 20): string | null {
  if (!isTimeValue(start)) return "Enter a start time, like 8:30 AM.";
  if (!isTimeValue(end, true)) return "Enter an end time, like 12:00 PM.";
  const d = timeToMinutes(end) - timeToMinutes(start);
  if (d <= 0) return "The end time must be after the start time.";
  if (d < minMinutes) return `Make it at least ${minMinutes} minutes, the length of one call.`;
  return null;
}

export interface DayWindow {
  day: number;
  start: string;
  end: string;
}

/**
 * Overlapping windows on the same day. Returns, for each index that overlaps
 * another, the index of the first window it collides with. Windows that only
 * touch (one ends at 12:00, the next starts at 12:00) do not overlap.
 */
export function findOverlaps(windows: readonly DayWindow[]): Map<number, number> {
  const out = new Map<number, number>();
  for (let i = 0; i < windows.length; i++) {
    const a = windows[i];
    const as = timeToMinutes(a.start);
    const ae = timeToMinutes(a.end);
    if (!(as < ae)) continue;
    for (let j = 0; j < windows.length; j++) {
      if (i === j) continue;
      const b = windows[j];
      if (b.day !== a.day) continue;
      const bs = timeToMinutes(b.start);
      const be = timeToMinutes(b.end);
      if (!(bs < be)) continue;
      if (as < be && bs < ae) {
        out.set(i, j);
        break;
      }
    }
  }
  return out;
}

/** Problem per window index: range errors first, then overlaps. Empty map = valid. */
export function validateWindows(windows: readonly DayWindow[], minMinutes = 20): Map<number, string> {
  const out = new Map<number, string>();
  windows.forEach((w, i) => {
    const e = rangeError(w.start, w.end, minMinutes);
    if (e) out.set(i, e);
  });
  for (const [i, j] of findOverlaps(windows)) {
    if (!out.has(i)) out.set(i, `Overlaps ${formatRange12(windows[j].start, windows[j].end)}. Move or remove one of them.`);
  }
  return out;
}

/**
 * Call slots in a week. Each day counts its windows' whole slots, capped at
 * maxPerDay when given (the booking engine stops a day at that many calls).
 */
export function weeklySlotTotal(windows: readonly DayWindow[], slotMinutes = 20, maxPerDay?: number): number {
  const perDay = new Map<number, number>();
  for (const w of windows) perDay.set(w.day, (perDay.get(w.day) ?? 0) + slotCount(w.start, w.end, slotMinutes));
  let total = 0;
  for (const n of perDay.values()) total += maxPerDay && maxPerDay > 0 ? Math.min(n, maxPerDay) : n;
  return total;
}

/** A sensible next window after the day's last one: starts where it ends, two hours long. Null when the day is full. */
export function nextWindow(dayWindows: readonly { start: string; end: string }[], fallbackStart = "09:00", lengthMinutes = 120): { start: string; end: string } | null {
  const ends = dayWindows.map((w) => timeToMinutes(w.end)).filter(Number.isFinite);
  const startMin = ends.length ? Math.max(...ends) : timeToMinutes(fallbackStart);
  if (startMin >= MINUTES_PER_DAY - 20) return null;
  const endMin = Math.min(startMin + lengthMinutes, MINUTES_PER_DAY);
  return { start: minutesToTime(startMin), end: minutesToTime(endMin) };
}
