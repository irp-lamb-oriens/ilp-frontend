"use client";

/**
 * SyncNotice (SYNC): starts the sync engine on every page and tells the
 * person, in one small notice, the three things they must know:
 *   - a screen is showing information saved earlier (server not reachable);
 *   - changes are waiting on this device to be sent;
 *   - a waiting change was sent, refused or lost.
 * Silent when everything is live, which is nearly always.
 */
import { useEffect, useState } from "react";
import { onSync, startSync } from "@/lib/sync";
import { Notice } from "@/components/ui/Notice";
import s from "./SyncNotice.module.scss";

type Result = { tone: "success" | "info"; title: string; text: string };

function clock(at: number): string {
  return new Date(at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function SyncNotice() {
  const [staleAt, setStaleAt] = useState<number | null>(null);
  const [waiting, setWaiting] = useState(0);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    startSync();
    return onSync((e) => {
      if (e.type === "stale") setStaleAt((cur) => (cur === null ? e.at : Math.min(cur, e.at)));
      else if (e.type === "live") setStaleAt(null);
      else if (e.type === "queued") {
        setWaiting(e.waiting);
        setResult(null);
      } else if (e.type === "sent") {
        setWaiting(e.waiting);
        if (e.waiting === 0) setResult({ tone: "success", title: "Your saved changes were sent", text: `Last one: ${e.label}.` });
      } else if (e.type === "rejected") {
        setWaiting(e.waiting);
        setResult({ tone: "info", title: `We could not save "${e.label}"`, text: `${e.reason} Open that page and save it again.` });
      } else if (e.type === "lost") {
        setWaiting(0);
        setResult({
          tone: "info",
          title: e.count === 1 ? "One saved change was not sent" : `${e.count} saved changes were not sent`,
          text: "Your sign-in ended before they could go out. Sign in and enter them again.",
        });
      }
    });
  }, []);

  if (staleAt === null && waiting === 0 && !result) return null;

  return (
    <div className={s.wrap}>
      {waiting > 0 && (
        <Notice tone="info" variant="banner" headingLevel="none" role="status" title={waiting === 1 ? "1 change is saved on this device" : `${waiting} changes are saved on this device`}>
          We could not reach the server. They will be sent as soon as the connection is back. You can keep this page open or come back later.
        </Notice>
      )}
      {staleAt !== null && (
        <Notice tone="info" variant="banner" headingLevel="none" role="status" title={`Showing information saved at ${clock(staleAt)}`}>
          We could not reach the server, so this may be out of date. It will update by itself when the connection is back.
        </Notice>
      )}
      {result?.tone === "success" && (
        <Notice tone="success" variant="banner" headingLevel="none" role="status" title={result.title} dismissible onDismiss={() => setResult(null)}>
          {result.text}
        </Notice>
      )}
      {result?.tone === "info" && (
        <Notice tone="info" variant="banner" headingLevel="none" role="status" title={result.title} dismissible onDismiss={() => setResult(null)}>
          {result.text}
        </Notice>
      )}
    </div>
  );
}
