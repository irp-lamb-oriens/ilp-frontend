"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  statusFetch,
  getClientToken,
  clearClientToken,
  type StatusProjectPayload,
  type StatusChargesPayload,
  type StatusQuote,
  type StatusChatMessage,
  type StatusComment,
} from "@/lib/status";
import AnimatedTabs, { type TabItem } from "@/components/AnimatedTabs";
import s from "../status.module.scss";

export default function StatusProjectPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const projectId = decodeURIComponent(params.id);

  const [payload, setPayload] = useState<StatusProjectPayload | null>(null);
  const [charges, setCharges] = useState<StatusChargesPayload | null>(null);
  const [quotes, setQuotes] = useState<StatusQuote[]>([]);
  const [thread, setThread] = useState<StatusChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Chat + comment + rating form state
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [ratingBusy, setRatingBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!getClientToken()) {
      router.replace("/status");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [p, c, q, t] = await Promise.all([
        statusFetch<StatusProjectPayload>(`/api/client-status/project/${projectId}`),
        statusFetch<StatusChargesPayload>(`/api/client-status/project/${projectId}/charges`),
        statusFetch<{ quotes: StatusQuote[] }>(`/api/client-status/project/${projectId}/quotes`),
        statusFetch<{ thread: StatusChatMessage[] }>(`/api/client-status/project/${projectId}/lily/history`),
      ]);
      setPayload(p);
      setCharges(c);
      setQuotes(q.quotes);
      setThread(t.thread);
    } catch (err) {
      if (err instanceof Error && (err as { status?: number }).status === 401) {
        clearClientToken();
        router.replace("/status");
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to load project.");
    } finally {
      setLoading(false);
    }
  }, [projectId, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function sendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || chatBusy) return;
    setChatBusy(true);
    const text = chatInput.trim();
    setChatInput("");
    setThread((prev) => [...prev, { role: "user", content: text, createdAt: new Date().toISOString() }]);
    try {
      const res = await statusFetch<{ reply: string }>(
        `/api/client-status/project/${projectId}/lily`,
        { method: "POST", body: JSON.stringify({ message: text }) },
      );
      setThread((prev) => [...prev, { role: "assistant", content: res.reply, createdAt: new Date().toISOString() }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message.");
    } finally {
      setChatBusy(false);
    }
  }

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentBody.trim() || commentBusy) return;
    setCommentBusy(true);
    try {
      const res = await statusFetch<{ comment: StatusComment }>(
        `/api/client-status/project/${projectId}/comment`,
        { method: "POST", body: JSON.stringify({ body: commentBody.trim() }) },
      );
      setPayload((prev) =>
        prev
          ? { ...prev, project: { ...prev.project, statusComments: [...prev.project.statusComments, res.comment] } }
          : prev,
      );
      setCommentBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add comment.");
    } finally {
      setCommentBusy(false);
    }
  }

  async function rateStage(stageKey: string, rating: number) {
    if (ratingBusy) return;
    setRatingBusy(stageKey);
    try {
      await statusFetch(`/api/client-status/project/${projectId}/stage-rating`, {
        method: "POST",
        body: JSON.stringify({ stageKey, rating }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save rating.");
    } finally {
      setRatingBusy(null);
    }
  }

  if (loading) {
    return (
      <main className={s.main}>
        <p>Loading…</p>
      </main>
    );
  }

  if (!payload) {
    return (
      <main className={s.main}>
        <p className={s.error}>{error ?? "Project not found."}</p>
      </main>
    );
  }

  const { project, stages, stageLabels, clientFields } = payload;
  const currentIdx = stages.indexOf(project.stage);
  const stageLabel = (id: string) => stageLabels.find((l) => l.id === id)?.label ?? id;

  const tabs: TabItem[] = [
    {
      id: "progress",
      label: "Progress",
      content: (
        <div className={s.stepper}>
          {stages.map((stage, i) => {
            const done = i < currentIdx;
            const active = i === currentIdx;
            const existing = project.stageRatings[stage];
            return (
              <div
                key={stage}
                className={`${s.step} ${active ? s.stepActive : ""} ${done ? s.stepDone : ""}`}
              >
                <span className={s.stepLabel}>{stageLabel(stage)}</span>
                {project.viewerIsPrincipal && (done || active) && (
                  <span className={s.stars}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        className={`${s.star} ${existing && existing.rating >= n ? s.starFilled : ""}`}
                        onClick={() => rateStage(stage, n)}
                        disabled={ratingBusy === stage}
                        aria-label={`Rate ${stageLabel(stage)} ${n} stars`}
                      >
                        ★
                      </button>
                    ))}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ),
    },
    {
      id: "details",
      label: "Your details",
      content: (
        <div className={s.fieldList}>
          {clientFields.length === 0 && <p className={s.empty}>No details on file.</p>}
          {clientFields.map((f) => (
            <div key={f.id} className={s.fieldRow}>
              <span className={s.fieldLabel}>{f.label}</span>
              <span className={s.fieldValue}>
                {f.value === "" || f.value == null ? "—" : String(f.value)}
              </span>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "charges",
      label: "Charges",
      content: charges && charges.charges.length > 0 ? (
        <>
          {charges.charges.map((c, i) => (
            <div key={i} className={s.chargeRow}>
              <span className={s.chargeLabel}>{c.label ?? "Charge"}</span>
              <span className={s.chargeAmount}>
                ${c.total.toFixed(2)} · {c.status.replace("_", " ")}
              </span>
            </div>
          ))}
          <div className={s.totals}>
            <div className={s.totalRow}>
              <span>Received</span>
              <span>${charges.totals.received.toFixed(2)}</span>
            </div>
            <div className={s.totalRow}>
              <span>Balance due</span>
              <span>${charges.totals.balanceDue.toFixed(2)}</span>
            </div>
          </div>
        </>
      ) : (
        <p className={s.empty}>No charges yet.</p>
      ),
    },
    {
      id: "quotes",
      label: "Quotes",
      content: quotes.length > 0 ? (
        quotes.map((q) => (
          <div key={q.id} className={s.quote}>
            <div className={s.quoteTitle}>{q.title ?? q.id}</div>
            <div className={s.quoteMeta}>
              {q.status} · {q.currency ?? "USD"} {q.total != null ? q.total : ""}
            </div>
          </div>
        ))
      ) : (
        <p className={s.empty}>No quotes yet.</p>
      ),
    },
    {
      id: "comments",
      label: "Comments",
      content: (
        <>
          <div className={s.commentList}>
            {project.statusComments.length === 0 && <p className={s.empty}>No comments yet.</p>}
            {project.statusComments.map((c) => (
              <div key={c.id} className={s.comment}>
                <div className={s.commentMeta}>
                  <span>{c.authorType === "staff" ? "ILP team" : "You"}</span>
                  <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
                <div className={s.commentBody}>{c.body}</div>
              </div>
            ))}
          </div>
          <form className={s.chatForm} onSubmit={addComment}>
            <input
              className={s.chatInput}
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              placeholder="Add a comment…"
            />
            <button type="submit" className={s.primary} disabled={commentBusy}>
              Post
            </button>
          </form>
        </>
      ),
    },
    {
      id: "lily",
      label: "Ask Lily",
      content: (
        <>
          <div className={s.chat}>
            {thread.length === 0 && <p className={s.empty}>Ask a question about your matter.</p>}
            {thread.map((m, i) => (
              <div
                key={i}
                className={`${s.chatMsg} ${m.role === "user" ? s.chatUser : s.chatAssistant}`}
              >
                {m.content}
              </div>
            ))}
          </div>
          <form className={s.chatForm} onSubmit={sendChat}>
            <input
              className={s.chatInput}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type a message…"
            />
            <button type="submit" className={s.primary} disabled={chatBusy}>
              Send
            </button>
          </form>
        </>
      ),
    },
  ];

  return (
    <main className={s.main}>
      <header className={s.header}>
        <div>
          <h1 className={s.title}>
            {project.name || project.email || "Your matter"}
          </h1>
          <p className={s.sub}>
            {project.legalArea ? `${project.legalArea} · ` : ""}
            {project.jurisdiction ?? ""}
          </p>
        </div>
        <span className={s.stageBadge}>{stageLabel(project.stage)}</span>
      </header>

      {error && <p className={s.error}>{error}</p>}

      <section className={s.card}>
        <AnimatedTabs tabs={tabs} defaultTab="progress" />
      </section>
    </main>
  );
}
