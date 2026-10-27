"use client";

import { useEffect, useState } from "react";
import { staffApi } from "@/lib/api";
import type { FunnelStep } from "@/lib/contracts";
import { EmptyState, ProgressBar, Skeleton, SkeletonRegion, SkeletonStatTile, SkeletonText, StaggerItem, StatTile, useSkeleton } from "@/components/ui";
import s from "./PmfPanel.module.scss";

/** Server: GET /api/analytics/pmf (server/API/analytics/funnel.ts). */
export interface PmfSummary {
  days: number;
  since: string;
  funnel: Array<{ step: FunnelStep; count: number; fromPrevious: number | null }>;
  sources: Array<{ source: string; checks: number; paid: number }>;
  postCall: { average: number | null; count: number; low: number };
  nps: { score: number | null; count: number; promoters: number; passives: number; detractors: number; average: number | null };
  cancels: { count: number; reasons: Array<{ reason: string; count: number }> };
}

export const STEP_LABEL: Record<FunnelStep, string> = {
  check_started: "Started the free check",
  check_completed: "Saw their findings",
  check_email_given: "Gave an email",
  join_started: "Opened Join",
  join_paid: "Paid and active",
  first_call_booked: "Booked a first call",
};

const pct = (x: number | null) => (x === null ? "–" : `${(x * 100).toFixed(1)}%`);

export function usePmf(days = 30) {
  const [data, setData] = useState<PmfSummary | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    staffApi
      .get<PmfSummary>("/api/analytics/pmf", { query: { days } })
      .then(setData)
      .catch(() => setFailed(true));
  }, [days]);
  return { data, failed };
}

/** Reports → Member funnel: last 30 days of the loop, call ratings, NPS and why people cancel. */
export default function PmfPanel() {
  const { data, failed } = usePmf(30);
  const { showSkeleton, skeletonVisible } = useSkeleton(!data && !failed);
  if (failed) {
    return (
      <StaggerItem>
        <EmptyState compact title="Funnel data could not be loaded" body="Try again in a minute." />
      </StaggerItem>
    );
  }
  if (showSkeleton || !data) {
    return (
      <SkeletonRegion label="Loading the member funnel" visible={skeletonVisible} className={s.wrap}>
        <PmfSkeleton />
      </SkeletonRegion>
    );
  }

  const top = Math.max(1, data.funnel[0]?.count ?? 0);
  const paid = data.funnel.find((f) => f.step === "join_paid")?.count ?? 0;
  const started = data.funnel[0]?.count ?? 0;

  return (
    <div className={s.wrap}>
      <StaggerItem index={0} className={s.tiles}>
        <StatTile
          size="lg"
          label="Free check → paid member"
          value={started ? pct(paid / started) : "–"}
          hint={`${paid} of ${started} visitors, last ${data.days} days · target ≥ 5%`}
        />
        <StatTile
          label="Average call rating"
          value={data.postCall.average === null ? "–" : `${data.postCall.average.toFixed(1)} of 5`}
          hint={`${data.postCall.count} ratings · ${data.postCall.low} at 1-2`}
        />
        <StatTile
          label="NPS (monthly question)"
          value={data.nps.score === null ? "–" : String(data.nps.score)}
          hint={`${data.nps.count} answers · ${data.nps.promoters} promoters, ${data.nps.detractors} detractors`}
        />
        <StatTile label="Cancel requests" value={data.cancels.count} hint={`last ${data.days} days`} />
      </StaggerItem>

      <StaggerItem as="section" index={1} className={s.block} aria-labelledby="pmf-funnel">
        <h2 className={s.title} id="pmf-funnel">
          Funnel, last {data.days} days
        </h2>
        <p className={s.note}>People per step (one anonymous browser id each). The figure on the right is the share of the step before.</p>
        <ol className={s.steps}>
          {data.funnel.map((f) => (
            <li key={f.step} className={s.step}>
              <ProgressBar
                label={STEP_LABEL[f.step]}
                value={f.count}
                max={top}
                valueText={`${f.count}${f.fromPrevious === null ? "" : ` · ${pct(f.fromPrevious)}`}`}
              />
            </li>
          ))}
        </ol>
      </StaggerItem>

      <StaggerItem index={2} className={s.split}>
        <section className={s.block} aria-labelledby="pmf-sources">
          <h2 className={s.title} id="pmf-sources">
            Where checks come from
          </h2>
          {data.sources.length === 0 ? (
            <p className={s.muted}>No checks yet.</p>
          ) : (
            <table className={s.table}>
              <thead>
                <tr>
                  <th scope="col">Source</th>
                  <th scope="col">Checks</th>
                  <th scope="col">Paid</th>
                </tr>
              </thead>
              <tbody>
                {data.sources.map((r) => (
                  <tr key={r.source}>
                    <td>{r.source}</td>
                    <td>{r.checks}</td>
                    <td>{r.paid}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className={s.block} aria-labelledby="pmf-cancel">
          <h2 className={s.title} id="pmf-cancel">
            Why members cancel
          </h2>
          {data.cancels.reasons.length === 0 ? (
            <p className={s.muted}>No cancel requests in this period.</p>
          ) : (
            <ul className={s.reasons}>
              {data.cancels.reasons.map((r) => (
                <li key={r.reason}>
                  <span>{r.reason}</span>
                  <span className={s.count}>{r.count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </StaggerItem>
    </div>
  );
}

/** Tiles, the six funnel bars and the two lower blocks. */
export function PmfSkeleton() {
  return (
    <>
      <div className={s.tiles} aria-hidden="true">
        <SkeletonStatTile size="lg" />
        <SkeletonStatTile />
        <SkeletonStatTile />
        <SkeletonStatTile />
      </div>
      <div className={s.block} aria-hidden="true">
        <Skeleton shape="line" size="lg" width="40" />
        <Skeleton shape="line" size="sm" width="75" />
        <div className={s.steps}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={s.step}>
              <Skeleton shape="line" size="sm" width={i % 2 ? "40" : "60"} />
              <Skeleton shape="pill" size="xs" width="100" />
            </div>
          ))}
        </div>
      </div>
      <div className={s.split} aria-hidden="true">
        <div className={s.block}>
          <Skeleton shape="line" size="lg" width="60" />
          <SkeletonText lines={4} size="sm" />
        </div>
        <div className={s.block}>
          <Skeleton shape="line" size="lg" width="60" />
          <SkeletonText lines={4} size="sm" />
        </div>
      </div>
    </>
  );
}
