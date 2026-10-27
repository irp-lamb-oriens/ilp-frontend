"use client";

import { useEffect, useMemo, useState } from "react";
import { staffApi } from "@/lib/api";
import { DataTable, EmptyState, Notice, Select, Skeleton, SkeletonRegion, StatusPill, Tabs, confirmLeave, useSkeleton, type Column, type TabItem } from "@/components/ui";
import { AssignmentView, ProvidersList } from "@/components/dashboard/AdminViews";
import AvailabilityView, { type AvailabilityAdapter } from "@/components/lawyer/AvailabilityView";
import { LawyerAvailabilitySkeleton } from "@/components/lawyer/LawyerSkeletons";
import type { AvailabilitySettings } from "@/components/lawyer/callsApi";
import { useLawyers } from "../staff/useLawyers";
import { PageHeader, ErrorText } from "../staff/PageHeader";
import type { LawyerCapacity } from "../staff/types";
import s from "./views.module.scss";

/** Lawyer capacity first, then the existing provider list and assignment queue. */
export default function LawyersView() {
  const tabs: TabItem[] = [
    { id: "capacity", label: "Capacity", content: () => <Capacity /> },
    { id: "hours", label: "Hours", content: () => <Hours /> },
    { id: "assignment", label: "Assignment", content: () => <AssignmentView /> },
    { id: "directory", label: "Directory", content: () => <ProvidersList /> },
  ];
  return (
    <>
      <PageHeader title="Lawyers" sub="Who has room for the next member, and who is carrying aging matters." />
      <Tabs tabs={tabs} label="Lawyer views" />
    </>
  );
}

function Capacity() {
  const [data, setData] = useState<{ items: LawyerCapacity[]; unassignedMatters: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    staffApi
      .get<{ items: LawyerCapacity[]; unassignedMatters: number }>("/api/dashboard/staff/lawyers")
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Capacity could not be loaded."));
  }, []);

  const columns: Column<LawyerCapacity>[] = [
    { key: "name", header: "Lawyer", render: (l) => l.name, sortValue: (l) => l.name, width: "wide" },
    { key: "areas", header: "Areas", render: (l) => l.legalAreas.join(", ").replace(/_/g, " ") || "—", hideOnMobile: true },
    { key: "open", header: "Open matters", render: (l) => l.openMatters, sortValue: (l) => l.openMatters, align: "end" },
    {
      key: "aging",
      header: "14+ days in stage",
      render: (l) => (l.agingMatters > 0 ? <StatusPill size="sm" tone="warning" label={`${l.agingMatters} aging`} /> : "None"),
      sortValue: (l) => l.agingMatters,
    },
    { key: "calls", header: "Calls next 7 days", render: (l) => l.callsNext7d, sortValue: (l) => l.callsNext7d, align: "end" },
  ];

  if (error) return <ErrorText>{error}</ErrorText>;
  return (
    <div className={s.stack}>
      {data && data.unassignedMatters > 0 && (
        <Notice
          tone="warning"
          title={`${data.unassignedMatters} open matter${data.unassignedMatters === 1 ? "" : "s"} without a lawyer`}
          terms={["matter", "partnerLawyer"]}
          fix={{
            summary: "Members without a lawyer cannot book a call, so assign them first.",
            steps: [
              "Open the Assignment tab on this page. Members without a lawyer are listed oldest first.",
              "For each member, pick a lawyer in the box and press Assign. Choose someone with room in the Capacity table above.",
              "Or press Auto-assign by score to let the system match each member to a lawyer with room.",
              "You can also assign from the member's own page, under Next actions.",
            ],
            tutorialId: "staff.lawyers",
            tutorialStep: "assign",
          }}
        >
          These members are waiting for a lawyer and cannot book a call yet.
        </Notice>
      )}
      <DataTable
        caption="Lawyer capacity"
        columns={columns}
        rows={data?.items ?? []}
        rowKey={(l) => l.id}
        loading={data === null}
        defaultSort={{ key: "open", dir: "desc" }}
        empty="No active lawyers."
      />
    </div>
  );
}

/** Staff edit any lawyer's weekly hours, days off, limits and specialties (P3 routes). */
function Hours() {
  const { lawyers, loaded } = useLawyers();
  const [pick, setPick] = useState("");
  const id = pick || lawyers[0]?.id || "";
  const name = lawyers.find((l) => l.id === id)?.name ?? "Lawyer";
  const adapter = useMemo<AvailabilityAdapter>(() => {
    const path = `/api/dashboard/availability/${encodeURIComponent(id)}`;
    return {
      load: () => staffApi.get<AvailabilitySettings>(path),
      save: (input) => staffApi.put<AvailabilitySettings>(path, input),
    };
  }, [id]);

  const sk = useSkeleton(!loaded);
  if (sk.showSkeleton) {
    return (
      <SkeletonRegion label="Loading lawyers" visible={sk.skeletonVisible}>
        <HoursSkeleton />
      </SkeletonRegion>
    );
  }
  if (!lawyers.length) return <EmptyState compact title="No active lawyers" body="Add a lawyer in the Directory tab, then set their hours here." />;
  return (
    <div className={s.stack}>
      <Select
        label="Lawyer"
        value={id}
        onChange={async (e) => {
          const next = e.target.value;
          const ok = await confirmLeave({
            title: "Switch lawyer without saving?",
            message: `${name}'s hours have changes that are not saved yet. Switching lawyer discards them.`,
            confirmLabel: "Switch without saving",
          });
          if (ok) setPick(next);
        }}
      >
        {lawyers.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </Select>
      <AvailabilityView key={id} adapter={adapter} title={`${name}: hours`} showBack={false} audience="staff"
        unsavedMessage={`${name}'s hours have changes that are not saved yet. If you leave now, they will be lost.`}
      />
    </div>
  );
}

/** Lawyer picker over the hours editor, while the lawyer list loads. */
export function HoursSkeleton() {
  return (
    <div className={s.stack} aria-hidden="true">
      <div className={s.fieldSk}>
        <Skeleton shape="line" size="sm" width="25" />
        <Skeleton shape="block" size="sm" />
      </div>
      <LawyerAvailabilitySkeleton />
    </div>
  );
}
