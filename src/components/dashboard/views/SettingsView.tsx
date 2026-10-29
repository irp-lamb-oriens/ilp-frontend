"use client";

import { useEffect, useState } from "react";
import { staffApi } from "@/lib/api";
import { Button, Skeleton, SkeletonRegion, Tabs, TextInput, useSkeleton, type TabItem } from "@/components/ui";
import { VendorsList } from "@/components/dashboard/AdminViews";
import EmailsTab from "@/components/dashboard/EmailsTab";
import { PageHeader, ErrorText, TabNote } from "../staff/PageHeader";
import { SpecialtiesEditor } from "../routing/SpecialtiesEditor"; // ROUTING
import { SalesHours } from "../routing/SalesHours"; // ROUTING
import { LawyerFeedbackSettings } from "../routing/LawyerFeedbackSettings"; // COMMS-P2
import s from "./views.module.scss";

/** Admin settings: pipeline stages, specialties, sales hours, lawyer feedback, email queue, vendors. */
export default function SettingsView() {
  const tabs: TabItem[] = [
    { id: "stages", label: "Stages", content: () => <StageConfig /> },
    // ROUTING: the specialty list lawyers pick from, and the sales team's hours.
    { id: "specialties", label: "Specialties", content: () => <SpecialtiesEditor /> },
    { id: "sales", label: "Sales calls", content: () => <SalesHours /> },
    // COMMS-P2: thresholds of the monthly lawyer feedback (coaching and thank-you notes).
    { id: "lawyer-feedback", label: "Lawyer feedback", content: () => <LawyerFeedbackSettings /> },
    {
      id: "emails",
      label: "Email queue",
      content: () => (
        <>
          <TabNote>Emails the system has written, such as booking confirmations, while they wait to go out. Open one to read it before it is sent.</TabNote>
          <EmailsTab />
        </>
      ),
    },
    {
      id: "vendors",
      label: "Vendors",
      content: () => (
        <>
          <TabNote>Outside suppliers ILP works with, and whether each one is active. Search by name.</TabNote>
          <VendorsList />
        </>
      ),
    },
  ];
  return (
    <>
      <PageHeader title="Settings" sub="Changes here apply to every member and lawyer at once." />
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
      <TabNote>
        Each matter moves through these stages in order. The staff label is the name the team sees. SLA days is the time limit for the stage: after it, the matter is flagged on Pipeline and under Needs attention on Today.
      </TabNote>
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
