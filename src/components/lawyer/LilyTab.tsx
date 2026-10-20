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

const QUICK_PROMPTS = [
  "Summarize this matter",
  "Draft a follow-up email",
  "What documents are missing?",
  "Summarize the client's concerns",
  "What is the current stage?",
];

function formatTime(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
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
  }, [thread, busy]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setInput("");
    setError(null);
    setThread((prev) => [
      ...prev,
      { role: "user", content: trimmed, createdAt: new Date().toISOString() },
    ]);
    setBusy(true);
    try {
      const res = await providerFetch<{ reply: string }>(
        `/api/provider/clients/${clientId}/lily`,
        { method: "POST", body: JSON.stringify({ message: trimmed }) },
      );
      setThread((prev) => [
        ...prev,
        { role: "assistant", content: res.reply, createdAt: new Date().toISOString(), author: "lily" },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reach Lily.");
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    send(input);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  return (
    <div className={styles.lily}>
      <div className={styles.banner}>
        <span className={styles.avatar} aria-hidden="true">🌿</span>
        <div className={styles.bannerText}>
          <span className={styles.bannerName}>
            Lily — CRM Copilot
            <span className={styles.onlineDot} aria-label="online" />
          </span>
          <span className={styles.bannerDesc}>
            Ask about this matter, draft emails, or summarize the client file.
          </span>
        </div>
      </div>

      <div ref={listRef} className={styles.thread}>
        {thread.length === 0 && (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>Ask Lily about this matter</p>
            <p className={styles.emptyDesc}>Try one of the prompts below to get started.</p>
          </div>
        )}
        {thread.map((m, i) => (
          <div
            key={i}
            className={`${styles.bubble} ${
              m.role === "user" ? styles.bubbleUser : styles.bubbleAssistant
            }`}
          >
            <span className={styles.bubbleText}>{m.content}</span>
            <span className={styles.bubbleTime}>{formatTime(m.createdAt)}</span>
          </div>
        ))}
        {busy && (
          <div className={`${styles.bubble} ${styles.bubbleAssistant}`}>
            <span className={styles.typing} aria-label="Lily is typing">
              <span className={styles.typingDot} />
              <span className={styles.typingDot} />
              <span className={styles.typingDot} />
            </span>
          </div>
        )}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.prompts}>
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            className={styles.promptChip}
            disabled={busy}
            onClick={() => send(p)}
          >
            {p}
          </button>
        ))}
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <textarea
          className={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Lily about this matter… (Enter to send, Shift+Enter for newline)"
          rows={2}
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