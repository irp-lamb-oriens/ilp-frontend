"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { csmApi } from "@/lib/api";
import { LIST_SCHEMAS } from "@/lib/listSchemas";
import { apiListSource } from "@/lib/listSource";
import { useSchemaList } from "@/lib/useSchemaList";
import { withScope, type BookRow } from "@/lib/csm";
import { Checkbox, DataTable, FilterBar, ListFooter, ProgressBar, Skeleton, StatusPill, type Column } from "@/components/ui";
import { PageHeader } from "../dashboard/staff/PageHeader";
import { MEMBERSHIP_LABEL, MEMBERSHIP_TONE, shortDate } from "../dashboard/staff/format";
import { useCsm } from "./CsmFrame";
import { HealthPill } from "./HealthPill";
import s from "./csm.module.scss";

const source = apiListSource<BookRow>(csmApi, "/api/csm/book");
const DEFAULT_SORT = { key: "healthScore", dir: "asc" as const };

/** My book: the CSM's members with the health score, lowest first, filtered and searched on the server. */
export default function CsmBook() {
  const csm = useCsm();
  const router = useRouter();
  const params = useSearchParams();
  const [unassigned, setUnassigned] = useState(csm.scope.unassigned === "1");
  const baseFilters = useMemo(() => ({ ...(csm.scope.csm ? { csm: csm.scope.csm } : {}), ...(unassigned ? { unassigned: "1" } : {}) }), [csm.scope.csm, unassigned]);
  const sl = useSchemaList<BookRow>({
    schema: LIST_SCHEMAS.csmBook,
    key: "csm-book",
    source,
    pageSize: 50,
    baseFilters,
    defaultSort: DEFAULT_SORT,
    initialQuery: params?.get("q") ?? "",
    keyOf: (r) => r.clientId,
    viewer: csm.viewer,
  });
  const list = sl.list;
  const bands = list.meta.bands as Record<string, number> | undefined;

  const columns = useMemo<Column<BookRow>[]>(() => [
    {
      key: "name",
      header: "Member",
      width: "wide",
      render: (r) => (
        <span className={s.who}>
          <span className={s.rowTitle}>
            {r.name}
            {r.unassigned && (
              <>
                {" "}
                <StatusPill size="sm" label="No CSM yet" tone="info" />
              </>
            )}
            {r.placeholder && (
              <>
                {" "}
                <StatusPill size="sm" label="Placeholder" tone="neutral" />
              </>
            )}
          </span>
          <span className={s.rowSub}>{r.email}</span>
        </span>
      ),
    },
    { key: "healthBand", header: "Health", render: (r) => <HealthPill health={r.health} /> },
    { key: "status", header: "Membership", render: (r) => <StatusPill size="sm" label={r.cancelAtPeriodEnd ? "Ends at period end" : MEMBERSHIP_LABEL[r.status]} tone={r.cancelAtPeriodEnd ? "warning" : MEMBERSHIP_TONE[r.status]} /> },
    {
      key: "completeness",
      header: "Profile",
      hideOnMobile: true,
      render: (r) => <ProgressBar label={r.consultationReady ? "Ready" : "Not ready"} value={r.completeness} tone={r.consultationReady ? "success" : "warning"} />,
    },
    { key: "daysSinceContact", header: "Last contact", hideOnMobile: true, render: (r) => (r.daysSinceContact === null ? "Never" : r.daysSinceContact === 0 ? "Today" : `${r.daysSinceContact} days ago`) },
    { key: "callsUsed", header: "Calls used", hideOnMobile: true, align: "end", render: (r) => `${r.callsUsed} of ${r.callsIncluded}` },
    { key: "deadlines14d", header: "Deadlines, 14 days", hideOnMobile: true, align: "end", render: (r) => r.deadlines14d || "None" },
    { key: "openQuotes", header: "Open quotes", hideOnMobile: true, align: "end", render: (r) => r.openQuotes || "None" },
    { key: "openTasks", header: "Open tasks", hideOnMobile: true, align: "end", render: (r) => (r.overdueTasks ? `${r.openTasks}, ${r.overdueTasks} late` : r.openTasks || "None") },
    { key: "periodEnd", header: "Renews", hideOnMobile: true, render: (r) => (r.cancelAtPeriodEnd || r.status === "cancelled" ? "Does not renew" : shortDate(r.periodEnd)) },
  ], []);

  return (
    <>
      <PageHeader
        title="My book"
        sub={
          list.initialLoading ? (
            <Skeleton shape="line" size="sm" width="40" />
          ) : bands ? (
            `${bands.at_risk ?? 0} at risk, ${bands.watch ?? 0} to watch, ${bands.healthy ?? 0} healthy.`
          ) : (
            "Your members, lowest health first."
          )
        }
      />
      <div className={s.toolbar} data-tour="csm-book-filters">
        <FilterBar list={sl} noun="members" placeholder="Name or email" columns={columns.map((c) => ({ key: c.key, header: c.header }))} hide={["placeholder", "unassigned"]} />
        <Checkbox label="Show unassigned members" checked={unassigned} onChange={(e) => setUnassigned(e.target.checked)} />
      </div>
      <DataTable
        caption="My book"
        columns={sl.visibleColumns(columns)}
        rows={list.items}
        rowKey={(r) => r.clientId}
        loading={list.initialLoading}
        loadingMore={list.loadingMore}
        stale={list.stale}
        skeletonRows={8}
        onRowActivate={(r) => router.push(withScope(`/csm/book/${encodeURIComponent(r.clientId)}`, csm.scope))}
        empty={sl.activeCount || list.activeQuery ? "No member matches these filters." : "No members in this book yet. Tick Show unassigned to take new members."}
      />
      <ListFooter list={list} audience="staff" />
    </>
  );
}
