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
import { getDashboardToken } from "@/lib/api";
import AnimatedTabs, { type TabItem } from "@/components/AnimatedTabs";
import StageTimeline from "@/components/status/StageTimeline";
import DeadlineConfig from "@/components/status/DeadlineConfig";
import EmptyState from "@/components/status/EmptyState";
import { GhostField, GhostLine, GhostBadge } from "@/components/status/Ghost";
import { Reveal } from "@/components/motion/Motion";
import CountUp from "@/components/motion/CountUp";
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
    if (!getClientToken() && !getDashboardToken()) {
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

  const { project, stages, stageLabels, stageDetails, clientFields } = payload;
  const stageLabel = (id: string) => stageLabels.find((l) => l.id === id)?.label ?? id;

  const tabs: TabItem[] = [
    {
      id: "progress",
      label: "Progress",
      content: (
        <StageTimeline
          stages={stages}
          stageLabels={stageLabels}
          stageDetails={stageDetails}
          currentStage={project.stage}
          stageRatings={project.stageRatings}
          viewerIsPrincipal={project.viewerIsPrincipal}
          ratingBusy={ratingBusy}
          onRate={rateStage}
        />
      ),
    },
    {
      id: "details",
      label: "Your details",
      content:
        clientFields.length === 0 ? (
          <EmptyState
            title="The details of your matter"
            explain="Fields describing your matter appear here as your legal team records them."
            steps={[
              "Your team captures the legal area and matter type first.",
              "Jurisdiction and documents follow as the case forms.",
              "Fields marked editable can be updated by you directly.",
            ]}
          >
            <GhostField label="Legal area" width="55%" />
            <GhostField label="Matter type" width="65%" />
            <GhostField label="Jurisdiction" width="40%" />
          </EmptyState>
        ) : (
          <div className={s.fieldList}>
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
              <CountUp
                value={charges.totals.received}
                formatter={(v) => `$${v.toFixed(2)}`}
              />
            </div>
            <div className={s.totalRow}>
              <span>Balance due</span>
              <CountUp
                value={charges.totals.balanceDue}
                formatter={(v) => `$${v.toFixed(2)}`}
              />
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          title="Charges on your matter"
          explain="Each fee the legal team posts appears here, with what has been paid and what remains."
          steps={[
            "A charge row shows the fee and its payment status.",
            "Totals track received versus balance due.",
            "Payment status updates as invoices settle.",
          ]}
        >
          <div className={s.chargeRow}>
            <span className={s.chargeLabel}>Legal fee</span>
            <span className={s.chargeAmount}>$0.00</span>
          </div>
          <div className={s.totals}>
            <div className={s.totalRow}>
              <span>Received</span>
              <GhostLine width="60px" height={10} />
            </div>
            <div className={s.totalRow}>
              <span>Balance due</span>
              <GhostLine width="60px" height={10} />
            </div>
          </div>
        </EmptyState>
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
        <EmptyState
          title="Quotes for your matter"
          explain="A quote appears here for your review before you accept it."
          steps={[
            "Your team prepares a quote with the scope and amount.",
            "You review it and confirm acceptance here.",
            "Once accepted, the matter moves to the next stage.",
          ]}
        >
          <div className={s.quote}>
            <div className={s.quoteTitle}>Quote</div>
            <div className={s.quoteMeta}>
              <GhostBadge>amount</GhostBadge>
            </div>
          </div>
        </EmptyState>
      ),
    },
    {
      id: "deadlines",
      label: "Deadlines",
      content: <DeadlineConfig projectId={projectId} />,
    },
    {
      id: "comments",
      label: "Comments",
      content: (
        <>
          {project.statusComments.length === 0 ? (
            <EmptyState
              title="Messages between you and your team"
              explain="Post updates and questions, and your legal team replies here in the same thread."
              steps={[
                "Type a message and post it below.",
                "Your team sees it and replies in this thread.",
                "Each reply shows who wrote it and when.",
              ]}
            >
              <div className={s.comment}>
                <div className={s.commentMeta}>
                  <span>ILP team</span>
                  <GhostLine width="80px" height={8} />
                </div>
                <div className={s.commentBody}>
                  <GhostLine width="85%" height={10} />
                </div>
              </div>
            </EmptyState>
          ) : (
            <div className={s.commentList}>
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
          )}
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
          {thread.length === 0 ? (
            <EmptyState
              title="Ask Lily about your matter"
              explain="Lily answers questions using only the details of your own matter, never general legal advice."
              steps={[
                "Type a question in the field below.",
                "Lily replies from your project's information.",
                "For complex questions, your team steps in.",
              ]}
            >
              <div className={`${s.chatMsg} ${s.chatUser}`}>
                <GhostLine width="70%" height={10} />
              </div>
              <div className={`${s.chatMsg} ${s.chatAssistant}`}>
                <GhostLine width="85%" height={10} />
              </div>
            </EmptyState>
          ) : (
            <div className={s.chat}>
              {thread.map((m, i) => (
                <div
                  key={i}
                  className={`${s.chatMsg} ${m.role === "user" ? s.chatUser : s.chatAssistant}`}
                >
                  {m.content}
                </div>
              ))}
            </div>
          )}
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
      <Reveal>
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
      </Reveal>

      {error && <p className={s.error}>{error}</p>}

      <Reveal>
        <section className={s.card}>
          <AnimatedTabs tabs={tabs} defaultTab="progress" />
        </section>
      </Reveal>
    </main>
  );
}
