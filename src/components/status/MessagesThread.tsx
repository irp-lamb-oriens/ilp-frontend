"use client";

import { useEffect, useRef, useState } from "react";
import { Button, EmptyState, TextArea, Loadable, Stagger, StaggerItem, STAGGER_MAX } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { memberApi, type ThreadItem } from "./api";
import { isLegalTopic } from "./messageRules";
import { announceAiConsent, useAiConsent } from "@/components/legal/aiConsent";
import { dateShort, timeOfDay } from "./format";
import { ThreadSkeleton } from "./StatusSkeletons";
import s from "./MessagesThread.module.scss";

/**
 * One thread. People first: team messages are full cards; the AI assistant's
 * replies are smaller, indented, always labeled "AI assistant", and carry
 * "your team will confirm" on anything legal.
 */
export default function MessagesThread() {
  const [items, setItems] = useState<ThreadItem[] | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState<"team" | "ai" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  // P6/P7: the assistant stays off until the AI notice above is accepted.
  const aiAllowed = useAiConsent();

  useEffect(() => {
    memberApi
      .messages()
      .then((d) => setItems(d.items))
      .catch(() => setItems([]));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [items?.length]);

  async function send(to: "team" | "ai") {
    const body = text.trim();
    if (!body) return setError("Write your message first.");
    setBusy(to);
    setError(null);
    try {
      const d = to === "team" ? await memberApi.sendMessage(body) : await memberApi.askAssistant(body);
      setItems(d.items);
      setText("");
    } catch (err) {
      if (to === "ai" && err instanceof ApiError && err.status === 403) announceAiConsent(false);
      setError(err instanceof ApiError ? err.message : "Could not send. Try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className={s.page}>
      <p className={s.intro}>
        Write to your ILP team here and a person from your team answers. For quick general questions you can ask
        the AI assistant. It is not your lawyer, and your team confirms anything legal.
      </p>

      <div className={s.thread} aria-live="polite">
        <Loadable loading={items === null} label="Loading messages" skeleton={<ThreadSkeleton />}>
          {() =>
            items === null ? null : items.length === 0 ? (
              <StaggerItem>
                <EmptyState compact title="No messages yet" body="Your conversation with your ILP team will appear here." />
              </StaggerItem>
            ) : (
              <Stagger>
                <ol className={s.list}>
                  {items.map((m, i) => (
                    // The newest messages (at the bottom, in view) stagger; older ones land together.
                    <Message key={m.id} m={m} index={Math.max(0, i - (items.length - STAGGER_MAX - 1))} />
                  ))}
                </ol>
              </Stagger>
            )
          }
        </Loadable>
        <div ref={endRef} />
      </div>

      <div className={s.composer}>
        <TextArea
          label="Your message"
          id="msg-body"
          rows={3}
          maxLength={4000}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        {error && (
          <p className={s.err} role="alert">
            {error}
          </p>
        )}
        <div className={s.actions}>
          <Button onClick={() => send("team")} busy={busy === "team"} disabled={!!busy}>
            Send to my team
          </Button>
          <Button
            variant="secondary"
            onClick={() => send("ai")}
            busy={busy === "ai"}
            disabled={!!busy || aiAllowed !== true}
            aria-describedby={aiAllowed === false ? "ai-off-hint" : undefined}
          >
            Ask the AI assistant
          </Button>
        </div>
        {aiAllowed === false && (
          <p id="ai-off-hint" className={s.muted}>
            To ask the AI assistant, read and accept the notice at the top of this page.
          </p>
        )}
      </div>
    </div>
  );
}

function Message({ m, index }: { m: ThreadItem; index: number }) {
  const when = m.at ? `${dateShort(m.at)}, ${timeOfDay(m.at)}` : "";
  if (m.kind === "ai") {
    return (
      <StaggerItem as="li" index={index} className={s.ai}>
        <p className={s.aiHead}>
          <span className={s.aiTag}>AI assistant</span>
          <span className={s.when}>{when}</span>
        </p>
        <p className={s.body}>{m.body}</p>
        {isLegalTopic(m.body) && (
          <p className={s.confirm}>This is general information, not legal advice. Your team will confirm.</p>
        )}
      </StaggerItem>
    );
  }
  const mine = m.kind === "member";
  return (
    <StaggerItem as="li" index={index} className={mine ? s.mine : s.team}>
      <p className={s.head}>
        <span className={s.author}>{mine ? "You" : m.author}</span>
        {mine && m.to === "ai" && <span className={s.toAi}>to the AI assistant</span>}
        <span className={s.when}>{when}</span>
      </p>
      <p className={s.body}>{m.body}</p>
    </StaggerItem>
  );
}
