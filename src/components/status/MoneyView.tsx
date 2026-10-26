"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, EmptyState, StatusPill } from "@/components/ui";
import type { StatusTone } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { memberApi, type MoneyPayload, type QuoteView } from "./api";
import { useMember } from "./MemberContext";
import { dateLong, dateShort, money } from "./format";
import s from "./MoneyView.module.scss";

const CHARGE_STATUS: Record<string, { label: string; tone: StatusTone }> = {
  paid: { label: "Paid", tone: "success" },
  partially_paid: { label: "Partly paid", tone: "warning" },
  due: { label: "To pay", tone: "warning" },
};

/** Balance due first, then proposals and charges together. */
export default function MoneyView() {
  const [data, setData] = useState<MoneyPayload | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    memberApi.money().then(setData).catch(() => setError(true));
  }, []);

  if (error) {
    return <EmptyState title="We could not load your payments" body="Try again in a minute. Nothing has changed on your account." />;
  }
  if (!data) return <p className={s.muted}>Loading…</p>;

  const awaiting = data.quotes.filter((q) => q.status === "awaiting");
  const others = data.quotes.filter((q) => q.status !== "awaiting");

  return (
    <div className={s.page}>
      <section className={s.balance} aria-labelledby="balance-title">
        <h2 className={s.balanceLabel} id="balance-title">
          Balance due
        </h2>
        <p className={s.balanceFigure}>{money(data.balanceDueCents)}</p>
        <p className={s.balanceNote}>
          {data.balanceDueCents > 0
            ? data.nextDueDate
              ? `Due by ${dateLong(data.nextDueDate)}. Your ILP team sends payment instructions by email.`
              : "Your ILP team sends payment instructions by email."
            : "You are all paid up. Thank you."}
        </p>
      </section>

      {awaiting.length > 0 && (
        <section className={s.block} aria-labelledby="awaiting-title">
          <h2 className={s.blockTitle} id="awaiting-title">
            {awaiting.length === 1 ? "A proposal is waiting for your answer" : "Proposals waiting for your answer"}
          </h2>
          <div className={s.quotes}>
            {awaiting.map((q) => (
              <QuoteCard key={q.id} quote={q} onAccepted={setData} />
            ))}
          </div>
        </section>
      )}

      <section className={s.block} aria-labelledby="history-title">
        <h2 className={s.blockTitle} id="history-title">
          Charges and proposals
        </h2>
        {data.charges.length === 0 && others.length === 0 ? (
          <EmptyState compact title="Nothing here yet" body="Your membership charges and any proposals for legal work appear here." />
        ) : (
          <ul className={s.rows}>
            {others.map((q) => (
              <li key={q.id} className={s.row}>
                <div className={s.rowMain}>
                  <p className={s.rowTitle}>{q.title}</p>
                  <p className={s.rowMeta}>
                    Proposal{q.acceptedAt ? `, accepted ${dateShort(q.acceptedAt)}` : q.createdAt ? `, ${dateShort(q.createdAt)}` : ""}
                  </p>
                </div>
                <div className={s.rowEnd}>
                  <span className={s.amount}>{money(q.totalCents, q.currency)}</span>
                  <StatusPill
                    label={q.status === "accepted" ? "Accepted" : "Declined"}
                    tone={q.status === "accepted" ? "success" : "neutral"}
                    size="sm"
                  />
                </div>
              </li>
            ))}
            {data.charges.map((c) => {
              const st = CHARGE_STATUS[c.status];
              return (
                <li key={c.id} className={s.row}>
                  <div className={s.rowMain}>
                    <p className={s.rowTitle}>{c.label}</p>
                    <p className={s.rowMeta}>
                      {c.date ? dateShort(c.date) : ""}
                      {c.status === "partially_paid" ? ` · ${money(c.balanceCents, c.currency)} left to pay` : ""}
                    </p>
                  </div>
                  <div className={s.rowEnd}>
                    <span className={s.amount}>{money(c.amountCents, c.currency)}</span>
                    <StatusPill label={st.label} tone={st.tone} size="sm" />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function QuoteCard({ quote, onAccepted }: { quote: QuoteView; onAccepted: (d: MoneyPayload) => void }) {
  const { home, refresh } = useMember();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(home.member.name === "You" ? "" : home.member.name);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    if (!agree) return setError("Tick the box to confirm you agree.");
    if (!name.trim()) return setError("Type your full name.");
    setBusy(true);
    setError(null);
    try {
      onAccepted(await memberApi.acceptQuote(quote.id, name.trim()));
      void refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not accept the proposal. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className={s.quote}>
      <div className={s.quoteHead}>
        <h3 className={s.quoteTitle}>{quote.title}</h3>
        <p className={s.quoteTotal}>{money(quote.totalCents, quote.currency)}</p>
      </div>
      {quote.summary && <p className={s.quoteSummary}>{quote.summary}</p>}
      {quote.scope.length > 0 && (
        <>
          <p className={s.scopeTitle}>What this covers</p>
          <ul className={s.scope}>
            {quote.scope.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </>
      )}
      <p className={s.fine}>
        This is separate from your membership fee. Your team agrees anything outside this list with you before doing
        it.
      </p>
      {!open ? (
        <div className={s.quoteActions}>
          <Button onClick={() => setOpen(true)}>Accept this proposal</Button>
          <Link className={s.askLink} href="/status/messages">
            Ask a question first
          </Link>
        </div>
      ) : (
        <div className={s.acceptForm}>
          <label htmlFor={`qname-${quote.id}`} className={s.label}>
            Type your full name to accept
          </label>
          <input
            id={`qname-${quote.id}`}
            className={s.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
          <label className={s.check}>
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />I agree to this proposal for{" "}
            {money(quote.totalCents, quote.currency)}.
          </label>
          {error && (
            <p className={s.err} role="alert">
              {error}
            </p>
          )}
          <div className={s.quoteActions}>
            <Button onClick={accept} busy={busy}>
              Confirm and accept
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Not now
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}
