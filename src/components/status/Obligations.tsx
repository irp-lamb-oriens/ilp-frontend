"use client";

import { useState } from "react";
import { Button, ButtonLink, EmptyState, ErrorNotice, Notice, StatusPill } from "@/components/ui";
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
      <Notice
        tone="neutral"
        variant="inline"
        className={s.intro}
        title="These dates may require review"
        terms={["obligation", "partnerLawyer"]}
        fix={{
          steps: [
            "These dates come from the answers in your profile. They are general dates, not legal advice.",
            "Some may not apply to you. Your lawyer tells you which ones do.",
            "Press Ask my lawyer on any date to add it to your next call.",
            "If something in your life changes, update your profile so the list stays right.",
          ],
          tutorialId: "client.overview",
          tutorialStep: "dates",
        }}
      >
        They come from what you told us; your lawyer tells you whether each one applies to you.
      </Notice>
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
                  {o.dueAt && o.confidence !== "low" && (
                    <p className={s.due}>
                      {o.windowStartAt && o.windowStartAt.slice(0, 10) < o.dueAt.slice(0, 10) ? `${dateShort(o.windowStartAt)} to ` : ""}
                      {dateShort(o.dueAt)} <span className={s.rel}>({relativeDue(o.dueAt)})</span>
                      {soon && !asked && <StatusPill label="Coming up" tone="warning" size="sm" className={s.pill} />}
                    </p>
                  )}
                  {/* COUNTRIES: research with low confidence never shows a firm date. */}
                  {o.confidence === "low" && <p className={s.due}>Ask your lawyer to confirm this date.</p>}
                  {!o.dueAt && o.dueText && o.confidence !== "low" && <p className={s.due}>{o.dueText}</p>}
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
        <ErrorNotice audience="member">{error}</ErrorNotice>
      )}
      {home.pendingQuestions.length > 0 && home.upcomingCalls.length === 0 && home.capacity.canBook && (
        <Notice
          tone="info"
          className={s.pending}
          title={`${home.pendingQuestions.length === 1 ? "1 question is" : `${home.pendingQuestions.length} questions are`} waiting for your next call`}
          actions={
            <ButtonLink href="/status/book" variant="secondary">
              Book a call
            </ButtonLink>
          }
          fix={{
            label: "What to do next",
            steps: [
              "Press Book a call and pick a time that suits you.",
              "Your questions go to your lawyer with the booking, so they can prepare.",
            ],
            tutorialId: "client.book",
          }}
        />
      )}
    </section>
  );
}
