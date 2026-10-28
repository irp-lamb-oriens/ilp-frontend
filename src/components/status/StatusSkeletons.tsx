"use client";

import { cx, Skeleton, SkeletonText } from "@/components/ui";
import overview from "./Overview.module.scss";
import booking from "./BookingFlow.module.scss";
import cancel from "./CancelMembership.module.scss";
import feedback from "./MonthlyFeedback.module.scss";
import scale from "./ScoreScale.module.scss";
import privacy from "@/components/legal/PrivacyCenter.module.scss";
import moneyPage from "@/app/status/money/money.module.scss";
import { MemberIntroSkeleton } from "./MemberIntro";
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

/**
 * Day and time pickers while open times load: a row of day chips over a grid
 * of 44 px time buttons. `daysClassName` / `timesClassName` are the real
 * picker's classes (BookingFlow `.days` / `.times`, UpcomingCalls `.chips`).
 */
export function SlotPickerSkeleton({
  daysClassName,
  timesClassName,
  days = 5,
  times = 10,
}: {
  daysClassName?: string;
  timesClassName?: string;
  days?: number;
  times?: number;
}) {
  return (
    <>
      <div className={daysClassName ?? booking.days} aria-hidden="true">
        {Array.from({ length: days }, (_, i) => (
          <Skeleton key={i} shape="block" size="sm" width="pill-lg" />
        ))}
      </div>
      <div className={timesClassName ?? booking.times} aria-hidden="true">
        {Array.from({ length: times }, (_, i) => (
          <Skeleton key={i} shape="block" size="sm" width={timesClassName ? "pill" : "100"} />
        ))}
      </div>
    </>
  );
}

/** Book a call: allowance line, then question, time, recording and confirm cards. */
export function BookSkeleton() {
  return (
    <div className={booking.flow} aria-hidden="true">
      <SkeletonText lines={2} />
      <div className={booking.step}>
        <Skeleton shape="line" size="lg" width="60" />
        <Skeleton shape="line" size="sm" width="40" />
        <Skeleton shape="block" size="lg" />
      </div>
      <div className={booking.step}>
        <Skeleton shape="line" size="lg" width="60" />
        <Skeleton shape="line" size="md" width="25" />
        <SlotPickerSkeleton />
      </div>
      <div className={booking.step}>
        <Skeleton shape="line" size="lg" width="60" />
        <SkeletonText lines={3} size="sm" />
        <div className={booking.times}>
          <Skeleton shape="block" size="sm" />
          <Skeleton shape="block" size="sm" />
        </div>
      </div>
      <div className={booking.summary}>
        <Skeleton shape="line" size="lg" width="25" />
        <SkeletonText lines={2} size="sm" />
        <Skeleton shape="block" size="sm" />
      </div>
    </div>
  );
}

/** Cancel membership: title, "what happens" card, reasons, comment, actions. */
export function CancelSkeleton() {
  return (
    <div className={cancel.page} aria-hidden="true">
      <Skeleton shape="line" size="xl" width="75" />
      <div className={cancel.what}>
        <Skeleton shape="line" size="lg" width="40" />
        <SkeletonText lines={4} size="sm" />
      </div>
      <div className={s.stackSm}>
        <Skeleton shape="line" size="md" width="40" />
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} shape="line" size="md" width={i % 2 ? "60" : "75"} />
        ))}
      </div>
      <div className={s.stackSm}>
        <Skeleton shape="line" size="sm" width="60" />
        <Skeleton shape="block" size="lg" />
      </div>
      <div className={s.head}>
        <Skeleton shape="block" size="sm" width="pill-lg" />
        <Skeleton shape="block" size="sm" width="pill-lg" />
      </div>
    </div>
  );
}

/** Monthly feedback: title, 0-10 scale, back link. */
export function FeedbackSkeleton() {
  return (
    <div className={feedback.page} aria-hidden="true">
      <Skeleton shape="line" size="xl" width="40" />
      <div className={s.stackSm}>
        <Skeleton shape="line" size="md" width="75" />
        <div className={scale.wide}>
          {Array.from({ length: 11 }, (_, i) => (
            <Skeleton key={i} shape="block" size="sm" />
          ))}
        </div>
        <div className={s.head}>
          <Skeleton shape="line" size="xs" width="25" />
          <Skeleton shape="line" size="xs" width="25" />
        </div>
      </div>
      <Skeleton shape="line" size="md" width="40" />
    </div>
  );
}

/** One privacy-page card: title, text and a button. */
function PrivacyCardSkeleton({ lines = 2, rows = 0 }: { lines?: number; rows?: number }) {
  return (
    <div className={privacy.card}>
      <Skeleton shape="line" size="lg" width="40" />
      <SkeletonText lines={lines} size="sm" />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={privacy.choice}>
          <div>
            <Skeleton shape="line" size="md" width="40" />
            <Skeleton shape="line" size="sm" width="90" />
          </div>
          <Skeleton shape="block" size="sm" width="pill-lg" />
        </div>
      ))}
      {rows === 0 && <Skeleton shape="block" size="sm" width="pill-lg" />}
    </div>
  );
}

/** Your data and privacy: heading, then download, choices and request cards. */
export function PrivacySkeleton() {
  return (
    <div className={privacy.page} aria-hidden="true">
      <PrivacyCardSkeleton lines={3} />
      <PrivacyCardSkeleton lines={0} rows={3} />
      <PrivacyCardSkeleton />
      <PrivacyCardSkeleton />
    </div>
  );
}

/** Choices card status line and the request list, while /privacy/me loads. */
export function PrivacyRequestsSkeleton() {
  return (
    <div className={s.rows} aria-hidden="true">
      {[0, 1].map((i) => (
        <div key={i} className={s.row}>
          <div className={s.rowSplit}>
            <Skeleton shape="line" size="md" width={i ? "40" : "60"} />
            <Skeleton shape="pill" size="sm" />
          </div>
          <Skeleton shape="line" size="sm" width="40" />
        </div>
      ))}
    </div>
  );
}

/** Gate and loading.tsx: the skeleton of the member page being opened. */
export default function StatusRouteSkeleton({ pathname }: { pathname: string }) {
  const screen = SCREENS.find(([prefix]) => pathname.startsWith(prefix))?.[1];
  const body = routeBody(pathname);
  // Each member screen opens with its MemberIntro (Overview draws its own inside the view).
  if (!screen) return body;
  return (
    <>
      <MemberIntroSkeleton screen={screen} />
      {body}
    </>
  );
}

/** Route prefix to MemberIntro `screen` key, most specific first. */
const SCREENS: Array<[string, string]> = [
  ["/status/profile", "profile"],
  ["/status/money/cancel", "cancel"],
  ["/status/money", "money"],
  ["/status/messages", "messages"],
  ["/status/book", "book"],
  ["/status/feedback", "feedback"],
  ["/status/privacy", "privacy"],
];

function routeBody(pathname: string) {
  if (pathname.startsWith("/status/profile")) return <ProfileSkeleton />;
  if (pathname.startsWith("/status/money/cancel")) return <CancelSkeleton />;
  if (pathname.startsWith("/status/money")) {
    // The Money page: payments, then the membership plan card.
    return (
      <div className={moneyPage.stack}>
        <MoneySkeleton />
        <PlanSkeleton />
      </div>
    );
  }
  if (pathname.startsWith("/status/messages")) return <MessagesSkeleton />;
  if (pathname.startsWith("/status/book")) return <BookSkeleton />;
  if (pathname.startsWith("/status/feedback")) return <FeedbackSkeleton />;
  if (pathname.startsWith("/status/privacy")) return <PrivacySkeleton />;
  return <OverviewSkeleton />;
}
