"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { staffApi } from "@/lib/api";
import { apiListSource } from "@/lib/listSource";
import { LIST_SCHEMAS } from "@/lib/listSchemas";
import { useSchemaListWithUrl } from "@/lib/useSchemaList";
import { countryNameOf, useCountryContext } from "@/lib/countryContext";
import type { Matter } from "@/lib/contracts";
import {
  AgingBadge,
  agingDays,
  Board,
  type BoardCardModel,
  type BoardColumnDef,
  Button,
  DataTable,
  FilterBar,
  ListFooter,
  ProgressBar,
  StatusPill,
  Tabs,
  type Column,
  type TabItem,
} from "@/components/ui";
import ClientsPanel from "@/components/dashboard/ClientsPanel";
import ImportExportModal from "@/components/dashboard/ImportExportModal";
import { PageHeader, SectionHead, TabNote } from "../staff/PageHeader";
import { dueLabel } from "../staff/format";
import { useLawyers } from "../staff/useLawyers";
import { useStaff } from "../staff/StaffSession";
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

const SORT = { key: "stageEnteredAt", dir: "asc" as const };
/** Open matters, streamed a page at a time and filtered on the server. memberName comes with each batch. */
type MatterRow = Matter & { memberName?: string; placeholder?: boolean };
const mattersSource = apiListSource<MatterRow>(staffApi, "/api/staff/matters", { open: "1" });
const VIEW_KEY = "ilp_staff_pipeline_view";
const keyOf = (m: MatterRow) => m.id;
const stageOf = (m: MatterRow) => m.stage;

function MattersTable() {
  const router = useRouter();
  const { email } = useStaff();
  const [stages, setStages] = useState<StageDef[]>([]);
  const [view, setView] = useState<"board" | "list">("board");
  // COUNTRIES: the shell's country switcher and the country filter share one value ("" = all six).
  const [country, setCountry] = useCountryContext();
  const { nameOf } = useLawyers();
  const baseFilters = useMemo(() => ({ country }), [country]);
  const sl = useSchemaListWithUrl<MatterRow>({
    schema: LIST_SCHEMAS.staffMatters,
    key: "staff-matters",
    source: mattersSource,
    pageSize: 25,
    baseFilters,
    defaultSort: SORT,
    keyOf,
    viewer: email,
  });
  const list = sl.list;
  // A country picked in the filters moves the shell's switcher too.
  const pickedCountry = list.filters.country ?? "";
  useEffect(() => {
    if (pickedCountry !== country) setCountry(pickedCountry);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickedCountry]);
  const stage = list.filters.stage ?? "";
  const setStage = (v: string) => list.setFilter("stage", v);

  useEffect(() => {
    try {
      const v = localStorage.getItem(VIEW_KEY);
      if (v === "board" || v === "list") setView(v);
    } catch {
      /* storage unavailable */
    }
  }, []);
  const pickView = (v: "board" | "list") => {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* storage unavailable */
    }
  };

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

  const columns = useMemo<Column<MatterRow>[]>(() => [
    { key: "title", header: "Matter", render: (m) => m.title, sortable: true, width: "wide" },
    { key: "memberName", header: "Member", render: (m) => m.memberName ?? "Member" },
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
    { key: "assignedProviderId", header: "Lawyer", render: (m) => nameOf(m.assignedProviderId), hideOnMobile: true },
    { key: "openedAt", header: "Opened", render: (m) => m.openedAt.slice(0, 10), hideOnMobile: true, sortable: true },
  ], [label, sla, nameOf]);

  const boardColumns = useMemo<BoardColumnDef[]>(
    () => stages.map((st) => ({ id: st.id, label: st.label, count: byStage.get(st.id) ?? 0, limitDays: st.slaDays })),
    [stages, byStage],
  );
  const filterOptions = useMemo(() => ({ stage: stages.map((st) => ({ value: st.id, label: st.label })) }), [stages]);
  const card = useCallback((m: MatterRow): BoardCardModel => {
    const lawyer = m.assignedProviderId ? nameOf(m.assignedProviderId) : null;
    const due = m.nextStep?.dueAt ? dueLabel(m.nextStep.dueAt) : null;
    const days = sla.get(m.stage);
    return {
      title: m.title,
      subtitle: m.memberName ?? null,
      meta: [m.area, m.country ?? "CR"],
      person: lawyer ? { name: lawyer, role: "Lawyer" } : null,
      pills: (
        <>
          <AgingBadge since={m.stageEnteredAt} warnAfterDays={days ? Math.max(1, Math.floor(days / 2)) : 7} overdueAfterDays={days ?? 14} />
          {!m.assignedProviderId && <StatusPill size="sm" tone="warning" label="No lawyer" />}
        </>
      ),
      due: m.nextStep ? { text: `Next: ${m.nextStep.what}${due ? ` · ${due.text}` : ""}`, tone: due?.tone === "danger" ? "danger" : due?.tone === "warning" ? "warning" : "neutral" } : { text: "No next step set", tone: "warning" },
      placeholder: m.placeholder,
    };
  }, [nameOf, sla]);
  const aging = useCallback((m: MatterRow, col: BoardColumnDef) => {
    const d = agingDays(m.stageEnteredAt);
    const limit = col.limitDays ?? 14;
    return d >= limit ? "overdue" : d >= Math.max(1, Math.floor(limit / 2)) ? "warn" : "fresh";
  }, []);
  const updateList = list.update;
  const saveMove = useCallback(async (m: MatterRow, to: string) => {
    const saved = await staffApi.patch<MatterRow>(`/api/staff/matters/${encodeURIComponent(m.id)}`, { stage: to });
    const row = { ...m, ...saved, memberName: m.memberName };
    updateList((items) => items.map((x) => (x.id === row.id ? row : x)));
    return row;
  }, [updateList]);
  const boardFilters = useMemo(() => {
    const f = { ...list.filters };
    delete f.stage;
    return f;
  }, [list.filters]);

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
      <div className={s.viewSwitch} role="group" aria-label="Pipeline layout">
        <button type="button" className={s.seg} aria-pressed={view === "board"} onClick={() => pickView("board")}>
          Board
        </button>
        <button type="button" className={s.seg} aria-pressed={view === "list"} onClick={() => pickView("list")}>
          List
        </button>
      </div>
      <FilterBar
        list={sl}
        noun="matters"
        searchLabel="Search matters"
        placeholder="Title, area or question"
        hideCount={view === "board"}
        options={filterOptions}
        hide={view === "board" ? ["stage"] : undefined}
        columns={view === "list" ? columns.map((c) => ({ key: c.key, header: c.header })) : undefined}
      />
      {view === "board" ? (
        <Board<MatterRow>
          id="staff-pipeline"
          label="Open matters by stage"
          noun="matters"
          columns={boardColumns}
          source={mattersSource}
          filters={boardFilters}
          query={list.activeQuery}
          sort={SORT}
          keyOf={keyOf}
          stageOf={stageOf}
          card={card}
          aging={aging}
          onOpen={(m) => router.push(`/dashboard/members/${encodeURIComponent(m.clientId)}`)}
          move={saveMove}
          optimistic={(m, to) => ({ ...m, stage: to, stageEnteredAt: new Date().toISOString() })}
          audience="staff"
        />
      ) : (
        <>
      <DataTable
        caption="Open matters"
        columns={sl.visibleColumns(columns)}
        rows={list.items}
        rowKey={(m) => m.id}
        loading={list.initialLoading}
        loadingMore={list.loadingMore}
        stale={list.stale}
        sort={list.sort}
        onSortChange={list.setSort}
        onRowActivate={(m) => router.push(`/dashboard/members/${encodeURIComponent(m.clientId)}`)}
        empty={list.activeQuery || sl.activeCount ? "No open matter matches these filters." : "No open matters."}
      />
      <ListFooter list={list} audience="staff" />
        </>
      )}
    </div>
  );
}
