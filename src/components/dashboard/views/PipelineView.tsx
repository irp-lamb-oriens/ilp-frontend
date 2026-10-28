"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { staffApi } from "@/lib/api";
import { apiListSource } from "@/lib/listSource";
import { useListUrl, useListUrlWrite } from "@/lib/useListUrl";
import { useStreamedList } from "@/lib/useStreamedList";
import { COUNTRY_LIST, countryNameOf, useCountryContext } from "@/lib/countryContext";
import type { Matter } from "@/lib/contracts";
import { AgingBadge, Button, DataTable, ListFooter, ListToolbar, ProgressBar, Select, StatusPill, Tabs, type Column, type TabItem } from "@/components/ui";
import ClientsPanel from "@/components/dashboard/ClientsPanel";
import ImportExportModal from "@/components/dashboard/ImportExportModal";
import { PageHeader, SectionHead, TabNote } from "../staff/PageHeader";
import { dueLabel } from "../staff/format";
import { useLawyers } from "../staff/useLawyers";
import s from "./views.module.scss";

interface StageDef {
  id: string;
  label: string;
  order: number;
  slaDays: number | null;
}

/** Open matters by stage (new records), with the legacy client CRM one tab away. */
export default function PipelineView() {
  const [showImport, setShowImport] = useState(false);
  const tabs: TabItem[] = [
    { id: "matters", label: "Matters", content: () => <MattersTable /> },
    {
      id: "crm",
      label: "Client CRM",
      content: () => (
        <>
          <TabNote>The older client records, kept for their stage actions, notes, Lily and emails. New work starts from Members and Matters.</TabNote>
          <ClientsPanel />
        </>
      ),
    },
  ];
  return (
    <>
      <PageHeader
        title="Pipeline"
        actions={
          <Button variant="secondary" onClick={() => setShowImport(true)}>
            Import clients
          </Button>
        }
      />
      <Tabs tabs={tabs} label="Pipeline views" />
      {showImport && <ImportExportModal onClose={() => setShowImport(false)} />}
    </>
  );
}

const MATTER_FILTERS = ["stage"];
const MATTER_DEFAULTS = { sort: { key: "stageEnteredAt", dir: "asc" as const } };
/** Open matters, streamed a page at a time and filtered on the server. */
const mattersSource = apiListSource<Matter>(staffApi, "/api/staff/matters", { open: "1" });

function MattersTable() {
  const router = useRouter();
  const [stages, setStages] = useState<StageDef[]>([]);
  // COUNTRIES: the shell's country switcher and this filter share one value ("" = all six).
  const [country, setCountry] = useCountryContext();
  const { nameOf } = useLawyers();
  const url = useListUrl(MATTER_FILTERS, MATTER_DEFAULTS);
  const list = useStreamedList<Matter>(mattersSource, {
    key: "staff-matters",
    pageSize: 25,
    initialQuery: url.init.q,
    filters: { ...url.init.filters, country },
    sort: url.init.sort,
    keyOf: (m) => m.id,
  });
  const { setFilter } = list;
  useEffect(() => setFilter("country", country), [country, setFilter]);
  useListUrlWrite(url, { q: list.activeQuery, filters: list.filters, sort: list.sort }, MATTER_FILTERS, MATTER_DEFAULTS);
  const stage = list.filters.stage ?? "";
  const setStage = (v: string) => list.setFilter("stage", v);

  useEffect(() => {
    staffApi
      .get<{ stages: StageDef[] }>("/api/dashboard/stage-config")
      .catch(() => ({ stages: [] as StageDef[] }))
      .then((st) => setStages([...st.stages].sort((a, b) => a.order - b.order)));
  }, []);

  const label = useMemo(() => new Map(stages.map((x) => [x.id, x.label])), [stages]);
  const sla = useMemo(() => new Map(stages.map((x) => [x.id, x.slaDays])), [stages]);
  // Counts for the whole country come with the first page (they do not follow the stage filter or search).
  const byStage = useMemo(() => new Map(Object.entries((list.meta.byStage as Record<string, number> | undefined) ?? {})), [list.meta.byStage]);
  const total = Number(list.meta.openTotal ?? 0);
  const late = Number(list.meta.late ?? 0);

  const columns = useMemo<Column<Matter>[]>(() => [
    { key: "title", header: "Matter", render: (m) => m.title, sortable: true, width: "wide" },
    { key: "stage", header: "Stage", render: (m) => <StatusPill size="sm" label={label.get(m.stage) ?? m.stage.replace(/_/g, " ")} /> },
    {
      key: "stageEnteredAt",
      header: "In stage",
      render: (m) => {
        const days = sla.get(m.stage);
        return <AgingBadge since={m.stageEnteredAt} warnAfterDays={days ? Math.max(1, Math.floor(days / 2)) : 7} overdueAfterDays={days ?? 14} />;
      },
      sortable: true,
    },
    { key: "area", header: "Area", render: (m) => m.area, hideOnMobile: true },
    { key: "country", header: "Country", render: (m) => countryNameOf(m.country ?? "CR"), hideOnMobile: true },
    {
      key: "next",
      header: "Next step",
      render: (m) => (m.nextStep ? `${m.nextStep.what} · ${dueLabel(m.nextStep.dueAt).text}` : "None set"),
      hideOnMobile: true,
    },
    { key: "lawyer", header: "Lawyer", render: (m) => nameOf(m.assignedProviderId), hideOnMobile: true },
  ], [label, sla, nameOf]);

  return (
    <div>
      {total > 0 && (
        <section className={s.stageStrip} aria-labelledby="by-stage-title">
          <SectionHead
            id="by-stage-title"
            level={3}
            title="Open matters by stage"
            sub={`${total} open matter${total === 1 ? "" : "s"}${late ? `, ${late} past the stage time limit` : ", none past the stage time limit"}. Click a stage to show only its matters.`}
          />
          <ul className={s.stageBars}>
            {[...byStage.keys()]
              .sort((a, b) => (stages.findIndex((x) => x.id === a) + 1 || 999) - (stages.findIndex((x) => x.id === b) + 1 || 999))
              .map((id) => (
                <li key={id}>
                  <button type="button" className={s.stageBar} aria-pressed={stage === id} onClick={() => setStage(stage === id ? "" : id)}>
                    <ProgressBar label={label.get(id) ?? id.replace(/_/g, " ")} value={byStage.get(id) ?? 0} max={total} valueText={String(byStage.get(id) ?? 0)} />
                  </button>
                </li>
              ))}
          </ul>
        </section>
      )}
      <ListToolbar list={list} noun="matters" searchLabel="Search matters" placeholder="Title, area or question">
        <Select label="Stage" value={stage} onChange={(e) => setStage(e.target.value)}>
          <option value="">All stages{total ? ` (${total})` : ""}</option>
          {[...byStage.keys()].map((id) => (
            <option key={id} value={id}>
              {label.get(id) ?? id} ({byStage.get(id)})
            </option>
          ))}
        </Select>
        <Select label="Country" value={country} onChange={(e) => setCountry(e.target.value)}>
          <option value="">All countries</option>
          {COUNTRY_LIST.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </Select>
      </ListToolbar>
      <DataTable
        caption="Open matters"
        columns={columns}
        rows={list.items}
        rowKey={(m) => m.id}
        loading={list.initialLoading}
        loadingMore={list.loadingMore}
        stale={list.stale}
        sort={list.sort}
        onSortChange={list.setSort}
        onRowActivate={(m) => router.push(`/dashboard/members/${encodeURIComponent(m.clientId)}`)}
        empty={list.activeQuery ? "No open matter matches this search." : "No open matters."}
      />
      <ListFooter list={list} audience="staff" />
    </div>
  );
}
