"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { useStreamedList } from "@/lib/useStreamedList";
import { AgingBadge, Button, DataTable, EmptyState, ErrorNotice, ListFooter, ListToolbar, Loadable, Select, SkeletonList, SkeletonTable, Stagger, StaggerItem, StatusPill, type Column } from "@/components/ui";
import ClientInspector from "./ClientInspector";
import MoveToMenu from "./MoveToMenu";
import { areaLabel, boardSource, errorText, fmtShortDate, lawyerApi, type BoardCard, type BoardMeta } from "./lawyerApi";
import { BoardColumnsSkeleton } from "./LawyerSkeletons";
import s from "./BoardView.module.scss";

type View = "board" | "list";
const VIEW_KEY = "ilp_lawyer_board_view";
type ColumnUpdate = (fn: (items: BoardCard[]) => BoardCard[]) => void;

function Flags({ card }: { card: BoardCard }) {
  return (
    <span className={s.flags}>
      <AgingBadge since={card.stageEnteredAt} suffix="in stage" />
      {card.overdueCount > 0 && <StatusPill size="sm" tone="danger" label={`${card.overdueCount} overdue`} srPrefix="Deadlines:" />}
      {card.overdueCount === 0 && card.dueSoonCount > 0 && <StatusPill size="sm" tone="warning" label={`${card.dueSoonCount} due in 14 days`} srPrefix="Deadlines:" />}
    </span>
  );
}

/**
 * Lawyer board: matters by stage with aging, deadline flags, search, an area
 * filter, a list view and keyboard moves. Each column loads its own cards from
 * the server a page at a time ("Load more in this column"); the list view is
 * one server-sorted, paged table.
 */
export default function BoardView() {
  const [view, setView] = useState<View>("board");
  const list = useStreamedList<BoardCard>(boardSource, {
    key: "lawyer-board",
    pageSize: 25,
    sort: { key: "stageEnteredAt", dir: "asc" },
    keyOf: (c) => c.id,
  });
  const meta = list.meta as BoardMeta;
  const area = list.filters.area ?? "";
  const [error, setError] = useState<string | null>(null);
  const [dragCard, setDragCard] = useState<BoardCard | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [open, setOpen] = useState<BoardCard | null>(null);
  const [announce, setAnnounce] = useState("");
  const [version, setVersion] = useState(0);
  const columnsRef = useRef(new Map<string, ColumnUpdate>());
  const register = useCallback((stage: string, update: ColumnUpdate | null) => {
    if (update) columnsRef.current.set(stage, update);
    else columnsRef.current.delete(stage);
  }, []);

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

  const labels = useMemo(() => {
    const m = new Map<string, string>();
    meta.stageLabels?.forEach((x) => m.set(x.id, x.label));
    return m;
  }, [meta.stageLabels]);
  const label = useCallback((id: string) => labels.get(id) ?? id.replace(/_/g, " "), [labels]);
  const stages = useMemo(() => meta.stages ?? [], [meta.stages]);
  const stageOptions = useMemo(() => stages.map((id) => ({ id, label: label(id) })), [stages, label]);
  const total = meta.total ?? 0;

  /** Put a card in its stage's column and out of the others; update the list row. */
  const updateList = list.update;
  const place = useCallback((card: BoardCard) => {
    for (const [st, update] of columnsRef.current) {
      update((items) => {
        const rest = items.filter((c) => c.id !== card.id);
        return st === card.stage ? [card, ...rest] : rest;
      });
    }
    updateList((items) => items.map((c) => (c.id === card.id ? card : c)));
  }, [updateList]);

  const move = useCallback(async (card: BoardCard, stage: string) => {
    if (card.stage === stage) return;
    setError(null);
    // Optimistic: move the one card, then replace it with the server's copy.
    place({ ...card, stage, stageEnteredAt: new Date().toISOString() });
    setMovingId(card.id);
    try {
      const updated = await lawyerApi.moveMatter(card.id, stage);
      place(updated);
      setOpen((o) => (o?.id === updated.id ? updated : o));
      setAnnounce(`${card.clientName} moved to ${label(stage)}.`);
    } catch (err) {
      place(card);
      setAnnounce("");
      setError(errorText(err, "Could not move that matter."));
    } finally {
      setMovingId(null);
    }
  }, [place, label]);

  function onDrop(e: DragEvent, stage: string) {
    e.preventDefault();
    setOverStage(null);
    if (dragCard) move(dragCard, stage);
    setDragCard(null);
  }

  const columns = useMemo<Column<BoardCard>[]>(() => [
    { key: "client", header: "Member", render: (c) => <span className={s.strong}>{c.clientName}</span> },
    { key: "title", header: "Matter", render: (c) => c.title, sortable: true, width: "wide" },
    { key: "area", header: "Area", render: (c) => areaLabel(c.area), hideOnMobile: true },
    { key: "stage", header: "Stage", render: (c) => label(c.stage) },
    { key: "stageEnteredAt", header: "In stage", render: (c) => <Flags card={c} />, sortable: true },
    { key: "call", header: "Next call", render: (c) => (c.nextCallAt ? fmtShortDate(c.nextCallAt) : <span className={s.muted}>None booked</span>), hideOnMobile: true },
    {
      key: "move",
      header: "Move",
      render: (c) => <MoveToMenu current={c.stage} stages={stageOptions} onMove={(st) => move(c, st)} disabled={movingId === c.id} subject={c.clientName} />,
      align: "end",
    },
  ], [label, stageOptions, move, movingId]);

  const ready = !list.initialLoading && !!meta.stages;
  const nothing = ready && total === 0 && !list.activeQuery;

  return (
    <div className={s.page}>
      <div className={s.toolbar}>
        <div className={s.viewSwitch} role="group" aria-label="Board layout">
          <button type="button" className={s.seg} aria-pressed={view === "board"} onClick={() => pickView("board")}>Board</button>
          <button type="button" className={s.seg} aria-pressed={view === "list"} onClick={() => pickView("list")}>List</button>
        </div>
      </div>
      <ListToolbar list={list} noun="matters" searchLabel="Search matters" placeholder="Member, matter or area" hideCount={view === "board"}>
        <Select className={s.filter} label="Legal area" value={area} onChange={(e) => list.setFilter("area", e.target.value)}>
          <option value="">All areas</option>
          {(meta.areas ?? []).map((a) => (
            <option key={a} value={a}>{areaLabel(a)}</option>
          ))}
        </Select>
      </ListToolbar>

      <p className={s.sr} aria-live="polite">{announce}</p>
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
            <EmptyState title={area ? `No ${areaLabel(area).toLowerCase()} matters` : "No open matters"} body="Matters assigned to you by the ILP team appear here." />
          </StaggerItem>
        )}

        {ready && !nothing && view === "list" && (
          <>
            <DataTable
              columns={columns}
              rows={list.items}
              rowKey={(c) => c.id}
              caption="Your matters"
              onRowActivate={setOpen}
              loadingMore={list.loadingMore}
              stale={list.stale}
              sort={list.sort}
              onSortChange={list.setSort}
              selectedKey={open?.id ?? null}
              empty="No matter matches this search."
            />
            <ListFooter list={list} audience="lawyer" />
          </>
        )}

        {ready && !nothing && view === "board" && (
          <Stagger>
            <div className={s.board} data-tour="lawyer-board">
              {stages.map((stage, i) => (
                <StaggerItem
                  as="section"
                  index={i}
                  key={stage}
                  className={s.col}
                  data-over={overStage === stage || undefined}
                  aria-labelledby={`col-${stage}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setOverStage(stage);
                  }}
                  onDragLeave={() => setOverStage((o) => (o === stage ? null : o))}
                  onDrop={(e) => onDrop(e, stage)}
                >
                  <BoardColumn
                    stage={stage}
                    label={label(stage)}
                    q={list.activeQuery}
                    area={area}
                    count={meta.counts?.[stage] ?? 0}
                    register={register}
                    version={version}
                    stageOptions={stageOptions}
                    movingId={movingId}
                    dragId={dragCard?.id ?? null}
                    onDragCard={setDragCard}
                    onOpen={setOpen}
                    onMove={move}
                  />
                </StaggerItem>
              ))}
            </div>
          </Stagger>
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

interface ColumnProps {
  stage: string;
  label: string;
  q: string;
  area: string;
  /** Cards in this stage (all of them, from the board's meta; a search shows what it found). */
  count: number;
  register: (stage: string, update: ColumnUpdate | null) => void;
  version: number;
  stageOptions: Array<{ id: string; label: string }>;
  movingId: string | null;
  dragId: string | null;
  onDragCard: (card: BoardCard | null) => void;
  onOpen: (card: BoardCard) => void;
  onMove: (card: BoardCard, stage: string) => void;
}

/** One stage column: its own paged, streamed list. */
function BoardColumn({ stage, label, q, area, count, register, version, stageOptions, movingId, dragId, onDragCard, onOpen, onMove }: ColumnProps) {
  const filters = useMemo(() => ({ stage, area }), [stage, area]);
  const col = useStreamedList<BoardCard>(boardSource, {
    key: `lawyer-board-${stage}`,
    pageSize: 12,
    initialQuery: q,
    filters,
    sort: { key: "stageEnteredAt", dir: "asc" },
    keyOf: (c) => c.id,
  });
  const { update, refresh } = col;
  useEffect(() => {
    register(stage, update);
    return () => register(stage, null);
  }, [register, stage, update]);
  useEffect(() => {
    if (version > 0) refresh();
  }, [version, refresh]);
  const shown = q ? `${col.items.length}${col.hasMore ? "+" : ""}` : String(Math.max(count, col.items.length));

  return (
    <>
      <h3 id={`col-${stage}`} className={s.colH}>
        {label} <span className={s.colCount}>{shown}</span>
      </h3>
      {col.initialLoading && <SkeletonList rows={2} variant="spaced" lines={2} />}
      {!col.initialLoading && col.items.length === 0 && !col.error && (
        <p className={s.colEmpty}>{q ? "No match in this stage." : "No matters in this stage. Drag a card here to move it."}</p>
      )}
      <ul className={s.cards} aria-busy={col.stale || col.loadingMore || undefined}>
        {col.items.map((c) => (
          <li
            key={c.id}
            className={s.card}
            data-dragging={dragId === c.id || undefined}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", c.id);
              e.dataTransfer.effectAllowed = "move";
              onDragCard(c);
            }}
            onDragEnd={() => onDragCard(null)}
          >
            <button type="button" className={s.cardOpen} onClick={() => onOpen(c)}>
              <span className={s.cardName}>{c.clientName}</span>
              <span className={s.cardTitle}>{c.title}</span>
              <span className={s.cardArea}>{areaLabel(c.area)}{c.nextCallAt ? ` · call ${fmtShortDate(c.nextCallAt)}` : ""}</span>
            </button>
            <div className={s.cardFoot}>
              <Flags card={c} />
              <MoveToMenu current={c.stage} stages={stageOptions} onMove={(st) => onMove(c, st)} disabled={movingId === c.id} subject={c.clientName} />
            </div>
          </li>
        ))}
      </ul>
      {col.loadingMore && <SkeletonList rows={1} variant="spaced" lines={2} />}
      {col.error && (
        <ErrorNotice audience="lawyer" onRetry={col.items.length ? col.loadMore : col.refresh}>
          {col.error}
        </ErrorNotice>
      )}
      {col.hasMore && !col.error && (
        <Button size="sm" variant="ghost" onClick={col.loadMore} disabled={col.loadingMore} aria-label={`Load more in ${label}`}>
          {col.loadingMore ? "Loading more…" : "Load more in this column"}
        </Button>
      )}
    </>
  );
}
