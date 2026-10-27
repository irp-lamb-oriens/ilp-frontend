"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { staffApi } from "@/lib/api";
import { COUNTRIES } from "@/components/shell";
import { Button, DataTable, ProgressBar, SearchInput, Select, Skeleton, StatusPill, StaggerItem, type Column } from "@/components/ui";
import { PageHeader, ErrorText } from "../staff/PageHeader";
import { useStaff } from "../staff/StaffSession";
import { MEMBERSHIP_LABEL, MEMBERSHIP_TONE, shortDate } from "../staff/format";
import type { MemberRow, MembersPage } from "../staff/types";
import s from "./members.module.scss";

const PAGE_SIZE = 25;
type SortKey = "name" | "joined" | "completeness" | "renewal";

/**
 * Members: one row per member (their current membership), filtered, searched
 * and paginated on the server (/api/dashboard/staff/members).
 */
export default function MembersList() {
  const router = useRouter();
  const params = useSearchParams();
  const staff = useStaff();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [status, setStatus] = useState(params.get("status") ?? "");
  const [csm, setCsm] = useState(params.get("csm") ?? (staff.role === "csm" ? staff.email : ""));
  const [ready, setReady] = useState(params.get("ready") ?? "");
  const [country, setCountry] = useState("CR");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "name", dir: "asc" });
  const [page, setPage] = useState(1);
  const [data, setData] = useState<MembersPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // The shell search navigates here with ?q=; follow it.
  const urlQ = params.get("q") ?? "";
  useEffect(() => {
    setQ(urlQ);
    setPage(1);
  }, [urlQ]);

  useEffect(() => {
    let live = true;
    setLoading(true);
    const t = setTimeout(() => {
      staffApi
        .get<MembersPage>("/api/dashboard/staff/members", {
          query: { q, status, csm, ready, country, sort: sort.key, dir: sort.dir, page, pageSize: PAGE_SIZE },
        })
        .then((r) => {
          if (!live) return;
          setData(r);
          setError(null);
        })
        .catch((e) => live && setError(e instanceof Error ? e.message : "Members could not be loaded."))
        .finally(() => live && setLoading(false));
    }, 200);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [q, status, csm, ready, country, sort, page]);

  const reset = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setPage(1);
  };

  const sortBtn = (key: SortKey, label: string) => (
    <button
      type="button"
      className={s.sortBtn}
      aria-pressed={sort.key === key}
      onClick={() => {
        setSort((cur) => ({ key, dir: cur.key === key && cur.dir === "asc" ? "desc" : "asc" }));
        setPage(1);
      }}
    >
      {label}
      {sort.key === key ? (sort.dir === "asc" ? " ↑" : " ↓") : ""}
    </button>
  );

  const columns: Column<MemberRow>[] = [
    {
      key: "name",
      header: "Member",
      width: "wide",
      render: (r) => (
        <span className={s.who}>
          <span className={s.name}>{r.name}</span>
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
    { key: "renewal", header: "Renews", render: (r) => (r.status === "cancelled" ? "—" : shortDate(r.periodEnd)), hideOnMobile: true },
    { key: "csm", header: "CSM", render: (r) => r.csmEmail?.split("@")[0] ?? "Unassigned", hideOnMobile: true },
    { key: "tasks", header: "Open tasks", render: (r) => r.openTasks || "—", align: "end", hideOnMobile: true },
  ];

  return (
    <>
      <PageHeader title="Members" sub={data ? `${data.total} member${data.total === 1 ? "" : "s"} match.` : <Skeleton shape="line" size="sm" width="25" />} />
      <form className={s.filters} role="search" onSubmit={(e) => e.preventDefault()}>
        <SearchInput
          label="Search"
          value={q}
          onValueChange={(v) => {
            reset(setQ)(v);
            router.replace(v ? `/dashboard/members?q=${encodeURIComponent(v)}` : "/dashboard/members", { scroll: false });
          }}
          placeholder="Name or email"
        />
        <Select label="Membership" value={status} onChange={(e) => reset(setStatus)(e.target.value)}>
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="pending">Pending payment</option>
          <option value="past_due">Past due</option>
          <option value="cancelled">Cancelled</option>
        </Select>
        <Select label="CSM" value={csm} onChange={(e) => reset(setCsm)(e.target.value)}>
          <option value="">Everyone</option>
          {staff.email && !data?.csms.includes(staff.email) && <option value={staff.email}>Me</option>}
          {(data?.csms ?? []).map((c) => (
            <option key={c} value={c}>
              {c === staff.email ? "Me" : c}
            </option>
          ))}
          <option value="none">No CSM</option>
        </Select>
        <Select label="Readiness" value={ready} onChange={(e) => reset(setReady)(e.target.value)}>
          <option value="">All</option>
          <option value="ready">Consultation-ready</option>
          <option value="not_ready">Not ready</option>
        </Select>
        <Select label="Country" value={country} onChange={(e) => reset(setCountry)(e.target.value)}>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code} disabled={!c.available}>
              {c.name}
              {c.available ? "" : " (coming soon)"}
            </option>
          ))}
        </Select>
      </form>

      <div className={s.sortRow} role="group" aria-label="Sort members">
        <span className={s.sortLabel}>Sort</span>
        {sortBtn("name", "Name")}
        {sortBtn("joined", "Joined")}
        {sortBtn("completeness", "Profile")}
        {sortBtn("renewal", "Renewal")}
      </div>

      {error && (
        <StaggerItem>
          <ErrorText>{error}</ErrorText>
        </StaggerItem>
      )}
      <DataTable
        caption="Members"
        columns={columns}
        rows={data?.items ?? []}
        rowKey={(r) => r.clientId}
        loading={loading && !data && !error}
        skeletonRows={8}
        onRowActivate={(r) => router.push(`/dashboard/members/${encodeURIComponent(r.clientId)}`)}
        empty="No member matches these filters."
      />

      {data && data.pages > 1 && (
        <nav className={s.pager} aria-label="Pages">
          <Button size="sm" variant="secondary" disabled={data.page <= 1} onClick={() => setPage(data.page - 1)}>
            Previous
          </Button>
          <span className={s.pageInfo}>
            Page {data.page} of {data.pages}
          </span>
          <Button size="sm" variant="secondary" disabled={data.page >= data.pages} onClick={() => setPage(data.page + 1)}>
            Next
          </Button>
        </nav>
      )}
    </>
  );
}
