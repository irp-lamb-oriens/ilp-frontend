"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cx } from "./cx";
import s from "./Drawer.module.scss";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  /** One line under the title, e.g. "Matter · Property · Guanacaste". */
  subtitle?: ReactNode;
  children: ReactNode;
  /** Sticky footer actions. */
  footer?: ReactNode;
  size?: "md" | "lg";
  /** Element to focus first; defaults to the close button. */
  initialFocusRef?: React.RefObject<HTMLElement | null>;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const EXIT_MS = 280;

/**
 * Right-side drawer. Focus is trapped while open, Esc and the scrim close it,
 * and focus returns to the element that opened it. Slides with transform only.
 */
export function Drawer({ open, onClose, title, subtitle, children, footer, size = "md", initialFocusRef }: DrawerProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);

  // Mount, then flip to the shown state on the next frame so the transition runs.
  useEffect(() => {
    if (open) {
      returnFocus.current = (document.activeElement as HTMLElement) ?? null;
      setMounted(true);
      const raf = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      return () => cancelAnimationFrame(raf);
    }
    setShown(false);
    const t = window.setTimeout(() => setMounted(false), EXIT_MS);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open || !mounted) return;
    const target = initialFocusRef?.current ?? closeRef.current;
    target?.focus({ preventScroll: true });
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      returnFocus.current?.focus?.({ preventScroll: true });
    };
  }, [open, mounted, initialFocusRef]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (n) => !n.hasAttribute("hidden") && n.offsetParent !== null,
      );
      if (!nodes.length) {
        e.preventDefault();
        return;
      }
      const firstEl = nodes[0];
      const lastEl = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    },
    [onClose],
  );

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div className={cx(s.root, shown && s.shown)} onKeyDown={onKeyDown}>
      <div className={s.scrim} onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        className={cx(s.panel, s[size])}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className={s.head}>
          <div className={s.headText}>
            <h2 id={titleId} className={s.title}>
              {title}
            </h2>
            {subtitle && <p className={s.subtitle}>{subtitle}</p>}
          </div>
          <button ref={closeRef} type="button" className={s.close} onClick={onClose} aria-label="Close">
            <span aria-hidden="true">×</span>
          </button>
        </header>
        <div className={s.body}>{children}</div>
        {footer && <footer className={s.footer}>{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}

export default Drawer;
