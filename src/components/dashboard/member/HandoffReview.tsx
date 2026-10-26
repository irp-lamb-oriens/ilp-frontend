"use client";

import { useState } from "react";
import { staffApi } from "@/lib/api";
import type { Consultation, CsmTask, Handoff } from "@/lib/contracts";
import { Button, StatusPill } from "@/components/ui";
import { ErrorText } from "../staff/PageHeader";
import { dueLabel, shortDate } from "../staff/format";
import s from "./member.module.scss";

const WHO: Record<string, string> = { client: "Member", lawyer: "Lawyer", ilp: "ILP team" };

export interface HandoffReviewProps {
  handoff: Handoff;
  consultation?: Consultation | null;
  lawyerName?: string;
  /** Open proposal task already linked to this handoff, if any. */
  proposalTask?: CsmTask | null;
  onChanged?: (what: "task" | "quote") => void;
}

/**
 * Handoff review for the CSM: the lawyer's next steps are read-only (they are
 * the lawyer's judgment and already visible to the member); commercial notes
 * are staff-only and turn into a proposal task or a draft quote.
 */
export function HandoffReview({ handoff, consultation, lawyerName, proposalTask, onChanged }: HandoffReviewProps) {
  const [busy, setBusy] = useState<"task" | "quote" | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasTask, setHasTask] = useState(!!proposalTask);

  async function createTask() {
    setBusy("task");
    setError(null);
    try {
      const r = await staffApi.post<{ created: boolean; task: CsmTask }>(
        `/api/dashboard/staff/handoffs/${encodeURIComponent(handoff.id)}/proposal-task`,
        {},
      );
      setHasTask(true);
      setDone(r.created ? `Proposal task created, due ${shortDate(r.task.dueAt)}.` : "A proposal task for this handoff is already open.");
      onChanged?.("task");
    } catch (e) {
      setError(e instanceof Error ? e.message : "The task could not be created.");
    } finally {
      setBusy(null);
    }
  }

  async function draftQuote() {
    setBusy("quote");
    setError(null);
    try {
      const first = handoff.legalNextSteps[0]?.what ?? "Legal work";
      await staffApi.post(`/api/dashboard/clients/${encodeURIComponent(handoff.clientId)}/quotes`, {
        title: `Proposal: ${first}`.slice(0, 120),
        notes: handoff.commercialNotes ?? null,
        status: "draft",
        clientDescription: handoff.legalNextSteps.map((x) => x.what).join("; "),
      });
      setDone("Draft quote created. Price it in the client CRM (Pipeline), then send it for approval.");
      onChanged?.("quote");
    } catch (e) {
      setError(e instanceof Error ? e.message : "The quote could not be created.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className={s.handoff} aria-label="Handoff review">
      <div className={s.handoffHead}>
        <h3 className={s.blockTitle}>Handoff from {lawyerName ?? "the lawyer"}</h3>
        <span className={s.meta}>
          Approved {shortDate(handoff.approvedAt)}
          {consultation?.endedAt ? ` · call ended ${shortDate(consultation.endedAt)}` : ""}
        </span>
      </div>

      <div className={s.legal}>
        <p className={s.label}>Legal next steps (lawyer-approved, read-only, visible to the member)</p>
        <ol className={s.steps}>
          {handoff.legalNextSteps.map((st, i) => {
            const due = dueLabel(st.dueAt);
            return (
              <li key={i} className={s.step}>
                <span className={s.stepWhat}>{st.what}</span>
                <span className={s.stepMeta}>
                  <StatusPill size="sm" label={WHO[st.who] ?? st.who} />
                  {st.dueAt && <StatusPill size="sm" tone={due.tone} label={due.text} />}
                </span>
              </li>
            );
          })}
        </ol>
        {consultation?.summary?.text && (
          <p className={s.summary}>
            <span className={s.label}>{consultation.summary.status === "confirmed" ? "Confirmed summary" : "Suggested summary (AI, not confirmed)"}: </span>
            {consultation.summary.text}
          </p>
        )}
      </div>

      <div className={s.commercial}>
        <p className={s.label}>Commercial notes (staff only, never shown to the member or lawyer)</p>
        <p className={s.commercialText}>{handoff.commercialNotes || "No commercial follow-up noted."}</p>
        {handoff.commercialNotes && (
          <div className={s.row}>
            <Button size="sm" busy={busy === "task"} disabled={hasTask} onClick={createTask}>
              {hasTask ? "Proposal task open" : "Create proposal task"}
            </Button>
            <Button size="sm" variant="secondary" busy={busy === "quote"} onClick={draftQuote}>
              Draft quote
            </Button>
          </div>
        )}
      </div>
      {done && (
        <p className={s.ok} role="status">
          {done}
        </p>
      )}
      {error && <ErrorText>{error}</ErrorText>}
    </section>
  );
}
