"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Drawer, StatusPill } from "@/components/ui";
import { ErrorText } from "../staff/PageHeader";
import { memberName, usd } from "../staff/format";
import type { MemberBundle } from "../staff/types";
import { NewOpportunity } from "./NewOpportunity";
import { OpportunityDrawer } from "./OpportunityDrawer";
import { STAGE_LABEL, STAGE_TONE, isClosedStage, oppApi, type OpportunityRow } from "./oppApi";
import s from "./opportunities.module.scss";

/** Member page section: this member's opportunities, with "New opportunity". */
export function MemberOpportunities({ bundle }: { bundle: MemberBundle }) {
  const clientId = bundle.client?.id ?? bundle.membership?.clientId ?? "";
  const [items, setItems] = useState<OpportunityRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState<OpportunityRow | null>(null);

  const load = useCallback(() => {
    if (!clientId) return;
    oppApi
      .list({ clientId })
      .then((r) => setItems(r.items))
      .catch((e) => setError(e instanceof Error ? e.message : "Opportunities could not be loaded."));
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  const sorted = [...(items ?? [])].sort((a, b) => Number(isClosedStage(a.stage)) - Number(isClosedStage(b.stage)) || b.updatedAt.localeCompare(a.updatedAt));

  return (
    <section className={s.memberBlock} aria-labelledby="member-opps">
      <div className={s.panelHead}>
        <h2 id="member-opps" className={s.memberTitle}>
          Opportunities
        </h2>
        <Button size="sm" variant="secondary" onClick={() => setCreating(true)}>
          New opportunity
        </Button>
      </div>
      {error && <ErrorText>{error}</ErrorText>}
      {items === null && !error ? (
        <p className={s.meta}>Loading…</p>
      ) : sorted.length === 0 ? (
        <p className={s.meta}>None yet. A handoff with commercial notes opens one automatically.</p>
      ) : (
        <ul className={s.memberList}>
          {sorted.map((o) => (
            <li key={o.id}>
              <button type="button" className={s.memberRow} onClick={() => setOpen(o)}>
                <span className={s.memberRowTitle}>{o.title}</span>
                <span className={s.memberRowMeta}>
                  <StatusPill size="sm" label={STAGE_LABEL[o.stage]} tone={STAGE_TONE[o.stage]} />
                  {o.valueCents != null && <span>{usd(o.valueCents, true)}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Drawer open={creating} onClose={() => setCreating(false)} title="New opportunity" subtitle={memberName(bundle.client, "Member")}>
        {creating && (
          <NewOpportunity
            clientId={clientId}
            handoffs={bundle.handoffs}
            consultations={bundle.consultations}
            obligations={bundle.obligations}
            matters={bundle.matters}
            onCancel={() => setCreating(false)}
            onCreated={(row) => {
              setCreating(false);
              setItems((prev) => [row, ...(prev ?? [])]);
              setOpen(row);
            }}
          />
        )}
      </Drawer>

      <OpportunityDrawer
        opportunity={open}
        onClose={() => setOpen(null)}
        onChanged={(row) => {
          setItems((prev) => (prev ? prev.map((x) => (x.id === row.id ? row : x)) : prev));
          setOpen(row);
        }}
      />
    </section>
  );
}
