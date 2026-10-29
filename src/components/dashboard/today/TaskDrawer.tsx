"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { staffApi } from "@/lib/api";
import type { CsmTask } from "@/lib/contracts";
import { Drawer, Loadable, ProgressBar, StatusPill } from "@/components/ui";
import { ErrorText } from "../staff/PageHeader";
import { MemberGlanceSkeleton } from "../member/MemberSkeleton";
import { dueLabel, memberName, shortDate, TASK_TYPE_LABEL, TASK_TYPE_TONE, usd } from "../staff/format";
import { isLawyerApplicationTask, isLawyerTask, lawyerTaskLabel, type MemberBundle, type QueueTask } from "../staff/types";
import { CloseTaskForm } from "../member/CloseTaskForm";
import { HandoffReview } from "../member/HandoffReview";
import { MembershipPanel } from "../member/MembershipPanel";
import { useLawyers } from "../staff/useLawyers";
import s from "../member/member.module.scss";

/**
 * Everything a CSM needs to act on one task without leaving Today: the member
 * at a glance, the context the task came from (handoff, quote, payment,
 * document), and the close-with-outcome form.
 */
export function TaskDrawer({
  task,
  onClose,
  onClosed,
  onChanged,
}: {
  task: QueueTask | null;
  onClose: () => void;
  onClosed: (t: CsmTask) => void;
  onChanged: () => void;
}) {
  const [bundle, setBundle] = useState<MemberBundle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const lawyerApp = isLawyerApplicationTask(task);
  const lawyerTask = isLawyerTask(task);
  const clientId = lawyerTask ? undefined : task?.clientId;
  const { nameOf } = useLawyers();

  useEffect(() => {
    if (!clientId) return;
    let live = true;
    setError(null);
    staffApi
      .get<MemberBundle>(`/api/staff/members/${encodeURIComponent(clientId)}`)
      .then((b) => live && setBundle(b))
      .catch((e) => live && setError(e instanceof Error ? e.message : "Member could not be loaded."));
    return () => {
      live = false;
    };
  }, [clientId, reload]);

  const b = bundle && bundle.client?.id === clientId ? bundle : null;
  const due = dueLabel(task?.dueAt);
  const handoff = task?.source.kind === "handoff" ? b?.handoffs.find((h) => h.id === task.source.id) : undefined;
  const quote =
    task?.source.kind === "quote"
      ? ((b?.client?.quotes as Array<Record<string, unknown>> | undefined) ?? []).find((q) => q.id === task.source.id)
      : undefined;
  const name = lawyerTask ? lawyerTaskLabel(task) : (task?.memberName ?? memberName(b?.client ?? null));

  return (
    <Drawer
      open={!!task}
      onClose={onClose}
      size="lg"
      title={task?.title ?? ""}
      subtitle={task ? `${TASK_TYPE_LABEL[task.type]} · ${name}` : undefined}
      footer={task ? <CloseTaskForm key={task.id} task={task} onClosed={onClosed} /> : null}
    >
      {task && (
        <div className={s.col}>
          <div className={s.row}>
            <StatusPill label={TASK_TYPE_LABEL[task.type]} tone={TASK_TYPE_TONE[task.type]} srPrefix="Task type" />
            <StatusPill label={due.text} tone={due.tone} srPrefix="Due" />
            {lawyerApp ? (
              <Link className={s.linkBtn} href="/dashboard/lawyers#applications">
                Open lawyer applications
              </Link>
            ) : lawyerTask ? (
              <Link className={s.linkBtn} href="/dashboard/lawyers">
                Open lawyers
              </Link>
            ) : (
              <Link className={s.linkBtn} href={`/dashboard/members/${encodeURIComponent(task.clientId)}`}>
                Open member page
              </Link>
            )}
          </div>
          {lawyerApp && (
            <p className={s.meta}>
              Review the application on the Lawyers page. Approve, Request changes and Decline each email the lawyer and close this task.
            </p>
          )}

          {error && <ErrorText>{error}</ErrorText>}
          {lawyerTask && !lawyerApp && (
            <p className={s.meta}>
              ILP emailed this lawyer their recent member feedback with constructive suggestions and offered a call. Offer the call, then close this task with what you agreed.
            </p>
          )}
          <Loadable loading={!lawyerTask && !b && !error} label="Loading member" skeleton={<MemberGlanceSkeleton />}>
            {null}
          </Loadable>

          {b && (
            <>
              <section className={s.block} aria-label="Member at a glance">
                <div className={s.blockHead}>
                  <h3 className={s.blockTitle}>{name}</h3>
                  <span className={s.meta}>{String(b.client?.email ?? "")}</span>
                </div>
                <ProgressBar
                  label={b.completeness.consultationReady ? "Profile complete (consultation-ready)" : "Profile complete (not ready yet)"}
                  value={b.completeness.score}
                  tone={b.completeness.consultationReady ? "success" : "warning"}
                />
                <dl className={s.facts}>
                  <div>
                    <dt>Minutes left</dt>
                    <dd>{b.membership ? `${b.minutesLeft} of ${b.membership.minutesIncluded}` : "No membership"}</dd>
                  </div>
                  <div>
                    <dt>Calls left</dt>
                    <dd>{b.membership ? `${b.callsLeft} of ${b.membership.callsIncluded}` : "No membership"}</dd>
                  </div>
                  <div>
                    <dt>Next call</dt>
                    <dd>{shortDate(b.consultations.filter((c) => c.status === "booked").map((c) => c.scheduledAt).sort()[0])}</dd>
                  </div>
                  <div>
                    <dt>Open tasks</dt>
                    <dd>{b.tasks.filter((t) => t.status === "open").length}</dd>
                  </div>
                </dl>
                {b.nextStep && (
                  <div className={s.nextStep}>
                    <p className={s.label}>Member&apos;s next step</p>
                    <p className={s.nextWhat}>{b.nextStep.what}</p>
                    <p className={s.meta}>
                      {b.nextStep.who === "client" ? "Member" : b.nextStep.who === "lawyer" ? "Lawyer" : "ILP"} · {dueLabel(b.nextStep.dueAt).text}
                    </p>
                  </div>
                )}
              </section>

              {handoff && (
                <HandoffReview
                  handoff={handoff}
                  consultation={b.consultations.find((c) => c.id === handoff.consultationId)}
                  lawyerName={nameOf(handoff.providerId)}
                  proposalTask={b.tasks.find((t) => t.type === "proposal" && t.status === "open" && t.source.id === handoff.id) ?? null}
                  onChanged={() => {
                    onChanged();
                    setReload((n) => n + 1);
                  }}
                />
              )}

              {quote && (
                <section className={s.block} aria-label="Quote">
                  <h3 className={s.blockTitle}>{String(quote.title ?? "Quote")}</h3>
                  <p className={s.meta}>
                    {usd(typeof quote.totalMinor === "number" ? quote.totalMinor : Math.round(Number(quote.total ?? 0) * 100))} · sent{" "}
                    {shortDate(String(quote.sentToClientAt ?? quote.sentAt ?? quote.createdAt ?? ""))} · status {String(quote.status ?? "").replace(/_/g, " ")}
                  </p>
                </section>
              )}

              {(task.source.kind === "membership" || b.membership?.status === "pending" || b.membership?.status === "past_due") && (
                <MembershipPanel
                  membership={b.membership}
                  onChanged={() => {
                    onChanged();
                    setReload((n) => n + 1);
                  }}
                />
              )}

              {task.type === "missing_document" && (
                <section className={s.block} aria-label="Missing document">
                  <h3 className={s.blockTitle}>Missing document</h3>
                  <p className={s.meta}>
                    {((b.client?.pendingActions as Array<Record<string, unknown>> | undefined) ?? [])
                      .map((p) => `${String(p.label ?? "")} (due ${shortDate(String(p.dueAt ?? ""))})`)
                      .join("; ") || "No document request on file."}
                  </p>
                </section>
              )}
            </>
          )}
        </div>
      )}
    </Drawer>
  );
}
