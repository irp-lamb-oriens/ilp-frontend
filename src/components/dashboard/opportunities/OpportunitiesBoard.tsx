"use client";

import { useCallback, useMemo } from "react";
import type { OpportunityStage } from "@/lib/contracts";
import { apiListSource } from "@/lib/listSource";
import { staffApi } from "@/lib/api";
import { AgingBadge, agingDays, Board, type BoardCardModel, type BoardColumnDef, type BoardController, StatusPill } from "@/components/ui";
import { dueLabel, usd } from "../staff/format";
import { STAGES, areaLabel, isClosedStage, type OpportunityRow, type OpportunitySummary } from "./oppApi";

interface Props {
  /** Search (already debounced), shared by every column. */
  q: string;
  /** The list's params (owner, area, schema filters); the board adds the stage. */
  filters: Record<string, string>;
  summary: OpportunitySummary | null;
  onOpen: (o: OpportunityRow) => void;
  /** Save a move. Won and lost open the drawer to ask for the outcome first (resolve null). */
  onMove: (o: OpportunityRow, stage: OpportunityStage) => Promise<OpportunityRow | null>;
  controller: BoardController<OpportunityRow>;
  selectedId?: string | null;
  /** Bumped by the page to reload every column (after an import). */
  version: number;
}

const source = apiListSource<OpportunityRow>(staffApi, "/api/dashboard/opportunities");
const SORT = { key: "updatedAt", dir: "desc" as const };
const keyOf = (o: OpportunityRow) => o.id;
const stageOf = (o: OpportunityRow) => o.stage;

function cardModel(o: OpportunityRow): BoardCardModel {
  const due = o.nextAction?.dueAt ? dueLabel(o.nextAction.dueAt) : null;
  return {
    title: o.title,
    subtitle: o.memberName,
    meta: [areaLabel(o.area)],
    person: o.ownerEmail ? { name: o.ownerEmail, role: "Owner" } : null,
    value: o.valueCents != null ? usd(o.valueCents, true) : null,
    due: o.nextAction ? { text: `Next: ${o.nextAction.what}${due ? ` · ${due.text}` : ""}`, tone: due?.tone === "danger" ? "danger" : due?.tone === "warning" ? "warning" : "neutral" } : null,
    pills: due?.tone === "danger" ? <StatusPill size="sm" label="Action overdue" tone="danger" /> : <AgingBadge since={o.updatedAt} suffix="since update" />,
    placeholder: (o as OpportunityRow & { placeholder?: boolean }).placeholder,
  };
}

function aging(o: OpportunityRow) {
  const days = agingDays(o.updatedAt);
  return days >= 14 ? "overdue" : days >= 7 ? "warn" : "fresh";
}

/**
 * Opportunities by stage on the shared board (components/ui/board). Each
 * column pages on its own; open stages move at once, won and lost open the
 * drawer to record the outcome.
 */
export function OpportunitiesBoard({ q, filters, summary, onOpen, onMove, controller, selectedId, version }: Props) {
  const columns = useMemo<BoardColumnDef[]>(
    () => STAGES.map((st) => ({ id: st.id, label: st.label, count: summary?.byStage[st.id]?.count ?? null, value: summary ? usd(summary.byStage[st.id]?.valueCents ?? 0, true) : null })),
    [summary],
  );
  const boardFilters = useMemo(() => {
    const f = { ...filters };
    delete f.stage;
    delete f.open;
    return f;
  }, [filters]);
  const move = useCallback((o: OpportunityRow, to: string) => onMove(o, to as OpportunityStage), [onMove]);
  return (
    <div data-tour="staff-opps-board">
      <Board<OpportunityRow>
        id="staff-opportunities"
        label="Opportunities by stage"
        noun="opportunities"
        columns={columns}
        source={source}
        filters={boardFilters}
        query={q}
        sort={SORT}
        pageSize={15}
        keyOf={keyOf}
        stageOf={stageOf}
        card={cardModel}
        aging={aging}
        onOpen={onOpen}
        selectedId={selectedId}
        move={move}
        optimistic={(o, to) => (isClosedStage(to as OpportunityStage) ? null : { ...o, stage: to as OpportunityStage, updatedAt: new Date().toISOString() })}
        moveTargets={(o) => (isClosedStage(o.stage) ? ["negotiating", o.stage] : null)}
        controller={controller}
        sumValue={(items) => usd(items.reduce((n, o) => n + (o.valueCents ?? 0), 0), true)}
        audience="staff"
        version={version}
      />
    </div>
  );
}
