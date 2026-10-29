"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, ButtonLink, Loadable, Notice, Skeleton, TextArea, ErrorNotice } from "@/components/ui";
import { bookingBlocked } from "./noticeFixes";
import { ApiError } from "@/lib/api";
import { PLAN_STANDARD } from "@/lib/contracts";
import { memberApi, type SlotsPayload } from "./api";
import { memberCalls, type RecordingChoice } from "./callsApi";
import { useMember } from "./MemberContext";
import Link from "next/link";
import { recordConsent } from "@/components/legal/consentApi";
import { dateLong, dayKey, displayTimeZone, timeOfDay, zoneName } from "./format";
import { SlotPickerSkeleton } from "./StatusSkeletons";
import ArrangingLawyer from "./ArrangingLawyer"; // ROUTING
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
          {dateLong(booked)} at {timeOfDay(booked)}, {zoneName()}{data?.lawyerName ? `, with ${data.lawyerName}` : ""}. Your
          lawyer reads your question and your profile before the call.
        </p>
        {linkPending ? (
          <Notice
            tone="info"
            variant="inline"
            title="Your Google Meet link is coming by email"
            terms={["videoLink"]}
            fix={{
              label: "What happens next",
              steps: [
                "Your ILP team is setting up the call and emails you the link.",
                "Look in your inbox, and your spam folder, for an email from ILP.",
                "The link also appears on your home page. The Join button works from 10 minutes before the call.",
                "No link by the day before the call? Write to your ILP team from Messages.",
              ],
            }}
          />
        ) : (
          <p className={s.doneBody}>
            The Google Meet link is in your email and on your home page. The Join button there works from 10 minutes before the call.
          </p>
        )}
        <ButtonLink href="/status">Back to your overview</ButtonLink>
      </div>
    );
  }

  if (!cap.canBook) {
    const blocked = bookingBlocked(cap.reason);
    return (
      <Notice
        tone={blocked.tone}
        headingLevel={2}
        title={blocked.title}
        fix={blocked.fix}
        actions={
          <ButtonLink href={blocked.tone === "danger" ? "/status/money" : "/status/messages"} variant="secondary">
            {blocked.tone === "danger" ? "Update payment method" : "Message your team"}
          </ButtonLink>
        }
      >
        {cap.reason}
      </Notice>
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

      <section className={s.step} aria-labelledby="q-title" data-tour="client-book-question">
        <h2 className={s.stepTitle} id="q-title">
          <span className={s.num} aria-hidden="true">1</span>
          <span className={s.sr}>Step 1: </span>
          What would you like to ask?
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

      <section className={s.step} aria-labelledby="t-title" data-tour="client-book-time">
        <h2 className={s.stepTitle} id="t-title">
          <span className={s.num} aria-hidden="true">2</span>
          <span className={s.sr}>Step 2: </span>
          Pick a time <span className={s.tz}>({zoneName()})</span>
        </h2>
        {loadError && <ErrorNotice audience="member">{loadError}</ErrorNotice>}
        <Loadable
          loading={!data && !loadError}
          label="Loading open times"
          skeleton={
            <>
              <Skeleton shape="line" size="md" width="25" />
              <SlotPickerSkeleton />
            </>
          }
        >
          {() => (
            <>
            {data?.lawyerName && <p className={s.lawyer}>With {data.lawyerName}</p>}
            {data && data.slots.length === 0 && data.matching && <ArrangingLawyer salesCall={data.salesCall} reason={data.reason} />}
            {data && data.slots.length === 0 && !data.matching && (
              <Notice
                tone="info"
                title={data.lawyerName ? "No open times in the next two weeks" : data.matching ? "We are matching you with a lawyer" : "No lawyer is assigned to you yet"}
                terms={["partnerLawyer", "slot"]}
                fix={{
                  steps: data.lawyerName
                    ? [
                        "Your lawyer's calendar is full for the next two weeks.",
                        "Write to your ILP team from Messages with the days and times that suit you. They will find a time with your lawyer.",
                        "Or come back in a few days: new times open as the calendar moves forward.",
                      ]
                    : [
                        "Your ILP team picks a lawyer for you based on your kind of question. You do not need to do anything.",
                        "They contact you when the lawyer is set. Then open times appear here.",
                        "If it has been more than two working days, write to your ILP team from Messages.",
                      ],
                }}
                actions={
                  <ButtonLink href="/status/messages" variant="secondary">
                    Message your team
                  </ButtonLink>
                }
              >
                {data.reason ?? "Message your team and we will find a time."}
              </Notice>
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
                      {new Date(list[0]).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: displayTimeZone() })}
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
            </>
          )}
        </Loadable>
      </section>

      <section className={s.step} aria-labelledby="rec-title">
        <h2 className={s.stepTitle} id="rec-title">
          <span className={s.num} aria-hidden="true">3</span>
          <span className={s.sr}>Step 3: </span>
          May the call be recorded?
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
          <span className={s.num} aria-hidden="true">4</span>
          <span className={s.sr}>Step 4: </span>
          Confirm
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
          <ErrorNotice audience="member">{error}</ErrorNotice>
        )}
        <Button block busy={busy} onClick={submit} disabled={!slot || !recording}>
          Book this call
        </Button>
      </section>
    </div>
  );
}
