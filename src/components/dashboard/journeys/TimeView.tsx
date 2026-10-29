"use client";

import { useMemo } from "react";
import type { PageTime } from "@/lib/contracts";
import { DataTable, SkeletonTable, type Column, useSkeleton } from "@/components/ui";
import { ErrorText } from "../staff/PageHeader";
import { Bar, RangeBar } from "./charts";
import { getPages } from "./journeysApi";
import { Panel, SampleNotice } from "./JourneysFrame";
import { count, formatMs, pageName, pct } from "./model";
import { useJourneyData, useJourneyFilters } from "./useJourneys";
import s from "./journeys.module.scss";

/**
 * Time: how long people spend on each page (active time only: the tab is
 * visible and the visitor used the page in the last 30 seconds) and how
 * often a page is the last one of a visit.
 */
export default function TimeView() {
  const { query, queryKey } = useJourneyFilters();
  const pages = useJourneyData(() => getPages(query), queryKey);
  const sk = useSkeleton(pages.loading && !pages.data);
  const rows = useMemo(() => pages.data?.pages ?? [], [pages.data]);
  const max = useMemo(() => Math.max(0, ...rows.map((r) => r.p75Ms ?? r.medianMs ?? 0)), [rows]);
  const top = useMemo(() => [...rows].sort((a, b) => b.views - a.views).slice(0, 10), [rows]);

  const columns = useMemo<Column<PageTime>[]>(
    () => [
      { key: "path", header: "Page", width: "wide", render: (r) => <span className={s.who}>{pageName(r.path)}<span className={s.whoSub}>{r.path}</span></span>, sortValue: (r) => r.path },
      { key: "views", header: "Views", align: "end", render: (r) => count(r.views), sortValue: (r) => r.views },
      { key: "median", header: "Median time", align: "end", render: (r) => formatMs(r.medianMs), sortValue: (r) => r.medianMs ?? -1 },
      { key: "p75", header: "Slowest quarter from", align: "end", render: (r) => formatMs(r.p75Ms), sortValue: (r) => r.p75Ms ?? -1, hideOnMobile: true },
      {
        key: "exit",
        header: "Exit rate",
        align: "end",
        render: (r) => pct(r.exitRate),
        sortValue: (r) => r.exitRate,
      },
    ],
    [],
  );

  if (pages.error && !pages.data) return <ErrorText onRetry={pages.retry}>Time on page could not be loaded. {pages.error}</ErrorText>;
  if (sk.showSkeleton || !pages.data) return sk.skeletonVisible ? <SkeletonTable columns={[{ header: "Page", width: "wide" }, { header: "Views", align: "end" }, { header: "Median time", align: "end" }, { header: "Exit rate", align: "end" }]} rows={8} /> : null;

  return (
    <div className={s.stack}>
      <SampleNotice show={pages.sample} />
      <Panel id="t-dist" title="Time on the busiest pages" sub="Dark bar: median time, so half of visits were shorter. Light bar: up to the 75th percentile, so a quarter of visits were longer still. Exit rate is the share of views that ended the visit.">
        {top.length ? (
          <div className={s.scroll}>
            <ul className={s.legend} aria-hidden="true">
              <li className={s.key}>
                <svg className={s.keySwatch} viewBox="0 0 14 8"><rect className={s.barFill} width="14" height="8" /></svg>
                Median
              </li>
              <li className={s.key}>
                <svg className={s.keySwatch} viewBox="0 0 14 8"><rect className={s.barSoft} width="14" height="8" /></svg>
                Up to 75th percentile
              </li>
            </ul>
            <table className={s.table}>
              <caption>Time on page, busiest pages</caption>
              <thead>
                <tr>
                  <th scope="col">Page</th>
                  <th scope="col" className={s.barCell}>Time</th>
                  <th scope="col" className={s.num}>Median, p75</th>
                  <th scope="col" className={s.barCell}>Exit rate</th>
                  <th scope="col" className={s.num}>Exits</th>
                </tr>
              </thead>
              <tbody>
                {top.map((r) => (
                  <tr key={r.path}>
                    <td>{pageName(r.path)}</td>
                    <td className={s.barCell}><RangeBar median={r.medianMs} p75={r.p75Ms} max={max} /></td>
                    <td className={s.num}>{formatMs(r.medianMs)}, {formatMs(r.p75Ms)}</td>
                    <td className={s.barCell}><Bar value={r.exitRate} tone="soft" /></td>
                    <td className={s.num}>{pct(r.exitRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={s.panelSub}>No page views in this range.</p>
        )}
      </Panel>
      <section aria-labelledby="t-all">
        <h2 className={s.panelHead} id="t-all">Every page</h2>
        <p className={s.panelSub}>Press a column title to sort. Sort by Median time to find the pages people work hardest on, or by Exit rate to find where visits end.</p>
        <DataTable caption="Time on every page" columns={columns} rows={rows} rowKey={(r) => r.path} defaultSort={{ key: "views", dir: "desc" }} empty="No page views in this range." />
      </section>
    </div>
  );
}
