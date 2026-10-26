"use client";

import { useEffect, useState } from "react";
import {
  pushSupported,
  notificationPermission,
  requestNotificationPermission,
  subscribeToPush,
} from "@/lib/push";
import s from "./notificationOptIn.module.scss";

/**
 * Compact notification opt-in for the client portal. Shown only when the
 * browser supports push and permission has not been decided yet. On grant it
 * subscribes the browser and persists the subscription under the signed-in
 * client's email. Maps rest, hover, focus-visible, active, and busy states.
 */
export default function NotificationOptIn() {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!pushSupported()) return;
    const permission = notificationPermission();
    if (permission === "prompt") {
      setVisible(true);
    } else if (permission === "granted") {
      // The customer may have granted permission during signup (local-only
      // subscription). Persist it now under the authenticated email.
      void subscribeToPush();
    }
  }, []);

  async function handleEnable() {
    if (busy) return;
    setBusy(true);
    try {
      const permission = await requestNotificationPermission();
      if (permission === "granted") {
        await subscribeToPush();
        setVisible(false);
      } else if (permission === "denied") {
        setVisible(false);
      }
    } finally {
      setBusy(false);
    }
  }

  if (!visible) return null;

  return (
    <div className={s.banner} role="status">
      <p className={s.text}>Get browser reminders before each legal deadline.</p>
      <button
        type="button"
        className={s.enable}
        onClick={handleEnable}
        disabled={busy}
        aria-busy={busy || undefined}
      >
        {busy ? "Enabling…" : "Enable notifications"}
      </button>
    </div>
  );
}