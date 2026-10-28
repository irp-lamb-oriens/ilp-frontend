"use client";

import { useEffect, useMemo } from "react";
import MoveToMenu from "@/components/lawyer/MoveToMenu";
import type { OpportunityStage } from "@/lib/contracts";
import { apiListSource } from "@/lib/listSource";
import { useStreamedList } from "@/lib/useStreamedList";
import { AgingBadge, Button, ErrorNotice, SkeletonList, Stagger, StaggerItem, StatusPill } from "@/components/ui";
import { staffApi } from "@/lib/api";
import { dueLabel, usd } from "../staff/format";
import { STAGES, areaLabel, type OpportunityRow, type OpportunitySummary } from "./oppApi";
import s from "./opportunities.module.scss";

/** Edits a column accepts from the page (a card moved in or out, a card changed in the drawer). */
export type ColumnUpdate = (fn: (items: OpportunityRow[]) => OpportunityRow[]) => void;

interface Props {
  /** Search (already debounced), owner ("me", "all", an email) and area, shared by every column. */
  q: string;
  owner: string;
  area: string;
  summary: OpportunitySummary | null;
  onOpen: (o: OpportunityRow) => void;
  /** Open stages move at once; won and lost open the drawer to ask for the outcome. */
  onMove: (o: OpportunityRow, stage: OpportunityStage) => void;
  busyId?: string | null;
  /** Each column registers its updater, so a move can take a card out of one column and into another. */
  register: (stage: OpportunityStage, update: ColumnUpdate | null) => void;
  /** Bumped by the page to reload every column (after an import). */
  version: number;
}

const MENU = STAGES.map((x) => ({ id: x.id, label: x.label }));
const source = apiListSource<OpportunityRow>(staffApi, "/api/dashboard/opportunities");

/**
 * Board by stage. Each column loads its own cards from the server, a page at
 * a time, with "Load more in this column". No drag: each card has a
 * keyboard-friendly "Move to…" menu.
 */
export function OpportunitiesBoard(props: Props) {
  return (
    <Stagger>
      <div className={s.board} data-tour="staff-opps-board">
        {STAGES.map((st, i) => (
          <StaggerItem as="section" index={i} key={st.id} className={s.column} aria-labelledby={`opp-col-${st.id}`}>
            <Column stage={st.id} label={st.label} {...props} />
          </StaggerItem>
        ))}
      </div>
    </Stagger>
  );
}

function Column({ stage, label, q, owner, area, summary, onOpen, onMove, busyId, register, version }: Props & { stage: OpportunityStage; label: string }) {
  const filters = useMemo(() => ({ stage, owner: owner === "all" ? "" : owner, area }), [stage, owner, area]);
  const list = useStreamedList<OpportunityRow>(source, {
    key: `staff-opps-${stage}`,
    pageSize: 15,
    initialQuery: q,
    filters,
    sort: { key: "updatedAt", dir: "desc" },
    keyOf: (o) => o.id,
  });
  const { update, refresh } = list;
  useEffect(() => {
    register(stage, update);
    return () => register(stage, null);
  }, [register, stage, update]);
  useEffect(() => {
    if (version > 0) refresh();
  }, [version, refresh]);

  const all = summary?.byStage[stage];
  // The summary counts every card in the stage; with a search the column says how many it found.
  const count = q ? `${list.items.length}${list.hasMore ? "+" : ""}` : String(all?.count ?? list.total ?? list.items.length);
  const value = q ? list.items.reduce((n, o) => n + (o.valueCents ?? 0), 0) : all?.valueCents ?? 0;

  return (
    <>
      <header className={s.columnHead}>
        <h2 id={`opp-col-${stage}`} className={s.columnTitle}>
          {label} <span className={s.count}>{count}</span>
        </h2>
        <p className={s.columnValue}>{usd(value, true)}</p>
      </header>
      {list.initialLoading ? (
        <SkeletonList rows={2} variant="spaced" lines={2} />
      ) : list.items.length === 0 && !list.error ? (
        <p className={s.columnEmpty}>{q ? "No match" : "None"}</p>
      ) : (
        <ul className={s.cards} aria-busy={list.stale || list.loadingMore || undefined}>
          {list.items.map((o) => {
            const due = o.nextAction?.dueAt ? dueLabel(o.nextAction.dueAt) : null;
            const menu = o.stage === "won" || o.stage === "lost" ? MENU.filter((m) => m.id === "negotiating" || m.id === o.stage) : MENU;
            return (
              <li key={o.id} className={s.card}>
                <button type="button" className={s.cardTitle} onClick={() => onOpen(o)}>
                  {o.title}
                </button>
                <p className={s.cardMember}>{o.memberName}</p>
                <p className={s.cardMeta}>
                  {areaLabel(o.area)}
                  {o.valueCents != null && <> · {usd(o.valueCents, true)}</>}
                </p>
                {o.nextAction && (
                  <p className={s.cardMeta}>
                    {o.nextAction.what}
                    {due && <> · {due.text}</>}
                  </p>
                )}
                <div className={s.cardFoot}>
                  {due?.tone === "danger" ? (
                    <StatusPill size="sm" label="Action overdue" tone="danger" />
                  ) : (
                    <AgingBadge since={o.updatedAt} suffix="since update" />
                  )}
                  <MoveToMenu current={o.stage} stages={menu} subject={o.title} disabled={busyId === o.id} onMove={(to) => onMove(o, to as OpportunityStage)} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {list.loadingMore && <SkeletonList rows={1} variant="spaced" lines={2} />}
      {list.error && (
        <ErrorNotice audience="staff" onRetry={list.items.length ? list.loadMore : list.refresh}>
          {list.error}
        </ErrorNotice>
      )}
      {list.hasMore && !list.error && (
        <Button size="sm" variant="ghost" onClick={list.loadMore} disabled={list.loadingMore} aria-label={`Load more in ${label}`}>
          {list.loadingMore ? "Loading more…" : "Load more in this column"}
        </Button>
      )}
    </>
  );
}
