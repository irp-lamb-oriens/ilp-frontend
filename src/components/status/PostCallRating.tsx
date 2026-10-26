"use client";

import { useEffect, useState } from "react";
import { Button, TextArea } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { feedbackApi, type PendingCall } from "./feedbackApi";
import { dateLong } from "./format";
import ScoreScale from "./ScoreScale";
import s from "./PostCallRating.module.scss";

const HIDE_KEY = "ilp_rating_later";

function hiddenFor(id: string): boolean {
  try {
    return window.sessionStorage.getItem(HIDE_KEY) === id;
  } catch {
    return false;
  }
}

/** Overview: rate the most recent completed call (1-5 + optional comment). Shows nothing when there is none. */
export default function PostCallRating() {
  const [call, setCall] = useState<PendingCall | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    feedbackApi
      .pending()
      .then((r) => setCall(r.consultation && !hiddenFor(r.consultation.id) ? r.consultation : null))
      .catch(() => setCall(null));
  }, []);

  if (!call) return null;

  if (done) {
    return (
      <section className={s.card} aria-live="polite">
        <p className={s.thanks}>Thank you. Your team reads every answer.</p>
      </section>
    );
  }

  async function send() {
    if (score === null || !call) return setError("Pick a number from 1 to 5.");
    setBusy(true);
    setError(null);
    try {
      await feedbackApi.rateCall({ consultationId: call.id, score, comment: comment.trim() || undefined });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "That did not save. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function later() {
    try {
      window.sessionStorage.setItem(HIDE_KEY, call!.id);
    } catch {
      // per-tab convenience only
    }
    setCall(null);
  }

  const who = call.lawyerName ? `with ${call.lawyerName}` : "with your lawyer";
  return (
    <section className={s.card} aria-labelledby="rate-title">
      <h2 className={s.title} id="rate-title">
        How was your call {who} on {dateLong(call.scheduledAt)}?
      </h2>
      <ScoreScale min={1} max={5} value={score} onChange={setScore} label="Your rating" lowLabel="poor" highLabel="excellent" name="call-score" />
      <div className={s.field}>
        <TextArea
          label="Anything to add? (optional)"
          id="rate-comment"
          rows={3}
          maxLength={1000}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>
      {error && (
        <p className={s.err} role="alert">
          {error}
        </p>
      )}
      <div className={s.actions}>
        <Button variant="secondary" onClick={send} busy={busy}>
          Send rating
        </Button>
        <Button variant="ghost" onClick={later}>
          Not now
        </Button>
      </div>
    </section>
  );
}
