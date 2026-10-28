"use client";

import { useEffect, useMemo, useState } from "react";
import { staffApi } from "@/lib/api";
import { apiListSource } from "@/lib/listSource";
import { useListUrl, useListUrlWrite } from "@/lib/useListUrl";
import { useStreamedList } from "@/lib/useStreamedList";
import { DataTable, EmptyState, ListFooter, ListToolbar, Notice, Select, Skeleton, SkeletonRegion, StatusPill, Tabs, confirmLeave, useSkeleton, type Column, type TabItem } from "@/components/ui";
import { AssignmentView, ProvidersList } from "@/components/dashboard/AdminViews";
import AvailabilityView, { type AvailabilityAdapter } from "@/components/lawyer/AvailabilityView";
import { LawyerAvailabilitySkeleton } from "@/components/lawyer/LawyerSkeletons";
import type { AvailabilitySettings } from "@/components/lawyer/callsApi";
import { useLawyers } from "../staff/useLawyers";
import { PageHeader, TabNote } from "../staff/PageHeader";
import type { LawyerCapacity } from "../staff/types";
import { LawyerApplications, type LawyerApplication } from "./LawyerApplications";
import s from "./views.module.scss";

/**
 * Lawyer capacity first, then the existing provider list and assignment
 * queue, plus Applications (T2): lawyers who applied from /lawyers/apply,
 * waiting for Approve, Request changes or Decline. /dashboard/lawyers#applications
 * opens that tab (the review task links there).
 */
const appsSource = apiListSource<LawyerApplication>(staffApi, "/api/dashboard/providers/applications");
const capacitySource = apiListSource<LawyerCapacity>(staffApi, "/api/dashboard/staff/lawyers");
const CAPACITY_FILTERS = ["area"];
const CAPACITY_DEFAULTS = { sort: { key: "openMatters", dir: "desc" as const } };

export default function LawyersView() {
  const [tab, setTab] = useState("capacity");
  const apps = useStreamedList<LawyerApplication>(appsSource, {
    key: "staff-applications",
    pageSize: 25,
    sort: { key: "submittedAt", dir: "desc" },
    keyOf: (a) => a.id,
  });

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#applications") setTab("applications");
  }, []);

  // Pending reviews among the rows loaded (a lower bound when more pages are waiting).
  const waiting = apps.items.filter((a) => a.status === "pending_review").length;
  const tabs: TabItem[] = [
    { id: "capacity", label: "Capacity", content: () => <Capacity /> },
    { id: "applications", label: "Applications", count: waiting || undefined, content: () => <LawyerApplications list={apps} /> },
    { id: "hours", label: "Hours", content: () => <Hours /> },
    {
      id: "assignment",
      label: "Assignment",
      content: () => (
        <>
          <TabNote>Members who do not have a lawyer yet, oldest first. Pick a lawyer with room in Capacity, then press Assign.</TabNote>
          <AssignmentView />
        </>
      ),
    },
    {
      id: "directory",
      label: "Directory",
      content: () => (
        <>
          <TabNote>Every lawyer on file, with email, legal areas and where they practise. Search by name, email or area.</TabNote>
          <ProvidersList />
        </>
      ),
    },
  ];
  return (
    <>
      <PageHeader title="Lawyers" />
      {waiting > 0 && tab !== "applications" && (
        <Notice tone="info" title={`${waiting} lawyer application${waiting === 1 ? "" : "s"} waiting for review`} actions={<button type="button" className={s.linkButton} onClick={() => setTab("applications")}>Open applications</button>}>
          Members cannot book these lawyers until someone approves them.
        </Notice>
      )}
      <Tabs tabs={tabs} label="Lawyer views" value={tab} onChange={setTab} />
    </>
  );
}

function Capacity() {
  const url = useListUrl(CAPACITY_FILTERS, CAPACITY_DEFAULTS);
  const list = useStreamedList<LawyerCapacity>(capacitySource, {
    key: "staff-capacity",
    pageSize: 25,
    initialQuery: url.init.q,
    filters: url.init.filters,
    sort: url.init.sort,
    keyOf: (l) => l.id,
  });
  useListUrlWrite(url, { q: list.activeQuery, filters: list.filters, sort: list.sort }, CAPACITY_FILTERS, CAPACITY_DEFAULTS);
  const unassignedMatters = Number(list.meta.unassignedMatters ?? 0);

  const columns = useMemo<Column<LawyerCapacity>[]>(() => [
    { key: "name", header: "Lawyer", render: (l) => l.name, sortable: true, width: "wide" },
    { key: "areas", header: "Areas", render: (l) => l.legalAreas.join(", ").replace(/_/g, " ") || "None set", hideOnMobile: true },
    { key: "openMatters", header: "Open matters", render: (l) => l.openMatters, sortable: true, align: "end" },
    {
      key: "agingMatters",
      header: "14+ days in stage",
      render: (l) => (l.agingMatters > 0 ? <StatusPill size="sm" tone="warning" label={`${l.agingMatters} aging`} /> : "None"),
      sortable: true,
    },
    { key: "callsNext7d", header: "Calls next 7 days", render: (l) => l.callsNext7d, sortable: true, align: "end" },
  ], []);

  return (
    <div className={s.stack}>
      <TabNote>How busy each partner lawyer is. Aging counts their matters that have stayed 14 days or more in one stage. Give new members to someone with room.</TabNote>
      {unassignedMatters > 0 && (
        <Notice
          tone="warning"
          title={`${unassignedMatters} open matter${unassignedMatters === 1 ? "" : "s"} without a lawyer`}
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
      <ListToolbar list={list} noun="lawyers" placeholder="Name, email or legal area" />
      <DataTable
        caption="Lawyer capacity"
        columns={columns}
        rows={list.items}
        rowKey={(l) => l.id}
        loading={list.initialLoading}
        loadingMore={list.loadingMore}
        stale={list.stale}
        sort={list.sort}
        onSortChange={list.setSort}
        empty={list.activeQuery ? "No lawyer matches this search." : "No active lawyers."}
      />
      <ListFooter list={list} audience="staff" />
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
      <TabNote>Pick a lawyer to change the weekly hours members can book, their days off and their call limits. Save before you switch lawyer.</TabNote>
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
