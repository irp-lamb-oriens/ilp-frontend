"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { useMember } from "./MemberContext";
import { dateLong, dayKey, relativeDue, timeOfDay } from "./format";
import { joinState, memberCalls, type RecordingChoice, type UpcomingCall } from "./callsApi";
import s from "./UpcomingCalls.module.scss";

/** Re-render every 30 s so the Join button switches on by itself. */
function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

const errText = (err: unknown, fallback: string) => (err instanceof ApiError && err.message ? err.message : fallback);

export default function UpcomingCalls() {
  const { home } = useMember();
  if (!home.upcomingCalls.length) return null;
  return (
    <section className={s.wrap} aria-labelledby="calls-title">
      <h2 className={s.title} id="calls-title">
        Your booked {home.upcomingCalls.length === 1 ? "call" : "calls"}
      </h2>
      <ul className={s.list}>
        {(home.upcomingCalls as UpcomingCall[]).map((c) => (
          <CallItem key={c.id} call={c} />
        ))}
      </ul>
    </section>
  );
}

function CallItem({ call: c }: { call: UpcomingCall }) {
  const { refresh } = useMember();
  const now = useNow();
  const [mode, setMode] = useState<"idle" | "join" | "change" | "cancel">("idle");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consent, setConsent] = useState(c.consent?.recording ?? "pending");
  const state = joinState(c.scheduledAt, c.durationMin ?? 20, now);
  const opensAt = new Date(Date.parse(c.scheduledAt) - 10 * 60_000).toISOString();

  // Recording choice on the join screen: saved, then Meet opens in a new tab (the link itself).
  const chooseAndJoin = (recording: RecordingChoice) => {
    setConsent(recording);
    memberCalls.consent(c.id, recording, "join").catch(() => undefined);
  };

  async function cancel() {
    setBusy(true);
    setError(null);
    try {
      await memberCalls.cancel(c.id);
      await refresh();
    } catch (err) {
      setError(errText(err, "Could not cancel the call. Message your team and they will help."));
      setBusy(false);
    }
  }

  return (
    <li className={s.item}>
      <p className={s.when}>
        {dateLong(c.scheduledAt)}, {timeOfDay(c.scheduledAt)} <span className={s.rel}>({relativeDue(c.scheduledAt)})</span>
      </p>
      <p className={s.meta}>
        {c.durationMin ?? 20} minutes{c.lawyerName ? ` with ${c.lawyerName}` : ""} · Costa Rica time · Google Meet
      </p>
      {c.question && <p className={s.question}>{c.question.split("\n")[0]}</p>}

      {mode === "join" && c.meetUrl ? (
        <div className={s.panel} role="group" aria-labelledby={`join-${c.id}`}>
          <p className={s.panelTitle} id={`join-${c.id}`}>Before you join: may your lawyer record this call?</p>
          <p className={s.small}>
            The recording becomes a transcript so your summary and next steps arrive sooner. Only your lawyer and your ILP team can read it.
          </p>
          <div className={s.actions}>
            <a className={s.joinLink} href={c.meetUrl} target="_blank" rel="noopener noreferrer" onClick={() => chooseAndJoin("granted")}>
              Yes, record and join
            </a>
            <a className={s.ghostLink} href={c.meetUrl} target="_blank" rel="noopener noreferrer" onClick={() => chooseAndJoin("declined")}>
              No recording, join
            </a>
          </div>
        </div>
      ) : (
        <div className={s.actions}>
          {c.linkPending || !c.meetUrl ? (
            <p className={s.small}>Your Google Meet link is coming by email.</p>
          ) : state === "open" ? (
            <Button onClick={() => setMode("join")}>Join call</Button>
          ) : state === "early" ? (
            <Button variant="secondary" disabled>
              Join opens at {timeOfDay(opensAt)}
            </Button>
          ) : null}
          {c.canChange && mode === "idle" && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setMode("change")}>Change time</Button>
              <Button variant="ghost" size="sm" onClick={() => setMode("cancel")}>Cancel call</Button>
            </>
          )}
        </div>
      )}

      {consent !== "pending" && mode !== "join" && (
        <p className={s.small}>Recording: {consent === "granted" ? "yes" : "no"}. You can change this when you join.</p>
      )}
      {c.canChange === false && state === "early" && (
        <p className={s.small}>Less than 24 hours to go. To change it, message your team.</p>
      )}

      {mode === "cancel" && (
        <div className={s.panel} role="group" aria-label="Cancel this call">
          <p className={s.panelTitle}>Cancel this call?</p>
          <p className={s.small}>It goes back to your monthly calls and minutes.</p>
          <div className={s.actions}>
            <Button variant="danger" size="sm" busy={busy} onClick={cancel}>Yes, cancel it</Button>
            <Button variant="ghost" size="sm" onClick={() => setMode("idle")} disabled={busy}>Keep the call</Button>
          </div>
        </div>
      )}

      {mode === "change" && <ChangeTime call={c} onDone={() => setMode("idle")} />}
      {error && <p className={s.error} role="alert">{error}</p>}
    </li>
  );
}

function ChangeTime({ call: c, onDone }: { call: UpcomingCall; onDone: () => void }) {
  const { refresh } = useMember();
  const [slots, setSlots] = useState<string[] | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    memberCalls
      .slotsForChange(c.id)
      .then((r) => {
        setSlots(r.slots);
        setDay(r.slots[0] ? dayKey(r.slots[0]) : null);
      })
      .catch(() => setError("We could not load the calendar. Try again in a minute."));
  }, [c.id]);

  const days = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const iso of slots ?? []) map.set(dayKey(iso), [...(map.get(dayKey(iso)) ?? []), iso]);
    return [...map.entries()];
  }, [slots]);

  async function save() {
    if (!slot) return;
    setBusy(true);
    setError(null);
    try {
      await memberCalls.reschedule(c.id, slot);
      await refresh();
      onDone();
    } catch (err) {
      setError(errText(err, "Could not move the call. Pick another time."));
      setBusy(false);
    }
  }

  return (
    <div className={s.panel} role="group" aria-label="Pick a new time">
      <p className={s.panelTitle}>Pick a new time (Costa Rica time)</p>
      {!slots && !error && <p className={s.small}>Loading times…</p>}
      {slots && slots.length === 0 && <p className={s.small}>No other times are open in the next two weeks. Message your team.</p>}
      {days.length > 0 && (
        <>
          <div className={s.chips} role="radiogroup" aria-label="Day">
            {days.map(([k, list]) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={day === k}
                className={`${s.chip} ${day === k ? s.selected : ""}`}
                onClick={() => {
                  setDay(k);
                  setSlot(null);
                }}
              >
                {new Date(list[0]).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "America/Costa_Rica" })}
              </button>
            ))}
          </div>
          <div className={s.chips} role="radiogroup" aria-label="Time">
            {(days.find(([k]) => k === day)?.[1] ?? []).map((iso) => (
              <button
                key={iso}
                type="button"
                role="radio"
                aria-checked={slot === iso}
                className={`${s.chip} ${slot === iso ? s.selected : ""}`}
                onClick={() => setSlot(iso)}
              >
                {timeOfDay(iso)}
              </button>
            ))}
          </div>
        </>
      )}
      {error && <p className={s.error} role="alert">{error}</p>}
      <div className={s.actions}>
        <Button size="sm" busy={busy} disabled={!slot} onClick={save}>Move the call</Button>
        <Button size="sm" variant="ghost" onClick={onDone} disabled={busy}>Keep the current time</Button>
      </div>
    </div>
  );
}
