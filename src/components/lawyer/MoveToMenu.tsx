"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import s from "./MoveToMenu.module.scss";

interface Props {
  current: string;
  stages: Array<{ id: string; label: string }>;
  onMove: (stage: string) => void;
  disabled?: boolean;
  /** Accessible name of what is moved, e.g. the client's name. */
  subject: string;
}

/**
 * Keyboard-accessible alternative to drag-and-drop: a menu button listing the
 * other stages. Enter/Space/ArrowDown opens, arrows move, Enter picks, Esc closes.
 */
export default function MoveToMenu({ current, stages, onMove, disabled, subject }: Props) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const options = stages.filter((x) => x.id !== current);

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const onDoc = (e: MouseEvent) => {
      if (!listRef.current?.contains(e.target as Node) && e.target !== btnRef.current) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function close(focusButton = true) {
    setOpen(false);
    if (focusButton) btnRef.current?.focus();
  }

  function onListKey(e: KeyboardEvent<HTMLUListElement>) {
    const items = Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? []);
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      items[(i + 1) % items.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      items[(i - 1 + items.length) % items.length]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      items[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      items[items.length - 1]?.focus();
    } else if (e.key === "Tab") {
      close(false);
    }
  }

  return (
    <div className={s.wrap}>
      <button
        ref={btnRef}
        type="button"
        className={s.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Move ${subject} to another stage`}
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        Move to…
      </button>
      {open && (
        <ul id={menuId} ref={listRef} role="menu" className={s.menu} onKeyDown={onListKey} onClick={(e) => e.stopPropagation()}>
          {options.map((o) => (
            <li key={o.id} role="none">
              <button
                type="button"
                role="menuitem"
                className={s.item}
                onClick={() => {
                  close();
                  onMove(o.id);
                }}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
