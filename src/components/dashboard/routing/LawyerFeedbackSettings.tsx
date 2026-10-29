"use client";

import { useEffect, useState } from "react";
import { ApiError, staffApi } from "@/lib/api";
import { LAWYER_FEEDBACK_DEFAULTS, LAWYER_FEEDBACK_LIMITS, type LawyerFeedbackConfig } from "@/lib/contracts";
import { Button, NumberStepper, Skeleton, SkeletonRegion, Switch, useSkeleton, useUnsavedChanges } from "@/components/ui";
import { ErrorText, TabNote } from "../staff/PageHeader";
import s from "./LawyerFeedbackSettings.module.scss";

type NumKey = keyof typeof LAWYER_FEEDBACK_LIMITS;

const FIELDS: Array<{ key: NumKey; label: string; hint: string; step?: number }> = [
  { key: "coachingBelowScore", label: "Coaching below this rating (0 to 100)", hint: "The hidden rating staff see on Lawyers, Capacity.", step: 5 },
  { key: "coachingMinReviews", label: "Reviews needed before the rating counts", hint: "Below this many reviews the rating rule does not apply." },
  { key: "lowStars", label: "A low score is this many stars or fewer", hint: "Out of 5." },
  { key: "lowScoresCount", label: "Coaching after this many low scores", hint: "Counted inside the window below, whatever the overall rating." },
  { key: "lowScoresWindowDays", label: "Window for low scores, in days", hint: "Also how far back themes are read from comments (at least 90 days).", step: 5 },
  { key: "recognitionAtLeastScore", label: "Thank-you note from this rating", hint: "Added to the monthly email when there are no recent low scores.", step: 5 },
  { key: "recognitionMinReviews", label: "Reviews needed for the thank-you note", hint: "So one early five-star call does not trigger it." },
  { key: "minReviewsToShowDetail", label: "Reviews needed to show an average and comments", hint: "Below this the lawyer sees only a count, so no member can be picked out." },
  { key: "coachingCooldownDays", label: "Days between coaching emails", hint: "No second coaching email to the same lawyer within this time.", step: 5 },
];

/**
 * Settings → Lawyer feedback (COMMS-P2). Each month every lawyer with reviews
 * gets their own anonymized comments and star average; strong results get a
 * thank-you note; lawyers under these thresholds get a constructive email with
 * an offer of a call, and staff get a bell alert and a task. Lawyers never see
 * the rating number or a comparison with others.
 */
export function LawyerFeedbackSettings() {
  const [saved, setSaved] = useState<LawyerFeedbackConfig | null>(null);
  const [draft, setDraft] = useState<LawyerFeedbackConfig>(LAWYER_FEEDBACK_DEFAULTS);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    staffApi
      .get<{ config: LawyerFeedbackConfig }>("/api/dashboard/lawyer-feedback/config")
      .then((r) => {
        setSaved(r.config);
        setDraft(r.config);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "The settings did not load."));
  }, []);
  const dirty = !!saved && JSON.stringify(saved) !== JSON.stringify(draft);
  useUnsavedChanges(dirty, "The lawyer feedback settings have changes that are not saved yet. If you leave now, they will be lost.");
  const { showSkeleton, skeletonVisible } = useSkeleton(!saved && !error);

  async function save() {
    setBusy(true);
    setError(null);
    setErrors({});
    setDone(false);
    try {
      const r = await staffApi.put<{ config: LawyerFeedbackConfig }>("/api/dashboard/lawyer-feedback/config", draft);
      setSaved(r.config);
      setDraft(r.config);
      setDone(true);
    } catch (e) {
      const body = e instanceof ApiError ? (e.body as { errors?: Record<string, string> } | undefined) : undefined;
      if (body?.errors) setErrors(body.errors);
      setError(e instanceof Error ? e.message : "The settings could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  if (showSkeleton || (!saved && !error)) {
    return (
      <SkeletonRegion label="Loading lawyer feedback settings" visible={skeletonVisible}>
        <div className={s.grid}>
          {FIELDS.map((f) => (
            <div key={f.key}>
              <Skeleton shape="line" size="sm" width="60" />
              <Skeleton shape="block" size="sm" width="40" />
            </div>
          ))}
        </div>
      </SkeletonRegion>
    );
  }

  return (
    <div className={s.wrap}>
      <TabNote>
        On the 1st of each month every lawyer with reviews gets their own comments, edited to remove names and contact details, and their star average. Strong results add a thank-you note. Lawyers under these thresholds get a constructive email with suggestions and an offer of a call, and the team gets an alert and a task. Lawyers never see the rating number or how they compare with others.
      </TabNote>
      <Switch checked={draft.enabled} onChange={(on) => setDraft({ ...draft, enabled: on })} label="Send feedback emails to lawyers" labelFirst />
      <div className={s.grid}>
        {FIELDS.map((f) => {
          const [min, max] = LAWYER_FEEDBACK_LIMITS[f.key];
          return (
            <NumberStepper
              key={f.key}
              label={f.label}
              hint={`${f.hint} Default ${LAWYER_FEEDBACK_DEFAULTS[f.key]}.`}
              value={draft[f.key]}
              min={min}
              max={max}
              step={f.step}
              onChange={(v) => setDraft({ ...draft, [f.key]: v })}
              error={errors[f.key]}
            />
          );
        })}
      </div>
      <div className={s.actions}>
        <Button disabled={!dirty} busy={busy} onClick={save}>Save feedback settings</Button>
        <Button variant="ghost" disabled={busy} onClick={() => setDraft(LAWYER_FEEDBACK_DEFAULTS)}>Use the defaults</Button>
        {done && !dirty && <span className={s.ok}>Saved</span>}
      </div>
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  );
}
