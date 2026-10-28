"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { staffApi } from "@/lib/api";
import { COUNTRIES } from "@/components/shell";
import { useCountryContext } from "@/lib/countryContext";
import { apiListSource } from "@/lib/listSource";
import { useListUrl, useListUrlWrite } from "@/lib/useListUrl";
import { useStreamedList } from "@/lib/useStreamedList";
import { DataTable, ListFooter, ListToolbar, ProgressBar, Select, Skeleton, StatusPill, type Column } from "@/components/ui";
import { PageHeader } from "../staff/PageHeader";
import { useStaff } from "../staff/StaffSession";
import { MEMBERSHIP_LABEL, MEMBERSHIP_TONE, shortDate } from "../staff/format";
import type { MemberRow } from "../staff/types";
import s from "./members.module.scss";

const PAGE_SIZE = 25;
type SortKey = "name" | "joined" | "completeness" | "renewal";
const FILTER_KEYS = ["status", "csm", "ready"];
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
  const defaults = useMemo(() => ({ filters: { csm: staff.role === "csm" ? staff.email : "" }, sort: DEFAULT_SORT }), [staff.role, staff.email]);
  const url = useListUrl(FILTER_KEYS, defaults);
  // COUNTRIES: "" is all six countries; the shell's country switcher sets the same value.
  const [country, setCountry] = useCountryContext();
  const list = useStreamedList<MemberRow>(membersSource, {
    key: "staff-members",
    pageSize: PAGE_SIZE,
    initialQuery: url.init.q,
    filters: { ...url.init.filters, country },
    sort: url.init.sort,
    keyOf: (r) => r.clientId,
  });
  const { setFilter } = list;
  useEffect(() => setFilter("country", country), [country, setFilter]);
  useListUrlWrite(url, { q: list.activeQuery, filters: list.filters, sort: list.sort }, FILTER_KEYS, defaults);

  const csms = (list.meta.csms as string[] | undefined) ?? [];
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
    { key: "csm", header: "CSM", render: (r) => r.csmEmail?.split("@")[0] ?? "Unassigned", hideOnMobile: true },
    { key: "tasks", header: "Open tasks", render: (r) => r.openTasks || "None", align: "end", hideOnMobile: true },
  ], []);

  return (
    <>
      <PageHeader
        title="Members"
        sub={list.initialLoading ? <Skeleton shape="line" size="sm" width="25" /> : list.total !== null ? `${list.total} member${list.total === 1 ? "" : "s"} match.` : "Members matching your filters."}
      />
      <div data-tour="staff-members-filters">
        <ListToolbar list={list} noun="members" placeholder="Name or email">
          <Select label="Membership" value={list.filters.status ?? ""} onChange={(e) => list.setFilter("status", e.target.value)}>
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="pending">Pending payment</option>
            <option value="past_due">Past due</option>
            <option value="cancelled">Cancelled</option>
          </Select>
          <Select label="CSM" value={list.filters.csm ?? ""} onChange={(e) => list.setFilter("csm", e.target.value)}>
            <option value="">Everyone</option>
            {staff.email && !csms.includes(staff.email) && <option value={staff.email}>Me</option>}
            {csms.map((c) => (
              <option key={c} value={c}>
                {c === staff.email ? "Me" : c}
              </option>
            ))}
            <option value="none">No CSM</option>
          </Select>
          <Select label="Readiness" value={list.filters.ready ?? ""} onChange={(e) => list.setFilter("ready", e.target.value)}>
            <option value="">All</option>
            <option value="ready">Consultation-ready</option>
            <option value="not_ready">Not ready</option>
          </Select>
          <Select label="Country" value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">All countries</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </Select>
        </ListToolbar>
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
        columns={columns}
        rows={list.items}
        rowKey={(r) => r.clientId}
        loading={list.initialLoading}
        loadingMore={list.loadingMore}
        stale={list.stale}
        skeletonRows={8}
        onRowActivate={(r) => router.push(`/dashboard/members/${encodeURIComponent(r.clientId)}`)}
        empty="No member matches these filters."
      />
      <ListFooter list={list} audience="staff" />
    </>
  );
}
