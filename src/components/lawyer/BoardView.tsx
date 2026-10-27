"use client";

import { useEffect, useMemo, useState, type DragEvent } from "react";
import { AgingBadge, Button, DataTable, EmptyState, Loadable, Select, SkeletonTable, Stagger, StaggerItem, StatusPill, type Column, ErrorNotice } from "@/components/ui";
import ClientInspector from "./ClientInspector";
import MoveToMenu from "./MoveToMenu";
import { areaLabel, errorText, fmtShortDate, lawyerApi, type BoardCard, type BoardData } from "./lawyerApi";
import { BoardColumnsSkeleton } from "./LawyerSkeletons";
import s from "./BoardView.module.scss";

type View = "board" | "list";
const VIEW_KEY = "ilp_lawyer_board_view";

function Flags({ card }: { card: BoardCard }) {
  return (
    <span className={s.flags}>
      <AgingBadge since={card.stageEnteredAt} suffix="in stage" />
      {card.overdueCount > 0 && <StatusPill size="sm" tone="danger" label={`${card.overdueCount} overdue`} srPrefix="Deadlines:" />}
      {card.overdueCount === 0 && card.dueSoonCount > 0 && <StatusPill size="sm" tone="warning" label={`${card.dueSoonCount} due in 14 days`} srPrefix="Deadlines:" />}
    </span>
  );
}

/** Lawyer board: matters by stage with aging, deadline flags, filters, list view and keyboard moves. */
export default function BoardView() {
  const [data, setData] = useState<BoardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>("board");
  const [area, setArea] = useState("all");
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [open, setOpen] = useState<BoardCard | null>(null);
  const [announce, setAnnounce] = useState("");

  async function load() {
    setError(null);
    try {
      setData(await lawyerApi.board());
    } catch (err) {
      setError(errorText(err, "Could not load your board."));
    }
  }

  useEffect(() => {
    load();
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
    data?.stageLabels.forEach((x) => m.set(x.id, x.label));
    return m;
  }, [data]);
  const label = (id: string) => labels.get(id) ?? id.replace(/_/g, " ");
  const stageOptions = (data?.stages ?? []).map((id) => ({ id, label: label(id) }));
  const areas = useMemo(() => [...new Set((data?.cards ?? []).map((c) => c.area))].sort(), [data]);
  const cards = (data?.cards ?? []).filter((c) => area === "all" || c.area === area);

  async function move(card: BoardCard, stage: string) {
    if (!data || card.stage === stage) return;
    const prev = data;
    // Optimistic: move the one card, then replace it with the server's copy.
    setData({ ...data, cards: data.cards.map((c) => (c.id === card.id ? { ...c, stage, stageEnteredAt: new Date().toISOString() } : c)) });
    setMovingId(card.id);
    try {
      const updated = await lawyerApi.moveMatter(card.id, stage);
      setData((d) => (d ? { ...d, cards: d.cards.map((c) => (c.id === updated.id ? updated : c)) } : d));
      setOpen((o) => (o?.id === updated.id ? updated : o));
      setAnnounce(`${card.clientName} moved to ${label(stage)}.`);
    } catch (err) {
      setData(prev);
      setAnnounce("");
      setError(errorText(err, "Could not move that matter."));
    } finally {
      setMovingId(null);
    }
  }

  function onDrop(e: DragEvent, stage: string) {
    e.preventDefault();
    setOverStage(null);
    const id = e.dataTransfer.getData("text/plain") || dragId;
    const card = data?.cards.find((c) => c.id === id);
    if (card) move(card, stage);
    setDragId(null);
  }

  const columns: Column<BoardCard>[] = [
    { key: "client", header: "Member", render: (c) => <span className={s.strong}>{c.clientName}</span>, sortValue: (c) => c.clientName },
    { key: "matter", header: "Matter", render: (c) => c.title, sortValue: (c) => c.title, width: "wide" },
    { key: "area", header: "Area", render: (c) => areaLabel(c.area), sortValue: (c) => c.area, hideOnMobile: true },
    { key: "stage", header: "Stage", render: (c) => label(c.stage), sortValue: (c) => (data?.stages ?? []).indexOf(c.stage) },
    { key: "aging", header: "In stage", render: (c) => <Flags card={c} />, sortValue: (c) => new Date(c.stageEnteredAt).getTime() * -1 },
    { key: "call", header: "Next call", render: (c) => fmtShortDate(c.nextCallAt), sortValue: (c) => c.nextCallAt ?? "9999", hideOnMobile: true },
    {
      key: "move",
      header: "Move",
      render: (c) => <MoveToMenu current={c.stage} stages={stageOptions} onMove={(st) => move(c, st)} disabled={movingId === c.id} subject={c.clientName} />,
      align: "end",
    },
  ];

  return (
    <div className={s.page}>
      <div className={s.toolbar}>
        <div className={s.viewSwitch} role="group" aria-label="Board layout">
          <button type="button" className={s.seg} aria-pressed={view === "board"} onClick={() => pickView("board")}>Board</button>
          <button type="button" className={s.seg} aria-pressed={view === "list"} onClick={() => pickView("list")}>List</button>
        </div>
        <Select className={s.filter} label="Legal area" value={area} onChange={(e) => setArea(e.target.value)}>
            <option value="all">All areas</option>
            {areas.map((a) => (
              <option key={a} value={a}>{areaLabel(a)}</option>
            ))}
        </Select>
        <span className={s.count}>{cards.length} {cards.length === 1 ? "matter" : "matters"}</span>
      </div>

      <p className={s.sr} aria-live="polite">{announce}</p>
      {error && (
        <ErrorNotice audience="lawyer" title="Your board did not load" onRetry={load} retryLabel="Reload">
          {error}
        </ErrorNotice>
      )}

      <Loadable loading={!data && !error} label="Loading your board" skeleton={view === "list" ? <SkeletonTable columns={7} rows={6} /> : <BoardColumnsSkeleton />}>
      {data && cards.length === 0 && (
        <StaggerItem>
          <EmptyState title={area === "all" ? "No open matters" : `No ${areaLabel(area).toLowerCase()} matters`} body="Matters assigned to you by the ILP team appear here." />
        </StaggerItem>
      )}

      {data && cards.length > 0 && view === "list" && (
        <DataTable columns={columns} rows={cards} rowKey={(c) => c.id} caption="Your matters" onRowActivate={setOpen} defaultSort={{ key: "aging", dir: "asc" }} selectedKey={open?.id ?? null} />
      )}

      {data && cards.length > 0 && view === "board" && (
        <Stagger>
        <div className={s.board} data-tour="lawyer-board">
          {data.stages.map((stage, i) => {
            const col = cards.filter((c) => c.stage === stage);
            return (
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
                <h3 id={`col-${stage}`} className={s.colH}>
                  {label(stage)} <span className={s.colCount}>{col.length}</span>
                </h3>
                <ul className={s.cards}>
                  {col.map((c) => (
                    <li
                      key={c.id}
                      className={s.card}
                      data-dragging={dragId === c.id || undefined}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", c.id);
                        e.dataTransfer.effectAllowed = "move";
                        setDragId(c.id);
                      }}
                      onDragEnd={() => {
                        setDragId(null);
                        setOverStage(null);
                      }}
                    >
                      <button type="button" className={s.cardOpen} onClick={() => setOpen(c)}>
                        <span className={s.cardName}>{c.clientName}</span>
                        <span className={s.cardTitle}>{c.title}</span>
                        <span className={s.cardArea}>{areaLabel(c.area)}{c.nextCallAt ? ` · call ${fmtShortDate(c.nextCallAt)}` : ""}</span>
                      </button>
                      <div className={s.cardFoot}>
                        <Flags card={c} />
                        <MoveToMenu current={c.stage} stages={stageOptions} onMove={(st) => move(c, st)} disabled={movingId === c.id} subject={c.clientName} />
                      </div>
                    </li>
                  ))}
                </ul>
              </StaggerItem>
            );
          })}
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
