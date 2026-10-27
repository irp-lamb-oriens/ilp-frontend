"use client";

import { useState } from "react";
import { Button, ButtonLink, EmptyState, StatusPill } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { memberApi } from "./api";
import { useMember } from "./MemberContext";
import { dateLong, dateShort, daysUntil, relativeDue } from "./format";
import s from "./Obligations.module.scss";

/** Dated items from the member's answers, worded "may require review". */
export default function Obligations() {
  const { home, refresh } = useMember();
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const items = [...home.obligations].sort((a, b) => String(a.dueAt ?? "9999").localeCompare(String(b.dueAt ?? "9999")));

  async function ask(id: string) {
    setBusy(id);
    setError(null);
    try {
      const r = await memberApi.askLawyer(id);
      setDone((d) => ({
        ...d,
        [id]: r.addedTo === "call" && r.callAt
          ? `Added to your call on ${dateLong(r.callAt)}.`
          : "Saved for your next call. It will be added when you book.",
      }));
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save that. Try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className={s.wrap} aria-labelledby="obligations-title" data-tour="client-obligations">
      <h2 className={s.title} id="obligations-title">
        Dates that may need attention
      </h2>
      <p className={s.intro}>
        These come from what you told us. Each one may require review; your lawyer tells you whether it applies to you.
      </p>
      {items.length === 0 ? (
        <EmptyState
          compact
          title="No dates on your list yet"
          body="When your profile shows a filing, renewal or tax date that may apply, it appears here with a reminder."
        />
      ) : (
        <ul className={s.list}>
          {items.map((o) => {
            const n = daysUntil(o.dueAt);
            const soon = n !== null && n <= 30;
            const asked = o.status === "asked";
            return (
              <li key={o.id} className={s.item}>
                <div className={s.text}>
                  <p className={s.itemTitle}>{o.title}</p>
                  {o.dueAt && (
                    <p className={s.due}>
                      {dateShort(o.dueAt)} <span className={s.rel}>({relativeDue(o.dueAt)})</span>
                      {soon && !asked && <StatusPill label="Coming up" tone="warning" size="sm" className={s.pill} />}
                    </p>
                  )}
                  {done[o.id] && (
                    <p className={s.saved} role="status">
                      {done[o.id]}
                    </p>
                  )}
                </div>
                <div className={s.action}>
                  {asked ? (
                    <StatusPill label="On your list for the next call" tone="info" size="sm" />
                  ) : (
                    <Button variant="secondary" busy={busy === o.id} onClick={() => ask(o.id)}>
                      Ask my lawyer
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {error && (
        <p className={s.error} role="alert">
          {error}
        </p>
      )}
      {home.pendingQuestions.length > 0 && home.upcomingCalls.length === 0 && home.capacity.canBook && (
        <div className={s.pending}>
          <p className={s.pendingText}>
            {home.pendingQuestions.length === 1 ? "1 question is" : `${home.pendingQuestions.length} questions are`} waiting
            for your next call.
          </p>
          <ButtonLink href="/status/book" variant="secondary">
            Book a call
          </ButtonLink>
        </div>
      )}
    </section>
  );
}
