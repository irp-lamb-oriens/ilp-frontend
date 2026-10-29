"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { COUNTRIES, type CountryCode, type Experiment } from "@/lib/contracts";
import { Button, DateInput, Notice, Select } from "@/components/ui";
import { listExperiments } from "./journeysApi";
import { RANGE_KEYS, rangeLabel, rangeOf } from "./model";
import { useJourneyFilters } from "./useJourneys";
import s from "./journeys.module.scss";

const SECTIONS = [
  { href: "/dashboard/journeys", label: "Overview", exact: true },
  { href: "/dashboard/journeys/paths", label: "Paths" },
  { href: "/dashboard/journeys/stuck", label: "Stuck" },
  { href: "/dashboard/journeys/time", label: "Time" },
  { href: "/dashboard/journeys/outbound", label: "Outbound" },
  { href: "/dashboard/journeys/experiments", label: "Experiments" },
];

const RANGE_LABEL: Record<string, string> = { "7": "Last 7 days", "28": "Last 28 days", "90": "Last 90 days", custom: "Custom dates" };
const FILTER_COUNTRIES: CountryCode[] = ["CO", "CR", "PA", "MX", "ES", "PT"];
const CHANNEL_LABEL: Record<string, string> = {
  organic: "Search engines",
  direct: "Direct",
  referral: "Other sites",
  campaign: "Campaigns (utm)",
  email_outreach: "Outreach email",
  import: "Imported leads",
  csm_call: "CSM calls",
};

export { CHANNEL_LABEL };

/** Section links for the Journeys pages; each keeps the current filters. */
export function JourneysNav() {
  const pathname = usePathname() ?? "";
  const { qs } = useJourneyFilters();
  return (
    <nav aria-label="Journeys sections">
      <ul className={s.subnav}>
        {SECTIONS.map((sec) => {
          const active = sec.exact ? pathname === sec.href : pathname.startsWith(sec.href);
          return (
            <li key={sec.href}>
              <Link href={qs ? `${sec.href}?${qs}` : sec.href} className={s.subnavLink} aria-current={active ? "page" : undefined}>
                {sec.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Date range, source, channel, country, device and experiment; all kept in the URL. */
export function JourneysFilters({ experimentFilter = true }: { experimentFilter?: boolean }) {
  const { filters, set, setRange, reset, qs } = useJourneyFilters();
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  useEffect(() => {
    if (!experimentFilter) return;
    listExperiments()
      .then((r) => setExperiments(r.data.filter((e) => e.status !== "draft")))
      .catch(() => setExperiments([]));
  }, [experimentFilter]);
  const r = rangeOf(filters);
  const exp = experiments.find((e) => e.key === filters.experiment);

  return (
    <>
      <form className={s.filters} aria-label="Filter the reports" onSubmit={(e) => e.preventDefault()} data-tour="staff-journeys-filters">
        <Select label="Dates" value={filters.range} onChange={(e) => (e.target.value === "custom" ? setRange(r.from, r.to) : set("range", e.target.value))} options={RANGE_KEYS.map((k) => ({ value: k, label: RANGE_LABEL[k] }))} />
        {filters.range === "custom" && (
          <>
            <DateInput label="From" value={r.from} max={r.to} onChange={(e) => e.target.value && setRange(e.target.value, r.to)} />
            <DateInput label="To" value={r.to} min={r.from} onChange={(e) => e.target.value && setRange(r.from, e.target.value)} />
          </>
        )}
        <Select
          label="Source"
          value={filters.source ?? ""}
          onChange={(e) => set("source", e.target.value)}
          options={[{ value: "", label: "Inbound and outbound" }, { value: "inbound", label: "Inbound" }, { value: "outbound", label: "Outbound" }]}
        />
        <Select label="Channel" value={filters.channel ?? ""} onChange={(e) => set("channel", e.target.value)} options={[{ value: "", label: "All channels" }, ...Object.entries(CHANNEL_LABEL).map(([value, label]) => ({ value, label }))]} />
        <Select label="Country" value={filters.country ?? ""} onChange={(e) => set("country", e.target.value)} options={[{ value: "", label: "All countries" }, ...FILTER_COUNTRIES.map((c) => ({ value: c, label: COUNTRIES[c].name }))]} />
        <Select
          label="Device"
          value={filters.device ?? ""}
          onChange={(e) => set("device", e.target.value)}
          options={[{ value: "", label: "All devices" }, { value: "phone", label: "Phone" }, { value: "tablet", label: "Tablet" }, { value: "desktop", label: "Computer" }]}
        />
        {experimentFilter && (
          <Select
            label="Experiment"
            value={filters.experiment ?? ""}
            onChange={(e) => set("experiment", e.target.value)}
            options={[{ value: "", label: "No experiment" }, ...experiments.map((e) => ({ value: e.key, label: e.name })), ...(filters.experiment && !exp ? [{ value: filters.experiment, label: filters.experiment }] : [])]}
          />
        )}
        {experimentFilter && filters.experiment && (
          <Select
            label="Version"
            value={filters.variant ?? ""}
            onChange={(e) => set("variant", e.target.value)}
            options={[{ value: "", label: "All versions" }, ...(exp?.variants ?? []).map((v) => ({ value: v.key, label: `${v.key}: ${v.name}` }))]}
          />
        )}
        <div className={s.filterActions}>
          <Button type="button" variant="ghost" size="sm" onClick={reset} disabled={!qs}>
            Clear filters
          </Button>
        </div>
      </form>
      <p className={s.rangeNote} role="status">
        {rangeLabel(filters)}
        {filters.range !== "custom" ? ` (${r.from} to ${r.to}, UTC)` : " (UTC)"}.
      </p>
    </>
  );
}

/** Shown while the Journeys routes are not on the server yet: the figures are a sample. */
export function SampleNotice({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <Notice tone="info" title="Sample figures" id="journeys-sample">
      The server does not have these reports yet, so this page shows sample figures to show the layout. Do not use them for decisions.
    </Notice>
  );
}

export function Panel({ title, sub, children, id }: { title: ReactNode; sub?: ReactNode; children: ReactNode; id?: string }) {
  return (
    <section className={s.panel} aria-labelledby={id}>
      <h2 className={s.panelHead} id={id}>
        {title}
      </h2>
      {sub && <p className={s.panelSub}>{sub}</p>}
      {children}
    </section>
  );
}

/** Section links, then the filter bar (not on the experiment pages, which have their own dates). */
export function JourneysChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const experiments = pathname.startsWith("/dashboard/journeys/experiments");
  return (
    <>
      <JourneysNav />
      {!experiments && <JourneysFilters />}
      {children}
    </>
  );
}
