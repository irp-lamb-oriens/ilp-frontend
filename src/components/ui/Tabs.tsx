"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "./cx";
import s from "./Tabs.module.scss";

export interface TabItem {
  id: string;
  label: string;
  /** Panel content. Not mounted until the tab is first opened. */
  content: ReactNode | (() => ReactNode);
  /** Small count after the label, e.g. open tasks. */
  count?: number;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  /** Controlled active id. */
  value?: string;
  /** Uncontrolled initial id. Defaults to the first tab. */
  defaultValue?: string;
  onChange?: (id: string) => void;
  /** Accessible name for the tab list. */
  label: string;
  className?: string;
}

/**
 * Tabs that mount a panel on first visit, then keep it mounted (hidden) so
 * its state and fetched data survive switching. Unvisited panels never mount,
 * so they never fetch. Arrow keys, Home and End move between tabs.
 */
export function Tabs({ tabs, value, defaultValue, onChange, label, className }: TabsProps) {
  const baseId = useId();
  const first = tabs.find((t) => !t.disabled)?.id ?? tabs[0]?.id;
  const [inner, setInner] = useState<string | undefined>(defaultValue ?? first);
  const active = value ?? inner ?? first;
  const [visited, setVisited] = useState<Set<string>>(() => new Set(active ? [active] : []));
  const listRef = useRef<HTMLDivElement>(null);

  if (active && !visited.has(active)) {
    // Record the visit during render so the panel mounts in the same pass.
    const next = new Set(visited);
    next.add(active);
    setVisited(next);
  }

  function select(id: string) {
    if (value === undefined) setInner(id);
    onChange?.(id);
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const enabled = tabs.filter((t) => !t.disabled);
    const idx = enabled.findIndex((t) => t.id === active);
    let nextIdx: number | null = null;
    if (e.key === "ArrowRight") nextIdx = (idx + 1) % enabled.length;
    else if (e.key === "ArrowLeft") nextIdx = (idx - 1 + enabled.length) % enabled.length;
    else if (e.key === "Home") nextIdx = 0;
    else if (e.key === "End") nextIdx = enabled.length - 1;
    if (nextIdx === null) return;
    e.preventDefault();
    const id = enabled[nextIdx].id;
    select(id);
    const btn = listRef.current?.querySelector<HTMLButtonElement>(`[data-tab-id="${CSS.escape(id)}"]`);
    btn?.focus();
  }

  return (
    <div className={cx(s.tabs, className)}>
      <div className={s.list} role="tablist" aria-label={label} ref={listRef} onKeyDown={onKeyDown}>
        {tabs.map((t) => {
          const selected = t.id === active;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`${baseId}-tab-${t.id}`}
              data-tab-id={t.id}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${t.id}`}
              tabIndex={selected ? 0 : -1}
              disabled={t.disabled}
              className={cx(s.tab, selected && s.active)}
              onClick={() => select(t.id)}
            >
              {t.label}
              {typeof t.count === "number" && <span className={s.count}>{t.count}</span>}
            </button>
          );
        })}
      </div>
      {tabs.map((t) => {
        if (!visited.has(t.id)) return null;
        const selected = t.id === active;
        return (
          <div
            key={t.id}
            role="tabpanel"
            id={`${baseId}-panel-${t.id}`}
            aria-labelledby={`${baseId}-tab-${t.id}`}
            hidden={!selected}
            tabIndex={0}
            className={s.panel}
          >
            {typeof t.content === "function" ? (t.content as () => ReactNode)() : t.content}
          </div>
        );
      })}
    </div>
  );
}

export default Tabs;
