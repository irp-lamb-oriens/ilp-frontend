"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { staffApi } from "@/lib/api";
import { useCountryContext } from "@/lib/countryContext";
import { LIST_SCHEMAS, type FilterState } from "@/lib/listSchemas";
import { apiListSource } from "@/lib/listSource";
import { useSchemaListWithUrl } from "@/lib/useSchemaList";
import { DataTable, FilterBar, ListFooter, ProgressBar, Skeleton, StatusPill, type Column } from "@/components/ui";
import { PageHeader } from "../staff/PageHeader";
import { useStaff } from "../staff/StaffSession";
import { MEMBERSHIP_LABEL, MEMBERSHIP_TONE, shortDate } from "../staff/format";
import type { MemberRow } from "../staff/types";
import s from "./members.module.scss";

const PAGE_SIZE = 25;
type SortKey = "name" | "joined" | "completeness" | "renewal";
const DEFAULT_SORT = { key: "name", dir: "asc" as const };

/** Members come from the server a page at a time, streamed (helper/listing.ts on the API). */
const membersSource = apiListSource<MemberRow>(staffApi, "/api/dashboard/staff/members");

/**
 * Members: one row per member (their current membership), filtered, searched,
 * sorted and paged on the server (/api/dashboard/staff/members). Search,
 * filters and sort live in the URL so a view can be shared.
 */
export default function MembersList() {
  const router = useRouter();
  const staff = useStaff();
  // A CSM opens on their own members; staff and admins on everyone.
  const defaultFilters = useMemo<FilterState | undefined>(() => (staff.role === "csm" ? { csmEmail: { op: "eq", value: staff.email } } : undefined), [staff.role, staff.email]);
  // COUNTRIES: "" is all six countries; the shell's country switcher sets the same value.
  const [country, setCountry] = useCountryContext();
  const baseFilters = useMemo(() => ({ country }), [country]);
  const sl = useSchemaListWithUrl<MemberRow>({
    schema: LIST_SCHEMAS.staffMembers,
    key: "staff-members",
    source: membersSource,
    pageSize: PAGE_SIZE,
    baseFilters,
    defaultFilters,
    defaultSort: DEFAULT_SORT,
    keyOf: (r) => r.clientId,
    viewer: staff.email,
  });
  const list = sl.list;
  // A country picked in the filters moves the shell's switcher too.
  const pickedCountry = list.filters.country ?? "";
  useEffect(() => {
    if (pickedCountry !== country) setCountry(pickedCountry);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickedCountry]);

  const csms = useMemo(() => (list.meta.csms as string[] | undefined) ?? [], [list.meta.csms]);
  const filterOptions = useMemo(
    () => ({
      csmEmail: [
        ...(staff.email ? [{ value: staff.email, label: "Me" }] : []),
        ...csms.filter((c) => c !== staff.email).map((c) => ({ value: c, label: c })),
        { value: "__none", label: "No CSM" },
      ],
    }),
    [csms, staff.email],
  );
  const sort = list.sort ?? DEFAULT_SORT;

  const sortBtn = (key: SortKey, label: string) => (
    <button
      type="button"
      className={s.sortBtn}
      aria-pressed={sort.key === key}
      onClick={() => list.setSort({ key, dir: sort.key === key && sort.dir === "asc" ? "desc" : "asc" })}
    >
      {label}
      {sort.key === key ? (sort.dir === "asc" ? " ↑" : " ↓") : ""}
    </button>
  );

  const columns = useMemo<Column<MemberRow>[]>(() => [
    {
      key: "name",
      header: "Member",
      width: "wide",
      render: (r) => (
        <span className={s.who}>
          <span className={s.name}>
            {r.name}
            {r.placeholder && (
              <>
                {" "}
                <StatusPill size="sm" label="Placeholder" tone="neutral" />
              </>
            )}
          </span>
          <span className={s.email}>{r.email}</span>
        </span>
      ),
    },
    { key: "email", header: "Email", render: (r) => r.email, hideOnMobile: true },
    { key: "status", header: "Membership", render: (r) => <StatusPill size="sm" label={MEMBERSHIP_LABEL[r.status]} tone={MEMBERSHIP_TONE[r.status]} /> },
    {
      key: "profile",
      header: "Profile",
      render: (r) => (
        <ProgressBar
          label={r.consultationReady ? "Ready" : "Not ready"}
          value={r.completeness}
          tone={r.consultationReady ? "success" : "warning"}
        />
      ),
    },
    { key: "usage", header: "Minutes used", render: (r) => `${r.minutesUsed} of ${r.minutesIncluded}`, hideOnMobile: true, align: "end" },
    { key: "renewal", header: "Renews", render: (r) => (r.status === "cancelled" ? "Does not renew" : shortDate(r.periodEnd)), hideOnMobile: true },
    { key: "csmEmail", header: "CSM", render: (r) => r.csmEmail?.split("@")[0] ?? "Unassigned", hideOnMobile: true },
    { key: "country", header: "Country", render: (r) => r.country, hideOnMobile: true },
    { key: "activatedAt", header: "Joined", render: (r) => shortDate(r.activatedAt), hideOnMobile: true },
    { key: "tasks", header: "Open tasks", render: (r) => r.openTasks || "None", align: "end", hideOnMobile: true },
  ], []);

  return (
    <>
      <PageHeader
        title="Members"
        sub={list.initialLoading ? <Skeleton shape="line" size="sm" width="25" /> : list.total !== null ? `${list.total} member${list.total === 1 ? "" : "s"} match.` : "Members matching your filters."}
      />
      <div data-tour="staff-members-filters">
        <FilterBar list={sl} noun="members" placeholder="Name or email" options={filterOptions} columns={columns.map((c) => ({ key: c.key, header: c.header }))} />
      </div>

      <div className={s.sortRow} role="group" aria-label="Sort members">
        <span className={s.sortLabel}>Sort</span>
        {sortBtn("name", "Name")}
        {sortBtn("joined", "Joined")}
        {sortBtn("completeness", "Profile")}
        {sortBtn("renewal", "Renewal")}
      </div>

      <DataTable
        caption="Members"
        columns={sl.visibleColumns(columns)}
        rows={list.items}
        rowKey={(r) => r.clientId}
        loading={list.initialLoading}
        loadingMore={list.loadingMore}
        stale={list.stale}
        skeletonRows={8}
        onRowActivate={(r) => router.push(`/dashboard/members/${encodeURIComponent(r.clientId)}`)}
        empty={sl.activeCount || list.activeQuery ? "No member matches these filters." : "No members yet."}
      />
      <ListFooter list={list} audience="staff" />
    </>
  );
}
