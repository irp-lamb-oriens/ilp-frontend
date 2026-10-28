"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Button, EmptyState, TextArea, Loadable, Skeleton, SkeletonRegion, SkeletonText, Stagger, StaggerItem, STAGGER_MAX, ErrorNotice } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { useStreamedList } from "@/lib/useStreamedList";
import { memberApi, messagesSource, type ThreadItem } from "./api";
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
  // Newest first from the server; shown oldest at the top. Older pages load on scroll up.
  const list = useStreamedList<ThreadItem>(messagesSource, { key: "member-messages", pageSize: 30, sort: { key: "at", dir: "desc" }, keyOf: (m) => m.id });
  const items = useMemo(() => (list.initialLoading ? null : [...list.items].reverse()), [list.initialLoading, list.items]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState<"team" | "ai" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  // P6/P7: the assistant stays off until the AI notice above is accepted.
  const aiAllowed = useAiConsent();

  const topRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const anchor = useRef<{ id: string; top: number } | null>(null);

  // Open on the newest message, and follow new ones; loading older ones does not jump.
  const newest = items?.[items.length - 1]?.id;
  useEffect(() => {
    if (newest) endRef.current?.scrollIntoView({ block: "end" });
  }, [newest]);

  /** Remember where the first visible message is, so older ones can load above it without a jump. */
  function loadOlder() {
    const first = listRef.current?.querySelector<HTMLElement>("li[data-id]");
    if (first) anchor.current = { id: first.dataset.id ?? "", top: first.getBoundingClientRect().top };
    list.loadMore();
  }
  useLayoutEffect(() => {
    const a = anchor.current;
    if (!a) return;
    const el = listRef.current?.querySelector<HTMLElement>(`li[data-id="${CSS.escape(a.id)}"]`);
    if (!el) return;
    const delta = el.getBoundingClientRect().top - a.top;
    if (delta) window.scrollBy(0, delta);
    if (!list.loadingMore) anchor.current = null;
  }, [items, list.loadingMore]);

  // The top of the thread scrolled into view: load the page before it.
  const canLoadOlder = list.hasMore && list.status === "done";
  useEffect(() => {
    const el = topRef.current;
    if (!canLoadOlder || !el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) loadOlder();
    }, { rootMargin: "200px 0px" });
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canLoadOlder]);

  async function send(to: "team" | "ai") {
    const body = text.trim();
    if (!body) return setError("Write your message first.");
    setBusy(to);
    setError(null);
    try {
      const d = to === "team" ? await memberApi.sendMessage(body) : await memberApi.askAssistant(body);
      // The reply holds the whole thread (oldest first): add only the new messages, newest first.
      list.update((cur) => {
        const have = new Set(cur.map((m) => m.id));
        return [...d.items.filter((m) => !have.has(m.id)).reverse(), ...cur];
      });
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
      <div className={s.thread} aria-live="polite" aria-busy={list.loadingMore || undefined}>
        <div ref={topRef} />
        {list.hasMore && (
          <div className={s.older}>
            <Button size="sm" variant="ghost" onClick={loadOlder} disabled={list.loadingMore}>
              {list.loadingMore ? "Loading earlier messages…" : "Show earlier messages"}
            </Button>
          </div>
        )}
        {list.loadingMore && <SkeletonText lines={2} size="sm" />}
        {list.error && (
          <ErrorNotice audience="member" onRetry={list.items.length ? loadOlder : list.refresh}>
            {list.error}
          </ErrorNotice>
        )}
        <Loadable loading={items === null && !list.error} label="Loading messages" skeleton={<ThreadSkeleton />}>
          {() =>
            items === null ? null : items.length === 0 ? (
              <StaggerItem>
                <EmptyState
                  compact
                  title="No messages yet"
                  body="Write your first message in the box below. A person from your ILP team answers here, and the whole conversation stays on this page."
                />
              </StaggerItem>
            ) : (
              <Stagger>
                <ol className={s.list} ref={listRef}>
                  {items.map((m, i) => (
                    // The newest messages (at the bottom, in view) stagger; older ones land together.
                    <Message key={m.id} m={m} index={Math.max(0, i - (items.length - STAGGER_MAX - 1))} />
                  ))}
                </ol>
              </Stagger>
            )
          }
        </Loadable>
        {busy === "ai" && items !== null && (
          // Where the assistant's reply will land, in the reply's own bubble.
          <SkeletonRegion label="The AI assistant is writing a reply" className={s.pendingReply}>
            <div className={s.ai} aria-hidden="true">
              <Skeleton shape="pill" size="sm" />
              <SkeletonText lines={2} size="sm" />
            </div>
          </SkeletonRegion>
        )}
        <div ref={endRef} />
      </div>

      <div className={s.composer} data-tour="client-message-box">
        <TextArea
          label="Your message"
          id="msg-body"
          rows={3}
          maxLength={4000}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        {error && (
          <ErrorNotice audience="member">{error}</ErrorNotice>
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
      <StaggerItem as="li" index={index} className={s.ai} data-id={m.id}>
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
    <StaggerItem as="li" index={index} className={mine ? s.mine : s.team} data-id={m.id}>
      <p className={s.head}>
        <span className={s.author}>{mine ? "You" : m.author}</span>
        {mine && m.to === "ai" && <span className={s.toAi}>to the AI assistant</span>}
        <span className={s.when}>{when}</span>
      </p>
      <p className={s.body}>{m.body}</p>
    </StaggerItem>
  );
}
