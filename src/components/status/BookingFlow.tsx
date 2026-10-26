"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, ButtonLink, EmptyState, TextArea } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { PLAN_STANDARD } from "@/lib/contracts";
import { memberApi, type SlotsPayload } from "./api";
import { memberCalls, type RecordingChoice } from "./callsApi";
import { useMember } from "./MemberContext";
import Link from "next/link";
import { recordConsent } from "@/components/legal/consentApi";
import { dateLong, dayKey, timeOfDay } from "./format";
import s from "./BookingFlow.module.scss";

/** Pick a 20-minute slot, say what you want to ask, see the minutes it uses. */
export default function BookingFlow() {
  const { home, matter, refresh } = useMember();
  const cap = home.capacity;
  const len = PLAN_STANDARD.callLengthMin;

  const [data, setData] = useState<SlotsPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booked, setBooked] = useState<string | null>(null);
  const [recording, setRecording] = useState<RecordingChoice | null>(null);
  const [linkPending, setLinkPending] = useState(false);

  useEffect(() => {
    if (!cap.canBook) return;
    memberApi
      .slots(matter?.id)
      .then((d) => {
        setData(d);
        setDay(d.slots[0] ? dayKey(d.slots[0]) : null);
      })
      .catch(() => setLoadError("We could not load the calendar. Try again in a minute."));
  }, [cap.canBook, matter?.id]);

  const days = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const iso of data?.slots ?? []) {
      const k = dayKey(iso);
      map.set(k, [...(map.get(k) ?? []), iso]);
    }
    return [...map.entries()];
  }, [data]);

  if (booked) {
    return (
      <div className={s.done} role="status">
        <h2 className={s.doneTitle}>Your call is booked</h2>
        <p className={s.doneBody}>
          {dateLong(booked)} at {timeOfDay(booked)}, Costa Rica time{data?.lawyerName ? `, with ${data.lawyerName}` : ""}. Your
          lawyer reads your question and your profile before the call.
        </p>
        <p className={s.doneBody}>
          {linkPending
            ? "Your Google Meet link is coming by email. Your ILP team is setting it up."
            : "The Google Meet link is in your email and on your home page. The Join button there works from 10 minutes before the call."}
        </p>
        <ButtonLink href="/status">Back to your overview</ButtonLink>
      </div>
    );
  }

  if (!cap.canBook) {
    return (
      <EmptyState
        title="You cannot book a call right now"
        body={cap.reason}
        action={
          <ButtonLink href="/status/messages" variant="secondary">
            Message your team
          </ButtonLink>
        }
      />
    );
  }

  const after = { minutes: cap.minutesAvailable - len, calls: cap.callsAvailable - 1 };

  async function submit() {
    if (!slot) return setError("Pick a time first.");
    if (!question.trim()) return setError("Tell your lawyer what you would like to ask.");
    if (!recording) return setError("Tell us whether the call may be recorded.");
    setBusy(true);
    setError(null);
    try {
      const r = await memberCalls.book({ scheduledAt: slot, question: question.trim(), matterId: matter?.id, recordingConsent: recording });
      // P6: ConsentRecord with the notice version; the call itself already stores the choice.
      const consultationId = (r.consultation as { id?: string } | undefined)?.id;
      recordConsent("recording", recording === "granted", "booking", consultationId).catch(() => undefined);
      setLinkPending(!r.consultation?.meetUrl);
      setBooked(slot);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not book the call. Try again.");
      if (err instanceof ApiError && err.status === 409) {
        // The slot may have gone: reload the calendar.
        memberApi.slots(matter?.id).then(setData).catch(() => undefined);
        setSlot(null);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={s.flow}>
      <p className={s.lead}>
        Calls last {len} minutes. You have <strong>{cap.minutesAvailable} minutes</strong> and{" "}
        <strong>{cap.callsAvailable} {cap.callsAvailable === 1 ? "call" : "calls"}</strong> available this month.
      </p>

      <section className={s.step} aria-labelledby="q-title">
        <h2 className={s.stepTitle} id="q-title">
          1. What would you like to ask?
        </h2>
        <TextArea
          label={<>Your question{matter ? ` about ${matter.title}` : ""}</>}
          id="booking-question"
          rows={4}
          maxLength={1000}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="For example: Do I need to file anything for my S.A. before January?"
        />
        {home.pendingQuestions.length > 0 && (
          <div className={s.pending}>
            <p className={s.pendingTitle}>Also added to this call from your list:</p>
            <ul className={s.pendingList}>
              {home.pendingQuestions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className={s.step} aria-labelledby="t-title">
        <h2 className={s.stepTitle} id="t-title">
          2. Pick a time <span className={s.tz}>(Costa Rica time)</span>
        </h2>
        {data?.lawyerName && <p className={s.lawyer}>With {data.lawyerName}</p>}
        {loadError && <p className={s.error}>{loadError}</p>}
        {!data && !loadError && <p className={s.muted}>Loading times…</p>}
        {data && data.slots.length === 0 && (
          <p className={s.muted}>{data.reason ?? "No times are open in the next two weeks. Message your team and we will find one."}</p>
        )}
        {days.length > 0 && (
          <>
            <div className={s.days} role="radiogroup" aria-label="Day">
              {days.map(([k, list]) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={day === k}
                  className={`${s.day} ${day === k ? s.selected : ""}`}
                  onClick={() => {
                    setDay(k);
                    setSlot(null);
                  }}
                >
                  {new Date(list[0]).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "America/Costa_Rica" })}
                </button>
              ))}
            </div>
            <div className={s.times} role="radiogroup" aria-label="Time">
              {(days.find(([k]) => k === day)?.[1] ?? []).map((iso) => (
                <button
                  key={iso}
                  type="button"
                  role="radio"
                  aria-checked={slot === iso}
                  className={`${s.time} ${slot === iso ? s.selected : ""}`}
                  onClick={() => setSlot(iso)}
                >
                  {timeOfDay(iso)}
                </button>
              ))}
            </div>
          </>
        )}
      </section>

      <section className={s.step} aria-labelledby="rec-title">
        <h2 className={s.stepTitle} id="rec-title">
          3. May the call be recorded?
        </h2>
        <p className={s.muted}>
          A recording gives your lawyer a transcript, so you get a written summary and next steps sooner. AI drafts the
          summary and your lawyer checks and confirms it. Only your lawyer and your ILP team can read the transcript. The
          call is recorded only if your lawyer agrees too, and anyone joining with you must agree. Saying no changes
          nothing else. You can change your mind when you join.{" "}
          <Link href="/legal/recording">How recording and AI work</Link>
        </p>
        <div className={s.times} role="radiogroup" aria-labelledby="rec-title">
          <button
            type="button"
            role="radio"
            aria-checked={recording === "granted"}
            className={`${s.time} ${recording === "granted" ? s.selected : ""}`}
            onClick={() => setRecording("granted")}
          >
            Yes, record it
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={recording === "declined"}
            className={`${s.time} ${recording === "declined" ? s.selected : ""}`}
            onClick={() => setRecording("declined")}
          >
            No recording
          </button>
        </div>
      </section>

      <section className={s.summary} aria-labelledby="sum-title">
        <h2 className={s.stepTitle} id="sum-title">
          4. Confirm
        </h2>
        <p className={s.uses}>
          This call uses <strong>{len} minutes</strong> and 1 call. Afterwards you will have{" "}
          <strong>{after.minutes} minutes</strong> and <strong>{after.calls} {after.calls === 1 ? "call" : "calls"}</strong> left
          this month.
        </p>
        {slot && (
          <p className={s.chosen}>
            {dateLong(slot)} at {timeOfDay(slot)}
          </p>
        )}
        {error && (
          <p className={s.error} role="alert">
            {error}
          </p>
        )}
        <Button block busy={busy} onClick={submit} disabled={!slot || !recording}>
          Book this call
        </Button>
      </section>
    </div>
  );
}
