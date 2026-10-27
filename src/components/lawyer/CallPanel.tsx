"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button, ErrorNotice, Notice, StatusPill, TextArea, TextInput } from "@/components/ui";
import type { ConsentState, LegalNextStep } from "./lawyerApi";
import { errorText, fmtShortDate, lawyerApi, WHO_LABEL, type Brief } from "./lawyerApi";
import { ConsentPill } from "./pills";
import { callsApi, fileToBase64, noShowAllowed, type TranscriptResult } from "./callsApi";
import JoinCall, { useNow } from "./JoinCall";
import s from "./CallPanel.module.scss";

const MAX_STEPS = 5;
const dateInput = (iso?: string) => (iso ? iso.slice(0, 10) : "");
const toIso = (d: string) => (d ? new Date(`${d}T17:00:00`).toISOString() : undefined);
const blank = (): LegalNextStep => ({ what: "", who: "client" });

/**
 * The call flow: recording consent, transcript, the AI summary shown as
 * "Suggested — confirm", 1-5 legal next steps, and one "Confirm and hand off"
 * that confirms the summary, records minutes and creates the handoff.
 * Commercial notes are not shown or edited here.
 */
export default function CallPanel({ brief, onChanged }: { brief: Brief; onChanged: (b: Brief) => void }) {
  const c = brief.consultation;
  const [consent, setConsent] = useState<ConsentState>(c.consent.recording);
  const [recording, setRecording] = useState(c.status === "in_progress");
  const [transcript, setTranscript] = useState(c.transcript ?? "");
  const [pasting, setPasting] = useState(false);
  const [summary, setSummary] = useState(c.summary?.text ?? "");
  const [summaryStatus, setSummaryStatus] = useState(c.summary?.status ?? null);
  const [steps, setSteps] = useState<LegalNextStep[]>(c.suggestedNextSteps.length ? c.suggestedNextSteps.slice(0, MAX_STEPS) : [blank()]);
  const [minutes, setMinutes] = useState<number>(c.minutesUsed ?? c.durationMin ?? 20);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [handoffId, setHandoffId] = useState<string | null>(c.handoffId);
  const [status, setStatus] = useState(c.status);
  const [confirmNoShow, setConfirmNoShow] = useState(false);
  const [meetNote, setMeetNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const autoTried = useRef(false);
  const now = useNow();
  const ended = now > Date.parse(c.scheduledAt) + (c.durationMin || 20) * 60_000;

  useEffect(() => {
    setHandoffId(c.handoffId);
  }, [c.handoffId]);

  const confirmed = summaryStatus === "confirmed" || !!handoffId;
  const cleanSteps = steps.filter((x) => x.what.trim());
  const canConfirm = !confirmed && summary.trim().length > 0 && cleanSteps.length > 0 && minutes > 0;

  async function run(label: string, fn: () => Promise<void>) {
    setBusy(label);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(null);
    }
  }

  const changeConsent = (next: ConsentState) =>
    run("consent", async () => {
      await lawyerApi.setConsent(c.id, next);
      setConsent(next);
      if (next !== "granted") setRecording(false);
    });

  const startRecording = () =>
    run("record", async () => {
      if (consent !== "granted") throw new Error("Recording needs the member's consent first.");
      await lawyerApi.setCallStatus(c.id, "in_progress");
      setRecording(true);
    });

  /** Apply a transcript + AI draft returned by the Meet fetch or the upload. */
  function applyTranscript(r: TranscriptResult) {
    if (r.status !== "fetched") {
      setMeetNote(r.message ?? "No transcript yet.");
      return;
    }
    setMeetNote(r.source === "upload" ? "Transcribed from your recording." : r.source === "notes" ? "From Gemini's meeting notes in Google Meet." : "From the Google Meet transcript.");
    if (r.transcript) setTranscript(r.transcript);
    if (r.summary) {
      setSummary(r.summary.text);
      setSummaryStatus("suggested");
    }
    if (r.suggestedNextSteps?.length) setSteps(r.suggestedNextSteps.slice(0, MAX_STEPS));
    setPasting(false);
  }

  const fetchFromMeet = (quiet = false) =>
    run("meet", async () => {
      try {
        applyTranscript(await callsApi.meetTranscript(c.id));
      } catch (err) {
        if (!quiet) throw err;
      }
    });

  const uploadRecording = (file: File) =>
    run("upload", async () => {
      if (file.size > 7 * 1024 * 1024) throw new Error("The recording is over 7 MB. Upload a shorter file or paste the transcript.");
      const dataBase64 = await fileToBase64(file);
      applyTranscript(await callsApi.uploadRecording(c.id, { fileName: file.name, contentType: file.type || "audio/webm", dataBase64 }));
    });

  const markNoShow = () =>
    run("noshow", async () => {
      await callsApi.noShow(c.id);
      setStatus("no_show");
      setConfirmNoShow(false);
      onChanged({ ...brief, consultation: { ...c, status: "no_show" } });
    });

  // After the call, pick up the Meet transcript by itself once (consent only).
  useEffect(() => {
    if (autoTried.current || !ended || consent !== "granted" || transcript || summary || handoffId) return;
    if (status !== "booked" && status !== "in_progress") return;
    autoTried.current = true;
    fetchFromMeet(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ended, consent]);

  const draftSummary = () =>
    run("suggest", async () => {
      const pasted = pasting && transcript.trim() ? transcript.trim() : undefined;
      const r = await lawyerApi.suggest(c.id, pasted);
      setSummary(r.summary.text);
      setSummaryStatus("suggested");
      if (r.suggestedNextSteps.length) setSteps(r.suggestedNextSteps.slice(0, MAX_STEPS));
      setPasting(false);
    });

  const confirm = () =>
    run("confirm", async () => {
      const r = await lawyerApi.confirmAndHandOff(c.id, {
        summary: summary.trim(),
        steps: cleanSteps.map((x) => ({ what: x.what.trim(), who: x.who, dueAt: x.dueAt })),
        minutesUsed: minutes,
      });
      setHandoffId(r.handoffId);
      setSummaryStatus("confirmed");
      onChanged({
        ...brief,
        consultation: { ...c, status: "completed", handoffId: r.handoffId, minutesUsed: minutes, summary: { text: summary.trim(), status: "confirmed" } },
      });
    });

  const setStep = (i: number, patch: Partial<LegalNextStep>) =>
    setSteps((prev) => prev.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  if (status === "no_show" && !handoffId) {
    return (
      <section className={s.panel} aria-labelledby="call-noshow">
        <StatusPill label="Member did not join" tone="warning" />
        <h2 id="call-noshow" className={s.h}>Marked as a no-show</h2>
        <p className={s.muted}>
          The call counts as used on the membership. The ILP team contacts the member, offers a new time and can give the call back.
        </p>
        <Link href="/lawyer" className={s.ghostLink}>Back to Today</Link>
      </section>
    );
  }

  if (handoffId) {
    return (
      <section className={s.panel} aria-labelledby="call-done">
        <StatusPill label="Handed off" tone="success" />
        <h2 id="call-done" className={s.h}>Summary confirmed and handed off</h2>
        <p className={s.muted}>
          The member sees these next steps on their home page. The ILP team follows up within one business day.
          {` ${minutes} minutes recorded on the membership.`}
        </p>
        <ol className={s.doneSteps}>
          {(cleanSteps.length ? cleanSteps : brief.matters.find((m) => m.current)?.nextStep ? [brief.matters.find((m) => m.current)!.nextStep!] : []).map((x, i) => (
            <li key={i}>
              {x.what} <span className={s.muted}>({WHO_LABEL[x.who]}{x.dueAt ? `, by ${fmtShortDate(x.dueAt)}` : ""})</span>
            </li>
          ))}
        </ol>
        <Link href="/lawyer" className={s.ghostLink}>Back to Today</Link>
      </section>
    );
  }

  return (
    <section className={s.panel} aria-labelledby="call-h">
      <h2 id="call-h" className={s.h}>Call</h2>

      {(status === "booked" || status === "in_progress") && (
        <div className={s.block}>
          <div className={s.actions}>
            <JoinCall meetUrl={c.meetUrl} scheduledAt={c.scheduledAt} durationMin={c.durationMin} size="md" />
            {noShowAllowed(c.scheduledAt, now) && !confirmNoShow && (
              <Button size="sm" variant="ghost" onClick={() => setConfirmNoShow(true)} disabled={busy !== null}>
                Member didn&apos;t join
              </Button>
            )}
          </div>
          {confirmNoShow && (
            <div className={s.confirmBox} role="group" aria-label="Confirm no-show">
              <p className={s.muted}>This marks the call as a no-show and uses one of the member&apos;s calls. The ILP team can give it back.</p>
              <div className={s.actions}>
                <Button size="sm" variant="danger" onClick={markNoShow} busy={busy === "noshow"} disabled={busy !== null}>Yes, mark no-show</Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmNoShow(false)}>Keep waiting</Button>
              </div>
            </div>
          )}
          {!c.meetUrl && (
            <Notice
              tone="info"
              variant="inline"
              title="The Meet link is on its way"
              terms={["videoLink"]}
              fix={{
                steps: [
                  "The ILP team creates the Google Meet link and emails it to you and the member.",
                  "Check your inbox, and your spam folder, a few minutes before the call.",
                  "If there is still no link 10 minutes before the start, email your ILP contact. They can send it again.",
                ],
              }}
            >
              The ILP team is sending it by email.
            </Notice>
          )}
        </div>
      )}

      <div className={s.block}>
        <div className={s.rowBetween}>
          <span className={s.label}>Recording consent</span>
          <ConsentPill state={consent} size="md" />
        </div>
        {consent === "pending" && (
          <Notice
            tone="info"
            variant="inline"
            title="Ask the member before recording"
            terms={["recordingConsent", "transcript"]}
            fix={{
              steps: [
                "At the start of the call, ask: May I record this call so ILP can write your summary?",
                "If they say yes, press Member agreed. Start recording then works.",
                "If they say no, press Member declined and write the summary yourself after the call.",
              ],
              tutorialId: "lawyer.call",
              tutorialStep: "consent",
            }}
          >
            Nothing is recorded until they agree.
          </Notice>
        )}
        {consent === "declined" && (
          <Notice
            tone="neutral"
            variant="inline"
            title="The member declined recording"
            fix={{
              label: "What to do instead",
              steps: [
                "Take your own notes during the call.",
                "After the call, type the summary and next steps yourself in the boxes below.",
                "No transcript is stored. If the member changes their mind, press Member agreed.",
              ],
              tutorialId: "lawyer.call",
              tutorialStep: "summary",
            }}
          >
            Write the summary yourself; no transcript is stored.
          </Notice>
        )}
        <div className={s.actions}>
          <Button size="sm" variant={consent === "granted" ? "secondary" : "primary"} onClick={() => changeConsent("granted")} disabled={busy !== null || consent === "granted"}>
            Member agreed
          </Button>
          <Button size="sm" variant="ghost" onClick={() => changeConsent("declined")} disabled={busy !== null || consent === "declined"}>
            Member declined
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={startRecording}
            disabled={consent !== "granted" || recording || busy !== null}
            aria-describedby={consent !== "granted" ? "rec-hint" : undefined}
          >
            {recording ? "Recording" : "Start recording"}
          </Button>
          {consent !== "granted" && <span id="rec-hint" className={s.hint}>Recording is blocked until consent is granted.</span>}
        </div>
      </div>

      <div className={s.block}>
        <div className={s.rowBetween}>
          <span className={s.label}>Transcript</span>
          {consent === "granted" && !pasting && (
            <Button size="sm" variant="ghost" onClick={() => setPasting(true)}>{transcript ? "Replace" : "Paste transcript"}</Button>
          )}
        </div>
        {consent === "granted" && !transcript && !pasting && summaryStatus !== "confirmed" && (
          <div className={s.actions}>
            <Button size="sm" variant="secondary" onClick={() => fetchFromMeet()} busy={busy === "meet"} disabled={busy !== null}>
              Get transcript from Meet
            </Button>
            <Button size="sm" variant="ghost" onClick={() => fileRef.current?.click()} busy={busy === "upload"} disabled={busy !== null}>
              Upload recording
            </Button>
            <label htmlFor="recording-file" className={s.srOnly}>Recording audio file</label>
            <input
              ref={fileRef}
              id="recording-file"
              type="file"
              accept="audio/*,.webm,.m4a,.mp3,.wav,.ogg"
              className={s.srOnly}
              tabIndex={-1}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadRecording(f);
                e.target.value = "";
              }}
            />
          </div>
        )}
        {meetNote && <p className={s.hint} role="status">{meetNote}</p>}
        {pasting ? (
          <>
            <TextArea label="Transcript" hideLabel id="transcript" rows={6} value={transcript} onChange={(e) => setTranscript(e.target.value)} />
          </>
        ) : transcript ? (
          <pre className={s.transcript} tabIndex={0} aria-label="Call transcript">{transcript}</pre>
        ) : (
          <p className={s.muted}>{consent === "granted" ? "No transcript yet." : "No transcript without consent."}</p>
        )}
        {(transcript || pasting) && consent === "granted" && summaryStatus !== "confirmed" && (
          <div className={s.actions}>
            <Button size="sm" variant="secondary" onClick={draftSummary} busy={busy === "suggest"} disabled={busy !== null}>
              {summary ? "Redraft summary" : "Draft summary"}
            </Button>
          </div>
        )}
      </div>

      <div className={s.block}>
        <div className={s.rowBetween}>
          <label htmlFor="summary" className={s.label}>Summary</label>
          {summaryStatus === "suggested" && <StatusPill label="Suggested — confirm" tone="info" size="sm" srPrefix="AI draft:" />}
        </div>
        {summaryStatus === "suggested" && (
          <Notice
            tone="info"
            variant="inline"
            title="Drafted by AI — check it before you confirm"
            terms={["aiSummary"]}
            fix={{
              steps: [
                "Read the summary line by line against what was said on the call.",
                "Fix anything wrong or missing, in plain words for the member.",
                "Check each next step: who does it and by when.",
                "Press Confirm and hand off only when you agree with every line. The member sees it after that.",
              ],
              tutorialId: "lawyer.call",
              tutorialStep: "summary",
            }}
          >
            Edit anything that is not right. The member sees it only after you confirm.
          </Notice>
        )}
        <textarea id="summary" className={s.textarea} rows={4} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="What was discussed and what you concluded, in plain words for the member." />
      </div>

      <fieldset className={s.block}>
        <legend className={s.label}>Legal next steps ({cleanSteps.length} of {MAX_STEPS})</legend>
        <ol className={s.steps}>
          {steps.map((x, i) => (
            <li key={i} className={s.step}>
              <label className={s.srOnly} htmlFor={`what-${i}`}>Step {i + 1}: what</label>
              <input id={`what-${i}`} className={s.input} value={x.what} onChange={(e) => setStep(i, { what: e.target.value })} placeholder="What needs to happen" />
              <label className={s.srOnly} htmlFor={`who-${i}`}>Step {i + 1}: who</label>
              <select id={`who-${i}`} className={s.select} value={x.who} onChange={(e) => setStep(i, { who: e.target.value as LegalNextStep["who"] })}>
                <option value="client">Member</option>
                <option value="lawyer">Lawyer</option>
                <option value="ilp">ILP team</option>
              </select>
              <label className={s.srOnly} htmlFor={`due-${i}`}>Step {i + 1}: by when</label>
              <input id={`due-${i}`} type="date" className={s.date} value={dateInput(x.dueAt)} onChange={(e) => setStep(i, { dueAt: toIso(e.target.value) })} />
              <button type="button" className={s.remove} onClick={() => setSteps((p) => (p.length > 1 ? p.filter((_, j) => j !== i) : [blank()]))} aria-label={`Remove step ${i + 1}`}>
                Remove
              </button>
            </li>
          ))}
        </ol>
        {steps.length < MAX_STEPS && (
          <Button size="sm" variant="ghost" onClick={() => setSteps((p) => [...p, blank()])}>Add a step</Button>
        )}
      </fieldset>

      <div className={s.field}>
        <TextInput
          label="Minutes used"
          id="minutes"
          className={s.minutes}
          type="number"
          min={1}
          max={60}
          value={minutes}
          onChange={(e) => setMinutes(Math.max(0, Number(e.target.value) || 0))}
        />
      </div>

      {error && <ErrorNotice audience="lawyer">{error}</ErrorNotice>}

      <div className={s.confirmRow}>
        <Button onClick={confirm} busy={busy === "confirm"} disabled={!canConfirm || busy !== null}>
          Confirm and hand off
        </Button>
        {!canConfirm && (
          <Notice
            tone="info"
            variant="inline"
            title="Add a summary and at least one next step"
            terms={["handoff", "nextStep"]}
            fix={{
              steps: [
                "Write the summary in the Summary box above, or press Draft summary and check it.",
                "Add at least one next step, with who does it.",
                "Confirm and hand off then becomes available. It sends the summary to the member and the next steps to the ILP team.",
              ],
              tutorialId: "lawyer.call",
              tutorialStep: "handoff",
            }}
          />
        )}
      </div>
    </section>
  );
}
