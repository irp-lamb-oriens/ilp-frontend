"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, TextArea } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { feedbackApi } from "./feedbackApi";
import ScoreScale from "./ScoreScale";
import s from "./MonthlyFeedback.module.scss";

const MONTH_RE = /^20\d\d-(0[1-9]|1[0-2])$/;

/**
 * /status/feedback?score=N[&m=YYYY-MM]: the monthly check-in question.
 * A score in the link (from the email) is saved on arrival, so one tap is
 * enough; the member can then change it or add a reason.
 */
export default function MonthlyFeedback() {
  const params = useSearchParams();
  const month = MONTH_RE.test(params?.get("m") ?? "") ? params!.get("m")! : undefined;
  const fromLink = Number(params?.get("score"));
  const linkScore = Number.isInteger(fromLink) && fromLink >= 0 && fromLink <= 10 && params?.get("score") !== null ? fromLink : null;

  const [score, setScore] = useState<number | null>(linkScore);
  const [saved, setSaved] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentComment, setSentComment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoSaved = useRef(false);

  useEffect(() => {
    if (linkScore !== null && !autoSaved.current) {
      autoSaved.current = true;
      feedbackApi
        .saveMonthly({ score: linkScore, month })
        .then((r) => setSaved(r.score))
        .catch(() => setError("Your answer did not save. Pick it again below."));
      return;
    }
    if (linkScore === null) {
      feedbackApi
        .monthly(month)
        .then((r) => {
          if (r.score !== null) {
            setScore(r.score);
            setSaved(r.score);
          }
        })
        .catch(() => undefined);
    }
  }, [linkScore, month]);

  async function save(withComment: boolean) {
    if (score === null) return setError("Pick a number from 0 to 10.");
    setBusy(true);
    setError(null);
    try {
      const r = await feedbackApi.saveMonthly({ score, month, comment: withComment ? comment.trim() || undefined : undefined });
      setSaved(r.score);
      if (withComment && comment.trim()) setSentComment(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "That did not save. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={s.page} data-tour="client-feedback-scale">
      <h1 className={s.title}>{saved !== null ? "Thank you" : "One question"}</h1>
      {saved !== null && <p className={s.body}>We saved your answer: {saved} out of 10. Your team reads every answer.</p>}

      <ScoreScale
        min={0}
        max={10}
        value={score}
        onChange={(n) => setScore(n)}
        label="How likely are you to recommend ILP to a friend living abroad?"
        lowLabel="not at all likely"
        highLabel="very likely"
        name="nps"
      />
      {score !== null && score !== saved && (
        <div>
          <Button variant="secondary" onClick={() => save(false)} busy={busy}>
            Save {score}
          </Button>
        </div>
      )}

      {saved !== null &&
        (sentComment ? (
          <p className={s.body}>Thank you for telling us more.</p>
        ) : (
          <div className={s.field}>
            <TextArea
              label="What is the main reason for your answer? (optional)"
              id="nps-comment"
              rows={4}
              maxLength={1000}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <div>
              <Button variant="secondary" onClick={() => save(true)} busy={busy} disabled={!comment.trim()}>
                Send
              </Button>
            </div>
          </div>
        ))}

      {error && (
        <p className={s.err} role="alert">
          {error}
        </p>
      )}
      <Link className={s.back} href="/status">
        Back to your ILP home
      </Link>
    </div>
  );
}
