"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button, Popover, StatusPill, type StatusTone } from "../ui";
import { bellHref, type BellItem, type BellSource, sortBell } from "@/lib/notifications";
import s from "./NotificationCenter.module.scss";

const POLL_MS = 60_000;

const SEVERITY: Record<BellItem["severity"], { label: string; tone: StatusTone }> = {
  urgent: { label: "Urgent", tone: "danger" },
  action: { label: "To do", tone: "warning" },
  info: { label: "For your information", tone: "info" },
};

function when(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  return new Date(t).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export interface NotificationCenterProps {
  source: BellSource;
  /** Which portal the links open in. */
  portal: "staff" | "csm" | "lawyer";
  /** Shown when there is nothing yet. */
  emptyText?: string;
}

/**
 * The real bell (COMMS-P3): unread count on the trigger, the newest items in
 * a panel (urgent unread first), each with a labeled pill and a link. Opening
 * an item marks it read; "Mark all read" clears the count. Polls once a
 * minute while the tab is visible.
 */
export function NotificationCenter({ source, portal, emptyText }: NotificationCenterProps) {
  const [items, setItems] = useState<BellItem[] | null>(null);
  const [unread, setUnread] = useState(0);
  const [failed, setFailed] = useState(false);

  const load = useCallback(() => {
    if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
    source
      .list(30)
      .then((r) => {
        setItems(sortBell(r.items));
        setUnread(r.unread);
        setFailed(false);
      })
      .catch(() => setFailed(true));
  }, [source]);

  useEffect(() => {
    load();
    const t = window.setInterval(load, POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  async function readAll() {
    await source.markAll().catch(() => undefined);
    load();
  }

  function open(item: BellItem) {
    if (!item.read) {
      setItems((list) => list?.map((x) => (x.id === item.id ? { ...x, read: true } : x)) ?? null);
      setUnread((n) => Math.max(0, n - 1));
      source.markRead([item.id]).catch(() => undefined);
    }
  }

  const label = unread > 0 ? `Notifications, ${unread} unread` : "Notifications";
  return (
    <Popover
      label={
        <span className={s.trigger}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 9a6 6 0 1 1 12 0c0 4.5 1.5 6 2 7H4c.5-1 2-2.5 2-7Z M10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {unread > 0 && (
            <span className={s.count} aria-hidden="true">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </span>
      }
      ariaLabel={label}
      align="end"
      width="md"
      role="dialog"
      triggerClassName={s.triggerButton}
    >
      {(close) => (
        <div className={s.panel} data-tour="bell-panel">
          <div className={s.head}>
            <h2 className={s.title}>Notifications</h2>
            {unread > 0 && (
              <Button size="sm" variant="secondary" onClick={readAll}>
                Mark all read
              </Button>
            )}
          </div>
          {failed && !items && <p className={s.meta}>Notifications could not be loaded. They will try again in a minute.</p>}
          {items && items.length === 0 && <p className={s.meta}>{emptyText ?? "Nothing new. Alerts about your work appear here."}</p>}
          {items && items.length > 0 && (
            <ul className={s.list}>
              {items.slice(0, 20).map((n) => {
                const href = bellHref(n, portal);
                const sev = SEVERITY[n.severity] ?? SEVERITY.info;
                return (
                  <li key={n.id} className={n.read ? s.read : s.unread}>
                    <span className={s.pills}>
                      <StatusPill size="sm" label={sev.label} tone={n.read ? "neutral" : sev.tone} />
                      {!n.read && <StatusPill size="sm" label="New" tone="info" />}
                    </span>
                    {href ? (
                      <Link
                        className={s.link}
                        href={href}
                        onClick={() => {
                          open(n);
                          close();
                        }}
                      >
                        {n.title}
                      </Link>
                    ) : (
                      <button type="button" className={s.linkButton} onClick={() => open(n)}>
                        {n.title}
                      </button>
                    )}
                    {n.body && <span className={s.body}>{n.body}</span>}
                    <span className={s.meta}>
                      {when(n.createdAt)}
                      {n.emailed ? " · also sent by email" : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </Popover>
  );
}

export default NotificationCenter;
