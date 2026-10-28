"use client";

import { useMemo } from "react";
import { defineListSchema } from "@/lib/listSchemas";
import { schemaMemorySource } from "@/lib/schemaSource";
import { useSchemaList } from "@/lib/useSchemaList";
import {
  AgingBadge,
  agingDays,
  Board,
  BoardSkeleton,
  type BoardCardModel,
  type BoardColumnDef,
  DataTable,
  FilterBar,
  ListFooter,
  StatusPill,
  useBoardController,
  type Column,
} from "@/components/ui";
import { NOW } from "./sampleData";
import s from "./BoardGallery.module.scss";

interface DemoMatter {
  id: string;
  member: string;
  title: string;
  area: string;
  country: string;
  stage: string;
  stageEnteredAt: string;
  lawyer: string | null;
  valueCents: number | null;
  nextStep: string | null;
  profile: number;
  placeholder?: boolean;
}

const ago = (d: number) => new Date(NOW.getTime() - d * 86_400_000).toISOString();

/** Sample matters for the gallery only (realistic names, organic figures). */
const MATTERS: DemoMatter[] = [
  { id: "d1", member: "Karen Whitfield", title: "S.A. annual corporation tax", area: "Corporate", country: "CR", stage: "intake", stageEnteredAt: ago(2), lawyer: "Andrea Vargas Mora", valueCents: 68000, nextStep: "Send the 2025 book of minutes", profile: 0.86 },
  { id: "d2", member: "Douglas Prentice", title: "Temporary residency renewal", area: "Immigration", country: "CR", stage: "intake", stageEnteredAt: ago(9), lawyer: null, valueCents: null, nextStep: null, profile: 0.62 },
  { id: "d3", member: "Linda Okafor", title: "Tamarindo condo title review", area: "Property", country: "CR", stage: "review", stageEnteredAt: ago(17), lawyer: "Andrea Vargas Mora", valueCents: 124500, nextStep: "Registry study ordered", profile: 0.43 },
  { id: "d4", member: "Robert Haskins", title: "Vehicle marchamo and transfer", area: "Vehicle", country: "PA", stage: "review", stageEnteredAt: ago(1), lawyer: "Jorge Batista Ruiz", valueCents: 21000, nextStep: "Member signs the transfer", profile: 0.29, placeholder: true },
  { id: "d5", member: "Susan Marchetti", title: "Will under Costa Rican law", area: "Family", country: "CR", stage: "filing", stageEnteredAt: ago(6), lawyer: "Andrea Vargas Mora", valueCents: 45000, nextStep: "Notary appointment", profile: 0.71 },
  { id: "d6", member: "Thomas Albright", title: "Rental contract for a Escazú house", area: "Property", country: "CR", stage: "filing", stageEnteredAt: ago(12), lawyer: "Lucía Hernández Soto", valueCents: 33500, nextStep: "Owner signs the lease", profile: 0.94 },
];

const COLUMNS: BoardColumnDef[] = [
  { id: "intake", label: "Intake", limitDays: 7 },
  { id: "review", label: "Lawyer review", limitDays: 14 },
  { id: "filing", label: "Filing", limitDays: 21 },
  { id: "closed", label: "Closed" },
];

const SCHEMA = defineListSchema({
  id: "ui-gallery-matters",
  fields: [
    { key: "member", label: "Member", type: "text", searchable: true, sortable: true },
    { key: "title", label: "Matter", type: "text", searchable: true, sortable: true },
    { key: "stage", label: "Stage", type: "enum", serverParam: "stage", options: COLUMNS.map((c) => ({ value: c.id, label: c.label })), quick: true },
    { key: "area", label: "Area", type: "enum", quick: true },
    { key: "country", label: "Country", type: "country" },
    { key: "lawyer", label: "Lawyer", type: "person", quick: true },
    { key: "valueCents", label: "Legal fees", type: "number", unit: "cents", sortable: true },
    { key: "stageEnteredAt", label: "In stage since", type: "date", sortable: true },
    { key: "placeholder", label: "Placeholder", type: "boolean", defaultVisible: false },
  ],
});

const usd = (c: number) => `US$${(c / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
const source = schemaMemorySource<DemoMatter>(SCHEMA, async () => {
  await new Promise((r) => setTimeout(r, 120));
  return MATTERS;
});
const keyOf = (m: DemoMatter) => m.id;
const stageOf = (m: DemoMatter) => m.stage;

function card(m: DemoMatter): BoardCardModel {
  return {
    title: m.member,
    subtitle: m.title,
    meta: [m.area, m.country],
    person: m.lawyer ? { name: m.lawyer, role: "Lawyer" } : null,
    value: m.valueCents != null ? usd(m.valueCents) : null,
    pills: (
      <>
        <AgingBadge since={m.stageEnteredAt} now={NOW} />
        {!m.lawyer && <StatusPill size="sm" tone="warning" label="No lawyer" />}
      </>
    ),
    due: m.nextStep ? { text: `Next: ${m.nextStep}` } : { text: "No next step set", tone: "warning" },
    progress: { value: m.profile, label: `Profile ${Math.round(m.profile * 100)}% complete` },
    placeholder: m.placeholder,
  };
}

/** /ui: the shared board (BOARDS) and the schema filter bar (FILTERS) over sample matters. */
export function BoardGallery() {
  const controller = useBoardController<DemoMatter>(stageOf, keyOf);
  const sl = useSchemaList<DemoMatter>({ schema: SCHEMA, key: "ui-gallery-matters", source, pageSize: 4, keyOf, defaultSort: { key: "member", dir: "asc" } });
  const filters = useMemo(() => {
    const f = { ...sl.list.filters };
    delete f.stage;
    return f;
  }, [sl.list.filters]);
  return (
    <div className={s.wrap}>
      <p className={s.note}>
        Drag a card, or focus it and press Space, then the arrow keys and Space again. Moving a card into Closed fails on purpose: the card goes back
        and a toast explains why. Density and collapsed columns are remembered in this browser.
      </p>
      <FilterBar list={sl} noun="matters" placeholder="Member or matter" hideCount hide={["stage"]} />
      <Board<DemoMatter>
        id="ui-gallery"
        label="Sample matters by stage"
        noun="matters"
        columns={COLUMNS}
        source={source}
        filters={filters}
        query={sl.list.activeQuery}
        sort={{ key: "stageEnteredAt", dir: "asc" }}
        pageSize={3}
        keyOf={keyOf}
        stageOf={stageOf}
        card={card}
        aging={(m, col) => {
          const d = agingDays(m.stageEnteredAt, NOW);
          const limit = col.limitDays ?? 14;
          return d >= limit ? "overdue" : d >= limit / 2 ? "warn" : "fresh";
        }}
        controller={controller}
        optimistic={(m, to) => ({ ...m, stage: to, stageEnteredAt: NOW.toISOString() })}
        move={async (m, to) => {
          await new Promise((r) => setTimeout(r, 400));
          if (to === "closed") throw new Error("Close a matter from its page, after the last step is confirmed.");
          const row = MATTERS.find((x) => x.id === m.id);
          if (row) {
            row.stage = to;
            row.stageEnteredAt = NOW.toISOString();
          }
          return { ...m, stage: to, stageEnteredAt: NOW.toISOString() };
        }}
        audience="staff"
      />
      <h3 className={s.h3}>Loading</h3>
      <BoardSkeleton columns={4} cards={2} />
    </div>
  );
}

const COLS: Column<DemoMatter>[] = [
  { key: "member", header: "Member", render: (m) => m.member, sortable: true },
  { key: "title", header: "Matter", render: (m) => m.title, sortable: true, width: "wide" },
  { key: "stage", header: "Stage", render: (m) => COLUMNS.find((c) => c.id === m.stage)?.label ?? m.stage },
  { key: "area", header: "Area", render: (m) => m.area, hideOnMobile: true },
  { key: "lawyer", header: "Lawyer", render: (m) => m.lawyer ?? "Unassigned", hideOnMobile: true },
  { key: "valueCents", header: "Legal fees", render: (m) => (m.valueCents != null ? usd(m.valueCents) : "Not priced"), sortable: true, align: "end" },
  { key: "placeholder", header: "Placeholder", render: (m) => (m.placeholder ? "Yes" : "No"), hideOnMobile: true },
];

/** /ui: FilterBar on a table: quick filters, More filters, chips, saved views, columns, paging. */
export function FilterGallery() {
  const sl = useSchemaList<DemoMatter>({ schema: SCHEMA, key: "ui-gallery-table", rows: MATTERS, pageSize: 4, keyOf, defaultSort: { key: "member", dir: "asc" } });
  return (
    <div className={s.wrap}>
      <p className={s.note}>
        Every filter comes from the list&apos;s schema (lib/listSchemas.ts): quick filters for the most used fields, More filters for all of them, chips to
        remove one or all, saved views and a column chooser kept in this browser, and Load more for the next page.
      </p>
      <FilterBar list={sl} noun="matters" placeholder="Member or matter" columns={COLS.map((c) => ({ key: c.key, header: c.header }))} />
      <DataTable
        caption="Sample matters"
        columns={sl.visibleColumns(COLS)}
        rows={sl.list.items}
        rowKey={keyOf}
        sort={sl.list.sort}
        onSortChange={sl.list.setSort}
        stale={sl.list.stale}
        empty="No matter matches these filters."
      />
      <ListFooter list={sl.list} audience="staff" auto={false} />
    </div>
  );
}
