"use client";

import { QUOTE_PHASE_LABEL, quotePhase } from "@/lib/quoteStatus";
import { useCallback, useEffect, useState } from "react";
import { providerFetch } from "@/lib/provider";
import { Button, EmptyState, Loadable, StatusPill, TextInput, type StatusTone, ErrorNotice } from "@/components/ui";
import { errorText, fmtShortDate, money } from "./lawyerApi";
import { QUOTE_STATUS_LABELS, type FeeLine, type QuoteStatus } from "./types";
import { QuotesListSkeleton } from "./LawyerSkeletons";
import s from "./FeeQuotesTab.module.scss";

/** A quote as the provider API returns it: no margins, no client price. */
interface RawQuote {
  quoteId?: string;
  id?: string;
  title?: string;
  status?: string;
  currency?: string;
  yourFee?: number;
  lineItems?: FeeLine[];
  lines?: Array<{ label: string; amountMinor?: number }>;
  createdAt?: string;
}

interface Draft {
  quoteId: string | null;
  title: string;
  lines: Array<{ lineId?: string; label: string; amount: string; notes: string }>;
}

const TONE: Record<string, StatusTone> = {
  draft: "neutral",
  pending_approval: "info",
  changes_requested: "warning",
  approved: "success",
  sent_to_client: "info",
  sent: "info",
  client_accepted: "success",
  accepted: "success",
  declined: "neutral",
};

const idOf = (q: RawQuote) => String(q.quoteId ?? q.id ?? "");
/** Other stored spellings (sent, accepted, declined) read through the shared mapping. */
const phaseLabel = (q: RawQuote) => {
  const p = quotePhase(q as { status?: unknown });
  return p ? QUOTE_PHASE_LABEL[p] : undefined;
};
const linesOf = (q: RawQuote): Array<{ label: string; amount: number }> =>
  q.lineItems?.length
    ? q.lineItems.map((l) => ({ label: l.label, amount: Number(l.amount) || 0 }))
    : (q.lines ?? []).map((l) => ({ label: l.label, amount: (Number(l.amountMinor) || 0) / 100 }));
const feeOf = (q: RawQuote) => (typeof q.yourFee === "number" ? q.yourFee : linesOf(q).reduce((n, l) => n + l.amount, 0));
const editable = (q: RawQuote) => q.status === "draft" || q.status === "changes_requested";

/**
 * Quotes, fee only: the lawyer scopes the work and prices their own fee.
 * ILP's margin and the member's price are added by staff and never shown here.
 */
export default function FeeQuotesTab({ clientId }: { clientId: string }) {
  const base = `/api/provider/clients/${encodeURIComponent(clientId)}/quotes`;
  const [quotes, setQuotes] = useState<RawQuote[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await providerFetch<{ quotes: RawQuote[] }>(base);
      setQuotes(r.quotes ?? []);
    } catch (err) {
      setError(errorText(err, "Could not load quotes."));
    }
  }, [base]);

  useEffect(() => {
    load();
  }, [load]);

  function edit(q?: RawQuote) {
    setError(null);
    setDraft(
      q
        ? { quoteId: idOf(q), title: q.title ?? "", lines: (q.lineItems ?? []).map((l) => ({ lineId: l.lineId, label: l.label, amount: String(l.amount), notes: l.notes ?? "" })) }
        : { quoteId: null, title: "", lines: [{ label: "", amount: "", notes: "" }] },
    );
  }

  async function save(submit: boolean) {
    if (!draft) return;
    const lineItems = draft.lines
      .filter((l) => l.label.trim())
      .map((l) => ({ lineId: l.lineId, label: l.label.trim(), amount: Number(l.amount) || 0, notes: l.notes.trim() || null }));
    if (!draft.title.trim() || lineItems.length === 0) {
      setError("Add a title and at least one fee line.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      let id = draft.quoteId;
      if (id) {
        await providerFetch(`${base}/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ title: draft.title.trim(), lineItems }) });
      } else {
        const r = await providerFetch<{ quote: RawQuote }>(base, { method: "POST", body: JSON.stringify({ title: draft.title.trim(), lineItems }) });
        id = idOf(r.quote);
      }
      if (submit && id) await providerFetch(`${base}/${encodeURIComponent(id)}/submit-for-approval`, { method: "POST", body: "{}" });
      setDraft(null);
      await load();
    } catch (err) {
      setError(errorText(err, "Could not save the quote."));
    } finally {
      setBusy(false);
    }
  }

  const setLine = (i: number, patch: Partial<Draft["lines"][number]>) =>
    setDraft((d) => (d ? { ...d, lines: d.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) } : d));

  if (draft) {
    const total = draft.lines.reduce((n, l) => n + (Number(l.amount) || 0), 0);
    return (
      <form className={s.editor} onSubmit={(e) => { e.preventDefault(); save(false); }}>
        <p className={s.muted}>Enter your fee for each piece of work. The ILP team adds the member price and sends it after approval.</p>
        <div className={s.field}>
          <TextInput
            label="Title"
            id="q-title"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="e.g. S.A. clean-up before sale"
          />
        </div>
        <ol className={s.lines}>
          {draft.lines.map((l, i) => (
            <li key={i} className={s.line}>
              <label className={s.sr} htmlFor={`ql-${i}`}>Line {i + 1} work</label>
              <input id={`ql-${i}`} className={s.input} value={l.label} onChange={(e) => setLine(i, { label: e.target.value })} placeholder="Work, e.g. two overdue corporation tax filings" />
              <label className={s.sr} htmlFor={`qa-${i}`}>Line {i + 1} your fee (USD)</label>
              <input id={`qa-${i}`} className={s.amount} inputMode="decimal" value={l.amount} onChange={(e) => setLine(i, { amount: e.target.value.replace(/[^\d.]/g, "") })} placeholder="Fee" />
              <button type="button" className={s.remove} onClick={() => setDraft({ ...draft, lines: draft.lines.length > 1 ? draft.lines.filter((_, j) => j !== i) : draft.lines })} aria-label={`Remove line ${i + 1}`}>Remove</button>
            </li>
          ))}
        </ol>
        <Button type="button" size="sm" variant="ghost" onClick={() => setDraft({ ...draft, lines: [...draft.lines, { label: "", amount: "", notes: "" }] })}>Add a line</Button>
        <p className={s.total}>Your fee <strong>{money(total)}</strong></p>
        {error && <ErrorNotice audience="lawyer">{error}</ErrorNotice>}
        <div className={s.actions}>
          <Button type="button" onClick={() => save(true)} busy={busy} disabled={busy}>Submit for approval</Button>
          <Button type="submit" variant="secondary" disabled={busy}>Save draft</Button>
          <Button type="button" variant="ghost" onClick={() => setDraft(null)} disabled={busy}>Cancel</Button>
        </div>
      </form>
    );
  }

  return (
    <div className={s.wrap}>
      <div className={s.bar}>
        <p className={s.muted}>Fees shown are yours. Member pricing is handled by the ILP team.</p>
        <Button size="sm" onClick={() => edit()}>New quote</Button>
      </div>
      {error && <ErrorNotice audience="lawyer">{error}</ErrorNotice>}
      <Loadable loading={quotes === null && !error} label="Loading quotes" skeleton={<QuotesListSkeleton />}>
        {null}
      </Loadable>
      {quotes && quotes.length === 0 && <EmptyState compact title="No quotes yet" body="Scope paid work here after a call. The ILP team prices and sends it." />}
      {quotes && quotes.length > 0 && (
        <ul className={s.list}>
          {quotes.map((q) => {
            const status = (q.status ?? "draft") as QuoteStatus;
            return (
              <li key={idOf(q)} className={s.quote}>
                <div className={s.qHead}>
                  <span className={s.qTitle}>{q.title ?? "Quote"}</span>
                  <StatusPill size="sm" tone={TONE[status] ?? "neutral"} label={QUOTE_STATUS_LABELS[status] ?? phaseLabel(q) ?? status.replace(/_/g, " ")} />
                </div>
                <ul className={s.qLines}>
                  {linesOf(q).map((l, i) => (
                    <li key={i}><span>{l.label}</span><span className={s.num}>{money(l.amount, q.currency ?? "USD")}</span></li>
                  ))}
                </ul>
                <div className={s.qFoot}>
                  <span className={s.muted}>{q.createdAt ? `Created ${fmtShortDate(q.createdAt)}` : ""}</span>
                  <span>Your fee <strong>{money(feeOf(q), q.currency ?? "USD")}</strong></span>
                  {editable(q) && q.lineItems && <Button size="sm" variant="ghost" onClick={() => edit(q)}>Edit</Button>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
