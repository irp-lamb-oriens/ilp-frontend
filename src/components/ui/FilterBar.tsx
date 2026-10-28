"use client";

import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import {
  type FilterValue,
  isActiveFilter,
  isFilterable,
  type ListField,
  type ListOption,
  NONE,
  sortKeyOf,
} from "@/lib/listSchemas";
import type { SchemaList } from "@/lib/useSchemaList";
import { Button } from "./Button";
import { Checkbox } from "./Checkbox";
import { cx } from "./cx";
import { Drawer } from "./Drawer";
import { IconBookmark, IconChevronDown, IconClose, IconColumns, IconFilter } from "./icons";
import { ListToolbar, type ListSortOption } from "./ListToolbar";
import { Popover } from "./Popover";
import s from "./FilterBar.module.scss";

export interface FilterBarProps<T> {
  /** The schema list (lib/useSchemaList). */
  list: SchemaList<T>;
  /** What the rows are, plural ("members"). */
  noun: string;
  searchLabel?: string;
  placeholder?: string;
  /** Extra controls in the toolbar row (a scope toggle, a country select). */
  children?: ReactNode;
  /** Sort choices; "schema" offers every sortable field. Tables with sortable headers leave it out. */
  sortOptions?: ListSortOption[] | "schema";
  hideCount?: boolean;
  /** Table columns for the column chooser. */
  columns?: Array<{ key: string; header: string }>;
  /** Options or labels the page knows better than the data (stage labels, lawyer names). */
  options?: Record<string, ListOption[]>;
  /** Fields not offered as filters here (a page control already covers them). */
  hide?: string[];
  /** Saved views. Default true. */
  views?: boolean;
  className?: string;
}

const QUICK_MAX = 4;
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

function fmtDate(v: string): string {
  const t = Date.parse(v.length === 10 ? `${v}T00:00:00Z` : v);
  return Number.isNaN(t) ? v : dateFmt.format(new Date(t));
}

function fmtNumber(field: ListField, v: string): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return v;
  if (field.unit === "cents") return money.format(n / 100);
  if (field.unit === "percent") return `${n}%`;
  if (field.unit === "minutes") return `${n} min`;
  if (field.unit === "days") return `${n} days`;
  return String(n);
}

const enumLike = (f: ListField) => f.type === "enum" || f.type === "multi-enum" || f.type === "person" || f.type === "country";
const noneLabel = (f: ListField) => (f.type === "person" ? "Unassigned" : "None");

/** Plain-language summary of one filter, for chips: "Stage: Intake, Review". */
export function describeFilter(field: ListField, f: FilterValue, labelOf: (v: string) => string): string {
  switch (f.op) {
    case "eq":
      return `${field.label}: ${field.type === "date" ? fmtDate(f.value) : field.type === "number" ? fmtNumber(field, f.value) : labelOf(f.value)}`;
    case "in":
      return `${field.label}: ${f.values.slice(0, 2).map(labelOf).join(", ")}${f.values.length > 2 ? ` and ${f.values.length - 2} more` : ""}`;
    case "contains":
      return `${field.label} contains “${f.value}”`;
    case "boolean":
      return `${field.label}: ${f.value ? "Yes" : "No"}`;
    case "before":
      return `${field.label}: before ${fmtDate(f.value)}`;
    case "after":
      return `${field.label}: on or after ${fmtDate(f.value)}`;
    case "range": {
      const show = (v: string) => (field.type === "date" || field.type === "daterange" ? fmtDate(v) : fmtNumber(field, v));
      if (f.min && f.max) return `${field.label}: ${show(f.min)} to ${show(f.max)}`;
      if (f.min) return `${field.label}: ${show(f.min)} or more`;
      return `${field.label}: up to ${show(f.max ?? "")}`;
    }
  }
}

/**
 * FILTERS: the schema-driven filter bar. Search and the count (ListToolbar),
 * quick filters for the most used fields, "More filters" with every field,
 * active filters as removable chips, saved views and a column chooser.
 * Everything renders from the list's schema, so any list gets it by
 * declaring its fields (lib/listSchemas.ts).
 */
export function FilterBar<T>({ list: sl, noun, searchLabel, placeholder, children, sortOptions, hideCount, columns, options, hide, views = true, className }: FilterBarProps<T>) {
  const { setColumnCatalog } = sl;
  const columnsKey = columns ? columns.map((c) => `${c.key}:${c.header}`).join("|") : "";
  useEffect(() => {
    if (columns) setColumnCatalog(columns);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnsKey, setColumnCatalog]);

  const fields = useMemo(() => sl.schema.fields.filter((f) => isFilterable(f) && !hide?.includes(f.key)), [sl.schema, hide]);
  const quick = useMemo(() => {
    const marked = fields.filter((f) => f.quick);
    return (marked.length ? marked : fields.filter((f) => enumLike(f) || f.type === "boolean")).slice(0, QUICK_MAX);
  }, [fields]);
  const optionsFor = useMemo(() => {
    return (f: ListField): ListOption[] => {
      const local = options?.[f.key];
      const remote = f.options ?? [];
      if (!local) return remote;
      const counts = new Map(remote.map((o) => [o.value, o.count]));
      const known = new Set(local.map((o) => o.value));
      return [...local.map((o) => ({ ...o, count: counts.get(o.value) ?? o.count })), ...remote.filter((o) => !known.has(o.value))];
    };
  }, [options]);
  const labelFor = (f: ListField) => (v: string) => (v === NONE ? noneLabel(f) : optionsFor(f).find((o) => o.value === v)?.label ?? v);

  const active = fields.filter((f) => isActiveFilter(sl.filterState[f.key]));
  const [more, setMore] = useState(false);
  const sorts: ListSortOption[] | undefined =
    sortOptions === "schema"
      ? sl.schema.fields.flatMap((f) => {
          const key = sortKeyOf(f);
          if (!key) return [];
          const word = f.type === "date" ? ["oldest first", "newest first"] : f.type === "number" ? ["low to high", "high to low"] : ["A to Z", "Z to A"];
          return [
            { value: `${key}:asc`, label: `${f.label}, ${word[0]}` },
            { value: `${key}:desc`, label: `${f.label}, ${word[1]}` },
          ];
        })
      : sortOptions;

  return (
    <div className={cx(s.bar, className)}>
      <ListToolbar list={sl.list} noun={noun} searchLabel={searchLabel} placeholder={placeholder} sortOptions={sorts} hideCount={hideCount}>
        {children}
      </ListToolbar>
      {(fields.length > 0 || views || columns) && (
        <div className={s.row} role="group" aria-label={`Filter ${noun}`}>
          {quick.map((f) => (
            <Popover
              key={f.key}
              label={
                <>
                  <span className={s.triggerText}>{isActiveFilter(sl.filterState[f.key]) ? describeFilter(f, sl.filterState[f.key], labelFor(f)) : f.label}</span>
                  <IconChevronDown />
                </>
              }
              ariaLabel={`Filter by ${f.label.toLowerCase()}`}
              active={isActiveFilter(sl.filterState[f.key])}
              width={enumLike(f) ? "sm" : "md"}
            >
              {(close) => (
                <FieldPanel
                  field={f}
                  value={sl.filterState[f.key]}
                  options={optionsFor(f)}
                  onApply={(v) => {
                    sl.setFieldFilter(f.key, v);
                    close();
                  }}
                />
              )}
            </Popover>
          ))}
          {fields.length > quick.length && (
            <button type="button" className={cx(s.ghostBtn, active.some((f) => !quick.includes(f)) && s.ghostOn)} onClick={() => setMore(true)} aria-haspopup="dialog">
              <IconFilter />
              More filters
              {active.length > 0 && <span className={s.badge}>{active.length}</span>}
            </button>
          )}
          <span className={s.spacer} />
          {views && <ViewsMenu sl={sl} />}
          {columns && columns.length > 1 && <ColumnsMenu sl={sl} columns={columns} />}
        </div>
      )}
      {active.length > 0 && (
        <ul className={s.chips} aria-label="Active filters">
          {active.map((f) => (
            <li key={f.key}>
              <button type="button" className={s.chip} onClick={() => sl.setFieldFilter(f.key, null)} aria-label={`Remove filter ${describeFilter(f, sl.filterState[f.key], labelFor(f))}`}>
                <span className={s.chipText}>{describeFilter(f, sl.filterState[f.key], labelFor(f))}</span>
                <IconClose />
              </button>
            </li>
          ))}
          {active.length > 1 && (
            <li>
              <button type="button" className={s.clearAll} onClick={sl.clearFilters}>
                Clear all filters
              </button>
            </li>
          )}
        </ul>
      )}
      <MoreFilters open={more} onClose={() => setMore(false)} sl={sl} fields={fields} optionsFor={optionsFor} noun={noun} />
    </div>
  );
}

// ── Editors ─────────────────────────────────────────────────────────────────

type Draft = FilterValue | null;

/** One field's editor with Apply and Clear (used by quick filters). */
function FieldPanel({ field, value, options, onApply }: { field: ListField; value: FilterValue | undefined; options: ListOption[]; onApply: (v: Draft) => void }) {
  const [draft, setDraft] = useState<Draft>(value ?? null);
  return (
    <form
      className={s.panel}
      onSubmit={(e) => {
        e.preventDefault();
        onApply(draft);
      }}
    >
      <FieldEditor field={field} value={draft} options={options} onChange={setDraft} />
      <div className={s.panelActions}>
        <Button size="sm" variant="ghost" onClick={() => onApply(null)}>
          Clear
        </Button>
        <Button size="sm" type="submit">
          Apply
        </Button>
      </div>
    </form>
  );
}

/** The input for one field, by type. Controlled; null is "no filter". */
export function FieldEditor({ field, value, options, onChange, showLabel }: { field: ListField; value: Draft; options: ListOption[]; onChange: (v: Draft) => void; showLabel?: boolean }) {
  const id = useId();
  const ops = field.operators ?? [];
  const legend = showLabel ? <legend className={s.legend}>{field.label}</legend> : <legend className={s.srOnly}>{field.label}</legend>;

  if (field.type === "boolean") {
    const cur = value?.op === "boolean" ? value.value : null;
    return (
      <fieldset className={s.fieldset}>
        {legend}
        <div className={s.segs} role="group">
          {([["Any", null], ["Yes", true], ["No", false]] as const).map(([label, v]) => (
            <button key={label} type="button" className={s.seg} aria-pressed={cur === v} onClick={() => onChange(v === null ? null : { op: "boolean", value: v })}>
              {label}
            </button>
          ))}
        </div>
      </fieldset>
    );
  }

  if (enumLike(field) && (options.length > 0 || field.type === "person")) {
    const picked = value?.op === "in" ? value.values : value?.op === "eq" ? [value.value] : [];
    const all = field.type === "person" && !options.some((o) => o.value === NONE) ? [...options, { value: NONE, label: noneLabel(field) }] : options;
    return <OptionList field={field} legend={legend} options={all} picked={picked} onChange={(vals) => onChange(vals.length ? { op: "in", values: vals } : null)} />;
  }

  if (field.type === "text" || enumLike(field)) {
    const text = value && (value.op === "contains" || value.op === "eq") ? value.value : "";
    const op = ops.includes("contains") ? "contains" : "eq";
    return (
      <fieldset className={s.fieldset}>
        {legend}
        <label className={s.inputLabel} htmlFor={id}>
          {op === "contains" ? "Contains" : "Is"}
        </label>
        <input id={id} className={s.input} value={text} onChange={(e) => onChange(e.target.value ? { op, value: e.target.value } : null)} />
      </fieldset>
    );
  }

  if (field.type === "date" || field.type === "daterange") {
    const mode: "range" | "before" | "after" = value?.op === "before" || value?.op === "after" ? value.op : "range";
    const min = value?.op === "range" ? value.min ?? "" : value?.op === "after" ? value.value : "";
    const max = value?.op === "range" ? value.max ?? "" : value?.op === "before" ? value.value : "";
    const set = (m: typeof mode, a: string, b: string) => {
      if (m === "before") onChange(b ? { op: "before", value: b } : null);
      else if (m === "after") onChange(a ? { op: "after", value: a } : null);
      else onChange(a || b ? { op: "range", ...(a ? { min: a } : {}), ...(b ? { max: b } : {}) } : null);
    };
    const modes = (["range", "before", "after"] as const).filter((m) => ops.includes(m));
    return (
      <fieldset className={s.fieldset}>
        {legend}
        {modes.length > 1 && (
          <div className={s.segs} role="group" aria-label="Kind of date filter">
            {modes.map((m) => (
              <button key={m} type="button" className={s.seg} aria-pressed={mode === m} onClick={() => set(m, m === "before" ? "" : min || max, m === "after" ? "" : max || min)}>
                {m === "range" ? "Between" : m === "before" ? "Before" : "On or after"}
              </button>
            ))}
          </div>
        )}
        <div className={s.pair}>
          {mode !== "before" && (
            <label className={s.inputLabel}>
              {mode === "after" ? "Date" : "From"}
              <input type="date" className={s.input} value={min.slice(0, 10)} onChange={(e) => set(mode, e.target.value, max)} />
            </label>
          )}
          {mode !== "after" && (
            <label className={s.inputLabel}>
              {mode === "before" ? "Date" : "To"}
              <input type="date" className={s.input} value={max.slice(0, 10)} onChange={(e) => set(mode, min, e.target.value)} />
            </label>
          )}
        </div>
      </fieldset>
    );
  }

  // number / numberrange
  const cents = field.unit === "cents";
  const toShown = (v?: string) => (v === undefined || v === "" ? "" : cents ? String(Number(v) / 100) : v);
  const fromShown = (v: string) => (v === "" ? "" : cents ? String(Math.round(Number(v) * 100)) : v);
  const min = value?.op === "range" ? toShown(value.min) : value?.op === "eq" ? toShown(value.value) : "";
  const max = value?.op === "range" ? toShown(value.max) : value?.op === "eq" ? toShown(value.value) : "";
  const set = (a: string, b: string) => {
    const lo = fromShown(a);
    const hi = fromShown(b);
    onChange(lo || hi ? { op: "range", ...(lo ? { min: lo } : {}), ...(hi ? { max: hi } : {}) } : null);
  };
  return (
    <fieldset className={s.fieldset}>
      {legend}
      <div className={s.pair}>
        <label className={s.inputLabel}>
          {cents ? "From (US$)" : "From"}
          <input type="number" inputMode="decimal" className={s.input} value={min} onChange={(e) => set(e.target.value, max)} />
        </label>
        <label className={s.inputLabel}>
          {cents ? "To (US$)" : "To"}
          <input type="number" inputMode="decimal" className={s.input} value={max} onChange={(e) => set(min, e.target.value)} />
        </label>
      </div>
    </fieldset>
  );
}

function OptionList({ field, legend, options, picked, onChange }: { field: ListField; legend: ReactNode; options: ListOption[]; picked: string[]; onChange: (v: string[]) => void }) {
  const [find, setFind] = useState("");
  const shown = find ? options.filter((o) => o.label.toLowerCase().includes(find.toLowerCase())) : options;
  const toggle = (v: string, on: boolean) => onChange(on ? [...picked.filter((x) => x !== v), v] : picked.filter((x) => x !== v));
  return (
    <fieldset className={s.fieldset}>
      {legend}
      {options.length > 8 && (
        <input className={s.input} value={find} onChange={(e) => setFind(e.target.value)} placeholder={`Find a ${field.label.toLowerCase()}`} aria-label={`Find a ${field.label.toLowerCase()}`} />
      )}
      <div className={s.options}>
        {shown.map((o) => (
          <Checkbox
            key={o.value}
            className={s.option}
            checked={picked.includes(o.value)}
            onChange={(e) => toggle(o.value, e.target.checked)}
            label={
              <span className={s.optionLabel}>
                <span>{o.label}</span>
                {o.count !== undefined && <span className={s.optionCount}>{o.count}</span>}
              </span>
            }
          />
        ))}
        {shown.length === 0 && <p className={s.muted}>No match.</p>}
      </div>
    </fieldset>
  );
}

// ── More filters ────────────────────────────────────────────────────────────

function MoreFilters<T>({ open, onClose, sl, fields, optionsFor, noun }: { open: boolean; onClose: () => void; sl: SchemaList<T>; fields: ListField[]; optionsFor: (f: ListField) => ListOption[]; noun: string }) {
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  useEffect(() => {
    if (open) setDrafts(Object.fromEntries(fields.map((f) => [f.key, sl.filterState[f.key] ?? null])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const apply = () => {
    for (const f of fields) {
      const next = drafts[f.key] ?? null;
      const cur = sl.filterState[f.key] ?? null;
      if (JSON.stringify(next) !== JSON.stringify(cur)) sl.setFieldFilter(f.key, next);
    }
    onClose();
  };
  return (
    <Drawer
      open={open}
      onClose={onClose}
      confirmClose={false}
      title="Filters"
      subtitle={`Every field you can filter ${noun} by. Results update when you choose Show results.`}
      footer={
        <div className={s.drawerActions}>
          <Button variant="ghost" onClick={() => setDrafts(Object.fromEntries(fields.map((f) => [f.key, null])))}>
            Clear all
          </Button>
          <Button onClick={apply}>Show results</Button>
        </div>
      }
    >
      <div className={s.drawerBody}>
        {fields.map((f) => (
          <FieldEditor key={f.key} field={f} value={drafts[f.key] ?? null} options={optionsFor(f)} onChange={(v) => setDrafts((d) => ({ ...d, [f.key]: v }))} showLabel />
        ))}
      </div>
    </Drawer>
  );
}

// ── Saved views ─────────────────────────────────────────────────────────────

function ViewsMenu<T>({ sl }: { sl: SchemaList<T> }) {
  const [name, setName] = useState("");
  const { views } = sl;
  const label = views.current === null ? "Default" : views.current ? views.current.name : "Unsaved view";
  return (
    <Popover
      align="end"
      width="md"
      ariaLabel={`Saved views. Current: ${label}`}
      label={
        <>
          <IconBookmark />
          <span className={s.triggerText}>{label}</span>
          <IconChevronDown />
        </>
      }
    >
      {(close) => (
        <div className={s.panel}>
          <p className={s.panelTitle}>Saved views</p>
          <ul className={s.viewList}>
            <li>
              <button
                type="button"
                className={s.viewBtn}
                aria-pressed={views.current === null}
                onClick={() => {
                  views.select(null);
                  close();
                }}
              >
                Default
              </button>
            </li>
            {views.state.views.map((v) => (
              <li key={v.id} className={s.viewRow}>
                <button
                  type="button"
                  className={s.viewBtn}
                  aria-pressed={views.current?.id === v.id}
                  onClick={() => {
                    views.select(v.id);
                    close();
                  }}
                >
                  {v.name}
                </button>
                <button type="button" className={s.iconBtn} aria-label={`Delete the view ${v.name}`} onClick={() => views.remove(v.id)}>
                  <IconClose />
                </button>
              </li>
            ))}
          </ul>
          <form
            className={s.saveRow}
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return;
              views.save(name);
              setName("");
              close();
            }}
          >
            <label className={s.inputLabel}>
              Save the current search, filters and sort as
              <input className={s.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="For example: My renewals this month" maxLength={60} />
            </label>
            <Button size="sm" type="submit" disabled={!name.trim()}>
              Save view
            </Button>
          </form>
          <p className={s.muted}>Views are kept in this browser, for you only.</p>
        </div>
      )}
    </Popover>
  );
}

// ── Columns ─────────────────────────────────────────────────────────────────

function ColumnsMenu<T>({ sl, columns }: { sl: SchemaList<T>; columns: Array<{ key: string; header: string }> }) {
  const hidden = new Set(sl.hiddenColumns);
  const shownCount = columns.filter((c) => !hidden.has(c.key)).length;
  return (
    <Popover
      align="end"
      ariaLabel="Choose columns"
      label={
        <>
          <IconColumns />
          <span className={s.triggerText}>Columns</span>
        </>
      }
    >
      <div className={s.panel}>
        <p className={s.panelTitle}>Show columns</p>
        <div className={s.options}>
          {columns.map((c) => (
            <Checkbox
              key={c.key}
              className={s.option}
              label={c.header || c.key}
              checked={!hidden.has(c.key)}
              disabled={!hidden.has(c.key) && shownCount === 1}
              onChange={(e) => sl.setColumnHidden(c.key, !e.target.checked)}
            />
          ))}
        </div>
        <Button size="sm" variant="ghost" onClick={sl.resetColumns}>
          Reset columns
        </Button>
      </div>
    </Popover>
  );
}

export default FilterBar;
