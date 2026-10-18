"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div
        ref={listRef}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          maxHeight: 320,
          overflowY: "auto",
          padding: "0.5rem",
          border: "1px solid rgba(18,59,93,0.14)",
          borderRadius: 10,
          minHeight: 160,
          background: "#eff7fb",
        }}
      >
        {thread.length === 0 && <p style={{ color: "#7a8a96", fontSize: "0.85rem" }}>No conversation yet.</p>}
        {thread.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              background: m.role === "user" ? "#5cccf7" : "#fff",
              color: m.role === "user" ? "#123b5d" : "#202a33",
              padding: "0.5rem 0.75rem",
              borderRadius: 10,
              maxWidth: "85%",
              fontSize: "0.9rem",
              border: m.role === "assistant" ? "1px solid rgba(18,59,93,0.14)" : undefined,
            }}
          >
            {m.content}
          </div>
        ))}
      </div>
      {error && <p style={{ color: "#c0392b", fontSize: "0.85rem", margin: 0 }}>{error}</p>}
      <form onSubmit={send} style={{ display: "flex", gap: "0.5rem" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Lily about this matter…"
          style={{
            flex: 1,
            padding: "0.6rem",
            border: "1px solid rgba(18,59,93,0.14)",
            borderRadius: 10,
            fontSize: "0.9rem",
          }}
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          style={{
            padding: "0.5rem 0.9rem",
            border: "none",
            borderRadius: 999,
            background: "#5cccf7",
            color: "#123b5d",
            fontWeight: 600,
            cursor: "pointer",
            opacity: busy || !input.trim() ? 0.5 : 1,
          }}
        >
          {busy ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}