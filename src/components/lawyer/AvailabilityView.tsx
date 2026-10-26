"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button, EmptyState } from "@/components/ui";
import { AREA_LABEL, errorText, fmtDate } from "./lawyerApi";
import { callsApi, DAY_NAMES, type AvailabilitySettings, type WeeklyWindow } from "./callsApi";
import s from "./AvailabilityView.module.scss";

/** Monday first, Sunday last. */
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;
const SPECIALTIES = ["real_estate", "corporate", "immigration", "tax", "vehicle", "notary"];
const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const todayCr = () => new Date(Date.now() - 6 * 3_600_000).toISOString().slice(0, 10);

/**
 * Lawyer availability: weekly hours in Costa Rica time, days off, notice,
 * calls per day, specialties and an optional Google Calendar for busy times.
 * Booking slots for members are built from exactly these settings.
 */
export default function AvailabilityView() {
  const [data, setData] = useState<AvailabilitySettings | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [weekly, setWeekly] = useState<WeeklyWindow[]>([]);
  const [blackout, setBlackout] = useState<string[]>([]);
  const [newDate, setNewDate] = useState("");
  const [lead, setLead] = useState(18);
  const [maxPerDay, setMaxPerDay] = useState(6);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [calendarId, setCalendarId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  function apply(a: AvailabilitySettings) {
    setData(a);
    setWeekly(a.weekly);
    setBlackout(a.blackoutDates);
    setLead(a.minLeadHours);
    setMaxPerDay(a.maxCallsPerDay);
    setSpecialties(a.specialties);
    setCalendarId(a.calendarId ?? "");
  }

  async function load() {
    setLoadError(null);
    try {
      apply(await callsApi.availability());
    } catch (err) {
      setLoadError(errorText(err, "Could not load your hours."));
    }
  }

  useEffect(() => {
    load();
    // Load once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const weeklyMinutes = useMemo(
    () => weekly.reduce((sum, w) => sum + Math.max(0, toMin(w.end) - toMin(w.start)), 0),
    [weekly],
  );

  if (loadError) return <EmptyState title="Your hours did not load" body={loadError} action={<Button onClick={load}>Try again</Button>} />;
  if (!data) return <p className={s.muted} aria-busy="true">Loading your hours…</p>;

  const setWindow = (i: number, patch: Partial<WeeklyWindow>) => {
    setSaved(null);
    setWeekly((prev) => prev.map((w, j) => (j === i ? { ...w, ...patch } : w)));
  };
  const addWindow = (day: WeeklyWindow["day"]) => {
    setSaved(null);
    const last = weekly.filter((w) => w.day === day).sort((a, b) => toMin(b.end) - toMin(a.end))[0];
    const start = last ? last.end : "09:00";
    const endMin = Math.min(toMin(start) + 120, 24 * 60);
    const end = `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`;
    setWeekly((prev) => [...prev, { day, start, end: end === "24:00" ? "23:59" : end }]);
  };
  const removeWindow = (i: number) => {
    setSaved(null);
    setWeekly((prev) => prev.filter((_, j) => j !== i));
  };
  const addDate = () => {
    if (!newDate) return;
    setSaved(null);
    setBlackout((prev) => [...new Set([...prev, newDate])].sort());
    setNewDate("");
  };
  const toggleSpecialty = (k: string) => {
    setSaved(null);
    setSpecialties((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  };

  async function save() {
    setBusy(true);
    setError(null);
    setSaved(null);
    try {
      const out = await callsApi.saveAvailability({
        weekly,
        blackoutDates: blackout.filter((d) => d >= todayCr()),
        minLeadHours: lead,
        maxCallsPerDay: maxPerDay,
        specialties,
        calendarId: calendarId.trim() || null,
      });
      apply(out);
      setSaved("Saved. Members now see times from these hours.");
    } catch (err) {
      setError(errorText(err, "Could not save. Check the times and try again."));
    } finally {
      setBusy(false);
    }
  }

  const upcomingBlackout = blackout.filter((d) => d >= todayCr());

  return (
    <div className={s.page}>
      <nav aria-label="Breadcrumb">
        <Link href="/lawyer" className={s.back}>← Today</Link>
      </nav>
      <header className={s.head}>
        <h2 className={s.h}>Your hours</h2>
        <p className={s.sub}>
          Members book 20-minute calls inside these hours, in Costa Rica time.
          {data.isDefault ? " You are on the standard hours until you save your own." : ""}
        </p>
      </header>

      <div className={s.cols}>
        <section className={s.week} aria-labelledby="week-h">
          <h3 id="week-h" className={s.sectionH}>Weekly hours</h3>
          <p className={s.muted}>{Math.round(weeklyMinutes / 20)} call slots a week at most.</p>
          <ul className={s.days}>
            {DAY_ORDER.map((day) => {
              const rows = weekly.map((w, i) => ({ w, i })).filter((x) => x.w.day === day);
              return (
                <li key={day} className={s.day}>
                  <span className={s.dayName}>{DAY_NAMES[day]}</span>
                  <div className={s.windows}>
                    {rows.length === 0 && <span className={s.off}>Not available</span>}
                    {rows.map(({ w, i }) => (
                      <div key={i} className={s.window}>
                        <label className={s.srOnly} htmlFor={`start-${i}`}>{DAY_NAMES[day]} from</label>
                        <input id={`start-${i}`} type="time" step={600} className={s.time} value={w.start} onChange={(e) => setWindow(i, { start: e.target.value })} />
                        <span aria-hidden="true">to</span>
                        <label className={s.srOnly} htmlFor={`end-${i}`}>{DAY_NAMES[day]} until</label>
                        <input id={`end-${i}`} type="time" step={600} className={s.time} value={w.end} onChange={(e) => setWindow(i, { end: e.target.value })} />
                        <button type="button" className={s.remove} onClick={() => removeWindow(i)} aria-label={`Remove ${DAY_NAMES[day]} ${w.start} to ${w.end}`}>
                          Remove
                        </button>
                      </div>
                    ))}
                    <button type="button" className={s.add} onClick={() => addWindow(day)}>
                      Add hours
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <div className={s.side}>
          <section aria-labelledby="off-h" className={s.block}>
            <h3 id="off-h" className={s.sectionH}>Days off</h3>
            <div className={s.inline}>
              <label className={s.srOnly} htmlFor="blackout">Add a day off</label>
              <input id="blackout" type="date" min={todayCr()} className={s.input} value={newDate} onChange={(e) => setNewDate(e.target.value)} />
              <Button size="sm" variant="secondary" onClick={addDate} disabled={!newDate}>Add day off</Button>
            </div>
            {upcomingBlackout.length === 0 ? (
              <p className={s.muted}>No days off planned.</p>
            ) : (
              <ul className={s.dates}>
                {upcomingBlackout.map((d) => (
                  <li key={d} className={s.date}>
                    <span>{fmtDate(`${d}T12:00:00-06:00`)}</span>
                    <button type="button" className={s.remove} onClick={() => setBlackout((p) => p.filter((x) => x !== d))} aria-label={`Remove day off ${d}`}>
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="limits-h" className={s.block}>
            <h3 id="limits-h" className={s.sectionH}>Limits</h3>
            <label htmlFor="lead" className={s.label}>Minimum notice before a call</label>
            <select id="lead" className={s.input} value={lead} onChange={(e) => { setSaved(null); setLead(Number(e.target.value)); }}>
              {[2, 4, 12, 18, 24, 48, 72].map((h) => <option key={h} value={h}>{h} hours</option>)}
            </select>
            <label htmlFor="max" className={s.label}>Most calls in one day</label>
            <input id="max" type="number" min={1} max={20} className={s.input} value={maxPerDay} onChange={(e) => { setSaved(null); setMaxPerDay(Math.max(1, Math.min(20, Number(e.target.value) || 1))); }} />
          </section>

          <fieldset className={s.block}>
            <legend className={s.sectionH}>Specialties</legend>
            <p className={s.muted}>Members without an assigned lawyer are routed by these.</p>
            <div className={s.checks}>
              {SPECIALTIES.map((k) => (
                <label key={k} className={s.check}>
                  <input type="checkbox" checked={specialties.includes(k)} onChange={() => toggleSpecialty(k)} />
                  {AREA_LABEL[k] ?? k}
                </label>
              ))}
            </div>
          </fieldset>

          <section aria-labelledby="cal-h" className={s.block}>
            <h3 id="cal-h" className={s.sectionH}>Google Calendar</h3>
            <label htmlFor="cal" className={s.label}>Block times that are busy in this calendar (optional)</label>
            <input id="cal" type="email" className={s.input} placeholder="you@yourfirm.cr" value={calendarId} onChange={(e) => { setSaved(null); setCalendarId(e.target.value); }} />
            <p className={s.muted}>Share your free/busy with ILP in Google Calendar so we can read it. Event details stay private.</p>
          </section>
        </div>
      </div>

      <div className={s.saveRow}>
        {error && <p className={s.error} role="alert">{error}</p>}
        {saved && <p className={s.saved} role="status">{saved}</p>}
        <Button onClick={save} busy={busy} disabled={busy}>Save hours</Button>
      </div>
    </div>
  );
}
