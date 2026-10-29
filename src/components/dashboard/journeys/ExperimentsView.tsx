"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Experiment } from "@/lib/contracts";
import { Button, DataTable, EmptyState, StatusPill, type Column, useSkeleton } from "@/components/ui";
import { ErrorText, PageHeader } from "../staff/PageHeader";
import { useStaff } from "../staff/StaffSession";
import ExperimentDialog from "./ExperimentDialog";
import { listExperiments } from "./journeysApi";
import { SampleNotice } from "./JourneysFrame";
import { EXPERIMENT_STATUS_LABEL, EXPERIMENT_STATUS_TONE, SURFACES, canEditExperiments, stepLabel } from "./model";
import { useJourneyData } from "./useJourneys";
import s from "./journeys.module.scss";

const surfaceName = (v: string) => SURFACES.find((x) => x.value === v)?.label ?? v;
const day = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Not started");

/** Experiments: every A/B test, its status and what counts as success. Admins create and run them. */
export default function ExperimentsView() {
  const router = useRouter();
  const staff = useStaff();
  const canEdit = canEditExperiments(staff.role);
  const [n, setN] = useState(0);
  const exps = useJourneyData(() => listExperiments(), String(n));
  const sk = useSkeleton(exps.loading && !exps.data);
  const [creating, setCreating] = useState(false);
  const rows = exps.data ?? [];

  const columns = useMemo<Column<Experiment>[]>(
    () => [
      { key: "name", header: "Test", width: "wide", render: (e) => <span className={s.who}>{e.name}<span className={s.whoSub}>{e.key}</span></span>, sortValue: (e) => e.name },
      { key: "status", header: "Status", render: (e) => <StatusPill size="sm" label={EXPERIMENT_STATUS_LABEL[e.status]} tone={EXPERIMENT_STATUS_TONE[e.status]} />, sortValue: (e) => e.status },
      { key: "surface", header: "Where", render: (e) => surfaceName(e.surface), hideOnMobile: true },
      { key: "primary", header: "Success step", render: (e) => stepLabel(e.primaryStep), hideOnMobile: true },
      { key: "versions", header: "Versions", align: "end", render: (e) => e.variants.length, hideOnMobile: true },
      { key: "started", header: "Started", render: (e) => day(e.startedAt), sortValue: (e) => e.startedAt ?? "" },
    ],
    [],
  );

  return (
    <>
      <PageHeader
        title="Experiments"
        sub={exps.data ? `${rows.filter((e) => e.status === "running").length} running, ${rows.length} in total.` : undefined}
        actions={canEdit ? <Button onClick={() => setCreating(true)}>New experiment</Button> : undefined}
      />
      <SampleNotice show={exps.sample} />
      {!canEdit && <p className={s.panelSub}>Only ILP admins can create, start or stop a test. You can open any test to read its results.</p>}
      {exps.error && !exps.data ? (
        <ErrorText onRetry={exps.retry}>The experiments could not be loaded. {exps.error}</ErrorText>
      ) : !sk.showSkeleton && exps.data && rows.length === 0 ? (
        <EmptyState
          title="No experiments yet"
          body="An experiment shows two or more versions of a page to different visitors and counts which one gets more people to the next step."
          action={canEdit ? <Button onClick={() => setCreating(true)}>New experiment</Button> : undefined}
        />
      ) : (
        <div data-tour="staff-journeys-experiments">
          <DataTable
            caption="Experiments"
            columns={columns}
            rows={rows}
            rowKey={(e) => e.id}
            loading={sk.showSkeleton || !exps.data}
            skeletonRows={4}
            defaultSort={{ key: "started", dir: "desc" }}
            onRowActivate={(e) => router.push(`/dashboard/journeys/experiments/${encodeURIComponent(e.id)}`)}
          />
        </div>
      )}
      {canEdit && (
        <ExperimentDialog
          open={creating}
          onClose={() => setCreating(false)}
          onSaved={(e) => {
            setCreating(false);
            setN((x) => x + 1);
            router.push(`/dashboard/journeys/experiments/${encodeURIComponent(e.id)}`);
          }}
        />
      )}
    </>
  );
}
