"use client";

import type { LawyerClient } from "./types";
import styles from "./quotesTab.module.scss";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending_approval: "Pending approval",
  changes_requested: "Changes requested",
  approved: "Approved",
  sent_to_client: "Sent to client",
  client_accepted: "Accepted",
};

function money(v: unknown, currency: unknown): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: typeof currency === "string" ? currency : "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

export default function QuotesTab({ client }: { client: LawyerClient }) {
  const quotes = Array.isArray(client.quotes) ? client.quotes : [];

  if (quotes.length === 0) {
    return <p className={styles.empty}>No quotes yet.</p>;
  }

  return (
    <div className={styles.quotes}>
      {quotes.map((q, i) => {
        const quoteId = String(q.quoteId ?? q.id ?? i);
        const status = String(q.status ?? "draft");
        const lineItems = Array.isArray(q.lineItems) ? q.lineItems : [];
        const lineGroups = Array.isArray(q.lineGroups) ? q.lineGroups : [];
        const schedule = Array.isArray(q.paymentSchedule) ? q.paymentSchedule : [];
        const changeLog = Array.isArray(q.changeLog) ? q.changeLog : [];
        const approvals = Array.isArray(q.approvals) ? q.approvals : [];
        const comments = Array.isArray(q.comments) ? q.comments : [];

        return (
          <div key={quoteId} className={styles.quote}>
            <div className={styles.quoteHead}>
              <span className={styles.title}>{String(q.title ?? "Quote")}</span>
              <span className={`${styles.statusBadge} ${styles[`status_${status}`] ?? ""}`}>
                {STATUS_LABELS[status] ?? status}
              </span>
            </div>

            <div className={styles.totals}>
              <span className={styles.total}>
                {money(q.total, q.currency)}
              </span>
              {q.costSubtotal != null && (
                <span className={styles.subtotal}>
                  Cost {money(q.costSubtotal, q.currency)}
                </span>
              )}
              {q.earnings != null && (
                <span className={styles.earnings}>
                  Earnings {money(q.earnings, q.currency)}
                </span>
              )}
            </div>

            {lineItems.length > 0 && (
              <div className={styles.lines}>
                {lineItems.map((li, j) => (
                  <div key={j} className={styles.line}>
                    <span className={styles.lineLabel}>
                      {String((li as Record<string, unknown>).label ?? "—")}
                    </span>
                    <span className={styles.lineAmount}>
                      {money(
                        (li as Record<string, unknown>).amount,
                        (li as Record<string, unknown>).currency ?? q.currency,
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {lineGroups.length > 0 && (
              <details className={styles.section}>
                <summary className={styles.sectionTitle}>Line groups</summary>
                {lineGroups.map((g, j) => (
                  <div key={j} className={styles.group}>
                    <span className={styles.groupTitle}>
                      {String((g as Record<string, unknown>).title ?? "Group")}
                    </span>
                    <span className={styles.groupRole}>
                      {String((g as Record<string, unknown>).role ?? "required")}
                    </span>
                  </div>
                ))}
              </details>
            )}

            {schedule.length > 0 && (
              <div className={styles.schedule}>
                {schedule.map((s, j) => (
                  <span key={j} className={styles.segment}>
                    {s}%
                  </span>
                ))}
              </div>
            )}

            {approvals.length > 0 && (
              <details className={styles.section}>
                <summary className={styles.sectionTitle}>Approvals</summary>
                {approvals.map((a, j) => (
                  <div key={j} className={styles.approval}>
                    <span className={styles.approvalWho}>
                      {String((a as Record<string, unknown>).approverEmail ?? "—")}
                    </span>
                    <span className={styles.approvalDecision}>
                      {String((a as Record<string, unknown>).decision ?? "—")}
                    </span>
                  </div>
                ))}
              </details>
            )}

            {comments.length > 0 && (
              <details className={styles.section}>
                <summary className={styles.sectionTitle}>Comments</summary>
                {comments.map((c, j) => (
                  <div key={j} className={styles.comment}>
                    <span className={styles.commentAuthor}>
                      {String((c as Record<string, unknown>).authorEmail ?? "—")}
                    </span>
                    <span className={styles.commentText}>
                      {String((c as Record<string, unknown>).text ?? "")}
                    </span>
                  </div>
                ))}
              </details>
            )}

            {changeLog.length > 0 && (
              <details className={styles.section}>
                <summary className={styles.sectionTitle}>Change log</summary>
                {changeLog.map((e, j) => (
                  <div key={j} className={styles.changeEntry}>
                    <span className={styles.changeSummary}>
                      {String((e as Record<string, unknown>).summary ?? "—")}
                    </span>
                    <span className={styles.changeMeta}>
                      {String((e as Record<string, unknown>).actor ?? "—")}
                    </span>
                  </div>
                ))}
              </details>
            )}
          </div>
        );
      })}
    </div>
  );
}