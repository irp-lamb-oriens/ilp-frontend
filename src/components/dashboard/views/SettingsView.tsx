"use client";

import { useEffect, useState } from "react";
import { staffApi } from "@/lib/api";
import { Button, Skeleton, SkeletonRegion, Tabs, TextInput, useSkeleton, type TabItem } from "@/components/ui";
import { VendorsList } from "@/components/dashboard/AdminViews";
import EmailsTab from "@/components/dashboard/EmailsTab";
import { PageHeader, ErrorText } from "../staff/PageHeader";
import s from "./views.module.scss";

/** Admin settings: pipeline stages, email queue, vendors. */
export default function SettingsView() {
  const tabs: TabItem[] = [
    { id: "stages", label: "Stages", content: () => <StageConfig /> },
    { id: "emails", label: "Email queue", content: () => <EmailsTab /> },
    { id: "vendors", label: "Vendors", content: () => <VendorsList /> },
  ];
  return (
    <>
      <PageHeader title="Settings" sub="Changes here apply to every member and lawyer." />
      <Tabs tabs={tabs} label="Settings" />
    </>
  );
}

interface StageDef {
  id: string;
  label: string;
  clientLabel?: string;
  order: number;
  slaDays: number | null;
  active: boolean;
}

function StageConfig() {
  const [stages, setStages] = useState<StageDef[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    staffApi
      .get<{ stages: StageDef[] }>("/api/dashboard/stage-config")
      .then((r) => setStages([...r.stages].sort((a, b) => a.order - b.order)))
      .catch((e) => setError(e instanceof Error ? e.message : "Stages could not be loaded."));
  }, []);

  function edit(id: string, patch: Partial<StageDef>) {
    setStages((list) => (list ?? []).map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  async function save(st: StageDef) {
    setBusy(st.id);
    setError(null);
    setSaved(null);
    try {
      await staffApi.patch(`/api/dashboard/stage-config/${encodeURIComponent(st.id)}`, {
        label: st.label,
        clientLabel: st.clientLabel ?? "",
        slaDays: st.slaDays,
      });
      setSaved(`Saved "${st.label}".`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setBusy(null);
    }
  }

  const sk = useSkeleton(stages === null && !error);
  if (sk.showSkeleton) {
    return (
      <SkeletonRegion label="Loading stages" visible={sk.skeletonVisible}>
        <StageConfigSkeleton />
      </SkeletonRegion>
    );
  }

  return (
    <div className={s.stack}>
      <p className={s.note}>
        The client label is what members see on their timeline. SLA days drive the aging badges on Pipeline and the Needs-attention rail.
      </p>
      {error && <ErrorText>{error}</ErrorText>}
      {saved && (
        <p className={s.ok} role="status">
          {saved}
        </p>
      )}
      <ul className={s.stageList}>
        {(stages ?? []).map((st) => (
          <li key={st.id} className={s.stageRow}>
            <TextInput
              label={
                <>
                  Staff label <span className={s.stageId}>{st.id}</span>
                </>
              }
              value={st.label}
              onChange={(e) => edit(st.id, { label: e.target.value })}
            />
            <TextInput
              label="SLA days"
              type="number"
              min={0}
              inputMode="numeric"
              value={st.slaDays ?? ""}
              onChange={(e) => edit(st.id, { slaDays: e.target.value === "" ? null : Number(e.target.value) })}
            />
            <Button variant="secondary" size="sm" busy={busy === st.id} onClick={() => save(st)}>
              Save
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The stage editor: intro note, then one row per stage (label, SLA days, Save). */
export function StageConfigSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className={s.stack} aria-hidden="true">
      <Skeleton shape="line" size="sm" width="90" />
      <ul className={s.stageList}>
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} className={s.stageRow}>
            <div className={s.fieldSk}>
              <Skeleton shape="line" size="sm" width="40" />
              <Skeleton shape="block" size="sm" />
            </div>
            <div className={s.fieldSk}>
              <Skeleton shape="line" size="sm" width="40" />
              <Skeleton shape="block" size="sm" />
            </div>
            <Skeleton shape="block" size="sm" width="pill" />
          </li>
        ))}
      </ul>
    </div>
  );
}
