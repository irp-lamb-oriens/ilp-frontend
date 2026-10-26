"use client";

import { useEffect, useState } from "react";
import {
  pushSupported,
  notificationPermission,
  requestNotificationPermission,
  subscribeToPush,
  subscribeLocally,
} from "@/lib/push";
import s from "./NotificationPermissionSlide.module.scss";

type SlideState = "idle" | "requesting" | "granted" | "denied" | "unsupported";

/**
 * Final signup slide: asks the customer to allow browser notifications with a
 * centered call-to-action. Clicking triggers the browser permission prompt;
 * on grant it subscribes the browser to push. Maps every interaction state
 * (rest, hover, focus-visible, active, busy, granted, denied, unsupported).
 */
export default function NotificationPermissionSlide({
  onDone,
  authenticated = false,
}: {
  onDone: () => void;
  /** When true (portal), persists the subscription under the signed-in email. */
  authenticated?: boolean;
}) {
  const [state, setState] = useState<SlideState>("idle");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!pushSupported()) {
      setState("unsupported");
      return;
    }
    const current = notificationPermission();
    if (current === "granted") setState("granted");
    else if (current === "denied") setState("denied");
  }, []);

  async function handleAllow() {
    if (busy) return;
    setBusy(true);
    try {
      const permission = await requestNotificationPermission();
      if (permission === "granted") {
        if (authenticated) {
          await subscribeToPush();
        } else {
          await subscribeLocally();
        }
        setState("granted");
      } else if (permission === "denied") {
        setState("denied");
      } else {
        setState("idle");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={s.slide}>
      <div className={s.icon} aria-hidden="true">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none">
          <path
            d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M13.7 21a2 2 0 0 1-3.4 0"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h2 className={s.title}>Stay ahead of every deadline</h2>
      <p className={s.copy}>
        Allow notifications and we will remind you in your browser before each
        legal deadline, so nothing slips past you.
      </p>

      {state === "unsupported" ? (
        <p className={s.note}>
          Your browser does not support notifications. You will still receive
          reminders by email.
        </p>
      ) : state === "granted" ? (
        <p className={s.note}>Notifications are on. You are all set.</p>
      ) : state === "denied" ? (
        <p className={s.note}>
          Notifications are off. You can enable them later from your browser
          settings.
        </p>
      ) : (
        <button
          type="button"
          className={s.allow}
          onClick={handleAllow}
          disabled={busy}
          aria-busy={busy || undefined}
        >
          {busy ? "Enabling…" : "Allow notifications"}
        </button>
      )}

      <button type="button" className={s.skip} onClick={onDone}>
        {state === "granted" ? "Continue" : "Not now"}
      </button>
    </div>
  );
}