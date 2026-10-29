"use client";

import Link from "next/link";
import { useState } from "react";
import type { CsmTask } from "@/lib/contracts";
import { withScope, type QueueItem, type TodayResponse } from "@/lib/csm";
import { EmptyState, Notice, SkeletonRegion, Stagger, StaggerItem, StatTile, StatusPill } from "@/components/ui";
import { ErrorText, PageHeader } from "../dashboard/staff/PageHeader";
import { dueLabel, shortDate, TASK_TYPE_LABEL, TASK_TYPE_TONE } from "../dashboard/staff/format";
import { TaskDrawer } from "../dashboard/today/TaskDrawer";
import { useCsm } from "./CsmFrame";
import { HealthPill } from "./HealthPill";
import { TodaySkeleton } from "./CsmSkeletons";
import { useCsmData } from "./useCsmData";
import s from "./csm.module.scss";

/** CSM Today: "which of my members need me today, and what do I do next". */
export default function CsmToday() {
  const csm = useCsm();
  const { data, error, reload, showSkeleton, skeletonVisible } = useCsmData<TodayResponse>("/api/csm/today");
  const [open, setOpen] = useState<QueueItem | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const href = (clientId: string) => withScope(`/csm/book/${encodeURIComponent(clientId)}`, csm.scope);

  if (error) return <ErrorText onRetry={reload}>{error}</ErrorText>;
  if (showSkeleton || !data) {
    return (
      <SkeletonRegion label="Loading your day" visible={skeletonVisible}>
        <TodaySkeleton />
      </SkeletonRegion>
    );
  }
  const c = data.counts;
  const whose = csm.viewingOther ? `${csm.csm}'s` : "Your";

  function onClosed(t: CsmTask) {
    setNotice(`Closed: ${t.title}`);
    setOpen(null);
    reload();
  }

  return (
    <Stagger>
      <PageHeader
        title="Today"
        sub={c.overdue + c.dueToday === 0 ? `${whose} queue has nothing late or due today.` : `${c.overdue} late and ${c.dueToday} due today in ${whose.toLowerCase()} queue.`}
      />
      <section className={s.counts} aria-label="Your day in numbers" data-tour="csm-counts">
        <StaggerItem index={0}>
          <StatTile size="lg" label="Late tasks" value={c.overdue} upIsGood={false} hint={c.overdue ? "Start with these" : "Nothing late"} />
        </StaggerItem>
        <StaggerItem index={1}>
          <StatTile label="Due today" value={c.dueToday} hint={`${c.later} later this week or after`} />
        </StaggerItem>
        <StaggerItem index={2}>
          <StatTile label="New members, 7 days" value={c.newMembers} hint={`${c.firstContactsDue} still waiting for a first contact`} />
        </StaggerItem>
        <StaggerItem index={3}>
          <StatTile label="At risk" value={c.atRisk} upIsGood={false} hint="Health score under 50" />
        </StaggerItem>
      </section>

      {notice && <Notice tone="success" variant="inline" title={notice} />}

      <div className={s.split}>
        <section className={s.block} aria-labelledby="csm-queue" data-tour="csm-queue">
          <h2 id="csm-queue" className={s.h2}>Your tasks</h2>
          <p className={s.lede}>Late tasks first, then by due time. Click a task to see the member and close it with what happened.</p>
          {data.queue.length === 0 ? (
            <EmptyState title="No open tasks" body="Tasks appear when a member joins, books or misses a call, gets a handoff, a payment fails or a quote goes quiet." />
          ) : (
            <ul className={s.rows}>
              {data.queue.map((t, i) => {
                const due = dueLabel(t.dueAt);
                return (
                  <StaggerItem as="li" index={i} key={t.id}>
                    <button type="button" className={s.rowButton} onClick={() => setOpen(t)} aria-haspopup="dialog">
                      <span className={s.rowLead}>
                        <StatusPill size="sm" label={TASK_TYPE_LABEL[t.type]} tone={TASK_TYPE_TONE[t.type]} />
                      </span>
                      <span className={s.rowMain}>
                        <span className={s.rowTitle}>
                          {t.title}
                          {t.placeholder && (
                            <>
                              {" "}
                              <StatusPill size="sm" label="Placeholder" tone="neutral" />
                            </>
                          )}
                        </span>
                        <span className={s.rowSub}>{t.memberName}</span>
                        {t.health && <HealthPill health={t.health} />}
                      </span>
                      <span className={s.rowTrail}>
                        <StatusPill size="sm" label={due.text} tone={due.tone} srPrefix="Due" />
                      </span>
                    </button>
                  </StaggerItem>
                );
              })}
            </ul>
          )}
        </section>

        <aside className={s.rail} aria-label="Members who need you">
          <section aria-labelledby="csm-new" data-tour="csm-new">
            <h2 id="csm-new" className={s.h2}>New members</h2>
            <p className={s.lede}>Joined in the last 7 days. First contact is due within one business day.</p>
            {data.newMembers.length === 0 ? (
              <p className={s.meta}>No new members this week.</p>
            ) : (
              <ul className={s.plainList}>
                {data.newMembers.map((m) => (
                  <li key={m.clientId}>
                    <Link className={s.railItem} href={href(m.clientId)}>
                      <span className={s.rowTitle}>{m.name}</span>
                      <span className={s.rowSub}>Joined {shortDate(m.activatedAt)}</span>
                      {m.lastContactAt ? (
                        <StatusPill size="sm" label="Contacted" tone="success" />
                      ) : (
                        <StatusPill size="sm" label={m.firstContactOverdue ? "First contact late" : `First contact by ${shortDate(m.firstContactDueAt)}`} tone={m.firstContactOverdue ? "danger" : "warning"} />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section aria-labelledby="csm-risk" data-tour="csm-risk">
            <h2 id="csm-risk" className={s.h2}>At risk</h2>
            <p className={s.lede}>Lowest health first. The pill says why.</p>
            {data.atRisk.length === 0 ? (
              <p className={s.meta}>Nobody in your book is at risk today.</p>
            ) : (
              <ul className={s.plainList}>
                {data.atRisk.map((r) => (
                  <li key={r.clientId}>
                    <Link className={s.railItem} href={href(r.clientId)}>
                      <span className={s.rowTitle}>{r.name}</span>
                      <HealthPill health={r.health} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link className={s.more} href={withScope("/csm/risk", csm.scope)}>
              Open Renewals and risk
            </Link>
          </section>
        </aside>
      </div>

      <TaskDrawer task={open} onClose={() => setOpen(null)} onClosed={onClosed} onChanged={reload} />
    </Stagger>
  );
}
