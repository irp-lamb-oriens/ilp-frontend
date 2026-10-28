"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cx } from "./cx";
import { IconClose, IconDanger, IconSuccess } from "./icons";
import s from "./Toast.module.scss";

export interface ToastProps {
  /** The message; null hides the toast. */
  message: string | null;
  tone?: "danger" | "success" | "neutral";
  onDismiss: () => void;
  /** Auto-hide after this many ms. Default 6000; 0 keeps it. */
  duration?: number;
}

/**
 * Small confirmation or failure line at the bottom of the screen (BOARDS:
 * a move that failed). Dashed hairline like a Notice, no fill. Slides with
 * transform and fades with opacity; reduced motion only fades.
 */
export function Toast({ message, tone = "neutral", onDismiss, duration = 6000 }: ToastProps) {
  const [shown, setShown] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!message) {
      setVisible(false);
      return;
    }
    setShown(message);
    const raf = window.requestAnimationFrame(() => setVisible(true));
    const t = duration ? window.setTimeout(onDismiss, duration) : 0;
    return () => {
      window.cancelAnimationFrame(raf);
      if (t) window.clearTimeout(t);
    };
  }, [message, duration, onDismiss]);
  if (typeof document === "undefined" || !shown) return null;
  return createPortal(
    <div className={cx(s.toast, s[tone], visible && s.visible)} role={tone === "danger" ? "alert" : "status"} onTransitionEnd={() => !visible && setShown(null)}>
      <span className={s.icon} aria-hidden="true">{tone === "danger" ? <IconDanger /> : tone === "success" ? <IconSuccess /> : null}</span>
      <span className={s.text}>{shown}</span>
      <button type="button" className={s.close} onClick={onDismiss} aria-label="Dismiss">
        <IconClose />
      </button>
    </div>,
    document.body,
  );
}

export default Toast;
