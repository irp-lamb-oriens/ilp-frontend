"use client";

/**
 * ChunkReload: when a page's code fails to download (the connection changed
 * mid-load, or a new version was published while the tab was open), reload
 * once so the person is not left on a blank screen. At most one reload a
 * minute, and never while offline.
 */
import { useEffect } from "react";

const KEY = "ilp_chunk_reload_at";

export function isChunkError(reason: unknown): boolean {
  const e = reason as { name?: unknown; message?: unknown } | null;
  return e?.name === "ChunkLoadError" || /Loading (CSS )?chunk [\w-]+ failed/i.test(String(e?.message ?? ""));
}

export default function ChunkReload() {
  useEffect(() => {
    const retry = (reason: unknown) => {
      if (!isChunkError(reason) || navigator.onLine === false) return;
      try {
        const last = Number(window.sessionStorage.getItem(KEY) ?? "0");
        if (Date.now() - last < 60_000) return;
        window.sessionStorage.setItem(KEY, String(Date.now()));
      } catch {
        return; // cannot remember the last reload: do not risk a loop
      }
      window.location.reload();
    };
    const onError = (e: ErrorEvent) => retry(e.error ?? { message: e.message });
    const onRejection = (e: PromiseRejectionEvent) => retry(e.reason);
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return null;
}
