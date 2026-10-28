"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState, IconArrowRight, IconCalendar, IconClock, Loadable, StatusPill, Stagger, StaggerItem, ErrorNotice } from "@/components/ui";
import { areaLabel, dayWindow, errorText, fmtShortDate, fmtTime, lawyerApi, type TodayItem } from "./lawyerApi";
import { useLawyer } from "./LawyerContext";
import { ConsentPill, SummaryPill } from "./pills";
import JoinCall from "./JoinCall";
import ApplicationStatus, { inReview } from "./ApplicationStatus";
import { CallsSkeleton, UpcomingSkeleton } from "./LawyerSkeletons";
import s from "./TodayView.module.scss";

/** Lawyer Today: the day's consultations in time order, each opening its brief. */
export default function TodayView() {
  const me = useLawyer();
  const [today, setToday] = useState<TodayItem[] | null>(null);
  const [upcoming, setUpcoming] = useState<TodayItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const day = dayWindow();
      const end = new Date(day.to);
      end.setDate(end.getDate() + 3);
      const [t, u] = await Promise.all([
        lawyerApi.today(day.from, day.to),
        lawyerApi.today(day.to, end.toISOString()),
      ]);
      setToday(t.items);
      setUpcoming(u.items);
    } catch (err) {
      setError(errorText(err, "Could not load today's calls."));
    }
  }

  useEffect(() => {
    load();
  }, []);

  const first = me.name?.split(" ")[0] ?? "";
  const nowIso = new Date().toISOString();
  const next = today?.find((c) => c.status !== "completed" && !c.handoffId && c.scheduledAt >= nowIso.slice(0, 10)) ?? null;
  const reviewing = inReview(me);
  const open = today?.filter((c) => c.status === "completed" && !c.handoffId).length ?? 0;

  return (
    <div className={s.page}>
      <section className={s.main} aria-labelledby="today-h" data-tour="lawyer-today-calls">
        <ApplicationStatus me={me} />
        <header className={s.head}>
          <h2 id="today-h" className={s.h}>
            {today === null ? "Today" : today.length === 0 ? `No calls today${first ? `, ${first}` : ""}` : `${today.length} ${today.length === 1 ? "call" : "calls"} today`}
          </h2>
          <p className={s.sub}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            {open > 0 ? ` · ${open} summary ${open === 1 ? "needs" : "need"} your confirmation` : ""}
          </p>
          <Link className={s.settingsLink} href="/lawyer/availability">
            <IconClock /> Your hours and availability
          </Link>
        </header>

        {error && (
          <StaggerItem>
            <ErrorNotice audience="lawyer" variant="block" title="Today did not load" onRetry={load}>{error}</ErrorNotice>
          </StaggerItem>
        )}

        <Loadable loading={today === null && !error} label="Loading today's calls" skeleton={<CallsSkeleton />}>
        {today && today.length === 0 && !error && (
          <StaggerItem>
          {reviewing ? (
            <EmptyState
              title="No calls yet"
              body="Members can book you once ILP approves your application. Your calls will appear here, in time order."
              action={<Link className={s.link} href="/lawyer/availability">Check your hours</Link>}
            />
          ) : (
            <EmptyState
              title="Nothing booked for today"
              body="Members book 20-minute calls from their portal. Your board has the matters waiting on you."
              action={<Link className={s.link} href="/lawyer/board">Open the board</Link>}
            />
          )}
          </StaggerItem>
        )}

        {today && today.length > 0 && (
          <Stagger>
          <ol className={s.list}>
            {today.map((c, i) => (
              <StaggerItem as="li" index={i} key={c.id} className={s.item} data-next={c.id === next?.id || undefined}>
                <Link href={`/lawyer/calls/${encodeURIComponent(c.id)}`} className={s.row}>
                  <span className={s.time}>
                    <span className={s.clock}>{fmtTime(c.scheduledAt)}</span>
                    <span className={s.len}>{c.durationMin} min</span>
                  </span>
                  <span className={s.body}>
                    <span className={s.name}>
                      {c.clientName}
                      {c.id === next?.id && <span className={s.nextTag}>Next</span>}
                    </span>
                    <span className={s.matter}>
                      {c.matterTitle ?? areaLabel(c.area)}
                      {typeof c.completeness === "number" && (
                        <span className={c.completeness < 70 ? s.profileLow : s.profile}> · Profile {c.completeness}%{c.completeness < 70 ? ", incomplete" : ""}</span>
                      )}
                    </span>
                    {c.question && <span className={s.q}>&ldquo;{c.question}&rdquo;</span>}
                  </span>
                  <span className={s.state}>
                    {c.handoffId ? (
                      <StatusPill label="Handed off" tone="success" size="sm" />
                    ) : (
                      <>
                        <ConsentPill state={c.consent.recording} />
                        <SummaryPill status={c.summaryStatus} />
                      </>
                    )}
                  </span>
                  <span className={s.open} aria-hidden="true">
                    Open brief <IconArrowRight />
                  </span>
                </Link>
                {!c.handoffId && (c.status === "booked" || c.status === "in_progress") && (
                  <div className={s.join}>
                    <JoinCall meetUrl={c.meetUrl} scheduledAt={c.scheduledAt} durationMin={c.durationMin} />
                  </div>
                )}
              </StaggerItem>
            ))}
          </ol>
          </Stagger>
        )}
        </Loadable>
      </section>

      <aside className={s.rail} aria-labelledby="upcoming-h">
        <h3 id="upcoming-h" className={s.railH}>
          <IconCalendar /> Next 3 days
        </h3>
        <Loadable loading={today === null && !error} label="Loading the next 3 days" skeleton={<UpcomingSkeleton />}>
        {upcoming.length === 0 ? (
          <StaggerItem as="p" className={s.railEmpty}>No calls booked in the next 3 days.</StaggerItem>
        ) : (
          <Stagger>
          <ul className={s.railList}>
            {upcoming.map((c, i) => (
              <StaggerItem as="li" index={i + 1} key={c.id}>
                <Link href={`/lawyer/calls/${encodeURIComponent(c.id)}`} className={s.railRow}>
                  <span className={s.railWhen}>{fmtShortDate(c.scheduledAt)} · {fmtTime(c.scheduledAt)}</span>
                  <span className={s.railName}>{c.clientName}</span>
                  <span className={s.railMatter}>{c.matterTitle ?? areaLabel(c.area)}</span>
                </Link>
              </StaggerItem>
            ))}
          </ul>
          </Stagger>
        )}
        </Loadable>
      </aside>
    </div>
  );
}
