"use client";

import { useState, type ReactNode } from "react";
import { ApiError } from "@/lib/api";
import s from "./DownloadButton.module.scss";

/**
 * A link-styled button that runs an authenticated download (AUTH: sessions
 * are Bearer tokens, so a plain `<a href>` to the API carries no credentials).
 * `download` is usually `() => downloadFile(role, path, fileName)` from
 * lib/api. Shows a short error under the label when the download fails.
 */
export function DownloadButton({
  download,
  className,
  children,
}: {
  download: () => Promise<void>;
  /** Visual class from the caller (usually its existing link style). */
  className?: string;
  children: ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await download();
    } catch (err) {
      setError(
        err instanceof ApiError && err.status !== 401
          ? err.message
          : "The download did not start. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className={s.wrap}>
      <button type="button" className={`${s.reset} ${className ?? ""}`} onClick={() => void run()} aria-busy={busy}>
        {children}
        {busy && <span className={s.busy}> (downloading…)</span>}
      </button>
      {error && (
        <span className={s.error} role="alert">
          {error}
        </span>
      )}
    </span>
  );
}

export default DownloadButton;
