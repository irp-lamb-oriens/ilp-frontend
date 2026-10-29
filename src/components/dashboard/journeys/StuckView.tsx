"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FUNNEL_STEPS, type JourneyStuck, type StuckPerson, COUNTRIES } from "@/lib/contracts";
import { useStreamedList } from "@/lib/useStreamedList";
import { AgingBadge, Button, DataTable, ListFooter, SearchInput, Select, SkeletonTable, StatusPill, Toast, type Column, useSkeleton } from "@/components/ui";
import { ErrorText } from "../staff/PageHeader";
import { createStuckTask, getStuck, stuckPeopleSource } from "./journeysApi";
import { Panel, SampleNotice } from "./JourneysFrame";
import { count, formatMs, pageName, stepLabel, targetName } from "./model";
import { useJourneyData, useJourneyFilters } from "./useJourneys";
import s from "./journeys.module.scss";

const DAY_OPTIONS = [
  { value: "", label: "Any time" },
  { value: "3", label: "3 days or more" },
  { value: "7", label: "7 days or more" },
  { value: "14", label: "14 days or more" },
  { value: "30", label: "30 days or more" },
];

/**
 * Stuck: for each step, how many people stopped there, how long they spent
 * before leaving, where they left from and which form fields failed. Below,
 * the people (leads and members) who are stuck now, with a follow-up task
 * one click away.
 */
export default function StuckView() {
  const { filters, query, queryKey } = useJourneyFilters();
  const stuck = useJourneyData(() => getStuck(query), queryKey);
  const sk = useSkeleton(stuck.loading && !stuck.data);
  const steps = (stuck.data?.steps ?? []) as JourneyStuck[];

  if (stuck.error && !stuck.data) return <ErrorText onRetry={stuck.retry}>The stuck report could not be loaded. {stuck.error}</ErrorText>;

  return (
    <div className={s.stack}>
      <SampleNotice show={stuck.sample} />
      <Panel id="s-steps" title="Where people stop" sub="Stuck means they reached the step and not the next one in these dates. Time at step is the median time they spent there before leaving or moving on.">
        {sk.showSkeleton || !stuck.data ? (
          sk.skeletonVisible ? <SkeletonTable columns={[{ header: "Step", width: "wide" }, { header: "Stuck", align: "end" }, { header: "Time at step", align: "end" }, { header: "Left from" }, { header: "Form errors" }]} rows={8} /> : null
        ) : (
          <StepTable steps={steps} />
        )}
      </Panel>
      <StuckPeople source={filters.source} country={filters.country} />
    </div>
  );
}

function StepTable({ steps }: { steps: JourneyStuck[] }) {
  const rows = steps.filter((x) => x.stuckCount > 0);
  if (!rows.length) return <p className={s.panelSub}>Nobody is stuck at any step in this range.</p>;
  return (
    <div className={s.scroll}>
      <table className={s.table}>
        <caption>Stuck people by step</caption>
        <thead>
          <tr>
            <th scope="col">Step</th>
            <th scope="col" className={s.num}>Stuck</th>
            <th scope="col" className={s.num}>Time at step</th>
            <th scope="col">Left from</th>
            <th scope="col" className={s.hideMd}>Form errors</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.step}>
              <td className={s.stepCell}>{r.label}</td>
              <td className={s.num}>{count(r.stuckCount)}</td>
              <td className={s.num}>{formatMs(r.medianDwellMs)}</td>
              <td>{r.topExitPaths.length ? r.topExitPaths.slice(0, 2).map((p) => `${pageName(p.path)} (${count(p.count)})`).join(", ") : "None recorded"}</td>
              <td className={s.hideMd}>{r.topFormErrors.length ? r.topFormErrors.slice(0, 3).map((e) => `${targetName(e.target)} (${count(e.count)})`).join(", ") : "None"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StuckPeople({ source, country }: { source?: string; country?: string }) {
  const [step, setStep] = useState("");
  const [days, setDays] = useState("7");
  const [toast, setToast] = useState<{ message: string; tone: "success" | "danger" } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const filters = useMemo(() => ({ step, days, source: source ?? "", country: country ?? "" }), [step, days, source, country]);
  const list = useStreamedList<StuckPerson>(stuckPeopleSource, { key: "journeys-stuck-people", pageSize: 25, filters, sort: { key: "days", dir: "desc" }, keyOf: (r) => r.id });
  const { setFilters } = list;
  useEffect(() => setFilters(filters), [filters, setFilters]);

  async function followUp(p: StuckPerson) {
    setBusy(p.id);
    try {
      const r = await createStuckTask(p.id);
      list.update((items) => items.map((x) => (x.id === p.id ? { ...x, openTaskId: r.taskId } : x)));
      setToast({ tone: "success", message: `Follow-up task created for ${p.name ?? "this person"}. It is due in 24 hours.` });
    } catch (e) {
      setToast({ tone: "danger", message: e instanceof Error ? `The task was not created: ${e.message}` : "The task was not created. Try again." });
    } finally {
      setBusy(null);
    }
  }

  const columns = useMemo<Column<StuckPerson>[]>(
    () => [
      {
        key: "name",
        header: "Person",
        width: "wide",
        render: (r) => (
          <span className={s.who}>
            {r.clientId ? <Link href={`/dashboard/members/${encodeURIComponent(r.clientId)}`}>{r.name ?? "Member"}</Link> : <span>{r.name ?? "Lead without a name"}</span>}
            <span className={s.whoSub}>{r.clientId ? "Member" : "Lead"}{r.placeholder ? ", sample" : ""}</span>
          </span>
        ),
      },
      { key: "step", header: "Stuck at", render: (r) => stepLabel(r.step) },
      { key: "days", header: "Days stuck", render: (r) => <AgingBadge days={r.daysStuck} warnAfterDays={3} overdueAfterDays={7} /> },
      { key: "source", header: "Source", render: (r) => (r.source === "outbound" ? "Outbound" : "Inbound"), hideOnMobile: true },
      { key: "country", header: "Country", render: (r) => (r.country ? COUNTRIES[r.country].name : "Unknown"), hideOnMobile: true },
      { key: "csm", header: "CSM", render: (r) => r.csmEmail?.split("@")[0] ?? "Unassigned", hideOnMobile: true },
      {
        key: "action",
        header: "Follow-up",
        render: (r) =>
          r.openTaskId ? (
            <StatusPill size="sm" tone="success" label="Task open" />
          ) : (
            <Button size="sm" variant="secondary" busy={busy === r.id} onClick={() => void followUp(r)} aria-label={`Create follow-up task for ${r.name ?? "this person"}`}>
              Create follow-up task
            </Button>
          ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [busy],
  );

  return (
    <section aria-labelledby="s-people" data-tour="staff-journeys-stuck">
      <h2 className={s.panelHead} id="s-people">Who is stuck now</h2>
      <p className={s.panelSub}>Leads and members who have not moved past a step, longest first. A follow-up task goes to their CSM, or to you when they have none.</p>
      <div className={s.peopleTools}>
        <SearchInput label="Search" placeholder="Name, CSM or country" value={list.query} onValueChange={list.setQuery} />
        <Select label="Stuck at" value={step} onChange={(e) => setStep(e.target.value)} options={[{ value: "", label: "Any step" }, ...FUNNEL_STEPS.map((x) => ({ value: x.id, label: x.label }))]} />
        <Select label="For" value={days} onChange={(e) => setDays(e.target.value)} options={DAY_OPTIONS} />
      </div>
      <DataTable
        caption="People who are stuck"
        columns={columns}
        rows={list.items}
        rowKey={(r) => r.id}
        loading={list.initialLoading}
        loadingMore={list.loadingMore}
        stale={list.stale}
        skeletonRows={6}
        empty={list.activeQuery || step ? "Nobody matches these filters." : "Nobody is stuck for this long."}
      />
      <ListFooter list={list} audience="staff" />
      <Toast message={toast?.message ?? null} tone={toast?.tone} onDismiss={() => setToast(null)} />
    </section>
  );
}
