"use client";

import { useEffect, useState } from "react";
import { AgingBadge, Button, EmptyState, Loadable, StatusPill, TextInput } from "@/components/ui";
import BriefPanel from "./BriefPanel";
import MoveToMenu from "./MoveToMenu";
import NotesTab from "./NotesTab";
import { BriefPanelSkeleton, InspectorCallsSkeleton, NotesSkeleton } from "./LawyerSkeletons";
import { areaLabel, errorText, fmtDate, fmtShortDate, lawyerApi, WHO_LABEL, type BoardCard, type ClientBrief } from "./lawyerApi";
import { SummaryPill } from "./pills";
import type { LawyerClient } from "./types";
import s from "./InspectorTabs.module.scss";

function useLoad<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    load().then((d) => live && setData(d)).catch((err) => live && setError(errorText(err)));
    return () => {
      live = false;
    };
  }, [load]);
  return { data, error, setData };
}

export function BriefTab({ load }: { load: () => Promise<ClientBrief> }) {
  const { data, error } = useLoad(load);
  if (error) return <EmptyState compact title="Brief did not load" body={error} />;
  return (
    <Loadable loading={!data} label="Loading the brief" skeleton={<BriefPanelSkeleton />}>
      {() => data && <BriefPanel brief={data} showWhen={false} />}
    </Loadable>
  );
}

const LEGAL_FIELDS = [
  { key: "legalArea", label: "Legal area" },
  { key: "legalMatter", label: "Matter description" },
  { key: "jurisdiction", label: "Jurisdiction" },
] as const;

export function MatterTab({
  card,
  stages,
  onMove,
  loadClient,
}: {
  card: BoardCard;
  stages: Array<{ id: string; label: string }>;
  onMove: (stage: string) => void;
  loadClient: () => Promise<LawyerClient>;
}) {
  const { data: client } = useLoad(loadClient);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const stageLabel = stages.find((x) => x.id === card.stage)?.label ?? card.stage;

  useEffect(() => {
    if (client) setDrafts({ legalArea: client.legalArea ?? "", legalMatter: client.legalMatter ?? "", jurisdiction: client.jurisdiction ?? "" });
  }, [client]);

  async function save(key: (typeof LEGAL_FIELDS)[number]["key"]) {
    setSaving(key);
    setMsg(null);
    try {
      await lawyerApi.updateClientField(card.clientId, key, drafts[key] ?? "");
      setMsg("Saved.");
    } catch (err) {
      setMsg(errorText(err));
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className={s.stack}>
      <dl className={s.facts}>
        <div><dt className={s.label}>Matter</dt><dd className={s.strong}>{card.title}</dd></div>
        <div><dt className={s.label}>Area</dt><dd>{areaLabel(card.area)}</dd></div>
        <div>
          <dt className={s.label}>Stage</dt>
          <dd className={s.inline}>
            {stageLabel} <AgingBadge since={card.stageEnteredAt} suffix="in stage" />
            <MoveToMenu current={card.stage} stages={stages} onMove={onMove} subject={card.clientName} />
          </dd>
        </div>
        <div>
          <dt className={s.label}>Next step</dt>
          <dd>{card.nextStep ? `${card.nextStep.what} (${WHO_LABEL[card.nextStep.who]}${card.nextStep.dueAt ? `, ${fmtShortDate(card.nextStep.dueAt)}` : ""})` : "None set. Your next handoff sets it."}</dd>
        </div>
        <div>
          <dt className={s.label}>Deadlines</dt>
          <dd className={s.inline}>
            {card.overdueCount > 0 ? <StatusPill tone="danger" size="sm" label={`${card.overdueCount} overdue`} /> : "None overdue"}
            {card.dueSoonCount > 0 && <StatusPill tone="warning" size="sm" label={`${card.dueSoonCount} due in 14 days`} />}
          </dd>
        </div>
      </dl>

      <section aria-labelledby="legal-fields">
        <h3 id="legal-fields" className={s.h3}>Legal classification</h3>
        <p className={s.muted}>Identity details are kept by the ILP team; tell them if something is wrong.</p>
        <div className={s.fields}>
          {LEGAL_FIELDS.map((f) => (
            <div key={f.key} className={s.field}>
              <div className={s.fieldRow}>
                <TextInput id={`lf-${f.key}`} label={f.label} value={drafts[f.key] ?? ""} onChange={(e) => setDrafts((d) => ({ ...d, [f.key]: e.target.value }))} disabled={!client} />
                <Button size="sm" variant="secondary" onClick={() => save(f.key)} busy={saving === f.key} disabled={!client || saving !== null}>Save</Button>
              </div>
            </div>
          ))}
        </div>
        {msg && <p className={s.muted} role="status">{msg}</p>}
      </section>
    </div>
  );
}

export function NotesCallsTab({ loadBrief, loadClient }: { loadBrief: () => Promise<ClientBrief>; loadClient: () => Promise<LawyerClient> }) {
  const brief = useLoad(loadBrief);
  const client = useLoad(loadClient);
  return (
    <div className={s.stack}>
      <section aria-labelledby="calls-h">
        <h3 id="calls-h" className={s.h3}>Your calls</h3>
        {brief.error ? (
          <p className={s.muted}>{brief.error}</p>
        ) : !brief.data ? (
          <Loadable loading label="Loading calls" skeleton={<InspectorCallsSkeleton />}>
            {null}
          </Loadable>
        ) : brief.data.calls.length === 0 ? (
          <p className={s.muted}>No calls with this member yet.</p>
        ) : (
          <ul className={s.calls}>
            {brief.data.calls.map((c) => (
              <li key={c.id} className={s.call}>
                <span className={s.callHead}>
                  <span className={s.strong}>{fmtDate(c.scheduledAt)}</span>
                  <span className={s.inline}>
                    {c.status === "no_show" && <StatusPill size="sm" tone="warning" label="No-show" />}
                    {c.handoffId ? <StatusPill size="sm" tone="success" label="Handed off" /> : <SummaryPill status={c.summaryStatus} />}
                  </span>
                </span>
                {c.question && <span className={s.muted}>Asked: {c.question}</span>}
                {c.summary && <span>{c.summary}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section aria-labelledby="notes-h">
        <h3 id="notes-h" className={s.h3}>Notes</h3>
        {client.error ? (
          <p className={s.muted}>{client.error}</p>
        ) : (
          <Loadable loading={!client.data} label="Loading notes" skeleton={<NotesSkeleton />}>
            {() => client.data && <NotesTab client={client.data} onRefreshed={(c) => client.setData(c)} />}
          </Loadable>
        )}
      </section>
    </div>
  );
}
