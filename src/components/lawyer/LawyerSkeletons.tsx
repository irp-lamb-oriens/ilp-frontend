"use client";

import { BoardSkeleton, PageIntroSkeleton, Skeleton, SkeletonCard, SkeletonList, SkeletonStatStrip, SkeletonTable, SkeletonText } from "@/components/ui";
import today from "./TodayView.module.scss";
import board from "./BoardView.module.scss";
import clients from "./ClientsView.module.scss";
import finance from "./FinanceView.module.scss";
import avail from "./AvailabilityView.module.scss";
import call from "./CallView.module.scss";
import brief from "./BriefPanel.module.scss";
import insp from "./InspectorTabs.module.scss";
import notes from "./notesTab.module.scss";
import fq from "./FeeQuotesTab.module.scss";
import dl from "./DeadlineEditor.module.scss";
import { ProfileSkeleton } from "@/components/routing/ProfileView";
import introCss from "./LawyerIntro.module.scss";

/** The compact intro a lawyer screen opens with (LawyerIntro), as a placeholder. */
function IntroSkeleton({ screen, collapsed = false, flush = false }: { screen: string; collapsed?: boolean; flush?: boolean }) {
  return <PageIntroSkeleton storageKey={`lawyer.${screen}`} defaultCollapsed={collapsed} className={flush ? undefined : introCss.intro} />;
}

/** Today's call rows: time, member and matter, consent and summary pills. */
export function CallsSkeleton({ rows = 4 }: { rows?: number }) {
  return <SkeletonList rows={rows} lead="time" trail="pills" lines={2} variant="spaced" />;
}

/** "Next 3 days" rail rows: when, member, matter. */
export function UpcomingSkeleton() {
  return <SkeletonList rows={3} lead={null} trail={null} lines={3} variant="plain" compact />;
}

/** Lawyer Today, header included (used by the gate before TodayView mounts). */
export function LawyerTodaySkeleton() {
  return (
    <div className={today.page}>
      <section className={today.main}>
        <header className={today.head}>
          <Skeleton shape="line" size="lg" width="40" />
          <Skeleton shape="line" size="sm" width="25" />
          <Skeleton shape="line" size="sm" width="40" />
        </header>
        <CallsSkeleton />
      </section>
      <aside className={today.rail}>
        <h3 className={today.railH}>Next 3 days</h3>
        <UpcomingSkeleton />
      </aside>
    </div>
  );
}

/** Stage columns with cards, in the board's own grid. */
export function BoardColumnsSkeleton() {
  return <BoardSkeleton columns={4} cards={3} />;
}

/** Toolbar plus columns (gate). */
export function LawyerBoardSkeleton() {
  return (
    <div className={board.page}>
      <div className={board.toolbar} aria-hidden="true">
        <Skeleton shape="pill" size="lg" width="pill-lg" />
        <Skeleton shape="block" size="sm" width="25" />
      </div>
      <BoardColumnsSkeleton />
    </div>
  );
}

export const CLIENT_SKELETON_COLUMNS = [
  { header: "Member" },
  { header: "Matter", width: "wide" as const },
  { header: "Area", hideOnMobile: true },
  { header: "Stage" },
  { header: "Deadlines", hideOnMobile: true },
  { header: "Next call" },
];

/** Search bar and the members table (gate). */
export function LawyerClientsSkeleton() {
  return (
    <div className={clients.page}>
      <div className={clients.bar} aria-hidden="true">
        <Skeleton shape="block" size="sm" width="60" />
      </div>
      <SkeletonTable columns={CLIENT_SKELETON_COLUMNS} rows={6} />
    </div>
  );
}

/** Paid (large), pending, next payout, then the by-matter table. */
export function LawyerFinanceSkeleton() {
  return (
    <div className={finance.page}>
      <SkeletonStatStrip className={finance.tiles} small={2} />
      <div aria-hidden="true">
        <Skeleton shape="line" size="lg" width="25" />
        <SkeletonTable columns={[{ header: "Matter", width: "wide" }, { header: "Member", hideOnMobile: true }, { header: "Paid", align: "end" }, { header: "Pending", align: "end" }, { header: "Next payout", hideOnMobile: true }]} rows={4} />
      </div>
    </div>
  );
}

/** Weekly hours (seven day rows) beside days off, limits and specialties. */
export function LawyerAvailabilitySkeleton({ withIntro = false }: { withIntro?: boolean }) {
  // Mirrors AvailabilityView: week editor (switch | ranges | count per day)
  // beside days off, limits, specialty chips and calendar blocks.
  return (
    <div className={avail.page}>
      {withIntro && <IntroSkeleton screen="availability" flush />}
      <header className={avail.head} aria-hidden="true">
        <Skeleton shape="line" size="lg" width="40" />
        <Skeleton shape="line" size="sm" width="75" />
      </header>
      <div className={avail.cols} aria-hidden="true">
        <section className={avail.week}>
          <Skeleton shape="line" size="md" width="25" />
          <Skeleton shape="line" size="sm" width="40" />
          <div className={avail.skDays}>
            {[0, 1, 2, 3, 4, 5, 6].map((d) => (
              <div key={d} className={avail.skDay}>
                <div className={avail.skSwitch}>
                  <Skeleton shape="pill" width="pill-sm" />
                  <Skeleton shape="line" size="md" width="60" />
                </div>
                <Skeleton shape="block" size="sm" width={d > 4 ? "40" : "75"} />
                {d > 4 ? <span /> : <Skeleton shape="line" size="sm" width="75" />}
              </div>
            ))}
          </div>
        </section>
        <div className={avail.side}>
          <section className={avail.block}>
            <Skeleton shape="line" size="md" width="40" />
            <Skeleton shape="block" size="sm" width="75" />
            <div className={avail.skChips}>
              <Skeleton shape="pill" width="pill" />
              <Skeleton shape="pill" width="pill" />
            </div>
          </section>
          <section className={avail.block}>
            <Skeleton shape="line" size="md" width="25" />
            <SkeletonText lines={1} size="sm" />
            <Skeleton shape="block" size="sm" width="40" />
            <SkeletonText lines={1} size="sm" />
            <Skeleton shape="block" size="sm" width="40" />
          </section>
          <section className={avail.block}>
            <Skeleton shape="line" size="md" width="25" />
            <div className={avail.skChips}>
              {[0, 1, 2, 3, 4, 5].map((c) => (
                <Skeleton key={c} shape="pill" width="pill" />
              ))}
            </div>
          </section>
          <section className={avail.block}>
            <Skeleton shape="line" size="md" width="40" />
            <Skeleton shape="block" size="sm" />
          </section>
        </div>
      </div>
    </div>
  );
}

/** One call: the one-screen brief on the left, the call flow on the right. */
export function LawyerCallSkeleton() {
  return (
    <div className={call.page}>
      <div className={call.crumbs} aria-hidden="true">
        <Skeleton shape="line" size="sm" width="pill" />
      </div>
      <IntroSkeleton screen="call" collapsed />
      <div className={call.cols}>
        <div className={call.briefCol}>
          <SkeletonCard badge lines={2}>
            <SkeletonText lines={5} size="sm" />
          </SkeletonCard>
          <SkeletonCard lines={2} />
        </div>
        <div className={call.callCol}>
          <SkeletonCard badge lines={3} action />
        </div>
      </div>
    </div>
  );
}

/** BriefPanel: name and facts, the question, six profile cells, matters and dates, completeness. */
export function BriefPanelSkeleton() {
  return (
    <div className={brief.brief} aria-hidden="true">
      <div className={brief.head}>
        <div>
          <Skeleton shape="line" size="lg" width="pill-lg" />
          <Skeleton shape="line" size="sm" width="pill-lg" />
        </div>
      </div>
      <div className={brief.question}>
        <Skeleton shape="line" size="xs" width="25" />
        <SkeletonText lines={2} />
      </div>
      <div className={brief.grid}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={brief.cell}>
            <Skeleton shape="line" size="xs" width="40" />
            <Skeleton shape="line" size="md" width={i % 2 ? "60" : "75"} />
          </div>
        ))}
      </div>
      <div className={brief.split}>
        {[0, 1].map((c) => (
          <div key={c}>
            <Skeleton shape="line" size="md" width="40" />
            <div className={brief.items}>
              {[0, 1, 2].map((i) => (
                <div key={i} className={brief.item}>
                  <Skeleton shape="line" size="md" width={i % 2 ? "60" : "75"} />
                  <Skeleton shape="line" size="sm" width="40" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className={brief.foot}>
        <Skeleton shape="line" size="sm" width="40" />
        <Skeleton shape="pill" size="xs" width="100" />
      </div>
    </div>
  );
}

/** Inspector "Your calls": date, pills, the question and summary per call. */
export function InspectorCallsSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <ul className={insp.calls} aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className={insp.call}>
          <span className={insp.callHead}>
            <Skeleton shape="line" size="md" width="40" />
            <Skeleton shape="pill" size="sm" />
          </span>
          <Skeleton shape="line" size="sm" width="75" />
          <Skeleton shape="line" size="sm" width="90" />
        </li>
      ))}
    </ul>
  );
}

/** Notes: the composer, then a few notes with author and time. */
export function NotesSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className={notes.notes} aria-hidden="true">
      <div className={notes.composer}>
        <Skeleton shape="block" size="md" />
        <Skeleton shape="line" size="sm" width="25" />
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={notes.note}>
          <div className={notes.noteMeta}>
            <Skeleton shape="line" size="sm" width="25" />
            <Skeleton shape="line" size="xs" width="15" />
          </div>
          <SkeletonText lines={i % 2 ? 1 : 2} size="sm" />
        </div>
      ))}
    </div>
  );
}

/** Fee quotes: title and status, fee lines, the footer with your fee. */
export function QuotesListSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <ul className={fq.list} aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className={fq.quote}>
          <div className={fq.qHead}>
            <Skeleton shape="line" size="md" width="40" />
            <Skeleton shape="pill" size="sm" />
          </div>
          <ul className={fq.qLines}>
            {[0, 1].map((l) => (
              <li key={l}>
                <Skeleton shape="line" size="sm" width="40" />
                <Skeleton shape="line" size="sm" width="15" />
              </li>
            ))}
          </ul>
          <div className={fq.qFoot}>
            <Skeleton shape="line" size="xs" width="25" />
            <Skeleton shape="line" size="sm" width="25" />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Deadline editor: a category heading, then rows with title, description and a date field. */
export function DeadlinesSkeleton({ groups = [2, 2] }: { groups?: number[] }) {
  return (
    <div className={dl.wrap} aria-hidden="true">
      {groups.map((n, g) => (
        <section key={g} className={dl.group}>
          <Skeleton shape="line" size="md" width="25" />
          <ul className={dl.list}>
            {Array.from({ length: n }, (_, i) => (
              <li key={i} className={dl.row}>
                <div className={dl.rowHead}>
                  <Skeleton shape="line" size="md" width="60" />
                </div>
                <Skeleton shape="line" size="sm" width="90" />
                <div className={dl.rowControls}>
                  <Skeleton shape="line" size="sm" width="25" />
                  <Skeleton shape="block" size="sm" width="pill-lg" />
                  <Skeleton shape="block" size="sm" width="pill" />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** Gate: the skeleton of the lawyer page being opened. */
// Each route page renders its LawyerIntro above the view, so the route
// skeleton starts with the intro placeholder (the call and availability
// views place theirs inside the view skeleton).
export default function LawyerRouteSkeleton({ pathname }: { pathname: string }) {
  if (pathname.startsWith("/lawyer/board")) return <><IntroSkeleton screen="board" /><LawyerBoardSkeleton /></>;
  if (pathname.startsWith("/lawyer/clients")) return <><IntroSkeleton screen="clients" /><LawyerClientsSkeleton /></>;
  if (pathname.startsWith("/lawyer/finance")) return <><IntroSkeleton screen="finance" /><LawyerFinanceSkeleton /></>;
  if (pathname.startsWith("/lawyer/availability")) return <LawyerAvailabilitySkeleton withIntro />;
  if (pathname.startsWith("/lawyer/profile")) return <><IntroSkeleton screen="profile" /><ProfileSkeleton /></>;
  if (pathname.startsWith("/lawyer/calls/")) return <LawyerCallSkeleton />;
  return <><IntroSkeleton screen="today" /><LawyerTodaySkeleton /></>;
}
