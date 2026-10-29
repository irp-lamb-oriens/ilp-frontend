"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button, Popover } from "@/components/ui";
import { routingApi, type BellItem } from "@/lib/routing";
import s from "./routing.module.scss";

const POLL_MS = 60_000;

/**
 * Staff bell: routing alerts (a member nobody can take, a member matched
 * after a wait). Every staff member sees every alert; the count is what this
 * person has not read. Polls once a minute while the tab is visible.
 */
export function StaffBell() {
  const [items, setItems] = useState<BellItem[]>([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(() => {
    if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
    routingApi.notifications().then((r) => {
      setItems(r.items);
      setUnread(r.unread);
    }).catch(() => undefined);
  }, []);
  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  async function readAll() {
    await routingApi.markRead([]).catch(() => undefined);
    load();
  }

  const label = unread > 0 ? `Notifications, ${unread} unread` : "Notifications";
  return (
    <Popover
      label={<span className={s.bellLabel}>Alerts{unread > 0 && <span className={s.bellCount} aria-hidden="true">{unread > 99 ? "99+" : unread}</span>}</span>}
      ariaLabel={label}
      align="end"
      width="md"
      role="dialog"
    >
      {(close) => (
        <div className={s.bellPanel}>
          <div className={s.bellHead}>
            <strong>Alerts</strong>
            {unread > 0 && <Button size="sm" variant="secondary" onClick={readAll}>Mark all read</Button>}
          </div>
          {items.length === 0 ? (
            <p className={s.meta}>No alerts. When no lawyer can take a member, it shows here and every staff member gets an email.</p>
          ) : (
            <ul className={s.bellList}>
              {items.slice(0, 15).map((n) => (
                <li key={n.id} className={n.read ? s.read : s.unread}>
                  {n.link ? (
                    <Link href={n.link} onClick={() => { routingApi.markRead([n.id]).finally(load); close(); }}>{n.title}</Link>
                  ) : (
                    <span>{n.title}</span>
                  )}
                  <span className={s.meta}>{new Date(n.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}{n.read ? "" : " · new"}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Popover>
  );
}
