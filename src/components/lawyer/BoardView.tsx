"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LIST_SCHEMAS } from "@/lib/listSchemas";
import { useSchemaList } from "@/lib/useSchemaList";
import {
  AgingBadge,
  agingDays,
  Board,
  type BoardCardModel,
  type BoardColumnDef,
  DataTable,
  EmptyState,
  ErrorNotice,
  FilterBar,
  ListFooter,
  Loadable,
  SkeletonTable,
  StaggerItem,
  StatusPill,
  useBoardController,
  type Column,
} from "@/components/ui";
import ClientInspector from "./ClientInspector";
import MoveToMenu from "./MoveToMenu";
import { useLawyer } from "./LawyerContext";
import { areaLabel, boardSource, errorText, fmtShortDate, lawyerApi, type BoardCard, type BoardMeta } from "./lawyerApi";
import { BoardColumnsSkeleton } from "./LawyerSkeletons";
import s from "./BoardView.module.scss";

type View = "board" | "list";
const VIEW_KEY = "ilp_lawyer_board_view";
const SORT = { key: "stageEnteredAt", dir: "asc" as const };

function Flags({ card }: { card: BoardCard }) {
  return (
    <span className={s.flags}>
      <AgingBadge since={card.stageEnteredAt} suffix="in stage" />
      {card.overdueCount > 0 && <StatusPill size="sm" tone="danger" label={`${card.overdueCount} overdue`} srPrefix="Deadlines" />}
      {card.overdueCount === 0 && card.dueSoonCount > 0 && <StatusPill size="sm" tone="warning" label={`${card.dueSoonCount} due in 14 days`} srPrefix="Deadlines" />}
    </span>
  );
}

const keyOf = (c: BoardCard) => c.id;
const stageOf = (c: BoardCard) => c.stage;

/**
 * Lawyer board: matters by stage on the shared board (components/ui/board),
 * with schema filters (area, country, dates), search, saved views, and a
 * server-sorted list view. Each column pages on its own.
 */
export default function BoardView() {
  const lawyer = useLawyer();
  const [view, setView] = useState<View>("board");
  const sl = useSchemaList<BoardCard>({
    schema: LIST_SCHEMAS.lawyerBoard,
    key: "lawyer-board",
    source: boardSource,
    pageSize: 25,
    defaultSort: SORT,
    keyOf,
    viewer: lawyer.email,
  });
  const list = sl.list;
  const meta = list.meta as BoardMeta & { slaDays?: Record<string, number | null> };
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<BoardCard | null>(null);
  const [version, setVersion] = useState(0);
  const controller = useBoardController<BoardCard>(stageOf, keyOf);

  useEffect(() => {
    try {
      const v = localStorage.getItem(VIEW_KEY);
      if (v === "list" || v === "board") setView(v);
    } catch {
      /* storage unavailable */
    }
  }, []);

  function pickView(v: View) {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* storage unavailable */
    }
  }

  const labels = useMemo(() => new Map((meta.stageLabels ?? []).map((x) => [x.id, x.label])), [meta.stageLabels]);
  const label = useCallback((id: string) => labels.get(id) ?? id.replace(/_/g, " "), [labels]);
  const stages = useMemo(() => meta.stages ?? [], [meta.stages]);
  const stageOptions = useMemo(() => stages.map((id) => ({ id, label: label(id) })), [stages, label]);
  const boardColumns = useMemo<BoardColumnDef[]>(
    () => stages.map((id) => ({ id, label: label(id), count: meta.counts?.[id] ?? 0, limitDays: meta.slaDays?.[id] ?? null })),
    [stages, label, meta.counts, meta.slaDays],
  );
  const filterOptions = useMemo(
    () => ({ stage: stageOptions.map((o) => ({ value: o.id, label: o.label })), area: (meta.areas ?? []).map((a) => ({ value: a, label: areaLabel(a) })) }),
    [stageOptions, meta.areas],
  );
  const total = meta.total ?? 0;

  /** The list view row follows a move made on the board, and the other way round. */
  const updateList = list.update;
  const place = useCallback((card: BoardCard) => {
    controller.place(card);
    updateList((items) => items.map((c) => (c.id === card.id ? card : c)));
    setOpen((o) => (o?.id === card.id ? card : o));
  }, [controller, updateList]);

  const saveMove = useCallback(async (card: BoardCard, stage: string) => {
    const updated = await lawyerApi.moveMatter(card.id, stage);
    updateList((items) => items.map((c) => (c.id === updated.id ? updated : c)));
    setOpen((o) => (o?.id === updated.id ? updated : o));
    return updated;
  }, [updateList]);

  /** List view and inspector moves (the board makes its own). */
  const move = useCallback(async (card: BoardCard, stage: string) => {
    if (card.stage === stage) return;
    setError(null);
    place({ ...card, stage, stageEnteredAt: new Date().toISOString() });
    try {
      place(await lawyerApi.moveMatter(card.id, stage));
    } catch (err) {
      place(card);
      setError(errorText(err, "Could not move that matter."));
    }
  }, [place]);

  const columns = useMemo<Column<BoardCard>[]>(() => [
    { key: "clientName", header: "Member", render: (c) => <span className={s.strong}>{c.clientName}</span> },
    { key: "title", header: "Matter", render: (c) => c.title, sortable: true, width: "wide" },
    { key: "area", header: "Area", render: (c) => areaLabel(c.area), hideOnMobile: true },
    { key: "country", header: "Country", render: (c) => c.country || "CR", hideOnMobile: true },
    { key: "stage", header: "Stage", render: (c) => label(c.stage) },
    { key: "stageEnteredAt", header: "In stage", render: (c) => <Flags card={c} />, sortable: true },
    { key: "call", header: "Next call", render: (c) => (c.nextCallAt ? fmtShortDate(c.nextCallAt) : <span className={s.muted}>None booked</span>), hideOnMobile: true },
    {
      key: "move",
      header: "Move",
      render: (c) => <MoveToMenu current={c.stage} stages={stageOptions} onMove={(st) => move(c, st)} subject={c.clientName} />,
      align: "end",
    },
  ], [label, stageOptions, move]);

  const cardModel = useCallback((c: BoardCard): BoardCardModel => ({
    title: c.clientName,
    subtitle: c.title,
    meta: [areaLabel(c.area), c.country || "CR"],
    pills: <Flags card={c} />,
    due: c.nextStep
      ? { text: `Next: ${c.nextStep.what}${c.nextStep.dueAt ? ` · ${fmtShortDate(c.nextStep.dueAt)}` : ""}`, tone: c.nextStep.dueAt && Date.parse(c.nextStep.dueAt) < Date.now() ? "danger" : "neutral" }
      : c.nextCallAt
        ? { text: `Call ${fmtShortDate(c.nextCallAt)}` }
        : null,
  }), []);
  const aging = useCallback((c: BoardCard, col: BoardColumnDef) => {
    const days = agingDays(c.stageEnteredAt);
    const limit = col.limitDays ?? 14;
    return days >= limit ? "overdue" : days >= Math.max(1, Math.floor(limit / 2)) ? "warn" : "fresh";
  }, []);
  const boardFilters = useMemo(() => {
    const f = { ...list.filters };
    delete f.stage;
    return f;
  }, [list.filters]);

  const ready = !list.initialLoading && !!meta.stages;
  const nothing = ready && total === 0 && !list.activeQuery && sl.activeCount === 0;
  const visible = sl.visibleColumns(columns);

  return (
    <div className={s.page}>
      <div className={s.toolbar}>
        <div className={s.viewSwitch} role="group" aria-label="Board layout">
          <button type="button" className={s.seg} aria-pressed={view === "board"} onClick={() => pickView("board")}>Board</button>
          <button type="button" className={s.seg} aria-pressed={view === "list"} onClick={() => pickView("list")}>List</button>
        </div>
      </div>
      <FilterBar
        list={sl}
        noun="matters"
        searchLabel="Search matters"
        placeholder="Member, matter or area"
        hideCount={view === "board"}
        options={filterOptions}
        hide={view === "board" ? ["stage"] : undefined}
        columns={view === "list" ? columns.map((c) => ({ key: c.key, header: c.header })) : undefined}
      />

      {error && (
        <ErrorNotice audience="lawyer" title="That did not work" onRetry={() => { setError(null); setVersion((v) => v + 1); list.refresh(); }} retryLabel="Reload">
          {error}
        </ErrorNotice>
      )}
      {list.initialLoading && list.error && (
        <ErrorNotice audience="lawyer" title="Your board did not load" onRetry={list.refresh} retryLabel="Reload">
          {list.error}
        </ErrorNotice>
      )}

      <Loadable loading={list.initialLoading && !list.error} label="Loading your board" skeleton={view === "list" ? <SkeletonTable columns={7} rows={6} /> : <BoardColumnsSkeleton />}>
        {nothing && (
          <StaggerItem>
            <EmptyState title="No open matters" body="Matters assigned to you by the ILP team appear here." />
          </StaggerItem>
        )}

        {ready && !nothing && view === "list" && (
          <>
            <DataTable
              columns={visible}
              rows={list.items}
              rowKey={keyOf}
              caption="Your matters"
              onRowActivate={setOpen}
              loadingMore={list.loadingMore}
              stale={list.stale}
              sort={list.sort}
              onSortChange={list.setSort}
              selectedKey={open?.id ?? null}
              empty="No matter matches these filters."
            />
            <ListFooter list={list} audience="lawyer" />
          </>
        )}

        {ready && !nothing && view === "board" && (
          <div data-tour="lawyer-board">
            <Board<BoardCard>
              id="lawyer-board"
              label="Your matters by stage"
              noun="matters"
              columns={boardColumns}
              source={boardSource}
              filters={boardFilters}
              query={list.activeQuery}
              sort={SORT}
              keyOf={keyOf}
              stageOf={stageOf}
              card={cardModel}
              aging={aging}
              onOpen={setOpen}
              selectedId={open?.id ?? null}
              move={saveMove}
              optimistic={(c, stage) => ({ ...c, stage, stageEnteredAt: new Date().toISOString() })}
              controller={controller}
              audience="lawyer"
              version={version}
            />
          </div>
        )}
      </Loadable>

      {open && (
        <ClientInspector
          card={open}
          stages={stageOptions}
          onMove={(st) => move(open, st)}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}
