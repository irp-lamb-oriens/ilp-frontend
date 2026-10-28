"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { staffApi } from "@/lib/api";
import type { Matter } from "@/lib/contracts";
import { AgingBadge, Button, DataTable, Select, StatusPill, Tabs, type Column, type TabItem } from "@/components/ui";
import ClientsPanel from "@/components/dashboard/ClientsPanel";
import ImportExportModal from "@/components/dashboard/ImportExportModal";
import { PageHeader, ErrorText } from "../staff/PageHeader";
import { dueLabel } from "../staff/format";
import { useLawyers } from "../staff/useLawyers";
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
    { id: "crm", label: "Client CRM", content: () => <ClientsPanel /> },
  ];
  return (
    <>
      <PageHeader
        title="Pipeline"
        sub="Open matters by stage and time in stage. The client CRM keeps stage actions, Lily and emails."
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

function MattersTable() {
  const router = useRouter();
  const [matters, setMatters] = useState<Matter[] | null>(null);
  const [stages, setStages] = useState<StageDef[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState("");
  const { nameOf } = useLawyers();

  useEffect(() => {
    Promise.all([
      staffApi.get<{ items: Matter[] }>("/api/staff/matters"),
      staffApi.get<{ stages: StageDef[] }>("/api/dashboard/stage-config").catch(() => ({ stages: [] as StageDef[] })),
    ])
      .then(([m, st]) => {
        setMatters(m.items.filter((x) => !x.closedAt));
        setStages([...st.stages].sort((a, b) => a.order - b.order));
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Matters could not be loaded."));
  }, []);

  const label = useMemo(() => new Map(stages.map((x) => [x.id, x.label])), [stages]);
  const sla = useMemo(() => new Map(stages.map((x) => [x.id, x.slaDays])), [stages]);
  const counts = useMemo(() => {
    const c = new Map<string, number>();
    for (const m of matters ?? []) c.set(m.stage, (c.get(m.stage) ?? 0) + 1);
    return c;
  }, [matters]);

  const rows = (matters ?? []).filter((m) => !stage || m.stage === stage);
  const columns: Column<Matter>[] = [
    { key: "title", header: "Matter", render: (m) => m.title, sortValue: (m) => m.title, width: "wide" },
    { key: "stage", header: "Stage", render: (m) => <StatusPill size="sm" label={label.get(m.stage) ?? m.stage.replace(/_/g, " ")} />, sortValue: (m) => m.stage },
    {
      key: "aging",
      header: "In stage",
      render: (m) => {
        const days = sla.get(m.stage);
        return <AgingBadge since={m.stageEnteredAt} warnAfterDays={days ? Math.max(1, Math.floor(days / 2)) : 7} overdueAfterDays={days ?? 14} />;
      },
      sortValue: (m) => m.stageEnteredAt,
    },
    { key: "area", header: "Area", render: (m) => m.area, sortValue: (m) => m.area, hideOnMobile: true },
    {
      key: "next",
      header: "Next step",
      render: (m) => (m.nextStep ? `${m.nextStep.what} · ${dueLabel(m.nextStep.dueAt).text}` : "None set"),
      hideOnMobile: true,
    },
    { key: "lawyer", header: "Lawyer", render: (m) => nameOf(m.assignedProviderId), sortValue: (m) => nameOf(m.assignedProviderId), hideOnMobile: true },
  ];

  if (error) return <ErrorText>{error}</ErrorText>;

  return (
    <div>
      <div className={s.bar}>
        <Select label="Stage" value={stage} onChange={(e) => setStage(e.target.value)}>
          <option value="">All stages ({matters?.length ?? 0})</option>
          {[...counts.keys()].map((id) => (
            <option key={id} value={id}>
              {label.get(id) ?? id} ({counts.get(id)})
            </option>
          ))}
        </Select>
      </div>
      <DataTable
        caption="Open matters"
        columns={columns}
        rows={rows}
        rowKey={(m) => m.id}
        loading={matters === null}
        defaultSort={{ key: "aging", dir: "asc" }}
        onRowActivate={(m) => router.push(`/dashboard/members/${encodeURIComponent(m.clientId)}`)}
        empty="No open matters."
      />
    </div>
  );
}
