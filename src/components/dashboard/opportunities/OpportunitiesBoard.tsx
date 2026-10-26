"use client";

import MoveToMenu from "@/components/lawyer/MoveToMenu";
import type { OpportunityStage } from "@/lib/contracts";
import { AgingBadge, StatusPill } from "@/components/ui";
import { dueLabel, usd } from "../staff/format";
import { STAGES, areaLabel, type OpportunityRow } from "./oppApi";
import s from "./opportunities.module.scss";

interface Props {
  items: OpportunityRow[];
  onOpen: (o: OpportunityRow) => void;
  /** Open stages move at once; won and lost open the drawer to ask for the outcome. */
  onMove: (o: OpportunityRow, stage: OpportunityStage) => void;
  busyId?: string | null;
}

const MENU = STAGES.map((x) => ({ id: x.id, label: x.label }));

/** Board by stage. No drag: each card has a keyboard-friendly "Move to…" menu. */
export function OpportunitiesBoard({ items, onOpen, onMove, busyId }: Props) {
  return (
    <div className={s.board}>
      {STAGES.map((st) => {
        const col = items.filter((o) => o.stage === st.id);
        const value = col.reduce((n, o) => n + (o.valueCents ?? 0), 0);
        return (
          <section key={st.id} className={s.column} aria-labelledby={`opp-col-${st.id}`}>
            <header className={s.columnHead}>
              <h2 id={`opp-col-${st.id}`} className={s.columnTitle}>
                {st.label} <span className={s.count}>{col.length}</span>
              </h2>
              <p className={s.columnValue}>{usd(value, true)}</p>
            </header>
            {col.length === 0 ? (
              <p className={s.columnEmpty}>None</p>
            ) : (
              <ul className={s.cards}>
                {col.map((o) => {
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
          </section>
        );
      })}
    </div>
  );
}
