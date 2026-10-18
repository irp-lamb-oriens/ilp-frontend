"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { sendChatbotMessage } from "@/lib/chatbot";
import { EASE_OUT_EXPO } from "@/components/motion/Motion";
import s from "./HeroChat.module.scss";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

/**
 * Conversational intake widget shown in the hero. Replaces/augments the
 * lead-form-only intake with the multi-agent chatbot (public /api/chatbot/message).
 * Collects a legal-area/jurisdiction question and surfaces the assistant reply.
 */
export default function HeroChat() {
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      content:
        "Hi, I'm ILP's legal intake assistant. What country and legal matter can I help you with?",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;

    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setBusy(true);

    try {
      const reply = await sendChatbotMessage(text);
      setMessages((prev) => [...prev, { role: "assistant", content: reply.response }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach the assistant.");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Please try again or use the form." },
      ]);
    } finally {
      setBusy(false);
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
      });
    }
  }

  return (
    <motion.div
      className={s.card}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
    >
      <div className={s.header}>
        <span className={s.dot} aria-hidden="true" />
        <span className={s.title}>Legal intake assistant</span>
      </div>
      <div className={s.list} ref={listRef}>
        {messages.map((m, i) => (
          <div key={i} className={`${s.msg} ${m.role === "user" ? s.user : s.assistant}`}>
            {m.content}
          </div>
        ))}
      </div>
      {error && <p className={s.error}>{error}</p>}
      <form className={s.form} onSubmit={submit}>
        <input
          className={s.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. Costa Rica, residency renewal"
          aria-label="Ask the legal intake assistant"
        />
        <button type="submit" className={s.send} disabled={busy || !input.trim()}>
          {busy ? "…" : "Send"}
        </button>
      </form>
    </motion.div>
  );
}