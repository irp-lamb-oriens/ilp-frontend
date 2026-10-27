"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { staffApi } from "@/lib/api";
import type { CsmTask } from "@/lib/contracts";
import { AgingBadge, Checkbox, EmptyState, Loadable, Skeleton, Stagger, StaggerItem, StatTile, StatusPill } from "@/components/ui";
import CountUp from "@/components/motion/CountUp";
import { PageHeader, ErrorText } from "../staff/PageHeader";
import { useStaff } from "../staff/StaffSession";
import { dueLabel, pct, shortDate, TASK_TYPE_LABEL, TASK_TYPE_TONE, usd } from "../staff/format";
import type { AttentionItem, QueueResponse, QueueTask, StaffSummary } from "../staff/types";
import { TaskDrawer } from "./TaskDrawer";
import { QueueSkeleton, RailSkeleton, TodayKpisSkeleton } from "./TodaySkeleton";
import s from "./today.module.scss";

const usdFmt = (v: number) => usd(Math.round(v));
const pctFmt = (v: number) => pct(Math.round(v * 10) / 10);

type Scope = "me" | "all";

/** Per-viewer convenience: remember the "Exclude placeholder data" choice. */
const EXCLUDE_KEY = "ilp_staff_exclude_placeholder";
function readExclude(): boolean {
  try {
    return window.localStorage.getItem(EXCLUDE_KEY) === "1";
  } catch {
    return false;
  }
}
function writeExclude(v: boolean): void {
  try {
    window.localStorage.setItem(EXCLUDE_KEY, v ? "1" : "0");
  } catch {
    // storage blocked: the choice lasts for this page only
  }
}

/**
 * Staff Today: "what needs me today?". KPI strip on top (MRR large), a wide
 * queue of my CSM tasks by due date, and a narrow Needs-attention rail.
 */
export default function TodayView() {
  const staff = useStaff();
  const [scope, setScope] = useState<Scope>("me");
  const [summary, setSummary] = useState<StaffSummary | null>(null);
  const [queue, setQueue] = useState<QueueResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<QueueTask | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // Read once on mount (the toggle only renders after the summary loads, so no hydration mismatch).
  const [exclude, setExclude] = useState(readExclude);

  const loadSummary = useCallback(() => {
    staffApi
      .get<StaffSummary>("/api/dashboard/staff/summary", { query: exclude ? { excludePlaceholder: "1" } : {} })
      .then(setSummary)
      .catch((e) => setError(e instanceof Error ? e.message : "Today could not be loaded."));
  }, [exclude]);

  const loadQueue = useCallback((sc: Scope) => {
    staffApi
      .get<QueueResponse>("/api/dashboard/staff/queue", { query: exclude ? { owner: sc, excludePlaceholder: "1" } : { owner: sc } })
      .then(setQueue)
      .catch((e) => setError(e instanceof Error ? e.message : "Your queue could not be loaded."));
  }, [exclude]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    loadQueue(scope);
  }, [scope, loadQueue]);

  function toggleExclude(v: boolean) {
    setExclude(v);
    writeExclude(v);
  }

  function onClosed(t: CsmTask) {
    setQueue((q) => (q ? { ...q, tasks: q.tasks.filter((x) => x.id !== t.id), counts: { ...q.counts, open: q.counts.open - 1 } } : q));
    setNotice(`Closed: ${t.title}`);
    setOpen(null);
    loadSummary();
  }

  const k = summary?.kpis;
  const tasks = queue?.tasks ?? [];
  const overdue = tasks.filter((t) => t.overdue).length;

  return (
    <>
      <PageHeader
        title="Today"
        sub={
          queue ? (
            tasks.length === 0 ? (
              "Your queue is clear."
            ) : (
              `${tasks.length} open task${tasks.length === 1 ? "" : "s"}${overdue ? `, ${overdue} overdue` : ""}.`
            )
          ) : (
            <Skeleton shape="line" size="sm" width="25" />
          )
        }
      />
      {error && (
        <StaggerItem>
          <ErrorText>{error}</ErrorText>
        </StaggerItem>
      )}
      {summary?.placeholder && summary.placeholder.members > 0 && (
        <section className={s.placeholderBar} aria-label="Placeholder data">
          <p className={s.placeholderText}>
            <StatusPill size="sm" label="Placeholder" tone="warning" /> Placeholder data is loaded ({summary.placeholder.members} members). Run{" "}
            <code>scripts/removePlaceholders.ts</code> to clear it.
          </p>
          <Checkbox label="Exclude placeholder data" checked={exclude} onChange={(e) => toggleExclude(e.target.checked)} />
        </section>
      )}

      <Loadable loading={!summary && !error} label="Loading key figures" skeleton={<TodayKpisSkeleton />}>
        {() => (
          <Stagger>
            <section className={s.kpis} aria-label="Key figures">
              <StaggerItem index={0}>
                <StatTile
                  size="lg"
                  label="Monthly recurring revenue"
                  value={k ? <CountUp value={k.mrr.cents} formatter={usdFmt} /> : "—"}
                  delta={k && k.mrr.deltaCents24h !== 0 ? `${k.mrr.deltaCents24h > 0 ? "+" : "−"}${usd(Math.abs(k.mrr.deltaCents24h))} since yesterday` : undefined}
                  trend={k ? (k.mrr.deltaCents24h > 0 ? "up" : k.mrr.deltaCents24h < 0 ? "down" : "flat") : "flat"}
                  hint={k ? `${k.mrr.activeMembers} active member${k.mrr.activeMembers === 1 ? "" : "s"} × US$79.99` : undefined}
                />
              </StaggerItem>
              <StaggerItem index={1}>
                <StatTile
                  label="Month-3 retention"
                  value={k && k.retentionM3.pct != null ? <CountUp value={k.retentionM3.pct} formatter={pctFmt} /> : "—"}
                  hint={k ? (k.retentionM3.cohort ? `${k.retentionM3.retained} of ${k.retentionM3.cohort} · target 80%` : "No 90-day cohort yet") : undefined}
                />
              </StaggerItem>
              <StaggerItem index={2}>
                <StatTile
                  label="Consultation-ready"
                  value={k && k.consultationReady.pct != null ? <CountUp value={k.consultationReady.pct} formatter={pctFmt} /> : "—"}
                  hint={k ? `${k.consultationReady.ready} of ${k.consultationReady.active} active members` : undefined}
                />
              </StaggerItem>
              <StaggerItem index={3}>
                <StatTile
                  label="Handoffs confirmed in 24 h"
                  value={k && k.handoffSla.pct != null ? <CountUp value={k.handoffSla.pct} formatter={pctFmt} /> : "—"}
                  hint={k ? `${k.handoffSla.within24h} of ${k.handoffSla.total} · target 100%` : undefined}
                />
              </StaggerItem>
              <StaggerItem index={4}>
                <StatTile
                  label="Overdue open tasks"
                  value={k ? <CountUp value={k.overdueTasks.total} /> : "—"}
                  upIsGood={false}
                  hint={k ? `${k.overdueTasks.mine} yours` : undefined}
                />
              </StaggerItem>
            </section>
            {k && (
              <StaggerItem as="p" index={5} className={s.gmv}>
                Legal fees (GMV) accepted in the last 30 days: <strong>{usd(k.legalGmv30d.cents, true)}</strong> across {k.legalGmv30d.quotes} quote
                {k.legalGmv30d.quotes === 1 ? "" : "s"}. Reported apart from membership revenue.
              </StaggerItem>
            )}
          </Stagger>
        )}
      </Loadable>

      <div className={s.grid}>
        <section className={s.queue} aria-labelledby="queue-title">
          <div className={s.queueHead}>
            <h2 id="queue-title" className={s.h2}>
              {scope === "me" ? "My queue" : "Team queue"}
            </h2>
            {staff.role !== "csm" || scope === "all" ? (
              <div className={s.toggle} role="group" aria-label="Whose tasks">
                <button type="button" className={s.toggleBtn} aria-pressed={scope === "me"} onClick={() => setScope("me")}>
                  Mine
                </button>
                <button type="button" className={s.toggleBtn} aria-pressed={scope === "all"} onClick={() => setScope("all")}>
                  Everyone
                </button>
              </div>
            ) : (
              <button type="button" className={s.linkBtn} onClick={() => setScope("all")}>
                Show the team queue
              </button>
            )}
          </div>
          {notice && (
            <p className={s.notice} role="status">
              {notice}
            </p>
          )}
          <Loadable loading={!queue && !error} label="Loading your tasks" skeleton={<QueueSkeleton />}>
            {queue && tasks.length === 0 && (
              <StaggerItem>
                <EmptyState
                  title="Nothing in your queue"
                  body="New tasks appear here when a member joins, books a call, gets a handoff, or a document or quote goes quiet."
                />
              </StaggerItem>
            )}
            {tasks.length > 0 && (
              <Stagger>
                <ul className={s.taskList}>
                  {tasks.map((t, i) => {
                    const due = dueLabel(t.dueAt);
                    return (
                      <StaggerItem as="li" index={i} key={t.id}>
                        <button type="button" className={s.task} onClick={() => setOpen(t)} aria-haspopup="dialog">
                          <span className={s.taskType}>
                            <StatusPill size="sm" label={TASK_TYPE_LABEL[t.type]} tone={TASK_TYPE_TONE[t.type]} />
                          </span>
                          <span className={s.taskMain}>
                            <span className={s.taskTitle}>
                              {t.title}
                              {t.placeholder && (
                                <>
                                  {" "}
                                  <StatusPill size="sm" label="Placeholder" tone="neutral" />
                                </>
                              )}
                            </span>
                            <span className={s.taskMember}>
                              {t.memberName ?? t.clientId}
                              {scope === "all" && t.ownerEmail ? ` · ${t.ownerEmail}` : ""}
                            </span>
                          </span>
                          <span className={s.taskDue}>
                            <StatusPill size="sm" label={due.text} tone={due.tone} srPrefix="Due" />
                          </span>
                        </button>
                      </StaggerItem>
                    );
                  })}
                </ul>
              </Stagger>
            )}
          </Loadable>
        </section>

        <aside className={s.rail} aria-label="Needs attention">
          <h2 className={s.h2}>Needs attention</h2>
          <Loadable loading={!summary && !error} label="Loading items that need attention" skeleton={<RailSkeleton />}>
            {() =>
              summary && (
                <Stagger>
                  <div className={s.railGroups}>
                    <StaggerItem index={0}>
                      <RailGroup
                        title="Overdue matters"
                        items={summary.attention.overdueMatters}
                        badge={(i) => <AgingBadge days={i.days} />}
                        empty="No matter is past its next step or 14 days in stage."
                      />
                    </StaggerItem>
                    <StaggerItem index={1}>
                      <RailGroup
                        title="Obligations due in 14 days"
                        items={summary.attention.obligationsDue}
                        badge={(i) => <StatusPill size="sm" tone={i.days < 0 ? "danger" : "warning"} label={i.days < 0 ? `${-i.days} days late` : `Due ${shortDate(i.at)}`} />}
                        empty="Nothing due in the next 14 days."
                      />
                    </StaggerItem>
                    <StaggerItem index={2}>
                      <RailGroup
                        title="Quotes unanswered 5+ days"
                        items={summary.attention.quotesUnanswered}
                        badge={(i) => <StatusPill size="sm" tone="warning" label={`${i.days} days`} />}
                        empty="Every sent quote has an answer or is under 5 days old."
                      />
                    </StaggerItem>
                    <StaggerItem index={3}>
                      <RailGroup
                        title="Not consultation-ready after 7 days"
                        items={summary.attention.notReady}
                        badge={(i) => <StatusPill size="sm" tone="warning" label={`Day ${i.days}`} />}
                        empty="Every member past day 7 is consultation-ready."
                      />
                    </StaggerItem>
                    <StaggerItem index={4}>
                      <RailGroup
                        title="No lawyer assigned"
                        items={summary.attention.unassigned}
                        badge={(i) => <StatusPill size="sm" label={`${i.days} days`} />}
                        empty="Every member has a lawyer."
                      />
                    </StaggerItem>
                  </div>
                </Stagger>
              )
            }
          </Loadable>
        </aside>
      </div>

      <TaskDrawer task={open} onClose={() => setOpen(null)} onClosed={onClosed} onChanged={() => { loadSummary(); loadQueue(scope); }} />
    </>
  );
}

function RailGroup({
  title,
  items,
  badge,
  empty,
}: {
  title: string;
  items: AttentionItem[];
  badge: (i: AttentionItem) => React.ReactNode;
  empty: string;
}) {
  const [all, setAll] = useState(false);
  const shown = all ? items : items.slice(0, 4);
  return (
    <section className={s.railGroup} aria-label={title}>
      <h3 className={s.h3}>
        {title} <span className={s.count}>{items.length}</span>
      </h3>
      {items.length === 0 ? (
        <p className={s.railEmpty}>{empty}</p>
      ) : (
        <ul className={s.railList}>
          {shown.map((i) => (
            <li key={i.id}>
              <Link className={s.railItem} href={`/dashboard/members/${encodeURIComponent(i.clientId)}`}>
                <span className={s.railText}>
                  <span className={s.railName}>{i.memberName}</span>
                  <span className={s.railTitle}>{i.title}</span>
                </span>
                {badge(i)}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {items.length > 4 && (
        <button type="button" className={s.linkBtn} onClick={() => setAll((v) => !v)}>
          {all ? "Show fewer" : `Show all ${items.length}`}
        </button>
      )}
    </section>
  );
}
