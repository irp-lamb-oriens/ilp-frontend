"use client";

import { useMemo } from "react";
import type { JourneyPath } from "@/lib/contracts";
import { SkeletonTable, useSkeleton } from "@/components/ui";
import { ErrorText } from "../staff/PageHeader";
import { Bar } from "./charts";
import { getPaths } from "./journeysApi";
import { Panel, SampleNotice } from "./JourneysFrame";
import { count, pageName, pct, stepLabel } from "./model";
import { useJourneyData, useJourneyFilters } from "./useJourneys";
import s from "./journeys.module.scss";

/** Transitions whose `from` is the start of a visit. */
const ENTRY = new Set(["", "(entry)", "entry", "(start)", "start"]);

interface Flow extends JourneyPath {
  share: number;
}

/** Each transition with its share of everyone who left the same `from`. */
export function withShares(paths: JourneyPath[]): Flow[] {
  const out = new Map<string, number>();
  for (const p of paths) out.set(p.from, (out.get(p.from) ?? 0) + p.visitors);
  return paths.map((p) => ({ ...p, share: out.get(p.from) ? p.visitors / (out.get(p.from) ?? 1) : 0 })).sort((a, b) => b.visitors - a.visitors);
}

/**
 * Paths: where people go next. A ranked list of step-to-step and
 * page-to-page moves (a readable stand-in for a flow diagram), the pages
 * visits start on, and the pages visits end on.
 */
export default function PathsView() {
  const { query, queryKey } = useJourneyFilters();
  const paths = useJourneyData(() => getPaths(query), queryKey);
  const sk = useSkeleton(paths.loading && !paths.data);
  const steps = useMemo(() => withShares(paths.data?.steps ?? []).slice(0, 15), [paths.data]);
  const pages = useMemo(() => withShares((paths.data?.pages ?? []).filter((p) => !ENTRY.has(p.from))).slice(0, 15), [paths.data]);
  const entries = useMemo(() => {
    const e = (paths.data?.pages ?? []).filter((p) => ENTRY.has(p.from));
    const total = e.reduce((n, p) => n + p.visitors, 0);
    return e.map((p) => ({ path: p.to, count: p.visitors, share: total ? p.visitors / total : 0 })).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [paths.data]);
  const exits = useMemo(() => {
    const e = paths.data?.exits ?? [];
    const total = e.reduce((n, p) => n + p.count, 0);
    return [...e].map((p) => ({ ...p, share: total ? p.count / total : 0 })).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [paths.data]);

  if (paths.error && !paths.data) return <ErrorText onRetry={paths.retry}>The paths could not be loaded. {paths.error}</ErrorText>;
  if (sk.showSkeleton || !paths.data) return sk.skeletonVisible ? <PathsSkeleton /> : null;

  return (
    <div className={s.stack}>
      <SampleNotice show={paths.sample} />
      <Panel id="p-steps" title="Step to next step" sub="Where people went after each step, most common first. The share is out of everyone who moved on from the same step.">
        <FlowTable caption="Step to next step" rows={steps} name={stepLabel} empty="No step-to-step moves in this range." />
      </Panel>
      <Panel id="p-pages" title="Page to next page" sub="The most common moves between pages. Use it to see which pages send people to the free check.">
        <FlowTable caption="Page to next page" rows={pages} name={(p) => pageName(p)} empty="No page-to-page moves in this range." />
      </Panel>
      <div className={s.compare}>
        <Panel id="p-entry" title="Where visits start" sub="The first page of each visit.">
          <RankTable caption="Entry pages" rows={entries.map((e) => ({ key: e.path, label: pageName(e.path), count: e.count, share: e.share }))} unit="Visits" empty="The server has not sent entry pages for this range." />
        </Panel>
        <Panel id="p-exit" title="Where visits end" sub="The last page before the visitor left the site.">
          <RankTable caption="Exit pages" rows={exits.map((e) => ({ key: e.path, label: pageName(e.path), count: e.count, share: e.share }))} unit="Visits" empty="No visits ended in this range." />
        </Panel>
      </div>
    </div>
  );
}

function FlowTable({ caption, rows, name, empty }: { caption: string; rows: Flow[]; name: (id: string) => string; empty: string }) {
  if (!rows.length) return <p className={s.panelSub}>{empty}</p>;
  return (
    <div className={s.scroll}>
      <table className={s.table}>
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">From</th>
            <th scope="col">To</th>
            <th scope="col" className={s.barCell}>
              Share of From
            </th>
            <th scope="col" className={s.num}>
              People
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.from}>${r.to}`}>
              <td>{name(r.from)}</td>
              <td>{name(r.to)}</td>
              <td className={s.barCell}>
                <Bar value={r.share} />
              </td>
              <td className={s.num}>
                {count(r.visitors)} ({pct(r.share)})
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RankTable({ caption, rows, unit, empty }: { caption: string; rows: { key: string; label: string; count: number; share: number }[]; unit: string; empty: string }) {
  if (!rows.length) return <p className={s.panelSub}>{empty}</p>;
  return (
    <div className={s.scroll}>
      <table className={s.table}>
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Page</th>
            <th scope="col" className={s.barCell}>
              Share
            </th>
            <th scope="col" className={s.num}>
              {unit}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              <td>{r.label}</td>
              <td className={s.barCell}>
                <Bar value={r.share} />
              </td>
              <td className={s.num}>
                {count(r.count)} ({pct(r.share)})
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PathsSkeleton() {
  return (
    <div className={s.stack} aria-hidden="true">
      <SkeletonTable columns={[{ header: "From" }, { header: "To" }, { header: "Share of From", width: "wide" }, { header: "People", align: "end" }]} rows={8} />
      <SkeletonTable columns={[{ header: "From" }, { header: "To" }, { header: "Share of From", width: "wide" }, { header: "People", align: "end" }]} rows={6} />
    </div>
  );
}
