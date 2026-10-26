"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, StatusPill } from "@/components/ui";
import type { ConsentState, LegalNextStep } from "./lawyerApi";
import { errorText, fmtShortDate, lawyerApi, WHO_LABEL, type Brief } from "./lawyerApi";
import { ConsentPill } from "./pills";
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
  const [quoteScope, setQuoteScope] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [handoffId, setHandoffId] = useState<string | null>(c.handoffId);

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
        quoteScope,
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

      <div className={s.block}>
        <div className={s.rowBetween}>
          <span className={s.label}>Recording consent</span>
          <ConsentPill state={consent} size="md" />
        </div>
        {consent === "pending" && <p className={s.muted}>Ask the member before recording. Nothing is recorded until they agree.</p>}
        {consent === "declined" && <p className={s.muted}>The member declined. Write the summary yourself; no transcript is stored.</p>}
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
        {pasting ? (
          <>
            <label htmlFor="transcript" className={s.srOnly}>Transcript</label>
            <textarea id="transcript" className={s.textarea} rows={6} value={transcript} onChange={(e) => setTranscript(e.target.value)} />
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
        {summaryStatus === "suggested" && <p className={s.hint}>Drafted by AI from the transcript. Edit anything that is not right before you confirm.</p>}
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

      <div className={s.twoUp}>
        <div className={s.field}>
          <label htmlFor="minutes" className={s.label}>Minutes used</label>
          <input id="minutes" type="number" min={1} max={60} className={s.input} value={minutes} onChange={(e) => setMinutes(Math.max(0, Number(e.target.value) || 0))} />
        </div>
        <div className={s.field}>
          <label htmlFor="scope" className={s.label}>Paid legal work needed (optional)</label>
          <input id="scope" className={s.input} value={quoteScope} onChange={(e) => setQuoteScope(e.target.value)} placeholder="Scope only, e.g. S.A. clean-up: two tax years, RTBF" />
        </div>
      </div>

      {error && <p className={s.error} role="alert">{error}</p>}

      <div className={s.confirmRow}>
        <Button onClick={confirm} busy={busy === "confirm"} disabled={!canConfirm || busy !== null}>
          Confirm and hand off
        </Button>
        {!canConfirm && <span className={s.hint}>Needs a summary and at least one next step.</span>}
      </div>
    </section>
  );
}
