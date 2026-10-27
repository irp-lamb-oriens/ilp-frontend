"use client";

import { cx, Skeleton, SkeletonText } from "@/components/ui";
import overview from "./Overview.module.scss";
import s from "./StatusSkeletons.module.scss";

/** "Next step" card: what, who, by when, and the action button. */
export function NextStepSkeleton() {
  return (
    <div className={cx(s.card, s.next)} aria-hidden="true">
      <Skeleton shape="line" size="xs" width="25" />
      <Skeleton shape="line" size="xl" width="75" />
      <div className={s.facts}>
        <div className={s.fact}>
          <Skeleton shape="line" size="sm" width="75" />
          <Skeleton shape="line" size="md" width="40" />
        </div>
        <div className={s.fact}>
          <Skeleton shape="line" size="sm" width="75" />
          <Skeleton shape="line" size="md" width="60" />
        </div>
      </div>
      <Skeleton shape="block" size="sm" />
    </div>
  );
}

/** Membership: minutes left of 60, calls left, renewal note, Book a call. */
export function MembershipSkeleton() {
  return (
    <div className={s.card} aria-hidden="true">
      <div className={s.head}>
        <Skeleton shape="line" size="lg" width="60" />
        <Skeleton shape="pill" size="sm" />
      </div>
      <div className={s.figures}>
        <div>
          <Skeleton shape="line" size="xl" width="60" />
          <Skeleton shape="line" size="sm" width="75" />
        </div>
        <div>
          <Skeleton shape="line" size="xl" width="40" />
          <Skeleton shape="line" size="sm" width="75" />
        </div>
      </div>
      <Skeleton shape="line" size="sm" width="90" />
      <Skeleton shape="block" size="sm" />
    </div>
  );
}

/** Upcoming obligations: title, intro and three dated items. */
export function ObligationsSkeleton({ items = 3 }: { items?: number }) {
  return (
    <div className={s.card} aria-hidden="true">
      <Skeleton shape="line" size="lg" width="40" />
      <Skeleton shape="line" size="sm" width="90" />
      <div className={s.rows}>
        {Array.from({ length: items }, (_, i) => (
          <div key={i} className={s.row}>
            <div className={s.rowSplit}>
              <Skeleton shape="line" size="md" width={i % 2 ? "60" : "75"} />
              <Skeleton shape="pill" size="sm" />
            </div>
            <Skeleton shape="line" size="sm" width="40" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Matter timeline: stage markers with a label and a line each. */
export function MatterTimelineSkeleton({ steps = 4 }: { steps?: number }) {
  return (
    <div className={s.card} aria-hidden="true">
      <div className={s.head}>
        <Skeleton shape="line" size="lg" width="40" />
        <Skeleton shape="line" size="sm" width="25" />
      </div>
      <div className={s.rows}>
        {Array.from({ length: steps }, (_, i) => (
          <div key={i} className={s.step}>
            <Skeleton shape="circle" size="md" />
            <div>
              <Skeleton shape="line" size="md" width={i % 2 ? "40" : "60"} />
              <Skeleton shape="line" size="sm" width="75" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Overview in its own grid: lead (hello, next step), rail (membership,
 * calls), main (obligations, timeline). Phones stack them in that order.
 */
export function OverviewSkeleton() {
  return (
    <div className={overview.grid}>
      <div className={overview.lead}>
        <Skeleton shape="line" size="lg" width="25" />
        <NextStepSkeleton />
      </div>
      <div className={overview.rail}>
        <MembershipSkeleton />
      </div>
      <div className={overview.main}>
        <ObligationsSkeleton />
        <MatterTimelineSkeleton />
      </div>
    </div>
  );
}

/** Profile: completion card, section forms, documents. */
export function ProfileSkeleton() {
  return (
    <div className={s.stack}>
      <div className={s.card} aria-hidden="true">
        <div className={s.head}>
          <Skeleton shape="line" size="lg" width="60" />
          <Skeleton shape="pill" size="sm" width="pill-lg" />
        </div>
        <Skeleton shape="pill" size="xs" width="100" />
        <SkeletonText lines={2} size="sm" />
      </div>
      <div className={s.stackSm}>
        {[0, 1, 2].map((i) => (
          <div key={i} className={s.card} aria-hidden="true">
            <div className={s.head}>
              <Skeleton shape="line" size="lg" width="40" />
              <Skeleton shape="line" size="sm" width="15" />
            </div>
            <Skeleton shape="line" size="sm" width="75" />
            <Skeleton shape="block" size="sm" />
            <Skeleton shape="block" size="sm" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Documents card: upload row and three files. */
export function DocumentsListSkeleton() {
  return (
    <div className={s.rows} aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className={s.row}>
          <div className={s.rowSplit}>
            <Skeleton shape="line" size="md" width={i % 2 ? "40" : "60"} />
            <Skeleton shape="line" size="sm" width="15" />
          </div>
          <Skeleton shape="line" size="sm" width="40" />
        </div>
      ))}
    </div>
  );
}

/** Money: balance due first, then charges and proposals. */
export function MoneySkeleton() {
  return (
    <div className={s.stack}>
      <div className={s.card} aria-hidden="true">
        <Skeleton shape="line" size="sm" width="25" />
        <Skeleton shape="line" size="xl" width="40" />
        <Skeleton shape="line" size="sm" width="75" />
      </div>
      <div className={s.stackSm} aria-hidden="true">
        <Skeleton shape="line" size="lg" width="40" />
        <div className={s.card}>
          <div className={s.rows}>
            {[0, 1, 2].map((i) => (
              <div key={i} className={s.row}>
                <div className={s.rowSplit}>
                  <Skeleton shape="line" size="md" width="60" />
                  <Skeleton shape="line" size="md" width="15" />
                </div>
                <Skeleton shape="pill" size="sm" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Membership plan card under Money. */
export function PlanSkeleton() {
  return (
    <div className={s.card} aria-hidden="true">
      <div className={s.head}>
        <Skeleton shape="line" size="lg" width="40" />
        <Skeleton shape="pill" size="sm" />
      </div>
      <Skeleton shape="line" size="md" width="75" />
      <Skeleton shape="line" size="sm" width="40" />
    </div>
  );
}

/** Message thread: team card, own message, labeled AI reply. */
export function ThreadSkeleton() {
  return (
    <div className={s.stackSm} aria-hidden="true">
      <div className={s.msgTeam}>
        <Skeleton shape="line" size="sm" width="25" />
        <SkeletonText lines={2} />
      </div>
      <div className={s.msgMine}>
        <Skeleton shape="line" size="sm" width="15" />
        <SkeletonText lines={1} />
      </div>
      <div className={s.msgAi}>
        <Skeleton shape="pill" size="sm" />
        <SkeletonText lines={2} size="sm" />
      </div>
    </div>
  );
}

/** Messages page before the gate passes: intro, thread, composer. */
export function MessagesSkeleton() {
  return (
    <div className={s.stackSm}>
      <SkeletonText lines={2} />
      <ThreadSkeleton />
      <div className={s.card} aria-hidden="true">
        <Skeleton shape="line" size="sm" width="25" />
        <Skeleton shape="block" size="lg" />
        <Skeleton shape="pill" size="lg" width="pill-lg" />
      </div>
    </div>
  );
}

/** Gate: the skeleton of the member page being opened. */
export default function StatusRouteSkeleton({ pathname }: { pathname: string }) {
  if (pathname.startsWith("/status/profile")) return <ProfileSkeleton />;
  if (pathname.startsWith("/status/money")) return <MoneySkeleton />;
  if (pathname.startsWith("/status/messages")) return <MessagesSkeleton />;
  return <OverviewSkeleton />;
}
