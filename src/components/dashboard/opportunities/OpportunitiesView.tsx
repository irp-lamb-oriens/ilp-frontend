"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { OpportunityStage } from "@/lib/contracts";
import { staffApi } from "@/lib/api";
import { apiListSource } from "@/lib/listSource";
import { LIST_SCHEMAS, type FilterState } from "@/lib/listSchemas";
import { useSchemaListWithUrl } from "@/lib/useSchemaList";
import {
  Button,
  Checkbox,
  DataTable,
  EmptyState,
  FilterBar,
  ListFooter,
  Loadable,
  StatTile,
  StatusPill,
  Tabs,
  useBoardController,
  type Column,
} from "@/components/ui";
import { useStaff } from "../staff/StaffSession";
import { ErrorText, PageHeader, TabNote } from "../staff/PageHeader";
import { dueLabel, pct, shortDate, usd } from "../staff/format";
import { OpportunitiesBoard } from "./OpportunitiesBoard";
import { OpportunityDrawer } from "./OpportunityDrawer";
import {
  STAGES,
  STAGE_LABEL,
  STAGE_TONE,
  areaLabel,
  isClosedStage,
  oppApi,
  type OpportunityRow,
  type OpportunitySummary,
} from "./oppApi";
import { OpportunitySummarySkeleton } from "./OpportunitiesSkeleton";
import s from "./opportunities.module.scss";

const EXTRA_KEYS = ["open"];
const DEFAULT_SORT = { key: "due", dir: "asc" as const };
const MINE: FilterState = { ownerEmail: { op: "eq", value: "me" } };
const listSource = apiListSource<OpportunityRow>(staffApi, "/api/dashboard/opportunities");

/**
 * Staff Opportunities: summary strip, filters, board by stage (each column
 * pages on its own) and a server-sorted list view, one drawer. Search,
 * filters and sort live in the URL.
 */
export default function OpportunitiesView() {
  const { role, isAdmin, email } = useStaff();
  const sl = useSchemaListWithUrl<OpportunityRow>({
    schema: LIST_SCHEMAS.opportunities,
    key: "staff-opps-list",
    source: listSource,
    pageSize: 25,
    defaultFilters: role === "csm" ? MINE : undefined,
    defaultSort: DEFAULT_SORT,
    keyOf: (o) => o.id,
    viewer: email,
    extraKeys: EXTRA_KEYS,
  });
  const list = sl.list;
  const area = list.filters.area ?? "";
  const openOnly = list.filters.open === "1";
  // The summary follows the owner and area filters ("me" is the signed-in CSM).
  const ownerParam = list.filters.owner ?? "";

  const [summary, setSummary] = useState<OpportunitySummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<{ row: OpportunityRow; stage?: OpportunityStage } | null>(null);
  const [backfill, setBackfill] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const board = useBoardController<OpportunityRow>((o) => o.stage, (o) => o.id);

  const loadSummary = useCallback(() => {
    oppApi
      .summary({ owner: ownerParam || undefined, area: area || undefined })
      .then((sm) => {
        setSummary(sm);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Opportunities could not be loaded."));
  }, [ownerParam, area]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const owners = useMemo(() => (list.meta.owners as string[] | undefined) ?? [], [list.meta.owners]);
  const areas = useMemo(() => (list.meta.areas as string[] | undefined) ?? [], [list.meta.areas]);

  /** A card changed: put it in its stage's column, out of the others, and refresh the list row. */
  const updateList = list.update;
  const replace = useCallback((row: OpportunityRow) => {
    board.place(row);
    updateList((items) => items.map((x) => (x.id === row.id ? row : x)));
    setOpen((cur) => (cur && cur.row.id === row.id ? { row } : cur));
    loadSummary();
  }, [board, updateList, loadSummary]);

  /** Board moves: the board shows the card at once and rolls back with a toast on failure. */
  const boardMove = useCallback(async (o: OpportunityRow, to: OpportunityStage) => {
    if (isClosedStage(to)) {
      setOpen({ row: o, stage: to });
      return null;
    }
    const row = await oppApi.move(o.id, to);
    updateList((items) => items.map((x) => (x.id === row.id ? row : x)));
    loadSummary();
    return row;
  }, [updateList, loadSummary]);

  const tableColumns = useMemo<Column<OpportunityRow>[]>(() => [
    { key: "title", header: "Opportunity", width: "wide", sortable: true, render: (o) => <strong>{o.title}</strong> },
    { key: "member", header: "Member", render: (o) => o.memberName },
    { key: "stage", header: "Stage", render: (o) => <StatusPill size="sm" label={STAGE_LABEL[o.stage]} tone={STAGE_TONE[o.stage]} /> },
    { key: "valueCents", header: "Legal fees", align: "end", sortable: true, render: (o) => (o.valueCents != null ? usd(o.valueCents, true) : "Not priced") },
    { key: "area", header: "Area", hideOnMobile: true, render: (o) => areaLabel(o.area) },
    {
      key: "due",
      header: "Next action",
      hideOnMobile: true,
      sortable: true,
      render: (o) => (o.nextAction ? `${o.nextAction.what}${o.nextAction.dueAt ? ` · ${dueLabel(o.nextAction.dueAt).text}` : ""}` : "None set"),
    },
    { key: "owner", header: "Owner", hideOnMobile: true, render: (o) => o.ownerEmail ?? "Unassigned" },
    { key: "updatedAt", header: "Updated", hideOnMobile: true, sortable: true, render: (o) => shortDate(o.updatedAt) },
  ], []);

  const filterOptions = useMemo(
    () => ({
      ownerEmail: [{ value: "me", label: "Mine" }, ...owners.filter((e) => e !== email).map((e) => ({ value: e, label: e })), { value: "__none", label: "Unassigned" }],
      area: areas.map((a) => ({ value: a, label: areaLabel(a) })),
    }),
    [owners, areas, email],
  );
  const nothingYet = summary !== null && summary.open.count === 0 && STAGES.every((st) => summary.byStage[st.id].count === 0);

  const empty = (
    <EmptyState
      compact
      title="No opportunities here yet"
      body="They open when a lawyer's handoff carries commercial notes, or from a member page with “New opportunity”."
      action={
        isAdmin ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={async () => {
              setBackfill(null);
              try {
                const r = await oppApi.backfill();
                setBackfill(r.created ? `${r.created} opportunities created from past handoffs.` : "No past handoff needed one.");
                setVersion((v) => v + 1);
                list.refresh();
                loadSummary();
              } catch (e) {
                setBackfill(e instanceof Error ? e.message : "Could not import.");
              }
            }}
          >
            Create from past handoffs
          </Button>
        ) : undefined
      }
    />
  );

  return (
    <>
      <PageHeader
        title="Opportunities"
        sub={summary ? `${summary.open.count} open, worth ${usd(summary.open.valueCents, true)} in legal fees (GMV). Only staff see these values.` : undefined}
      />

      <Loadable loading={!summary && !error} label="Loading the pipeline summary" skeleton={<OpportunitySummarySkeleton />}>
        {() => summary && <SummaryStrip summary={summary} />}
      </Loadable>

      <FilterBar
        list={sl}
        noun="opportunities"
        placeholder="Title, member or owner"
        hideCount
        options={filterOptions}
        columns={tableColumns.map((c) => ({ key: c.key, header: c.header }))}
      />

      {error && <ErrorText>{error}</ErrorText>}
      {backfill && (
        <p className={s.meta} role="status">
          {backfill}
        </p>
      )}

      <Tabs
        label="Opportunity views"
        tabs={[
          {
            id: "board",
            label: "Board",
            content: (
              <>
                <TabNote>Each column is a stage, from first mention on the left to won or lost on the right. Move a card when the situation changes, or click it to open the details. Each column loads more cards as you ask for them.</TabNote>
                {nothingYet && !list.activeQuery ? (
                  empty
                ) : (
                  <OpportunitiesBoard
                    q={list.activeQuery}
                    filters={list.filters}
                    summary={summary}
                    selectedId={open?.row.id ?? null}
                    onOpen={(o) => setOpen({ row: o })}
                    onMove={boardMove}
                    controller={board}
                    version={version}
                  />
                )}
              </>
            ),
          },
          {
            id: "list",
            label: "List",
            content: (
              <div className={s.listWrap}>
                <TabNote>The same opportunities as a table. Sort by next action to see what is due first.</TabNote>
                <div className={s.listFilters}>
                  <Checkbox label="Open only" checked={openOnly} onChange={(e) => list.setFilter("open", e.target.checked ? "1" : "")} />
                </div>
                <DataTable
                  caption="Opportunities"
                  columns={sl.visibleColumns(tableColumns)}
                  rows={list.items}
                  rowKey={(o) => o.id}
                  loading={list.initialLoading}
                  loadingMore={list.loadingMore}
                  stale={list.stale}
                  sort={list.sort}
                  onSortChange={list.setSort}
                  selectedKey={open?.row.id ?? null}
                  onRowActivate={(o) => setOpen({ row: o })}
                  empty={nothingYet ? empty : "No opportunity matches these filters."}
                />
                <ListFooter list={list} audience="staff" />
              </div>
            ),
          },
        ]}
      />

      <OpportunityDrawer opportunity={open?.row ?? null} initialStage={open?.stage ?? null} onClose={() => setOpen(null)} onChanged={replace} />
    </>
  );
}

function SummaryStrip({ summary }: { summary: OpportunitySummary }) {
  return (
    <div className={s.summary} data-tour="staff-opps-summary">
      <StatTile size="lg" label="Open pipeline" value={usd(summary.open.valueCents, true)} hint={`${summary.open.count} open · legal fees (GMV)`} />
      <div className={s.summarySmall}>
        <StatTile label="Win rate" value={summary.winRate == null ? "No data yet" : pct(summary.winRate)} hint={`${summary.byStage.won.count} won · ${summary.byStage.lost.count} lost`} />
        <StatTile label="Days to win" value={summary.avgDaysToWin == null ? "No data yet" : String(summary.avgDaysToWin)} hint={summary.avgDaysToClose == null ? "average" : `${summary.avgDaysToClose} to close, won or lost`} />
        <StatTile label="Won legal fees" value={usd(summary.legalGmvWonCents, true)} hint="GMV, not ILP revenue" />
        <StatTile label="ILP share on won quotes" value={usd(summary.platformRevenueCents, true)} hint="Platform revenue" />
      </div>
      <dl className={s.byStage} aria-label="Value by stage">
        {STAGES.map((st) => (
          <div key={st.id} className={s.byStageItem}>
            <dt>{st.label}</dt>
            <dd>
              <span className={s.byStageValue}>{usd(summary.byStage[st.id].valueCents, true)}</span>
              <span className={s.meta}>{summary.byStage[st.id].count}</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
