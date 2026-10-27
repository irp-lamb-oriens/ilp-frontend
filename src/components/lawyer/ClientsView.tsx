"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AgingBadge, DataTable, EmptyState, SearchInput, Skeleton, StaggerItem, StatusPill, type Column } from "@/components/ui";
import ClientInspector from "./ClientInspector";
import { areaLabel, errorText, fmtShortDate, lawyerApi, type BoardCard, type BoardData } from "./lawyerApi";
import s from "./ClientsView.module.scss";

/** Every member the lawyer works with, one row per matter, searchable from the top bar. */
export default function ClientsView() {
  const params = useSearchParams();
  const [q, setQ] = useState(params?.get("q") ?? "");
  const [data, setData] = useState<BoardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<BoardCard | null>(null);

  useEffect(() => {
    setQ(params?.get("q") ?? "");
  }, [params]);

  useEffect(() => {
    lawyerApi.board().then(setData).catch((err) => setError(errorText(err, "Could not load your clients.")));
  }, []);

  const label = (id: string) => data?.stageLabels.find((x) => x.id === id)?.label ?? id.replace(/_/g, " ");
  const stages = (data?.stages ?? []).map((id) => ({ id, label: label(id) }));
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (data?.cards ?? []).filter((c) => !needle || `${c.clientName} ${c.title} ${c.area}`.toLowerCase().includes(needle));
  }, [data, q]);

  async function move(card: BoardCard, stage: string) {
    try {
      const updated = await lawyerApi.moveMatter(card.id, stage);
      setData((d) => (d ? { ...d, cards: d.cards.map((c) => (c.id === updated.id ? updated : c)) } : d));
      setOpen(updated);
    } catch (err) {
      setError(errorText(err, "Could not move that matter."));
    }
  }

  const columns: Column<BoardCard>[] = [
    { key: "name", header: "Member", render: (c) => <span className={s.strong}>{c.clientName}</span>, sortValue: (c) => c.clientName },
    { key: "matter", header: "Matter", render: (c) => c.title, sortValue: (c) => c.title, width: "wide" },
    { key: "area", header: "Area", render: (c) => areaLabel(c.area), sortValue: (c) => c.area, hideOnMobile: true },
    { key: "stage", header: "Stage", render: (c) => <span className={s.inline}>{label(c.stage)} <AgingBadge since={c.stageEnteredAt} /></span>, sortValue: (c) => c.stage },
    {
      key: "deadlines",
      header: "Deadlines",
      render: (c) => (c.overdueCount ? <StatusPill size="sm" tone="danger" label={`${c.overdueCount} overdue`} /> : c.dueSoonCount ? <StatusPill size="sm" tone="warning" label={`${c.dueSoonCount} soon`} /> : <span className={s.muted}>None due</span>),
      sortValue: (c) => -(c.overdueCount * 100 + c.dueSoonCount),
      hideOnMobile: true,
    },
    { key: "call", header: "Next call", render: (c) => fmtShortDate(c.nextCallAt), sortValue: (c) => c.nextCallAt ?? "9999" },
  ];

  return (
    <div className={s.page}>
      <div className={s.bar}>
        <SearchInput className={s.search} label="Find a member or matter" value={q} onValueChange={setQ} placeholder="Name, matter or area" />
        {data ? <span className={s.muted}>{rows.length} of {data.cards.length}</span> : <Skeleton shape="line" size="sm" width="pill-sm" />}
      </div>
      {error && <StaggerItem as="p" className={s.error} role="alert">{error}</StaggerItem>}
      {data && data.cards.length === 0 ? (
        <StaggerItem>
          <EmptyState title="No members assigned yet" body="The ILP team assigns members to you after their first booking." />
        </StaggerItem>
      ) : (
        <DataTable columns={columns} rows={rows} rowKey={(c) => c.id} caption="Your members and matters" onRowActivate={setOpen} loading={!data && !error} selectedKey={open?.id ?? null} empty={<EmptyState compact title="No match" body="Try another name or matter." />} />
      )}
      {open && <ClientInspector card={open} stages={stages} onMove={(st) => move(open, st)} onClose={() => setOpen(null)} />}
    </div>
  );
}
