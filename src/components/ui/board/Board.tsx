"use client";

/**
 * BOARDS: one board system for every kanban in the three portals
 * (staff Pipeline and Opportunities, lawyer Board). docs/workstreams/LISTS.md, "Boards".
 *
 * - Columns page on their own (one streamed list per stage, "Load more in
 *   this column"), with a sticky header: name, count, value, time limit, an
 *   aging summary bar, search inside the column, collapse (remembered).
 * - Cards: title, one meta line, labelled pills, value, next action, a small
 *   progress bar; comfortable or compact density (remembered per board).
 * - Moves: pointer drag (the card follows the pointer), keyboard drag (Space,
 *   arrows, Space; Esc cancels), and the "Move to…" menu. Every move is
 *   optimistic, rolls back with a toast when the server refuses it, and is
 *   announced to screen readers.
 * - Motion: transform and opacity only; layout moves use framer-motion
 *   layout="position". Reduced motion: no lift, no scale, instant moves.
 */

import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { memo, useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { ListSource } from "@/lib/listSource";
import { type ListSort, useStreamedList } from "@/lib/useStreamedList";
import { Button } from "../Button";
import { cx } from "../cx";
import { ErrorNotice, type NoticeAudience } from "../ErrorNotice";
import { IconChevronLeft, IconChevronRight, IconClose, IconSearch } from "../icons";
import { Skeleton } from "../Skeleton";
import { StatusPill } from "../StatusPill";
import { Toast } from "../Toast";
import { boardKeyboardReducer, KB_IDLE, type KbColumn, type KbState, keyToAction } from "./boardKeyboard";
import MoveToMenu from "./MoveToMenu";
import s from "./Board.module.scss";

export type AgingTone = "fresh" | "warn" | "overdue";

export interface BoardColumnDef {
  id: string;
  label: string;
  /** Every card in the stage (from the list meta); the column shows what it loaded when missing. */
  count?: number | null;
  /** Formatted total value of the stage (opportunities). */
  value?: string | null;
  /** The stage's time limit in days, for the limit indicator. */
  limitDays?: number | null;
}

export interface BoardCardModel {
  title: string;
  subtitle?: string | null;
  /** One meta line: area, country code… */
  meta?: Array<string | null | undefined | false>;
  /** Owner or lawyer, shown as initials with the full name for screen readers. */
  person?: { name: string; role: string } | null;
  /** Labelled pills (StatusPill, AgingBadge). */
  pills?: ReactNode;
  value?: string | null;
  /** Next action or due line. */
  due?: { text: string; tone?: "neutral" | "warning" | "danger" } | null;
  /** Profile completeness or next-step progress, 0..1. */
  progress?: { value: number; label: string } | null;
  placeholder?: boolean;
}

export interface BoardController<T> {
  /** Put a card in its column (top, or at index) and out of the others. */
  place: (item: T, index?: number) => void;
  /** Reload every column. */
  refresh: () => void;
  /** Internal: columns register here. */
  register: (col: string, api: ColumnApi<T> | null) => void;
}

interface ColumnApi<T> {
  update: (fn: (items: T[]) => T[]) => void;
  refresh: () => void;
  items: () => T[];
}

/** A board's link to its columns, for moves made outside it (a drawer save, an import). */
export function useBoardController<T>(stageOf: (t: T) => string, keyOf: (t: T) => string): BoardController<T> {
  const cols = useRef(new Map<string, ColumnApi<T>>());
  const fns = useRef({ stageOf, keyOf });
  fns.current = { stageOf, keyOf };
  return useMemo<BoardController<T>>(
    () => ({
      register: (col, api) => {
        if (api) cols.current.set(col, api);
        else cols.current.delete(col);
      },
      place: (item, index = 0) => {
        const id = fns.current.keyOf(item);
        const to = fns.current.stageOf(item);
        for (const [col, api] of cols.current) {
          api.update((items) => {
            const rest = items.filter((x) => fns.current.keyOf(x) !== id);
            if (col !== to) return rest.length === items.length ? items : rest;
            const at = Math.max(0, Math.min(index, rest.length));
            return [...rest.slice(0, at), item, ...rest.slice(at)];
          });
        }
      },
      refresh: () => {
        for (const api of cols.current.values()) api.refresh();
      },
    }),
    [],
  );
}

export interface BoardProps<T> {
  /** Names the board for remembered density and collapsed columns. */
  id: string;
  /** Accessible name, e.g. "Matters by stage". */
  label: string;
  /** What the cards are, plural ("matters"). */
  noun: string;
  columns: BoardColumnDef[];
  source: ListSource<T>;
  /** Query param that picks a column's cards. Default "stage". */
  stageParam?: string;
  /** Params every column sends (area, owner, schema filters). */
  filters?: Record<string, string>;
  /** Search shared by every column (already debounced). */
  query?: string;
  sort: ListSort;
  pageSize?: number;
  keyOf: (t: T) => string;
  stageOf: (t: T) => string;
  card: (t: T) => BoardCardModel;
  /** Fresh, warn or overdue, for the column's aging bar. */
  aging?: (t: T, column: BoardColumnDef) => AgingTone;
  onOpen?: (t: T) => void;
  selectedId?: string | null;
  /** Save a move. Resolve with the server's copy, or null when the page handles it (a drawer asks first). */
  move: (t: T, to: string) => Promise<T | null>;
  /** The card as it looks after a move, shown at once; null waits for the server. */
  optimistic?: (t: T, to: string) => T | null;
  /** Columns a card may move to (null: all). */
  moveTargets?: (t: T) => string[] | null;
  controller?: BoardController<T>;
  /** Value total of loaded cards, shown while searching. */
  sumValue?: (items: T[]) => string | null;
  audience: NoticeAudience;
  /** Bump to reload every column. */
  version?: number;
  className?: string;
}

type Density = "comfortable" | "compact";

interface Prefs {
  density: Density;
  collapsed: string[];
}

function readPrefs(id: string): Prefs {
  try {
    const raw = window.localStorage.getItem(`ilp_board:${id}`);
    const p = raw ? (JSON.parse(raw) as Partial<Prefs>) : {};
    return { density: p.density === "compact" ? "compact" : "comfortable", collapsed: Array.isArray(p.collapsed) ? p.collapsed.filter((x) => typeof x === "string") : [] };
  } catch {
    return { density: "comfortable", collapsed: [] };
  }
}

function writePrefs(id: string, p: Prefs) {
  try {
    window.localStorage.setItem(`ilp_board:${id}`, JSON.stringify(p));
  } catch {
    /* storage unavailable: remembered for this visit only */
  }
}

export function initials(name: string): string {
  const parts = name.replace(/@.*/, "").split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : parts[0]?.[1] ?? "")).toUpperCase() || "?";
}

interface DragInfo<T> {
  item: T;
  from: string;
  width: number;
  offsetX: number;
  offsetY: number;
}

const DRAG_THRESHOLD = 5;
const TOUCH_HOLD_MS = 220;

export function Board<T>(props: BoardProps<T>) {
  const { id, label, noun, columns, keyOf, stageOf, card, move, optimistic, moveTargets, className } = props;
  const reduce = useReducedMotion() ?? false;
  const internal = useBoardController<T>(stageOf, keyOf);
  const ctl = props.controller ?? internal;

  const [prefs, setPrefs] = useState<Prefs>({ density: "comfortable", collapsed: [] });
  useEffect(() => setPrefs(readPrefs(id)), [id]);
  const updatePrefs = (fn: (p: Prefs) => Prefs) =>
    setPrefs((p) => {
      const next = fn(p);
      writePrefs(id, next);
      return next;
    });

  const [announce, setAnnounce] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [kb, setKb] = useState<KbState>(KB_IDLE);
  const [drag, setDrag] = useState<DragInfo<T> | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const counts = useRef(new Map<string, number>());
  const itemsOf = useRef(new Map<string, () => T[]>());
  const labelOf = useCallback((col: string) => columns.find((c) => c.id === col)?.label ?? col, [columns]);

  // Columns report their loaded cards (keyboard placement, drag lookups).
  const register = ctl.register;
  const report = useCallback(
    (col: string, api: ColumnApi<T> | null) => {
      register(col, api);
      if (api) itemsOf.current.set(col, api.items);
      else itemsOf.current.delete(col);
    },
    [register],
  );

  const doMove = useCallback(
    async (item: T, to: string, index = 0) => {
      const from = stageOf(item);
      if (from === to) return;
      const allowed = moveTargets?.(item);
      if (allowed && !allowed.includes(to)) return;
      const title = card(item).title;
      const fromItems = itemsOf.current.get(from)?.() ?? [];
      const fromIndex = Math.max(0, fromItems.findIndex((x) => keyOf(x) === keyOf(item)));
      const opt = optimistic ? optimistic(item, to) : null;
      if (opt) ctl.place(opt, index);
      setBusyId(keyOf(item));
      try {
        const saved = await move(item, to);
        if (saved) {
          ctl.place(saved, index);
          setAnnounce(`${title} moved to ${labelOf(stageOf(saved))}.`);
        } else if (opt) {
          // The page took over (a drawer asks for an outcome): put the card back until it saves.
          ctl.place(item, fromIndex);
        }
      } catch (e) {
        if (opt) ctl.place(item, fromIndex);
        const why = e instanceof Error && e.message ? e.message : "The server did not accept the move.";
        setToast(`${title} was not moved to ${labelOf(to)}. ${why}`);
        setAnnounce(`Move failed. ${title} is back in ${labelOf(from)}.`);
      } finally {
        setBusyId(null);
      }
    },
    [stageOf, moveTargets, card, keyOf, optimistic, ctl, move, labelOf],
  );

  // ── Keyboard drag ────────────────────────────────────────────────────────
  const kbColumns = useCallback(
    (): KbColumn[] => columns.map((c) => ({ id: c.id, label: c.label, count: counts.current.get(c.id) ?? 0 })),
    [columns],
  );
  const kbRef = useRef(kb);
  kbRef.current = kb;
  const onCardKey = useCallback(
    (e: KeyboardEvent<HTMLElement>, item: T, col: string, index: number) => {
      const lifted = kbRef.current.mode === "lifted";
      const type = keyToAction(e.key, lifted);
      if (!type) {
        if (!lifted) navigate(e);
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      const ctx = { columns: kbColumns(), allowed: moveTargets?.(item) ?? null };
      const r =
        type === "lift"
          ? boardKeyboardReducer(kbRef.current, { type, cardId: keyOf(item), cardLabel: card(item).title, from: col, index }, ctx)
          : boardKeyboardReducer(kbRef.current, { type }, ctx);
      setKb(r.state);
      if (r.announce) setAnnounce(r.announce);
      if (r.move) {
        const moving = (itemsOf.current.get(r.move.from)?.() ?? []).find((x) => keyOf(x) === r.move!.cardId);
        if (moving) {
          const key = `${id}-${r.move.cardId}`;
          void doMove(moving, r.move.to, r.move.index);
          // Keep focus on the moved card in its new column.
          window.requestAnimationFrame(() =>
            window.requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-card-key="${CSS.escape(key)}"]`)?.focus()),
          );
        }
      }
    },
    [kbColumns, moveTargets, keyOf, card, doMove, id],
  );

  // ── Pointer drag ─────────────────────────────────────────────────────────
  const scroller = useRef<HTMLDivElement>(null);
  const ghost = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const raf = useRef(0);
  const suppressClick = useRef(false);
  const dragRef = useRef<DragInfo<T> | null>(null);
  dragRef.current = drag;
  const overRef = useRef<string | null>(null);

  const paint = useCallback(() => {
    raf.current = 0;
    const g = ghost.current;
    const d = dragRef.current;
    if (!g || !d) return;
    g.style.transform = `translate3d(${pos.current.x - d.offsetX}px, ${pos.current.y - d.offsetY}px, 0)${reduce ? "" : " scale(1.03) rotate(-0.6deg)"}`;
  }, [reduce]);

  const onCardPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement>, item: T, col: string) => {
      if (e.button !== 0 || (e.target as HTMLElement).closest("[data-no-drag], a, input, select, textarea")) return;
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      const start = { x: e.clientX, y: e.clientY };
      const touch = e.pointerType === "touch";
      let active = false;
      let held = !touch;
      const timer = touch ? window.setTimeout(() => (held = true), TOUCH_HOLD_MS) : 0;
      const begin = () => {
        active = true;
        suppressClick.current = true;
        setDrag({ item, from: col, width: rect.width, offsetX: start.x - rect.left, offsetY: start.y - rect.top });
        setAnnounce(`Dragging ${card(item).title}.`);
      };
      const onMove = (ev: PointerEvent) => {
        pos.current = { x: ev.clientX, y: ev.clientY };
        if (!active) {
          const far = Math.hypot(ev.clientX - start.x, ev.clientY - start.y) > DRAG_THRESHOLD;
          if (far && !held) return cleanup(); // a touch scroll, not a drag
          if (far && held) begin();
          if (!active) return;
        }
        ev.preventDefault();
        if (!raf.current) raf.current = window.requestAnimationFrame(paint);
        const hit = document.elementFromPoint(ev.clientX, ev.clientY)?.closest<HTMLElement>("[data-board-col]");
        const target = hit?.dataset.boardCol ?? null;
        const allowed = moveTargets?.(item);
        const ok = target && (target === col || !allowed || allowed.includes(target)) ? target : null;
        if (ok !== overRef.current) {
          overRef.current = ok;
          setOver(ok);
        }
        const sc = scroller.current;
        if (sc) {
          const r = sc.getBoundingClientRect();
          if (ev.clientX < r.left + 48) sc.scrollLeft -= 14;
          else if (ev.clientX > r.right - 48) sc.scrollLeft += 14;
        }
      };
      const onUp = () => {
        const target = overRef.current;
        const wasActive = active;
        cleanup();
        if (wasActive) {
          if (target && target !== col) void doMove(item, target);
          else setAnnounce(`${card(item).title} stays in ${labelOf(col)}.`);
          window.setTimeout(() => (suppressClick.current = false), 0);
        }
      };
      const onKeyEsc = (ev: globalThis.KeyboardEvent) => {
        if (ev.key === "Escape" && active) {
          overRef.current = null;
          onUp();
        }
      };
      const cleanup = () => {
        window.clearTimeout(timer);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", cancel);
        window.removeEventListener("keydown", onKeyEsc);
        if (raf.current) window.cancelAnimationFrame(raf.current);
        raf.current = 0;
        if (active) {
          setDrag(null);
          setOver(null);
          overRef.current = null;
        }
      };
      const cancel = () => {
        overRef.current = null;
        onUp();
      };
      pos.current = start;
      window.addEventListener("pointermove", onMove, { passive: false });
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", cancel);
      window.addEventListener("keydown", onKeyEsc);
    },
    [card, doMove, labelOf, moveTargets, paint],
  );

  useEffect(() => {
    if (drag) paint();
  }, [drag, paint]);

  // Scroll edges: fade the side that has more to show (opacity only).
  const frame = useRef<HTMLDivElement>(null);
  const onScroll = useCallback(() => {
    const sc = scroller.current;
    const f = frame.current;
    if (!sc || !f) return;
    f.dataset.left = sc.scrollLeft > 4 ? "1" : "0";
    f.dataset.right = sc.scrollLeft + sc.clientWidth < sc.scrollWidth - 4 ? "1" : "0";
  }, []);
  useEffect(() => {
    onScroll();
    window.addEventListener("resize", onScroll);
    return () => window.removeEventListener("resize", onScroll);
  }, [onScroll, columns.length, prefs.collapsed.length]);

  const onOpen = useCallback(
    (item: T) => {
      if (suppressClick.current) return;
      props.onOpen?.(item);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.onOpen],
  );
  const lifted = kb.mode === "lifted" ? kb : null;

  return (
    <div className={cx(s.root, className)} data-density={prefs.density}>
      <div className={s.bar}>
        <p className={s.hint}>Drag a card to another column, or focus it and press Space, then the arrow keys. Enter opens it.</p>
        <div className={s.segs} role="group" aria-label="Card density">
          {(["comfortable", "compact"] as const).map((d) => (
            <button key={d} type="button" className={s.seg} aria-pressed={prefs.density === d} onClick={() => updatePrefs((p) => ({ ...p, density: d }))}>
              {d === "comfortable" ? "Comfortable" : "Compact"}
            </button>
          ))}
        </div>
      </div>
      <p className={s.sr} aria-live="assertive" aria-atomic="true">
        {announce}
      </p>
      <div ref={frame} className={s.frame} data-left="0" data-right="0">
        <LayoutGroup id={id}>
          <div ref={scroller} className={s.scroller} onScroll={onScroll} role="group" aria-label={label} aria-roledescription="board">
            {columns.map((col, ci) => (
              <Column<T>
                key={col.id}
                index={ci}
                col={col}
                props={props}
                collapsed={prefs.collapsed.includes(col.id)}
                onCollapse={(c) => updatePrefs((p) => ({ ...p, collapsed: c ? [...p.collapsed, col.id] : p.collapsed.filter((x) => x !== col.id) }))}
                report={report}
                setCount={(n) => {
                  counts.current.set(col.id, n);
                }}
                over={over === col.id || lifted?.to === col.id}
                lifted={lifted}
                dragId={drag ? keyOf(drag.item) : null}
                busyId={busyId}
                reduce={reduce}
                onCardKey={onCardKey}
                onCardPointerDown={onCardPointerDown}
                onOpen={onOpen}
                onMenuMove={(item, to) => void doMove(item, to)}
                noun={noun}
              />
            ))}
          </div>
        </LayoutGroup>
      </div>
      {drag &&
        typeof document !== "undefined" &&
        createPortal(
          <div ref={ghost} className={cx(s.ghost, reduce && s.ghostStill)} aria-hidden="true">
            <GhostWidth width={drag.width}>
              <CardBody model={card(drag.item)} density={prefs.density} />
            </GhostWidth>
          </div>,
          document.body,
        )}
      <Toast message={toast} tone="danger" onDismiss={dismissToast} />
    </div>
  );
}

/** Sets the dragged copy's width through a ref (no inline style attribute). */
function GhostWidth({ width, children }: { width: number; children: ReactNode }) {
  const ref = useCallback((el: HTMLDivElement | null) => {
    if (el) el.style.width = `${width}px`;
  }, [width]);
  return (
    <div ref={ref} className={s.card}>
      {children}
    </div>
  );
}

// ── Column ──────────────────────────────────────────────────────────────────

interface ColumnProps<T> {
  index: number;
  col: BoardColumnDef;
  props: BoardProps<T>;
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  report: (col: string, api: ColumnApi<T> | null) => void;
  setCount: (n: number) => void;
  over: boolean;
  lifted: Extract<KbState, { mode: "lifted" }> | null;
  dragId: string | null;
  busyId: string | null;
  reduce: boolean;
  onCardKey: (e: KeyboardEvent<HTMLElement>, item: T, col: string, index: number) => void;
  onCardPointerDown: (e: ReactPointerEvent<HTMLElement>, item: T, col: string) => void;
  onOpen: (item: T) => void;
  onMenuMove: (item: T, to: string) => void;
  noun: string;
}

const AGING_WORD: Record<AgingTone, string> = { fresh: "on time", warn: "getting old", overdue: "past the time limit" };

function Column<T>({ index, col, props, collapsed, onCollapse, report, setCount, over, lifted, dragId, busyId, reduce, onCardKey, onCardPointerDown, onOpen, onMenuMove, noun }: ColumnProps<T>) {
  const { source, stageParam = "stage", filters, query = "", sort, pageSize = 12, keyOf, card, aging, selectedId, moveTargets, sumValue, audience, version = 0, columns } = props;
  const colFilters = useMemo(() => ({ ...(filters ?? {}), [stageParam]: col.id }), [filters, stageParam, col.id]);
  const list = useStreamedList<T>(source, { key: `board-${props.id}-${col.id}`, pageSize, initialQuery: query, filters: colFilters, sort, keyOf });
  const { update, refresh, items } = list;
  const itemsRef = useRef(items);
  itemsRef.current = items;
  useEffect(() => {
    report(col.id, { update, refresh, items: () => itemsRef.current });
    return () => report(col.id, null);
  }, [report, col.id, update, refresh]);
  useEffect(() => {
    setCount(items.length);
  }, [items.length, setCount]);
  const firstVersion = useRef(version);
  useEffect(() => {
    if (version !== firstVersion.current) refresh();
  }, [version, refresh]);

  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (searching) searchRef.current?.focus();
  }, [searching]);
  const localQuery = searching && list.query !== query;
  const filtered = !!list.activeQuery;
  const total = filtered ? `${items.length}${list.hasMore ? "+" : ""}` : String(Math.max(col.count ?? list.total ?? 0, items.length));
  const value = filtered && sumValue ? sumValue(items) : col.value;

  const tones = useMemo(() => {
    const t = { fresh: 0, warn: 0, overdue: 0 };
    if (aging) for (const it of items) t[aging(it, col)]++;
    return t;
  }, [aging, items, col]);
  const agingLabel = `Time in stage for the ${items.length} ${noun} shown: ${tones.fresh} ${AGING_WORD.fresh}, ${tones.warn} ${AGING_WORD.warn}, ${tones.overdue} ${AGING_WORD.overdue}.`;
  const headId = `board-${props.id}-${col.id}-h`;

  if (collapsed) {
    return (
      <section className={cx(s.col, s.collapsed, over && s.over)} data-board-col={col.id} aria-labelledby={headId}>
        <button type="button" className={s.expand} onClick={() => onCollapse(false)} aria-label={`Expand the ${col.label} column, ${total} ${noun}`}>
          <IconChevronRight />
          <span id={headId} className={s.vertical}>
            {col.label}
          </span>
          <span className={s.countPill}>{total}</span>
        </button>
      </section>
    );
  }

  const ghostAt = lifted && lifted.to === col.id && lifted.from !== col.id ? Math.min(lifted.index, items.length) : -1;

  return (
    <section className={cx(s.col, over && s.over)} data-board-col={col.id} aria-labelledby={headId} aria-busy={list.stale || list.loadingMore || undefined}>
      <header className={s.colHead}>
        <div className={s.headRow}>
          <h3 id={headId} className={s.colTitle}>
            {col.label}
          </h3>
          <span className={s.countPill} aria-label={`${total} ${noun}`}>
            {total}
          </span>
          <span className={s.headActions}>
            <button
              type="button"
              className={s.iconBtn}
              aria-pressed={searching}
              aria-label={searching ? `Close the search in ${col.label}` : `Search in ${col.label}`}
              onClick={() => {
                if (searching) list.setQuery(query);
                setSearching((v) => !v);
              }}
            >
              {searching ? <IconClose /> : <IconSearch />}
            </button>
            <button type="button" className={s.iconBtn} onClick={() => onCollapse(true)} aria-label={`Collapse the ${col.label} column`}>
              <IconChevronLeft />
            </button>
          </span>
        </div>
        {(value || col.limitDays) && (
          <p className={s.headMeta}>
            {value && <span className={s.value}>{value}</span>}
            {col.limitDays ? (
              tones.overdue > 0 ? (
                <StatusPill size="sm" tone="warning" label={`Limit ${col.limitDays} days · ${tones.overdue} over`} srPrefix="Stage time limit" />
              ) : (
                <span className={s.limit}>Limit {col.limitDays} days</span>
              )
            ) : null}
          </p>
        )}
        {aging && items.length > 0 && <AgingBar tones={tones} label={agingLabel} />}
        {searching && (
          <label className={s.colSearch}>
            <span className={s.sr}>Search in {col.label}</span>
            <input ref={searchRef} className={s.colSearchInput} value={list.query} placeholder={`Search ${col.label}`} onChange={(e) => list.setQuery(e.target.value)} onKeyDown={(e) => e.key === "Escape" && (list.setQuery(query), setSearching(false))} />
          </label>
        )}
      </header>

      {list.initialLoading ? (
        <ul className={s.cards} aria-hidden="true">
          <SkeletonCards n={2} />
        </ul>
      ) : (
        <ul className={cx(s.cards, list.stale && s.stale)}>
          {items.map((item, i) => {
            const key = keyOf(item);
            const isLifted = lifted?.cardId === key;
            return (
              <FragmentWithGhost key={key} ghost={ghostAt === i}>
                <CardItem
                  item={item}
                  model={card(item)}
                  col={col.id}
                  colIndex={index}
                  index={i}
                  selected={selectedId === key}
                  lifted={isLifted}
                  dragging={dragId === key}
                  busy={busyId === key}
                  reduce={reduce}
                  layoutId={`${props.id}-${key}`}
                  onKey={onCardKey}
                  onPointerDown={onCardPointerDown}
                  onOpen={onOpen}
                  menu={
                    <MoveToMenu
                      current={col.id}
                      stages={columns.filter((c) => c.id === col.id || !moveTargets?.(item) || moveTargets(item)!.includes(c.id)).map((c) => ({ id: c.id, label: c.label }))}
                      onMove={(to) => onMenuMove(item, to)}
                      disabled={busyId === key}
                      subject={card(item).title}
                    />
                  }
                />
              </FragmentWithGhost>
            );
          })}
          {ghostAt === items.length && ghostAt >= 0 && <li className={s.dropGhost} aria-hidden="true">Drop here</li>}
        </ul>
      )}
      {!list.initialLoading && items.length === 0 && !list.error && ghostAt < 0 && (
        <div className={s.empty}>
          <p>{filtered || localQuery ? "No match in this stage." : `No ${noun} in this stage.`}</p>
          {!filtered && <p className={s.emptyHint}>Drag a card here, or use Move to on a card.</p>}
        </div>
      )}
      {list.loadingMore && (
        <ul className={s.cards} aria-hidden="true">
          <SkeletonCards n={1} />
        </ul>
      )}
      {list.error && (
        <ErrorNotice audience={audience} onRetry={items.length ? list.loadMore : list.refresh}>
          {list.error}
        </ErrorNotice>
      )}
      {list.hasMore && !list.error && (
        <Button size="sm" variant="ghost" className={s.more} onClick={list.loadMore} disabled={list.loadingMore} aria-label={`Load more in ${col.label}`}>
          {list.loadingMore ? "Loading more…" : "Load more in this column"}
        </Button>
      )}
    </section>
  );
}

function FragmentWithGhost({ ghost, children }: { ghost: boolean; children: ReactNode }) {
  return (
    <>
      {ghost && (
        <li className={s.dropGhost} aria-hidden="true">
          Drop here
        </li>
      )}
      {children}
    </>
  );
}

/** Segmented hairline bar: share of cards on time, getting old, past the limit. Widths are set through refs. */
function AgingBar({ tones, label }: { tones: Record<AgingTone, number>; label: string }) {
  const seg = (n: number) => (el: HTMLSpanElement | null) => {
    if (el) el.style.flexGrow = String(n);
  };
  return (
    <div className={s.aging} role="img" aria-label={label}>
      {tones.fresh > 0 && <span ref={seg(tones.fresh)} className={cx(s.agingSeg, s.fresh)} />}
      {tones.warn > 0 && <span ref={seg(tones.warn)} className={cx(s.agingSeg, s.warn)} />}
      {tones.overdue > 0 && <span ref={seg(tones.overdue)} className={cx(s.agingSeg, s.overdue)} />}
    </div>
  );
}

// ── Card ────────────────────────────────────────────────────────────────────

interface CardItemProps<T> {
  item: T;
  model: BoardCardModel;
  col: string;
  colIndex: number;
  index: number;
  selected: boolean;
  lifted: boolean;
  dragging: boolean;
  busy: boolean;
  reduce: boolean;
  layoutId: string;
  onKey: (e: KeyboardEvent<HTMLElement>, item: T, col: string, index: number) => void;
  onPointerDown: (e: ReactPointerEvent<HTMLElement>, item: T, col: string) => void;
  onOpen: (item: T) => void;
  menu: ReactNode;
}

const EASE = [0.23, 1, 0.32, 1] as const;

function CardItemInner<T>({ item, model, col, colIndex, index, selected, lifted, dragging, busy, reduce, layoutId, onKey, onPointerDown, onOpen, menu }: CardItemProps<T>) {
  return (
    <motion.li
      layout={reduce ? false : "position"}
      layoutId={reduce ? undefined : layoutId}
      transition={{ duration: reduce ? 0 : 0.22, ease: EASE }}
      className={cx(s.card, selected && s.selected, lifted && s.lifted, dragging && s.dragging, busy && s.busy)}
      onPointerDown={(e) => onPointerDown(e, item, col)}
    >
      <button
        type="button"
        className={s.cardOpen}
        data-board-card=""
        data-col-index={colIndex}
        data-card-index={index}
        data-card-key={layoutId}
        aria-pressed={lifted || undefined}
        onClick={() => onOpen(item)}
        onKeyDown={(e) => onKey(e, item, col, index)}
      >
        <CardBody model={model} />
      </button>
      <div className={s.cardFoot}>
        {model.pills && <span className={s.pills}>{model.pills}</span>}
        {menu}
      </div>
    </motion.li>
  );
}

const CardItem = memo(CardItemInner) as typeof CardItemInner;

function CardBody({ model, density }: { model: BoardCardModel; density?: Density }) {
  const meta = (model.meta ?? []).filter(Boolean) as string[];
  return (
    <span className={s.body} data-density={density}>
      <span className={s.titleRow}>
        <span className={s.title}>{model.title}</span>
        {model.value && <span className={s.money}>{model.value}</span>}
      </span>
      {model.subtitle && <span className={s.subtitle}>{model.subtitle}</span>}
      {(meta.length > 0 || model.person || model.placeholder) && (
        <span className={s.metaRow}>
          {meta.length > 0 && <span className={s.meta}>{meta.join(" · ")}</span>}
          {model.placeholder && <StatusPill size="sm" label="Placeholder" tone="neutral" />}
          {model.person && (
            <span className={s.avatar} title={`${model.person.role}: ${model.person.name}`}>
              <span aria-hidden="true">{initials(model.person.name)}</span>
              <span className={s.sr}>
                {model.person.role}: {model.person.name}
              </span>
            </span>
          )}
        </span>
      )}
      {model.due && <span className={cx(s.due, model.due.tone && s[`due_${model.due.tone}`])}>{model.due.text}</span>}
      {model.progress && (
        <span className={s.progress}>
          <span className={s.progressLabel}>{model.progress.label}</span>
          <progress className={s.progressBar} value={Math.round(Math.max(0, Math.min(1, model.progress.value)) * 100)} max={100} aria-label={model.progress.label} />
        </span>
      )}
    </span>
  );
}

function SkeletonCards({ n }: { n: number }) {
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <li key={i} className={cx(s.card, s.skeletonCard)}>
          <Skeleton shape="line" size="md" width="75" />
          <Skeleton shape="line" size="sm" width="40" />
          <span className={s.skeletonPills}>
            <Skeleton shape="pill" size="sm" />
            <Skeleton shape="pill" size="sm" />
          </span>
        </li>
      ))}
    </>
  );
}

/** Loading layout matching the board: column headers and cards. */
export function BoardSkeleton({ columns = 4, cards = 3, className }: { columns?: number; cards?: number; className?: string }) {
  return (
    <div className={cx(s.root, className)} aria-hidden="true">
      <div className={s.frame}>
        <div className={s.scroller}>
          {Array.from({ length: columns }, (_, c) => (
            <section key={c} className={s.col}>
              <header className={s.colHead}>
                <span className={s.headRow}>
                  <Skeleton shape="line" size="md" width="40" />
                </span>
                <span className={s.aging} />
              </header>
              <ul className={s.cards}>
                <SkeletonCards n={Math.max(1, cards - (c % 2))} />
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Arrow-key focus moves between cards and columns (not while a card is lifted). */
function navigate(e: KeyboardEvent<HTMLElement>) {
  const el = e.currentTarget;
  const ci = Number(el.dataset.colIndex);
  const i = Number(el.dataset.cardIndex);
  const board = el.closest("[aria-roledescription='board']");
  if (!board) return;
  const at = (c: number, k: number) => board.querySelector<HTMLElement>(`[data-board-card][data-col-index="${c}"][data-card-index="${k}"]`);
  let next: HTMLElement | null = null;
  if (e.key === "ArrowDown") next = at(ci, i + 1);
  else if (e.key === "ArrowUp") next = at(ci, i - 1);
  else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
    const step = e.key === "ArrowRight" ? 1 : -1;
    const total = board.querySelectorAll("[data-board-col]").length;
    for (let c = ci + step; c >= 0 && c < total && !next; c += step) {
      next = at(c, i);
      if (!next) {
        const cards = board.querySelectorAll<HTMLElement>(`[data-board-card][data-col-index="${c}"]`);
        next = cards[cards.length - 1] ?? null;
      }
    }
  } else if (e.key === "Home") next = at(ci, 0);
  else if (e.key === "End") {
    const cards = board.querySelectorAll<HTMLElement>(`[data-board-card][data-col-index="${ci}"]`);
    next = cards[cards.length - 1] ?? null;
  }
  if (next) {
    e.preventDefault();
    next.focus();
    next.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
}

export default Board;
