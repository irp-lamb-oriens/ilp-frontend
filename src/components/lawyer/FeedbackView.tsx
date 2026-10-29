"use client";

import { useCallback, useEffect, useState } from "react";
import { EmptyState, ErrorNotice, SkeletonRegion, SkeletonStatStrip, SkeletonText, Stagger, StaggerItem, StatTile, useSkeleton } from "@/components/ui";
import { getFeedback, starsText, type LawyerFeedbackPage } from "./commsApi";
import s from "./FeedbackView.module.scss";

/** Placeholder with the page's own grid. */
export function FeedbackSkeleton() {
  return (
    <div className={s.page}>
      <SkeletonStatStrip small={1} className={s.tiles} />
      <SkeletonText lines={5} />
    </div>
  );
}

/**
 * What members said about the lawyer's own calls: the star average and
 * comments over the last 90 days (edited to remove names and contact
 * details), and a six-month history. Averages and comments show only over
 * enough reviews that no single member can be picked out.
 */
export default function FeedbackView() {
  const [data, setData] = useState<LawyerFeedbackPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => {
    setError(null);
    getFeedback()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Feedback did not load."));
  }, []);
  useEffect(load, [load]);
  const { showSkeleton, skeletonVisible } = useSkeleton(!data && !error);

  if (error && !data) {
    return <ErrorNotice audience="lawyer" variant="block" title="Feedback did not load" onRetry={load}>{error}</ErrorNotice>;
  }
  if (showSkeleton || !data) {
    return (
      <SkeletonRegion label="Loading your feedback" visible={skeletonVisible}>
        <FeedbackSkeleton />
      </SkeletonRegion>
    );
  }

  const r = data.recent;
  if (!r.totalReviews) {
    return <EmptyState title="No reviews yet" body="After each call, members can rate it from 1 to 5 stars and add a comment. Their feedback shows here once it arrives." />;
  }
  return (
    <Stagger>
      <div className={s.page}>
        <div className={s.tiles}>
          <StaggerItem index={0} className={s.tileCell}>
            <StatTile
              size="lg"
              label="Average over the last 90 days"
              value={r.averageStars != null ? starsText(r.averageStars) : "Not shown yet"}
              hint={r.averageStars != null ? "stars" : `Shown from ${r.minReviewsToShowDetail} reviews`}
            />
          </StaggerItem>
          <StaggerItem index={1} className={s.tileCell}>
            <StatTile label="Reviews in the last 90 days" value={String(r.reviewsInPeriod)} hint={`${r.totalReviews} in total`} />
          </StaggerItem>
        </div>

        <StaggerItem as="section" index={2} aria-labelledby="fb-comments">
          <h2 id="fb-comments" className={s.h}>What members wrote</h2>
          {r.tooFewToShow ? (
            <p className={s.muted}>
              Comments show once there are at least {r.minReviewsToShowDetail} reviews in the last 90 days, so no single member can be picked out.
            </p>
          ) : r.comments.length ? (
            <ul className={s.comments}>
              {r.comments.map((c, i) => (
                <li key={i} className={s.comment}>{c}</li>
              ))}
            </ul>
          ) : (
            <p className={s.muted}>Members left stars without comments in this period.</p>
          )}
        </StaggerItem>

        <StaggerItem as="section" index={3} aria-labelledby="fb-months">
          <h2 id="fb-months" className={s.h}>By month</h2>
          <table className={s.table}>
            <caption className={s.srOnly}>Reviews and average stars by month</caption>
            <thead>
              <tr>
                <th scope="col">Month</th>
                <th scope="col" className={s.num}>Reviews</th>
                <th scope="col" className={s.num}>Average</th>
              </tr>
            </thead>
            <tbody>
              {data.months.map((m) => (
                <tr key={m.month}>
                  <th scope="row">{m.label}</th>
                  <td className={s.num}>{m.reviews}</td>
                  <td className={s.num}>{m.averageStars != null ? starsText(m.averageStars) : m.reviews ? "Too few to show" : "No reviews"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </StaggerItem>

        <p className={s.muted}>
          Comments are edited to remove names and contact details. Only you and the ILP team see your feedback, and members never see star scores. Each month we email you a short summary.
        </p>
      </div>
    </Stagger>
  );
}
