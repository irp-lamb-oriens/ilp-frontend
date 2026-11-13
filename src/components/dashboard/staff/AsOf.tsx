"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import s from "./staff.module.scss";

/** "just now", "4 min ago", "1 h ago" from an ISO time. */
export function agoLabel(iso: string, now = Date.now()): string {
  const min = Math.max(0, Math.floor((now - Date.parse(iso)) / 60_000));
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  return `${Math.floor(min / 60)} h ago`;
}

/**
 * How fresh a page's company-wide figures are, with a way to update them now.
 * The server computes these figures at most every 10 minutes and hands back
 * `asOf` (server/helper/summaries.ts); Refresh asks it to recompute.
 * Renders nothing until the figures have loaded.
 */
export function AsOf({ asOf, onRefresh, busy }: { asOf?: string | null; onRefresh: () => void; busy?: boolean }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  if (!asOf || Number.isNaN(Date.parse(asOf))) return null;
  const at = new Date(asOf).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return (
    <div className={s.asOf}>
      <span role="status" title="Company-wide figures are worked out at most every 10 minutes.">
        Figures from {at} ({agoLabel(asOf, now)})
      </span>
      <Button variant="ghost" size="sm" onClick={onRefresh} busy={busy}>
        Update now
      </Button>
    </div>
  );
}
