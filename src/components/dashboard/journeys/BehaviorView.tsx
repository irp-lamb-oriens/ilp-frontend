"use client";

import { useEffect, useMemo, useState } from "react";
import { DataTable, DateInput, Select, SkeletonStatStrip, SkeletonTable, StatTile, StatusPill, type Column, type StatusTone } from "@/components/ui";
import { ErrorText } from "../staff/PageHeader";
import {
  type BehaviorDevice,
  type BehaviorHeat,
  type BehaviorPage,
  type BehaviorPages,
  type HeatLayer,
  DEVICE_LABEL,
  dropBand,
  getBehaviorHeat,
  getBehaviorPages,
  LAYERS,
} from "./behaviorApi";
import HeatMap from "./HeatMap";
import { count, formatMs, pageName, pct, RANGE_KEYS, rangeOf } from "./model";
import { useJourneyFilters } from "./useJourneys";
import s from "./behavior.module.scss";

const RANGE_LABEL: Record<string, string> = { "7": "Last 7 days", "28": "Last 28 days", "90": "Last 90 days", custom: "Custom dates" };
const TONE: Record<"danger" | "warning" | "info", StatusTone> = { danger: "danger", warning: "warning", info: "info" };
const TONE_LABEL = { danger: "Fix first", warning: "Look at this", info: "Note" };

const seconds = (ms: number | null) => (ms === null ? "None" : `${(ms / 1000).toFixed(1)} s`);
const errText = (e: unknown) => (e instanceof Error && e.message ? e.message : "Try again in a minute.");

/** The device most views of a page came from. */
function mainDevice(p: BehaviorPage | undefined): BehaviorDevice {
  if (!p) return "desktop";
  const d = p.devices;
  return d.phone >= d.desktop && d.phone >= d.tablet ? "phone" : d.desktop >= d.tablet ? "desktop" : "tablet";
}

/**
 * Behavior: what visitors do on each public page. A heat map of clicks, rage
 * clicks and dead clicks over the page itself, how far people scroll, where
 * their attention goes, the controls they use, page speed and script errors.
 * Totals only: no person, no typed text, nothing from the signed-in portals.
 */
export default function BehaviorView() {
  const { filters, set, setRange } = useJourneyFilters();
  const r = rangeOf(filters);
  const [pages, setPages] = useState<BehaviorPages | null>(null);
  const [pagesError, setPagesError] = useState<string | null>(null);
  // ?page=/pricing opens that page's heat map (the link on the Time screen).
  const [path, setPath] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    try {
      return new URLSearchParams(window.location.search).get("page") ?? "";
    } catch {
      return "";
    }
  });
  const [device, setDevice] = useState<BehaviorDevice | "">("");
  const [layer, setLayer] = useState<HeatLayer>("clicks");
  const [heat, setHeat] = useState<BehaviorHeat | null>(null);
  const [heatError, setHeatError] = useState<string | null>(null);
  const [n, setN] = useState(0);

  useEffect(() => {
    let live = true;
    setPagesError(null);
    getBehaviorPages(r.from, r.to)
      .then((p) => {
        if (!live) return;
        setPages(p);
        setPath((cur) => (cur && p.pages.some((x) => x.path === cur) ? cur : p.pages[0]?.path ?? ""));
      })
      .catch((e) => live && setPagesError(errText(e)));
    return () => {
      live = false;
    };
  }, [r.from, r.to, n]);

  const row = useMemo(() => pages?.pages.find((p) => p.path === path), [pages, path]);
  const shownDevice: BehaviorDevice = device || mainDevice(row);

  useEffect(() => {
    if (!path) {
      setHeat(null);
      return;
    }
    let live = true;
    setHeatError(null);
    getBehaviorHeat(path, r.from, r.to, device)
      .then((h) => live && setHeat(h))
      .catch((e) => live && setHeatError(errText(e)));
    return () => {
      live = false;
    };
  }, [path, device, r.from, r.to, n]);

  const columns = useMemo<Column<BehaviorPage>[]>(
    () => [
      { key: "path", header: "Page", width: "wide", render: (p) => <span>{pageName(p.path)}<br /><span className={s.heatMeta}>{p.path}</span></span>, sortValue: (p) => p.path },
      { key: "views", header: "Views", align: "end", render: (p) => count(p.views), sortValue: (p) => p.views },
      { key: "time", header: "Time on page", align: "end", render: (p) => formatMs(p.avgActiveMs), sortValue: (p) => p.avgActiveMs ?? -1 },
      { key: "scroll", header: "Scrolled", align: "end", render: (p) => (p.avgScroll === null ? "None" : `${p.avgScroll}%`), sortValue: (p) => p.avgScroll ?? -1 },
      { key: "quick", header: "Left at once", align: "end", render: (p) => pct(p.quickRate), sortValue: (p) => p.quickRate, hideOnMobile: true },
      { key: "rage", header: "Rage clicks", align: "end", render: (p) => count(p.rage), sortValue: (p) => p.rage },
      { key: "dead", header: "Dead clicks", align: "end", render: (p) => pct(p.deadRate), sortValue: (p) => p.deadRate, hideOnMobile: true },
      { key: "lcp", header: "Load time", align: "end", render: (p) => seconds(p.lcpMs), sortValue: (p) => p.lcpMs ?? -1, hideOnMobile: true },
      { key: "errors", header: "Errors", align: "end", render: (p) => count(p.errors), sortValue: (p) => p.errors, hideOnMobile: true },
    ],
    [],
  );

  if (pagesError && !pages) return <ErrorText onRetry={() => setN((x) => x + 1)}>The behavior report could not be loaded. {pagesError}</ErrorText>;
  if (!pages) {
    return (
      <>
        <SkeletonStatStrip />
        <SkeletonTable columns={[{ header: "Page", width: "wide" }, { header: "Views", align: "end" }, { header: "Time on page", align: "end" }]} rows={6} />
      </>
    );
  }

  const active = LAYERS.find((l) => l.id === layer)!;
  const drop = heat ? dropBand(heat.reach) : null;

  return (
    <div>
      <form className={s.controls} aria-label="Choose the page, device and dates" onSubmit={(e) => e.preventDefault()} data-tour="staff-behavior-controls">
        <Select
          label="Page"
          value={path}
          onChange={(e) => setPath(e.target.value)}
          placeholder={pages.pages.length ? undefined : "No measured pages yet"}
          options={pages.pages.map((p) => ({ value: p.path, label: `${pageName(p.path)} (${count(p.views)} views)` }))}
        />
        <Select
          label="Device"
          value={device}
          onChange={(e) => setDevice(e.target.value as BehaviorDevice | "")}
          options={[{ value: "", label: "All devices" }, ...(["phone", "tablet", "desktop"] as const).map((d) => ({ value: d, label: DEVICE_LABEL[d] }))]}
        />
        <Select label="Dates" value={filters.range} onChange={(e) => (e.target.value === "custom" ? setRange(r.from, r.to) : set("range", e.target.value))} options={RANGE_KEYS.map((k) => ({ value: k, label: RANGE_LABEL[k] }))} />
        {filters.range === "custom" && (
          <>
            <DateInput label="From" value={r.from} max={r.to} onChange={(e) => e.target.value && setRange(e.target.value, r.to)} />
            <DateInput label="To" value={r.to} min={r.from} onChange={(e) => e.target.value && setRange(r.from, e.target.value)} />
          </>
        )}
      </form>

      {!pages.pages.length ? (
        <p className={s.muted} role="status">
          No behavior has been measured between {r.from} and {r.to}. Measurement starts when a visitor who allowed measurement opens a public page; pages inside member, lawyer and staff accounts are never measured.
        </p>
      ) : (
        <>
          {heatError && <ErrorText onRetry={() => setN((x) => x + 1)}>This page could not be loaded. {heatError}</ErrorText>}
          {heat && (
            <>
              <div className={s.kpis} data-tour="staff-behavior-kpis">
                <StatTile label={`Views of ${pageName(path)}`} value={count(heat.views)} hint={`${DEVICE_LABEL.phone} ${count(heat.devices.phone)}, ${DEVICE_LABEL.tablet} ${count(heat.devices.tablet)}, ${DEVICE_LABEL.desktop} ${count(heat.devices.desktop)}`} />
                <StatTile size="sm" label="Time on page" value={formatMs(heat.avgActiveMs)} hint="Average active time" />
                <StatTile size="sm" label="Scrolled" value={heat.avgScroll === null ? "None" : `${heat.avgScroll}%`} hint={drop === null ? "Most views reach the end" : `Half the views stop before ${drop * 10}%`} />
                <StatTile size="sm" label="Rage clicks" value={count(heat.rage)} hint={`${pct(heat.rageRate)} of views`} />
                <StatTile size="sm" label="Dead clicks" value={pct(heat.deadRate)} hint={`${count(heat.dead)} of ${count(heat.clicks)} clicks`} />
                <StatTile size="sm" label="Load time" value={seconds(heat.lcpMs)} hint={heat.inpMs === null ? "Until the main content shows" : `Reacts to a tap in ${heat.inpMs} ms`} />
              </div>

              <ul className={s.findings} aria-label="What stands out on this page" data-tour="staff-behavior-findings">
                {heat.insights.map((i) => (
                  <li key={i.text} className={s.finding}>
                    <StatusPill size="sm" tone={TONE[i.tone]} label={TONE_LABEL[i.tone]} />
                    <span>{i.text}</span>
                  </li>
                ))}
              </ul>

              <div className={s.section}>
                <h2 className={s.h2}>Heat map</h2>
                <ul className={s.layers} data-tour="staff-behavior-layers">
                  {LAYERS.map((l) => (
                    <li key={l.id}>
                      <button type="button" className={s.layer} aria-pressed={layer === l.id} onClick={() => setLayer(l.id)}>
                        {l.label}
                      </button>
                    </li>
                  ))}
                </ul>
                <p className={s.layerHelp} role="status">{active.help}</p>
                <div className={s.split}>
                  <div data-tour="staff-behavior-map">
                    <HeatMap path={path} device={shownDevice} layer={layer} heat={heat} />
                  </div>
                  <div>
                    <h3 className={s.h2}>How far people get</h3>
                    <table className={s.reach}>
                      <caption className={s.muted}>Share of views that reached each part of the page, top to bottom.</caption>
                      <thead>
                        <tr>
                          <th scope="col">Part of the page</th>
                          <th scope="col">Reached</th>
                          <th scope="col">Views</th>
                        </tr>
                      </thead>
                      <tbody>
                        {heat.reach.map((v, i) => (
                          <tr key={i}>
                            <th scope="row">{i * 10}% to {i * 10 + 10}%</th>
                            <td><span className={s.reachBar} style={{ width: `${Math.round(v * 100)}%` }} /></td>
                            <td>{pct(v)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <section className={s.section} aria-labelledby="bh-el" data-tour="staff-behavior-elements">
                <h2 className={s.h2} id="bh-el">What people click</h2>
                <p className={s.muted}>Each control by its label. A control with rage clicks looks broken or slow; a row that is not a link or a button and still gets clicks should probably become one.</p>
                <DataTable
                  caption="Clicked controls"
                  rows={heat.elements}
                  rowKey={(e) => e.label}
                  defaultSort={{ key: "clicks", dir: "desc" }}
                  empty="No clicks recorded on this page in this period."
                  columns={[
                    { key: "label", header: "Control", width: "wide", render: (e) => e.label, sortValue: (e) => e.label },
                    { key: "clicks", header: "Clicks", align: "end", render: (e) => count(e.clicks), sortValue: (e) => e.clicks },
                    { key: "share", header: "Share of clicks", align: "end", render: (e) => pct(e.share), sortValue: (e) => e.share },
                    { key: "rage", header: "Rage", align: "end", render: (e) => count(e.rage), sortValue: (e) => e.rage },
                    { key: "dead", header: "Dead", align: "end", render: (e) => count(e.dead), sortValue: (e) => e.dead },
                  ]}
                />
              </section>
            </>
          )}

          <section className={s.section} aria-labelledby="bh-all" data-tour="staff-behavior-pages">
            <h2 className={s.h2} id="bh-all">Every page</h2>
            <p className={s.muted}>
              {count(pages.total.views)} measured views, {count(pages.total.clicks)} clicks, {count(pages.total.rage)} rage clicks and {count(pages.total.errors)} script errors from {r.from} to {r.to} (UTC). Press a row to open its heat map; press a column title to sort.
            </p>
            <DataTable caption="Behavior on every page" columns={columns} rows={pages.pages} rowKey={(p) => p.path} defaultSort={{ key: "views", dir: "desc" }} selectedKey={path} onRowActivate={(p) => { setPath(p.path); window.scrollTo({ top: 0 }); }} empty="No measured pages." />
          </section>
        </>
      )}
    </div>
  );
}
