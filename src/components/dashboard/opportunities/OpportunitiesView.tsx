"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { OpportunityStage } from "@/lib/contracts";
import {
  Button,
  Checkbox,
  DataTable,
  EmptyState,
  Loadable,
  SearchInput,
  Select,
  StatTile,
  StaggerItem,
  StatusPill,
  Tabs,
  type Column,
} from "@/components/ui";
import { useStaff } from "../staff/StaffSession";
import { ErrorText, PageHeader } from "../staff/PageHeader";
import { dueLabel, pct, shortDate, usd } from "../staff/format";
import { OpportunitiesBoard } from "./OpportunitiesBoard";
import { OpportunityDrawer } from "./OpportunityDrawer";
import {
  STAGES,
  STAGE_LABEL,
  STAGE_TONE,
  areaLabel,
  isClosedStage,
  oppApi,
  type OpportunityRow,
  type OpportunitySummary,
} from "./oppApi";
import { OpportunityBoardSkeleton, OpportunitySummarySkeleton } from "./OpportunitiesSkeleton";
import s from "./opportunities.module.scss";

/** Staff Opportunities: summary strip, filters, board by stage and a list view, one drawer. */
export default function OpportunitiesView() {
  const { role, isAdmin } = useStaff();
  const [owner, setOwner] = useState(role === "csm" ? "me" : "all");
  const [area, setArea] = useState("");
  const [stage, setStage] = useState("");
  const [q, setQ] = useState("");
  const [openOnly, setOpenOnly] = useState(false);
  const [items, setItems] = useState<OpportunityRow[] | null>(null);
  const [owners, setOwners] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [summary, setSummary] = useState<OpportunitySummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<{ row: OpportunityRow; stage?: OpportunityStage } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [backfill, setBackfill] = useState<string | null>(null);

  const load = useCallback(() => {
    const f = { owner: owner === "all" ? undefined : owner, area: area || undefined };
    Promise.all([oppApi.list(f), oppApi.summary(f)])
      .then(([l, sm]) => {
        setItems(l.items);
        setOwners(l.owners);
        setAreas(l.areas);
        setSummary(sm);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Opportunities could not be loaded."));
  }, [owner, area]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (items ?? []).filter((o) => {
      if (needle && !`${o.title} ${o.memberName} ${o.area} ${o.ownerEmail ?? ""}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [items, q]);

  const listRows = visible.filter((o) => (!stage || o.stage === stage) && (!openOnly || !isClosedStage(o.stage)));

  function replace(row: OpportunityRow) {
    setItems((prev) => (prev ? prev.map((x) => (x.id === row.id ? row : x)) : prev));
    setOpen((cur) => (cur && cur.row.id === row.id ? { row } : cur));
    oppApi.summary({ owner: owner === "all" ? undefined : owner, area: area || undefined }).then(setSummary).catch(() => undefined);
  }

  async function move(o: OpportunityRow, to: OpportunityStage) {
    setMoveError(null);
    if (isClosedStage(to)) {
      setOpen({ row: o, stage: to });
      return;
    }
    setBusyId(o.id);
    try {
      replace(await oppApi.move(o.id, to));
    } catch (e) {
      setMoveError(e instanceof Error ? e.message : "The opportunity could not be moved.");
    } finally {
      setBusyId(null);
    }
  }

  const columns: Column<OpportunityRow>[] = [
    { key: "title", header: "Opportunity", width: "wide", sortValue: (o) => o.title, render: (o) => <strong>{o.title}</strong> },
    { key: "member", header: "Member", sortValue: (o) => o.memberName, render: (o) => o.memberName },
    {
      key: "stage",
      header: "Stage",
      sortValue: (o) => STAGES.findIndex((x) => x.id === o.stage),
      render: (o) => <StatusPill size="sm" label={STAGE_LABEL[o.stage]} tone={STAGE_TONE[o.stage]} />,
    },
    { key: "value", header: "Legal fees", align: "end", sortValue: (o) => o.valueCents ?? -1, render: (o) => (o.valueCents != null ? usd(o.valueCents, true) : "—") },
    { key: "area", header: "Area", hideOnMobile: true, sortValue: (o) => o.area, render: (o) => areaLabel(o.area) },
    {
      key: "next",
      header: "Next action",
      hideOnMobile: true,
      sortValue: (o) => o.nextAction?.dueAt ?? "9999",
      render: (o) => (o.nextAction ? `${o.nextAction.what}${o.nextAction.dueAt ? ` · ${dueLabel(o.nextAction.dueAt).text}` : ""}` : "—"),
    },
    { key: "owner", header: "Owner", hideOnMobile: true, sortValue: (o) => o.ownerEmail ?? "", render: (o) => o.ownerEmail ?? "Unassigned" },
    { key: "updated", header: "Updated", hideOnMobile: true, sortValue: (o) => o.updatedAt, render: (o) => shortDate(o.updatedAt) },
  ];

  const ownerOptions = [
    { value: "me", label: "Mine" },
    { value: "all", label: "Everyone" },
    ...owners.map((e) => ({ value: e, label: e })),
  ];
  const areaChoices = [{ value: "", label: "All areas" }, ...areas.map((a) => ({ value: a, label: areaLabel(a) }))];

  const empty = (
    <EmptyState
      compact
      title="No opportunities here yet"
      body="They open when a lawyer's handoff carries commercial notes, or from a member page with “New opportunity”."
      action={
        isAdmin ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={async () => {
              setBackfill(null);
              try {
                const r = await oppApi.backfill();
                setBackfill(r.created ? `${r.created} opportunities created from past handoffs.` : "No past handoff needed one.");
                load();
              } catch (e) {
                setBackfill(e instanceof Error ? e.message : "Could not import.");
              }
            }}
          >
            Create from past handoffs
          </Button>
        ) : undefined
      }
    />
  );

  return (
    <>
      <PageHeader title="Opportunities" sub="Paid legal work beyond the membership, from first mention to won or lost. Values are legal fees (GMV), shown to staff only." />

      <Loadable loading={!summary && !error} label="Loading the pipeline summary" skeleton={<OpportunitySummarySkeleton />}>
        {() => summary && <SummaryStrip summary={summary} />}
      </Loadable>

      <div className={s.filters} role="search" aria-label="Filter opportunities">
        <SearchInput className={s.search} label="Search" value={q} onValueChange={setQ} placeholder="Title, member or owner" />
        <Select label="Owner" value={owner} onChange={(e) => setOwner(e.target.value)} options={ownerOptions} />
        <Select label="Area" value={area} onChange={(e) => setArea(e.target.value)} options={areaChoices} />
      </div>

      {error && (
        <StaggerItem>
          <ErrorText>{error}</ErrorText>
        </StaggerItem>
      )}
      {moveError && <ErrorText>{moveError}</ErrorText>}
      {backfill && (
        <p className={s.meta} role="status">
          {backfill}
        </p>
      )}

      <Tabs
        label="Opportunity views"
        tabs={[
          {
            id: "board",
            label: "Board",
            content: (
              <Loadable loading={items === null && !error} label="Loading opportunities" skeleton={<OpportunityBoardSkeleton />}>
                {() =>
                  items === null ? null : items.length === 0 ? (
                    <StaggerItem>{empty}</StaggerItem>
                  ) : (
                    <OpportunitiesBoard items={visible} busyId={busyId} onOpen={(o) => setOpen({ row: o })} onMove={move} />
                  )
                }
              </Loadable>
            ),
          },
          {
            id: "list",
            label: "List",
            content: (
              <div className={s.listWrap}>
                <div className={s.listFilters}>
                  <Select
                    label="Stage"
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    options={[{ value: "", label: "All stages" }, ...STAGES.map((x) => ({ value: x.id, label: x.label }))]}
                  />
                  <Checkbox label="Open only" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} />
                </div>
                <DataTable
                  caption="Opportunities"
                  columns={columns}
                  rows={listRows}
                  rowKey={(o) => o.id}
                  loading={items === null && !error}
                  defaultSort={{ key: "next", dir: "asc" }}
                  selectedKey={open?.row.id ?? null}
                  onRowActivate={(o) => setOpen({ row: o })}
                  empty={items && items.length === 0 ? empty : "No opportunity matches these filters."}
                />
              </div>
            ),
          },
        ]}
      />

      <OpportunityDrawer opportunity={open?.row ?? null} initialStage={open?.stage ?? null} onClose={() => setOpen(null)} onChanged={replace} />
    </>
  );
}

function SummaryStrip({ summary }: { summary: OpportunitySummary }) {
  return (
    <div className={s.summary}>
      <StatTile size="lg" label="Open pipeline" value={usd(summary.open.valueCents, true)} hint={`${summary.open.count} open · legal fees (GMV)`} />
      <div className={s.summarySmall}>
        <StatTile label="Win rate" value={summary.winRate == null ? "—" : pct(summary.winRate)} hint={`${summary.byStage.won.count} won · ${summary.byStage.lost.count} lost`} />
        <StatTile label="Days to win" value={summary.avgDaysToWin == null ? "—" : String(summary.avgDaysToWin)} hint={summary.avgDaysToClose == null ? "average" : `${summary.avgDaysToClose} to close, won or lost`} />
        <StatTile label="Won legal fees" value={usd(summary.legalGmvWonCents, true)} hint="GMV, not ILP revenue" />
        <StatTile label="ILP share on won quotes" value={usd(summary.platformRevenueCents, true)} hint="Platform revenue" />
      </div>
      <dl className={s.byStage} aria-label="Value by stage">
        {STAGES.map((st) => (
          <div key={st.id} className={s.byStageItem}>
            <dt>{st.label}</dt>
            <dd>
              <span className={s.byStageValue}>{usd(summary.byStage[st.id].valueCents, true)}</span>
              <span className={s.meta}>{summary.byStage[st.id].count}</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
