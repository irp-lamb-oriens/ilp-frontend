"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
  STEP_LABEL,
  STEP_TONE,
  withScope,
  type CallsResponse,
  type DeadlineRow,
  type MessageRow,
  type OnboardingRow,
  type OpportunityRow,
  type QuoteRow,
  type RiskItem,
  type RiskResponse,
} from "@/lib/csm";
import { DataTable, EmptyState, SkeletonRegion, Stagger, StaggerItem, StatusPill, type Column } from "@/components/ui";
import { ErrorText, PageHeader } from "../dashboard/staff/PageHeader";
import { shortDate, usd } from "../dashboard/staff/format";
import { useCsm } from "./CsmFrame";
import { HealthPill } from "./HealthPill";
import { GroupsSkeleton, TableSkeleton } from "./CsmSkeletons";
import { useCsmData } from "./useCsmData";
import s from "./csm.module.scss";

const DT = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const when = (iso: string | null | undefined) => (iso && !Number.isNaN(Date.parse(iso)) ? DT.format(new Date(iso)) : "Not set");

function useHref() {
  const csm = useCsm();
  return (clientId: string) => withScope(`/csm/book/${encodeURIComponent(clientId)}`, csm.scope);
}

/** A titled group of member rows. */
function Group({ id, title, lede, items, empty, render }: { id: string; title: string; lede: string; items: RiskItem[]; empty: string; render?: (i: RiskItem) => ReactNode }) {
  const href = useHref();
  return (
    <section className={s.block} aria-labelledby={id}>
      <h2 id={id} className={s.h2}>
        {title} <span className={s.count}>{items.length}</span>
      </h2>
      <p className={s.lede}>{lede}</p>
      {items.length === 0 ? (
        <p className={s.meta}>{empty}</p>
      ) : (
        <ul className={s.rows}>
          {items.map((i, k) => (
            <StaggerItem as="li" index={k} key={`${id}:${i.clientId}:${i.at ?? k}`}>
              <Link className={s.rowLink} href={href(i.clientId)}>
                <span className={s.rowMain}>
                  <span className={s.rowTitle}>{i.name}</span>
                  <span className={s.rowSub}>{i.detail}</span>
                </span>
                <span className={s.rowTrail}>{render ? render(i) : <HealthPill health={i.health} reasons={false} />}</span>
              </Link>
            </StaggerItem>
          ))}
        </ul>
      )}
    </section>
  );
}

// ─── Onboarding ────────────────────────────────────────────────────────────

export function CsmOnboarding() {
  const href = useHref();
  const router = useRouter();
  const { data, error, reload, showSkeleton, skeletonVisible } = useCsmData<{ items: OnboardingRow[] }>("/api/csm/onboarding");
  if (error) return <ErrorText onRetry={reload}>{error}</ErrorText>;
  if (showSkeleton || !data) return <SkeletonRegion label="Loading onboarding" visible={skeletonVisible}><TableSkeleton /></SkeletonRegion>;
  const step = (label: string, st: { state: keyof typeof STEP_LABEL }, extra?: string) => (
    <span className={s.step}>
      <span className={s.stepName}>{label}</span>
      <StatusPill size="sm" label={extra ? `${STEP_LABEL[st.state]}, ${extra}` : STEP_LABEL[st.state]} tone={STEP_TONE[st.state]} />
    </span>
  );
  const columns: Column<OnboardingRow>[] = [
    { key: "name", header: "Member", width: "wide", render: (r) => <span className={s.who}><span className={s.rowTitle}>{r.name}</span><span className={s.rowSub}>Joined {shortDate(r.activatedAt)}, day {r.daysSinceJoin}</span></span> },
    { key: "contact", header: "First contact", render: (r) => step("First contact", r.firstContact, r.firstContact.state !== "done" && r.firstContact.dueAt ? `by ${shortDate(r.firstContact.dueAt)}` : undefined) },
    { key: "profile", header: "Profile", render: (r) => step("Profile", r.profile, `${Math.round(r.profile.completeness * 100)}%`) },
    { key: "booked", header: "First call booked", render: (r) => step("First call booked", r.callBooked) },
    { key: "done", header: "First call held", render: (r) => step("First call held", r.callDone) },
    { key: "health", header: "Health", hideOnMobile: true, render: (r) => <HealthPill health={r.health} reasons={false} /> },
  ];
  return (
    <>
      <PageHeader title="Onboarding" sub={`${data.items.length} member${data.items.length === 1 ? "" : "s"} in their first 45 days.`} />
      <DataTable
        caption="Onboarding"
        columns={columns}
        rows={data.items}
        rowKey={(r) => r.clientId}
        onRowActivate={(r) => router.push(href(r.clientId))}
        empty="Nobody joined in the last 45 days. New members appear here the day they pay."
      />
    </>
  );
}

// ─── Calls ─────────────────────────────────────────────────────────────────

export function CsmCalls() {
  const href = useHref();
  const { data, error, reload, showSkeleton, skeletonVisible } = useCsmData<CallsResponse>("/api/csm/calls");
  if (error) return <ErrorText onRetry={reload}>{error}</ErrorText>;
  if (showSkeleton || !data) return <SkeletonRegion label="Loading calls" visible={skeletonVisible}><GroupsSkeleton /></SkeletonRegion>;
  const lawyer = (id: string) => data.lawyers[id] ?? "Lawyer";
  return (
    <Stagger>
      <PageHeader title="Calls" sub={`${data.upcoming.length} in the next 14 days, ${data.wrapUp.length} to wrap up, ${data.noShows.length} missed.`} />
      <section className={s.block} aria-labelledby="calls-up" data-tour="csm-calls">
        <h2 id="calls-up" className={s.h2}>Coming up <span className={s.count}>{data.upcoming.length}</span></h2>
        <p className={s.lede}>Each call shows five checks. Fix what is missing before the call starts.</p>
        {data.upcoming.length === 0 ? (
          <EmptyState compact title="No calls in the next 14 days" body="Members with calls left may need a nudge: see My book, Calls used." />
        ) : (
          <ul className={s.rows}>
            {data.upcoming.map((c, i) => (
              <StaggerItem as="li" index={i} key={c.id}>
                <div className={s.callRow}>
                  <div className={s.rowMain}>
                    <Link className={s.rowTitleLink} href={href(c.clientId)}>{c.name}</Link>
                    <span className={s.rowSub}>{when(c.scheduledAt)} with {lawyer(c.providerId)}</span>
                  </div>
                  <StatusPill size="sm" label={c.ready ? "Ready" : "Not ready"} tone={c.ready ? "success" : "warning"} />
                  <ul className={s.checks} aria-label="Readiness checks">
                    {(c.checks ?? []).map((k) => (
                      <li key={k.code}>
                        <StatusPill size="sm" label={k.ok ? "OK" : "Fix"} tone={k.ok ? "success" : "warning"} />
                        <span>{k.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </StaggerItem>
            ))}
          </ul>
        )}
      </section>
      <section className={s.block} aria-labelledby="calls-wrap">
        <h2 id="calls-wrap" className={s.h2}>To wrap up <span className={s.count}>{data.wrapUp.length}</span></h2>
        <p className={s.lede}>Calls from the last 14 days without a confirmed summary or handoff. Ask the lawyer to confirm, then send the next steps.</p>
        {data.wrapUp.length === 0 ? (
          <p className={s.meta}>Every recent call has a confirmed summary and a handoff.</p>
        ) : (
          <ul className={s.rows}>
            {data.wrapUp.map((c) => (
              <li key={c.id}>
                <Link className={s.rowLink} href={href(c.clientId)}>
                  <span className={s.rowMain}>
                    <span className={s.rowTitle}>{c.name}</span>
                    <span className={s.rowSub}>{when(c.scheduledAt)} with {lawyer(c.providerId)}. {(c.missing ?? []).join(". ")}.</span>
                  </span>
                  <StatusPill size="sm" label="Needs wrap-up" tone="warning" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className={s.block} aria-labelledby="calls-miss">
        <h2 id="calls-miss" className={s.h2}>Missed calls <span className={s.count}>{data.noShows.length}</span></h2>
        <p className={s.lede}>Last 30 days. Send the Missed call playbook email the same day and offer a new time.</p>
        {data.noShows.length === 0 ? (
          <p className={s.meta}>No missed calls in the last 30 days.</p>
        ) : (
          <ul className={s.rows}>
            {data.noShows.map((c) => (
              <li key={c.id}>
                <Link className={s.rowLink} href={href(c.clientId)}>
                  <span className={s.rowMain}>
                    <span className={s.rowTitle}>{c.name}</span>
                    <span className={s.rowSub}>{when(c.scheduledAt)} with {lawyer(c.providerId)}</span>
                  </span>
                  <StatusPill size="sm" label={c.rebooked ? "Booked again" : "Not booked again"} tone={c.rebooked ? "success" : "danger"} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Stagger>
  );
}

// ─── Renewals and risk ─────────────────────────────────────────────────────

export function CsmRisk() {
  const { data, error, reload, showSkeleton, skeletonVisible } = useCsmData<RiskResponse>("/api/csm/risk");
  if (error) return <ErrorText onRetry={reload}>{error}</ErrorText>;
  if (showSkeleton || !data) return <SkeletonRegion label="Loading renewals and risk" visible={skeletonVisible}><GroupsSkeleton groups={5} /></SkeletonRegion>;
  const total = data.pastDue.length + data.cancelRequested.length + data.lowScores.length + data.inactive30d.length;
  return (
    <Stagger>
      <PageHeader title="Renewals and risk" sub={total ? `${total} member${total === 1 ? "" : "s"} to call, ${data.renewals7d.length} renewal${data.renewals7d.length === 1 ? "" : "s"} this week.` : `Nobody at risk. ${data.renewals7d.length} renewal${data.renewals7d.length === 1 ? "" : "s"} this week.`} />
      <div className={s.groups} data-tour="csm-risk-groups">
        <Group id="risk-pay" title="Payment failed" lede="Call the same day and send the payment playbook email." items={data.pastDue} empty="No failed payments." render={() => <StatusPill size="sm" label="Payment failed" tone="danger" />} />
        <Group id="risk-cancel" title="Asked to cancel" lede="Call before the period ends to understand why." items={data.cancelRequested} empty="No cancellation requests." render={() => <StatusPill size="sm" label="Cancel requested" tone="danger" />} />
        <Group id="risk-low" title="Low ratings, 30 days" lede="A call rated 2 or less, or a monthly score of 6 or less." items={data.lowScores} empty="No low ratings in the last 30 days." render={() => <StatusPill size="sm" label="Low rating" tone="warning" />} />
        <Group id="risk-quiet" title="Quiet for 30 days" lede="No call, message, upload or rating in 30 days." items={data.inactive30d} empty="Every member did something in the last 30 days." />
        <Group id="risk-renew" title="Renewing in 7 days" lede="Check they used their calls this period and offer one if not." items={data.renewals7d} empty="No renewals in the next 7 days." render={(i) => <StatusPill size="sm" label={i.detail} tone="info" />} />
      </div>
    </Stagger>
  );
}

// ─── Deadlines ─────────────────────────────────────────────────────────────

export function CsmDeadlines() {
  const href = useHref();
  const router = useRouter();
  const { data, error, reload, showSkeleton, skeletonVisible } = useCsmData<{ items: DeadlineRow[] }>("/api/csm/deadlines");
  if (error) return <ErrorText onRetry={reload}>{error}</ErrorText>;
  if (showSkeleton || !data) return <SkeletonRegion label="Loading deadlines" visible={skeletonVisible}><TableSkeleton /></SkeletonRegion>;
  const columns: Column<DeadlineRow>[] = [
    { key: "when", header: "Due", render: (r) => (r.daysLeft === null ? <StatusPill size="sm" label="Needs a date" tone="warning" /> : <StatusPill size="sm" label={r.daysLeft < 0 ? `${-r.daysLeft} days late` : r.daysLeft === 0 ? "Today" : `${shortDate(r.dueAt)}, in ${r.daysLeft} days`} tone={r.daysLeft < 0 ? "danger" : r.daysLeft <= 14 ? "warning" : "neutral"} />) },
    { key: "title", header: "Deadline", width: "wide", render: (r) => <span className={s.who}><span className={s.rowTitle}>{r.title}</span><span className={s.rowSub}>May require review by the member&apos;s lawyer</span></span> },
    { key: "name", header: "Member", render: (r) => r.name },
    { key: "status", header: "Status", hideOnMobile: true, render: (r) => <StatusPill size="sm" label={r.status === "asked" ? "Asked the lawyer" : "To do"} tone={r.status === "asked" ? "info" : "neutral"} /> },
  ];
  return (
    <>
      <PageHeader title="Deadlines" sub={`${data.items.length} in the next 60 days or still without a date.`} />
      <DataTable caption="Deadlines" columns={columns} rows={data.items} rowKey={(r) => r.id} onRowActivate={(r) => router.push(href(r.clientId))} empty="No deadlines in the next 60 days for your members." />
    </>
  );
}

// ─── Quotes and opportunities ──────────────────────────────────────────────

export function CsmQuotes() {
  const href = useHref();
  const router = useRouter();
  const { data, error, reload, showSkeleton, skeletonVisible } = useCsmData<{ quotes: QuoteRow[]; opportunities: OpportunityRow[] }>("/api/csm/quotes");
  if (error) return <ErrorText onRetry={reload}>{error}</ErrorText>;
  if (showSkeleton || !data) return <SkeletonRegion label="Loading quotes" visible={skeletonVisible}><TableSkeleton /></SkeletonRegion>;
  const qCols: Column<QuoteRow>[] = [
    { key: "name", header: "Member", render: (r) => r.name },
    { key: "title", header: "Quote", width: "wide", render: (r) => r.title },
    { key: "cents", header: "Amount", align: "end", render: (r) => usd(r.cents) },
    { key: "wait", header: "Waiting", render: (r) => <StatusPill size="sm" label={`${r.daysWaiting} day${r.daysWaiting === 1 ? "" : "s"}`} tone={r.daysWaiting >= 5 ? "warning" : "neutral"} /> },
  ];
  const oCols: Column<OpportunityRow>[] = [
    { key: "name", header: "Member", render: (r) => r.name },
    { key: "title", header: "Opportunity", width: "wide", render: (r) => <span className={s.who}><span className={s.rowTitle}>{r.title}</span><span className={s.rowSub}>{r.nextAction ? `Next: ${r.nextAction}` : "No next action set"}</span></span> },
    { key: "stage", header: "Stage", render: (r) => <StatusPill size="sm" label={r.stage[0].toUpperCase() + r.stage.slice(1)} /> },
    { key: "value", header: "Estimated fees", align: "end", hideOnMobile: true, render: (r) => (r.valueCents === null ? "Not set" : usd(r.valueCents, true)) },
    { key: "due", header: "Next action due", render: (r) => <StatusPill size="sm" label={r.nextActionDueAt ? shortDate(r.nextActionDueAt) : "No date"} tone={r.overdue ? "danger" : "neutral"} /> },
  ];
  return (
    <>
      <PageHeader title="Quotes and opportunities" sub={`${data.quotes.length} quote${data.quotes.length === 1 ? "" : "s"} waiting for an answer, ${data.opportunities.length} open opportunit${data.opportunities.length === 1 ? "y" : "ies"}.`} />
      <section className={s.block} aria-labelledby="q-quotes">
        <h2 id="q-quotes" className={s.h2}>Quotes waiting for the member</h2>
        <DataTable caption="Quotes waiting" columns={qCols} rows={data.quotes} rowKey={(r) => `${r.clientId}:${r.quoteId}`} onRowActivate={(r) => router.push(href(r.clientId))} empty="No quote is waiting for an answer." />
      </section>
      <section className={s.block} aria-labelledby="q-opps">
        <h2 id="q-opps" className={s.h2}>Open opportunities</h2>
        <DataTable caption="Open opportunities" columns={oCols} rows={data.opportunities} rowKey={(r) => r.id} onRowActivate={(r) => router.push(href(r.clientId))} empty="No open opportunities for your members." />
      </section>
    </>
  );
}

// ─── Messages ──────────────────────────────────────────────────────────────

export function CsmMessages() {
  const href = useHref();
  const { data, error, reload, showSkeleton, skeletonVisible } = useCsmData<{ items: MessageRow[] }>("/api/csm/messages");
  if (error) return <ErrorText onRetry={reload}>{error}</ErrorText>;
  if (showSkeleton || !data) return <SkeletonRegion label="Loading messages" visible={skeletonVisible}><GroupsSkeleton groups={1} /></SkeletonRegion>;
  const open = data.items.filter((m) => !m.answered).length;
  return (
    <Stagger>
      <PageHeader title="Messages" sub={open ? `${open} waiting for an answer.` : "Everything from the last 30 days has an answer."} />
      {data.items.length === 0 ? (
        <EmptyState title="Nothing from your members in 30 days" body="Messages members write to the team and documents they upload appear here." />
      ) : (
        <ul className={s.rows} data-tour="csm-messages">
          {data.items.map((m, i) => (
            <StaggerItem as="li" index={i} key={m.id}>
              <Link className={s.rowLink} href={href(m.clientId)}>
                <span className={s.rowLead}>
                  <StatusPill size="sm" label={m.kind === "upload" ? "Upload" : "Message"} tone="info" />
                </span>
                <span className={s.rowMain}>
                  <span className={s.rowTitle}>{m.name}</span>
                  <span className={s.rowSub}>{m.text.length > 180 ? `${m.text.slice(0, 177)}...` : m.text}</span>
                  <span className={s.meta}>{when(m.at)}</span>
                </span>
                <StatusPill size="sm" label={m.answered ? (m.kind === "upload" ? "Reviewed" : "Answered") : (m.kind === "upload" ? "Not reviewed" : "Not answered")} tone={m.answered ? "success" : "warning"} />
              </Link>
            </StaggerItem>
          ))}
        </ul>
      )}
    </Stagger>
  );
}
