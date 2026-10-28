"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cx } from "./cx";
import { IconClose } from "./icons";
import s from "./Dialog.module.scss";

export interface DialogProps {
  open: boolean;
  /** Esc, the scrim and the caller's cancel button all call this. */
  onClose: () => void;
  title: ReactNode;
  children?: ReactNode;
  /** Action buttons, right-aligned (stacked on phones). Put the safe choice first. */
  footer?: ReactNode;
  /** "alertdialog" for confirmations that interrupt (unsaved changes, deletes). */
  role?: "dialog" | "alertdialog";
  /**
   * Element to focus first. Default: the first element inside with
   * data-autofocus, else the first focusable element.
   */
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  /** "lg" widens the panel for richer content (tutorials). Default "md". */
  size?: "md" | "lg";
  /** Small line above the title (the tutorial's name and step). */
  eyebrow?: ReactNode;
  /** Adds a close button (×) beside the title with this accessible name; it calls onClose. */
  closeLabel?: string;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const EXIT_MS = 200;

/**
 * Small centred modal (a bottom sheet on phones) for short confirmations.
 * Focus is trapped while open and returns to the element that opened it;
 * Esc and the scrim call onClose. Fades and scales with opacity/transform only.
 */
export function Dialog({ open, onClose, title, children, footer, role = "dialog", initialFocusRef, size = "md", eyebrow, closeLabel }: DialogProps) {
  const titleId = useId();
  const bodyId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);

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
    const panel = panelRef.current;
    const target =
      initialFocusRef?.current ??
      panel?.querySelector<HTMLElement>("[data-autofocus]") ??
      panel?.querySelector<HTMLElement>(FOCUSABLE) ??
      panel;
    target?.focus({ preventScroll: true });
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      const back = returnFocus.current;
      if (back && back.isConnected) back.focus?.({ preventScroll: true });
    };
  }, [open, mounted, initialFocusRef]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        e.preventDefault();
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
      if (e.shiftKey && (document.activeElement === firstEl || document.activeElement === panelRef.current)) {
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
        className={cx(s.panel, size === "lg" && s.lg)}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={children ? bodyId : undefined}
        tabIndex={-1}
      >
        {eyebrow || closeLabel ? (
          <div className={s.head}>
            <div className={s.headText}>
              {eyebrow && <p className={s.eyebrow}>{eyebrow}</p>}
              <h2 id={titleId} className={s.title}>
                {title}
              </h2>
            </div>
            {closeLabel && (
              <button type="button" className={s.close} aria-label={closeLabel} onClick={onClose}>
                <IconClose />
              </button>
            )}
          </div>
        ) : (
          <h2 id={titleId} className={s.title}>
            {title}
          </h2>
        )}
        {children && (
          <div id={bodyId} className={s.body}>
            {children}
          </div>
        )}
        {footer && <div className={s.footer}>{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export default Dialog;
