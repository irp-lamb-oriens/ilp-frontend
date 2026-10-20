"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { providerFetch } from "@/lib/provider";
import styles from "./lilyTab.module.scss";

interface LilyMessage {
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
  author?: string;
}

export default function LilyTab({ clientId }: { clientId: string }) {
  const [thread, setThread] = useState<LilyMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await providerFetch<{ thread: LilyMessage[] }>(
        `/api/provider/clients/${clientId}/lily/history`,
      );
      setThread(res.thread ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Lily thread.");
    }
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
  }, [thread]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setError(null);
    setThread((prev) => [...prev, { role: "user", content: text }]);
    setBusy(true);
    try {
      const res = await providerFetch<{ reply: string }>(
        `/api/provider/clients/${clientId}/lily`,
        { method: "POST", body: JSON.stringify({ message: text }) },
      );
      setThread((prev) => [...prev, { role: "assistant", content: res.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reach Lily.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.lily}>
      <div ref={listRef} className={styles.thread}>
        {thread.length === 0 && (
          <p className={styles.empty}>Ask Lily about this matter…</p>
        )}
        {thread.map((m, i) => (
          <div
            key={i}
            className={`${styles.bubble} ${
              m.role === "user" ? styles.bubbleUser : styles.bubbleAssistant
            }`}
          >
            {m.content}
          </div>
        ))}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <form className={styles.form} onSubmit={send}>
        <input
          className={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Lily about this matter…"
        />
        <button
          type="submit"
          className={styles.sendBtn}
          disabled={busy || !input.trim()}
        >
          {busy ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}