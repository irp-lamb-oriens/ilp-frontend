"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, TextInput, Loadable, Skeleton, SkeletonRegion, SkeletonText, ErrorNotice } from "@/components/ui";
import s from "./crm.module.scss";
import { dashboardFetch } from "@/lib/api";

interface LilyMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * R5.4 — CrmLilyTab: staff CRM chat with Lily for a single client. Loads the
 * thread from GET /api/dashboard/clients/:id/lily/history and sends new
 * messages to POST /api/dashboard/clients/:id/lily.
 */
export default function CrmLilyTab({ clientId }: { clientId: string }) {
  const [thread, setThread] = useState<LilyMessage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await dashboardFetch<{ thread: LilyMessage[] }>(
        `/api/dashboard/clients/${clientId}/lily/history`,
      );
      setThread(res.thread ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Lily thread.");
    } finally {
      setLoaded(true);
    }
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setError(null);
    setThread((prev) => [...prev, { role: "user", content: text }]);
    setBusy(true);
    try {
      const res = await dashboardFetch<{ reply: string }>(
        `/api/dashboard/clients/${clientId}/lily`,
        { method: "POST", body: JSON.stringify({ message: text }) },
      );
      setThread((prev) => [...prev, { role: "assistant", content: res.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reach Lily.");
    } finally {
      setBusy(false);
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
      });
    }
  }

  return (
    <div className={s.stack}>
      <div ref={listRef} className={s.thread}>
        <Loadable loading={!loaded} label="Loading the Lily thread" className={s.threadSk} skeleton={<LilyThreadSkeleton />}>
          {() => (
            <>
              {thread.length === 0 && <p className={s.meta}>No conversation yet.</p>}
              {thread.map((m, i) => (
                <div key={i} className={`${s.bubble} ${m.role === "user" ? s.user : s.assistant}`}>
                  {m.role !== "user" && <span className={s.aiLabel}>Lily (AI)</span>}
                  {m.content}
                </div>
              ))}
              {busy && (
                <SkeletonRegion label="Lily is writing a reply" className={`${s.bubble} ${s.assistant} ${s.bubbleSk}`}>
                  <Skeleton shape="line" size="xs" width="25" />
                  <SkeletonText lines={2} size="sm" />
                </SkeletonRegion>
              )}
            </>
          )}
        </Loadable>
      </div>
      {error && (
        <ErrorNotice audience="staff">{error}</ErrorNotice>
      )}
      <form onSubmit={send} className={s.composer}>
        <TextInput
          label="Ask Lily"
          hideLabel
          className={s.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Lily about this matter…"
        />
        <Button type="submit" size="sm" busy={busy} disabled={!input.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}

/** Two exchanges: a question on the right, Lily's labeled answer on the left. */
function LilyThreadSkeleton() {
  return (
    <>
      {[0, 1].map((i) => (
        <div key={i} className={s.threadSk}>
          <div className={`${s.bubble} ${s.user} ${s.bubbleSk}`} aria-hidden="true">
            <SkeletonText lines={1} size="sm" />
          </div>
          <div className={`${s.bubble} ${s.assistant} ${s.bubbleSk}`} aria-hidden="true">
            <Skeleton shape="line" size="xs" width="25" />
            <SkeletonText lines={2} size="sm" />
          </div>
        </div>
      ))}
    </>
  );
}
