"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { useStreamedList } from "@/lib/useStreamedList";
import { AgingBadge, DataTable, EmptyState, ListFooter, ListToolbar, StaggerItem, StatusPill, type Column, ErrorNotice } from "@/components/ui";
import ClientInspector from "./ClientInspector";
import { areaLabel, boardSource, errorText, fmtShortDate, lawyerApi, type BoardCard, type BoardMeta } from "./lawyerApi";
import s from "./ClientsView.module.scss";

/**
 * Every member the lawyer works with, one row per matter, searchable from the
 * top bar. Searched, sorted and paged on the server; rows stream in.
 */
export default function ClientsView() {
  const params = useSearchParams();
  const list = useStreamedList<BoardCard>(boardSource, {
    key: "lawyer-clients",
    pageSize: 25,
    initialQuery: params?.get("q") ?? "",
    sort: { key: "stageEnteredAt", dir: "asc" },
    keyOf: (c) => c.id,
  });
  const meta = list.meta as BoardMeta;
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<BoardCard | null>(null);

  const label = useCallback((id: string) => meta.stageLabels?.find((x) => x.id === id)?.label ?? id.replace(/_/g, " "), [meta.stageLabels]);
  const stages = useMemo(() => (meta.stages ?? []).map((id) => ({ id, label: label(id) })), [meta.stages, label]);

  async function move(card: BoardCard, stage: string) {
    try {
      const updated = await lawyerApi.moveMatter(card.id, stage);
      list.update((items) => items.map((c) => (c.id === updated.id ? updated : c)));
      setOpen(updated);
    } catch (err) {
      setError(errorText(err, "Could not move that matter."));
    }
  }

  const columns = useMemo<Column<BoardCard>[]>(() => [
    { key: "name", header: "Member", render: (c) => <span className={s.strong}>{c.clientName}</span> },
    { key: "title", header: "Matter", render: (c) => c.title, sortable: true, width: "wide" },
    { key: "area", header: "Area", render: (c) => areaLabel(c.area), hideOnMobile: true },
    { key: "stageEnteredAt", header: "Stage", render: (c) => <span className={s.inline}>{label(c.stage)} <AgingBadge since={c.stageEnteredAt} /></span>, sortable: true },
    {
      key: "deadlines",
      header: "Deadlines",
      render: (c) => (c.overdueCount ? <StatusPill size="sm" tone="danger" label={`${c.overdueCount} overdue`} /> : c.dueSoonCount ? <StatusPill size="sm" tone="warning" label={`${c.dueSoonCount} due soon`} /> : <span className={s.muted}>None due</span>),
      hideOnMobile: true,
    },
    { key: "call", header: "Next call", render: (c) => (c.nextCallAt ? fmtShortDate(c.nextCallAt) : <span className={s.muted}>None booked</span>) },
  ], [label]);

  const nothing = list.status === "done" && list.items.length === 0 && !list.activeQuery;

  return (
    <div className={s.page}>
      <div data-tour="lawyer-clients-search">
        <ListToolbar list={list} noun="matters" searchLabel="Find a member or matter" placeholder="Name, matter or area" />
      </div>
      {(error || (list.initialLoading && list.error)) && (
        <StaggerItem>
          <ErrorNotice audience="lawyer" title={error ? "That did not work" : "Your clients did not load"} onRetry={error ? undefined : list.refresh}>
            {error ?? list.error}
          </ErrorNotice>
        </StaggerItem>
      )}
      {nothing ? (
        <StaggerItem>
          <EmptyState title="No members assigned yet" body="The ILP team assigns members to you after their first booking." />
        </StaggerItem>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={list.items}
            rowKey={(c) => c.id}
            caption="Your members and matters"
            onRowActivate={setOpen}
            loading={list.initialLoading && !list.error}
            loadingMore={list.loadingMore}
            stale={list.stale}
            sort={list.sort}
            onSortChange={list.setSort}
            selectedKey={open?.id ?? null}
            empty={<EmptyState compact title="No match" body="Try another name or matter." />}
          />
          <ListFooter list={list} audience="lawyer" />
        </>
      )}
      {open && <ClientInspector card={open} stages={stages} onMove={(st) => move(open, st)} onClose={() => setOpen(null)} />}
    </div>
  );
}
