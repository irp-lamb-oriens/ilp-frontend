"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cx } from "./cx";
import s from "./Popover.module.scss";

export interface PopoverProps {
  /** The trigger's content; the trigger is a button that opens the panel. */
  label: ReactNode;
  /** Accessible name when the label is not enough (e.g. "Filter by stage"). */
  ariaLabel?: string;
  /** Panel content; a function gets `close`. */
  children: ReactNode | ((close: () => void) => ReactNode);
  /** Marks the trigger as holding a value (filled chip). */
  active?: boolean;
  align?: "start" | "end";
  /** Panel width: "sm" 16rem, "md" 20rem. */
  width?: "sm" | "md";
  className?: string;
  triggerClassName?: string;
  /** "dialog" (default) for forms, "menu" for action lists. */
  role?: "dialog" | "menu";
  disabled?: boolean;
}

/**
 * Small anchored panel: opens under its trigger and scales from it
 * (transform and opacity only), Esc or a click outside closes it and focus
 * returns to the trigger. The first field inside gets focus.
 */
export function Popover({ label, ariaLabel, children, active, align = "start", width = "sm", className, triggerClassName, role = "dialog", disabled }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const id = useId();
  const wrap = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  const close = (focus = true) => {
    setOpen(false);
    if (focus) btn.current?.focus();
  };

  useEffect(() => {
    if (!open) {
      setShown(false);
      return;
    }
    const raf = window.requestAnimationFrame(() => setShown(true));
    const first = panel.current?.querySelector<HTMLElement>("input, select, textarea, button, [tabindex]:not([tabindex='-1'])");
    first?.focus();
    const onDoc = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
        btn.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      window.cancelAnimationFrame(raf);
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrap} className={cx(s.wrap, className)}>
      <button
        ref={btn}
        type="button"
        className={cx(s.trigger, active && s.active, triggerClassName)}
        aria-haspopup={role === "menu" ? "menu" : "dialog"}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
      >
        {label}
      </button>
      {open && (
        <div
          ref={panel}
          id={id}
          role={role === "menu" ? "menu" : "dialog"}
          aria-label={ariaLabel ?? (typeof label === "string" ? label : undefined)}
          className={cx(s.panel, s[align], s[width], shown && s.shown)}
        >
          {typeof children === "function" ? children(() => close()) : children}
        </div>
      )}
    </div>
  );
}

export default Popover;
