"use client";

import { useEffect, useState } from "react";
import {
  pushSupported,
  notificationPermission,
  requestNotificationPermission,
  subscribeToPush,
} from "@/lib/push";
import { Button, Notice } from "@/components/ui";

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
    <Notice
      id="status.notifications"
      dismissible
      tone="info"
      title="Get a reminder before each date"
      terms={["notification"]}
      actions={
        <Button onClick={handleEnable} busy={busy}>
          Enable notifications
        </Button>
      }
      fix={{
        label: "How this works",
        steps: [
          "Press Enable notifications. Your browser asks for permission; choose Allow.",
          "ILP then reminds you on this device before each date on your list. Email reminders continue as before.",
          "To turn them off later, change the notification setting for this site in your browser.",
          "Not now? Close this box. Nothing changes and you can still get reminders by email.",
        ],
      }}
    >
      A notification on this device before each date on your list.
    </Notice>
  );
}
