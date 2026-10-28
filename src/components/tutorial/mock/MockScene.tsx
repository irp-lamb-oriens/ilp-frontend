/**
 * Renders a declarative mock tree with the UI kit's look (same tokens,
 * radii, type and pills) but none of its behavior: no data, no handlers, no
 * focusable elements. The caller wraps it in an inert, aria-hidden stage.
 *
 * Every node or sub-item with an id gets data-mock-id so the cursor player
 * can find it; `overrides` patches fields by id (pressed, label, open…).
 */
import { createContext, useContext, type ReactNode } from "react";
import { cx } from "../../ui/cx";
import { EMPTY_OVERRIDES, type Overrides } from "../sceneUtils";
import type {
  BoardCard,
  BoardColumn,
  ListItem,
  MockNode,
  MockPillSpec,
  MockTone,
  PatchValue,
  TableRow,
  TimelineEntry,
  TutorialRole,
} from "../types";
import s from "./MockScene.module.scss";

const ROLE_LABEL: Record<TutorialRole, string> = { staff: "Staff", lawyer: "Lawyer", client: "Member" };

type Patchable = { id?: string };
/** Player-only flags any node or sub-item can carry for a moment. */
type Transient = { hovered?: boolean; dragging?: boolean };

const OverridesCtx = createContext<Overrides>(EMPTY_OVERRIDES);

function mergeWith(overrides: Overrides) {
  return function merge<T extends Patchable>(n: T): T & Transient {
    const p = n.id ? overrides.patch[n.id] : undefined;
    return (p ? { ...n, ...p } : n) as T & Transient;
  };
}

export function initials(name: string): string {
  const parts = name
    .replace(/[^\p{L}\s'-]/gu, " ")
    .split(/[\s-]+/)
    .filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

function Pill({ spec, size = "sm" }: { spec?: MockPillSpec | PatchValue; size?: "sm" | "md" }) {
  if (!spec || typeof spec !== "object") return null;
  return <span className={cx(s.pill, s[`tone_${spec.tone ?? "neutral"}`], size === "sm" && s.pillSm)}>{spec.label}</span>;
}

function flag(v: PatchValue): boolean {
  return v === true;
}

export interface MockSceneProps {
  root: MockNode;
  overrides: Overrides;
}

function boardColumns(cols: BoardColumn[], moves: Record<string, string>): BoardColumn[] {
  if (!Object.keys(moves).length) return cols;
  const out = cols.map((c) => ({ ...c, cards: c.cards.filter((k) => !(k.id && moves[k.id] && moves[k.id] !== c.id)) }));
  for (const c of cols) {
    for (const k of c.cards) {
      const dest = k.id ? moves[k.id] : undefined;
      if (!dest || dest === c.id) continue;
      const target = out.find((x) => x.id === dest);
      if (target) target.cards = [...target.cards, k];
    }
  }
  return out;
}

function cell(c: string | MockNode, i: number): ReactNode {
  return typeof c === "string" ? c : <Node key={i} node={c} />;
}

function Node({ node }: { node: MockNode }): ReactNode {
  const overrides = useContext(OverridesCtx);
  const merge = mergeWith(overrides);
  const n = merge(node);
  if (n.hidden) return null;
  const idAttr = n.id ? { "data-mock-id": n.id } : {};
  const hl = flag(n.highlight);
  const hov = flag(n.hovered);

  switch (n.type) {
    case "frame":
      return (
        <div className={s.frame} {...idAttr}>
          <div className={s.nav}>
            <div className={s.brand}>
              <span className={s.brandMark}>ILP</span>
              <span className={s.brandRole}>{ROLE_LABEL[n.role]}</span>
            </div>
            {(n.nav ?? []).map((label) => (
              <span key={label} className={cx(s.navItem, label === n.active && s.navActive)} data-mock-id={`nav:${label}`}>
                {label}
              </span>
            ))}
          </div>
          <div className={s.main}>
            <div className={s.topbar}>
              {n.search ? <span className={s.search}>{n.search}</span> : <span />}
              <span className={s.topActions}>
                {n.role !== "client" && <span className={s.country}>{n.role === "staff" ? "All countries" : "Costa Rica"}</span>}
                <span className={s.help} data-mock-id="help">
                  ?
                </span>
                <span className={s.avatar}>{n.role === "staff" ? "SC" : n.role === "lawyer" ? "AV" : "LH"}</span>
              </span>
            </div>
            <div className={s.viewport}>
              <div className={s.scroll} data-mock-scroll="">
                {(n.title || n.actions?.length) && (
                  <div className={s.pageHead}>
                    {n.title && <span className={s.pageTitle}>{n.title}</span>}
                    {n.actions && <span className={s.pageActions}>{n.actions.map((a, i) => <Node key={i} node={a} />)}</span>}
                  </div>
                )}
                <Node node={n.body} />
              </div>
            </div>
          </div>
          {n.overlays?.map((o, i) => <Node key={i} node={o} />)}
        </div>
      );

    case "stack":
      return (
        <div className={cx(s.stack, s[`gap${n.gap ?? 3}`], hl && s.hl)} {...idAttr}>
          {n.children.map((c, i) => (
            <Node key={i} node={c} />
          ))}
        </div>
      );

    case "row":
      return (
        <div className={cx(s.row, s[`gap${n.gap ?? 2}`], s[`align_${n.align ?? "center"}`], n.wrap && s.wrap, hl && s.hl)} {...idAttr}>
          {n.children.map((c, i) => (
            <Node key={i} node={c} />
          ))}
        </div>
      );

    case "grid":
      return (
        <div className={cx(s.grid, s[`cols_${n.cols.replace(/-/g, "_")}`], s[`gap${n.gap ?? 3}`])} {...idAttr}>
          {n.children.map((c, i) => (
            <Node key={i} node={c} />
          ))}
        </div>
      );

    case "card":
      return (
        <div className={cx(s.card, n.tone === "accent" && s.cardAccent, n.tone === "mist" && s.cardMist, hl && s.hl)} {...idAttr}>
          {(n.title || n.meta) && (
            <div className={s.cardHead}>
              {n.title && <span className={s.cardTitle}>{n.title}</span>}
              {n.meta && <span className={s.meta}>{n.meta}</span>}
            </div>
          )}
          {n.children?.map((c, i) => (
            <Node key={i} node={c} />
          ))}
        </div>
      );

    case "statTile":
      return (
        <div className={cx(s.tile, n.size === "lg" && s.tileLg, hl && s.hl)} {...idAttr}>
          <span className={s.tileLabel}>{n.label}</span>
          <span className={s.tileValue}>{n.value}</span>
          {(n.delta || n.hint) && (
            <span className={s.tileMeta}>
              {n.delta && <span className={cx(s.delta, n.trend === "up" && s.good, n.trend === "down" && s.bad)}>{n.delta}</span>}
              {n.hint && <span className={s.hint}>{n.hint}</span>}
            </span>
          )}
        </div>
      );

    case "table":
      return (
        <div className={cx(s.tableWrap, hl && s.hl)} {...idAttr}>
          <div className={s.table}>
            <div className={cx(s.tr, s.th)}>
              {n.columns.map((c) => (
                <span key={c} className={s.td}>
                  {c}
                </span>
              ))}
            </div>
            {n.rows.map((row0, ri) => {
              const r = merge(row0 as TableRow);
              if (r.hidden) return null;
              return (
                <div
                  key={ri}
                  className={cx(s.tr, flag(r.highlight) && s.rowHl, flag(r.hovered) && s.rowHover)}
                  {...(r.id ? { "data-mock-id": r.id } : {})}
                >
                  {r.cells.map((c, ci) => (
                    <span key={ci} className={cx(s.td, ci === 0 && s.tdFirst)}>
                      {cell(c, ci)}
                    </span>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      );

    case "list":
      return (
        <ul className={cx(s.list, n.variant === "plain" ? s.listPlain : s.listRows, hl && s.hl)} {...idAttr}>
          {n.items.map((it0, i) => {
            const it = merge(it0 as ListItem);
            if (it.hidden) return null;
            const av = it.avatar === "auto" ? initials(it.title) : it.avatar;
            return (
              <li
                key={i}
                className={cx(s.item, flag(it.highlight) && s.rowHl, flag(it.hovered) && s.rowHover)}
                {...(it.id ? { "data-mock-id": it.id } : {})}
              >
                {av && <span className={s.itemAvatar}>{av}</span>}
                {it.lead && (
                  <span className={s.itemLead}>
                    <span className={s.itemLeadMain}>{it.lead}</span>
                    {it.leadMeta && <span className={s.meta}>{it.leadMeta}</span>}
                  </span>
                )}
                <span className={s.itemMain}>
                  <span className={s.itemTitle}>{it.title}</span>
                  {it.meta && <span className={s.meta}>{it.meta}</span>}
                  {it.quote && <span className={s.itemQuote}>“{it.quote}”</span>}
                </span>
                {(it.pill || it.pills) && (
                  <span className={s.itemPills}>
                    {it.pill && <Pill spec={it.pill} />}
                    {it.pills?.map((p, pi) => <Pill key={pi} spec={p} />)}
                  </span>
                )}
                {it.trailing && <span className={s.itemTrailing}>{it.trailing}</span>}
              </li>
            );
          })}
        </ul>
      );

    case "pill":
      return (
        <span className={cx(s.pill, s[`tone_${(n.tone as MockTone) ?? "neutral"}`], n.size === "sm" && s.pillSm, hl && s.hl)} {...idAttr}>
          {n.label}
        </span>
      );

    case "button":
      return (
        <span
          className={cx(
            s.button,
            s[`btn_${n.variant ?? "primary"}`],
            n.size === "sm" && s.btnSm,
            flag(n.pressed) && s.pressed,
            hov && s.btnHover,
            flag(n.disabled) && s.disabled,
            hl && s.hl,
          )}
          {...idAttr}
        >
          {n.label}
        </span>
      );

    case "input": {
      const value = typeof n.value === "string" ? n.value : "";
      const focused = flag(n.focused);
      return (
        <span className={cx(s.field, hl && s.hl)} {...idAttr}>
          {n.label && <span className={s.fieldLabel}>{n.label}</span>}
          <span className={cx(s.input, n.multiline && s.textarea, focused && s.focused)}>
            {value ? <span className={s.value}>{value}</span> : <span className={s.placeholder}>{n.placeholder ?? ""}</span>}
            {focused && <span className={s.caret} />}
            {n.select && <span className={s.chevron}>▾</span>}
          </span>
          {n.hint && <span className={s.meta}>{n.hint}</span>}
        </span>
      );
    }

    case "timeRange":
      return (
        <span className={cx(s.field, hl && s.hl)} {...idAttr}>
          {n.label && <span className={s.fieldLabel}>{n.label}</span>}
          <span className={s.timeRange}>
            <span className={s.input}>{n.from}</span>
            <span className={s.meta}>to</span>
            <span className={s.input}>{n.to}</span>
          </span>
        </span>
      );

    case "chip":
      return (
        <span className={cx(s.chip, flag(n.selected) && s.chipOn, hl && s.hl)} {...idAttr}>
          {flag(n.selected) && <span className={s.check}>✓</span>}
          {n.label}
        </span>
      );

    case "toggle":
      return (
        <span className={cx(s.toggle, hl && s.hl)} {...idAttr}>
          {n.kind === "checkbox" ? (
            <span className={cx(s.box, flag(n.on) && s.boxOn)}>{flag(n.on) ? "✓" : ""}</span>
          ) : (
            <span className={cx(s.switch, flag(n.on) && s.switchOn)}>
              <span className={s.knob} />
            </span>
          )}
          <span>{n.label}</span>
        </span>
      );

    case "text":
      return (
        <span className={cx(s.text, s[`t_${n.variant ?? "body"}`], hl && s.hl)} {...idAttr}>
          {n.text}
        </span>
      );

    case "board":
      return (
        <div className={cx(s.board, hl && s.hl)} {...idAttr}>
          {boardColumns(n.columns, overrides.moves).map((c0, ci) => {
            const c = merge(c0);
            return (
              <div key={ci} className={cx(s.column, flag(c.highlight) && s.columnHl)} {...(c.id ? { "data-mock-id": c.id } : {})}>
                <span className={s.columnHead}>
                  {c.title} <span className={s.count}>{c.cards.filter((k) => !merge(k).hidden).length}</span>
                </span>
                <div className={s.columnCards} data-mock-drop="">
                  {c.cards.map((k0, ki) => {
                    const k = merge(k0 as BoardCard);
                    if (k.hidden) return null;
                    return (
                      <div
                        key={k.id ?? ki}
                        className={cx(s.boardCard, flag(k.highlight) && s.hl, flag(k.dragging) && s.dragging, flag(k.hovered) && s.rowHover)}
                        {...(k.id ? { "data-mock-id": k.id } : {})}
                      >
                        <span className={s.itemTitle}>{k.title}</span>
                        {k.meta && <span className={s.meta}>{k.meta}</span>}
                        {(k.pill || k.badge) && (
                          <span className={s.itemPills}>
                            <Pill spec={k.pill} />
                            <Pill spec={k.badge} />
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      );

    case "timeline":
      return (
        <ol className={cx(s.timeline, hl && s.hl)} {...idAttr}>
          {n.items.map((e0, i) => {
            const e = merge(e0 as TimelineEntry);
            if (e.hidden) return null;
            return (
              <li key={i} className={cx(s.tlItem, s[`tl_${e.state ?? "upcoming"}`], flag(e.highlight) && s.rowHl)} {...(e.id ? { "data-mock-id": e.id } : {})}>
                <span className={s.tlMark}>{e.state === "done" ? "✓" : ""}</span>
                <span className={s.itemMain}>
                  <span className={s.itemTitle}>{e.title}</span>
                  {e.meta && <span className={s.meta}>{e.meta}</span>}
                </span>
              </li>
            );
          })}
        </ol>
      );

    case "progress": {
      const v = typeof n.value === "number" ? Math.max(0, Math.min(1, n.value)) : 0;
      return (
        <span className={cx(s.progress, hl && s.hl)} {...idAttr}>
          <span className={s.progressRow}>
            <span className={s.fieldLabel}>{n.label}</span>
            <span className={s.meta}>{n.valueText ?? `${Math.round(v * 100)}%`}</span>
          </span>
          <span className={s.track}>
            <span className={cx(s.fill, s[`fill_${n.tone ?? "accent"}`], s[`w${Math.round(v * 20) * 5}`])} />
          </span>
        </span>
      );
    }

    case "drawer":
      return (
        <div className={cx(s.drawerLayer, flag(n.open) && s.open)} {...idAttr}>
          <span className={s.scrim} />
          <div className={s.drawer}>
            <div className={s.drawerHead}>
              <span className={s.cardTitle}>{n.title}</span>
              {n.subtitle && <span className={s.meta}>{n.subtitle}</span>}
              <span className={s.close}>×</span>
            </div>
            <div className={s.drawerBody}>
              {n.children.map((c, i) => (
                <Node key={i} node={c} />
              ))}
            </div>
          </div>
        </div>
      );

    case "dialog":
      return (
        <div className={cx(s.dialogLayer, flag(n.open) && s.open)} {...idAttr}>
          <span className={s.scrim} />
          <div className={s.dialog}>
            <span className={s.cardTitle}>{n.title}</span>
            {n.children.map((c, i) => (
              <Node key={i} node={c} />
            ))}
          </div>
        </div>
      );

    case "toast":
      return (
        <div className={cx(s.toast, flag(n.visible) && s.toastOn)} {...idAttr}>
          <span className={s.toastMark}>✓</span>
          {n.text}
        </div>
      );

    case "tabs":
      return (
        <div className={s.tabs} {...idAttr}>
          {n.tabs.map((t) => (
            <span key={t.label} className={cx(s.tab, (t.id === n.active || t.label === n.active) && s.tabOn)} {...(t.id ? { "data-mock-id": t.id } : {})}>
              {t.label}
            </span>
          ))}
        </div>
      );

    case "menu":
      return (
        <span className={s.menuAnchor}>
          <span className={cx(s.menu, flag(n.open) && s.open)} {...idAttr}>
            {n.items.map((m0, i) => {
              const m = merge(m0);
              if (m.hidden) return null;
              return (
                <span key={i} className={cx(s.menuItem, flag(m.highlight) && s.menuItemOn)} {...(m.id ? { "data-mock-id": m.id } : {})}>
                  {m.label}
                </span>
              );
            })}
          </span>
        </span>
      );

    case "message":
      return (
        <div className={cx(s.message, s[`msg_${n.from}`], hl && s.hl)} {...idAttr}>
          <span className={s.msgHead}>
            <span className={s.itemTitle}>{n.author}</span>
            {n.from === "ai" && <span className={cx(s.pill, s.tone_info, s.pillSm)}>AI assistant</span>}
          </span>
          <span className={s.msgText}>{n.text}</span>
          {n.meta && <span className={s.meta}>{n.meta}</span>}
        </div>
      );

    case "divider":
      return <span className={s.divider} {...idAttr} />;

    case "deflist":
      return (
        <dl className={cx(s.deflist, hl && s.hl)} {...idAttr}>
          {n.items.map((d0, i) => {
            const d = merge(d0);
            if (d.hidden) return null;
            return (
              <div key={i} className={cx(s.defRow, flag(d.highlight) && s.rowHl)} {...(d.id ? { "data-mock-id": d.id } : {})}>
                <dt>{d.term}</dt>
                <dd>{d.value}</dd>
              </div>
            );
          })}
        </dl>
      );

    default:
      return null;
  }
}

export function MockScene({ root, overrides }: MockSceneProps) {
  return (
    <OverridesCtx.Provider value={overrides}>
      <Node node={root} />
    </OverridesCtx.Provider>
  );
}

export default MockScene;
