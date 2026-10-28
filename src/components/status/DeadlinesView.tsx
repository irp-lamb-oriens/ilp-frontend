"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Button,
  ButtonLink,
  DateInput,
  EmptyState,
  ErrorNotice,
  FilterBar,
  ListFooter,
  Loadable,
  Notice,
  SkeletonList,
  StatusPill,
  Switch,
  Toast,
} from "@/components/ui";
import { AreaIcon } from "@/components/deadlines/AreaIcon";
import { ApiError } from "@/lib/api";
import { LIST_SCHEMAS } from "@/lib/listSchemas";
import { useSchemaList } from "@/lib/useSchemaList";
import { AREA_LABELS, cardTitle, clearPendingDeadlines, type DeadlineRow, loadPendingDeadlines, longDate } from "@/lib/deadlines";
import { isFreeAccount, memberApi } from "./api";
import { deadlinesApi, type DeadlinePatchBody, deadlinesSource } from "./deadlinesApi";
import DeadlinePicker from "./DeadlinePicker";
import { useMember } from "./MemberContext";
import { relativeDue } from "./format";
import { ObligationsSkeleton } from "./StatusSkeletons";
import s from "./DeadlinesView.module.scss";

const GROUPS: Array<{ key: DeadlineRow["group"]; title: string; empty?: string }> = [
  { key: "soon", title: "Coming up", empty: "Nothing in the next 90 days." },
  { key: "later", title: "Later" },
  { key: "needsDate", title: "Needs a date" },
  { key: "done", title: "Done" },
];

const SOURCE_LABEL: Record<string, string> = {
  check: "From the free check",
  picker: "Added by you",
  lawyer: "Added by your lawyer",
  staff: "Added by your ILP team",
};

/**
 * DEADLINES: /status/deadlines. The person's own deadlines, grouped Coming up
 * (next 90 days), Later, Needs a date and Done. Each one can get the person's
 * own date, be marked done, have reminders turned off, be removed (with
 * undo), or go to the lawyer (members). "Add more deadlines" opens the same
 * cards as the free check.
 */
export default function DeadlinesView() {
  const { home, refresh } = useMember();
  const free = isFreeAccount(home);
  const sl = useSchemaList<DeadlineRow>({
    schema: LIST_SCHEMAS.memberDeadlines,
    key: "member-deadlines",
    source: deadlinesSource,
    pageSize: 100,
    defaultSort: { key: "shownDueAt", dir: "asc" },
    keyOf: (r) => r.id,
  });
  const list = sl.list;
  const items = list.initialLoading ? null : list.items;
  const [picker, setPicker] = useState(false);
  const [welcome, setWelcome] = useState<number | null>(null);
  const [toast, setToast] = useState<{ text: string; undo?: () => void } | null>(null);

  // Straight from the free check: finish the save (idempotent) and say so.
  useEffect(() => {
    const p = loadPendingDeadlines();
    if (!p) return;
    // Only for the person who saved them, never for another account signed in on this browser.
    if ((home.member.email ?? "").toLowerCase() !== p.email.toLowerCase()) return;
    clearPendingDeadlines();
    setWelcome(p.count);
    deadlinesApi
      .add({ country: p.country, ruleIds: p.ruleIds, claimToken: p.claimToken })
      .then((r) => {
        if (r.created || r.restored) list.refresh();
      })
      .catch(() => {
        // The claim already saved them on the server; nothing to repair here.
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const replace = useCallback((row: DeadlineRow) => list.update((rows) => rows.map((r) => (r.id === row.id ? row : r))), [list]);

  const patch = useCallback(
    async (row: DeadlineRow, body: DeadlinePatchBody) => {
      const after = await deadlinesApi.patch(row.id, body);
      if (after.status === "dismissed") list.update((rows) => rows.filter((r) => r.id !== row.id));
      else replace(after);
      return after;
    },
    [list, replace],
  );

  async function remove(row: DeadlineRow) {
    await patch(row, { dismissed: true });
    setToast({
      text: `Removed: ${cardTitle(row.title)}.`,
      undo: async () => {
        setToast(null);
        try {
          await deadlinesApi.patch(row.id, { dismissed: false, status: row.status === "handled" ? "handled" : "upcoming" });
          list.refresh();
        } catch {
          setToast({ text: "Could not bring it back. Add it again from Add more deadlines." });
        }
      },
    });
    void refresh();
  }

  const byGroup = (key: DeadlineRow["group"]) => (items ?? []).filter((r) => r.group === key);
  const filtered = !!list.activeQuery || sl.activeCount > 0;

  return (
    <div className={s.page}>
      {welcome !== null && (
        <Notice tone="success" dismissible title={`Your ${welcome} ${welcome === 1 ? "deadline is" : "deadlines are"} saved`} onDismiss={() => setWelcome(null)}>
          Set a date for each one below. Where we found a date, press Use the suggested date or type your own. We email you 30 and 7 days before each date.
        </Notice>
      )}

      <div className={s.toolbar}>
        <Button onClick={() => setPicker(true)} data-tour="client-deadlines-add">
          Add more deadlines
        </Button>
        {free && (
          <p className={s.freeNote}>
            You have a free ILP account. <Link href="/join">Join ILP</Link> to have a lawyer licensed in your country tell you which dates apply to you.
          </p>
        )}
      </div>

      {(list.items.length > 0 || filtered) && (
        <FilterBar list={sl} noun="deadlines" searchLabel="Search your deadlines" placeholder="Name or what it means" sortOptions="schema" views={false} />
      )}

      <Loadable loading={items === null && !list.error} label="Loading your deadlines" skeleton={<ObligationsSkeleton items={4} />}>
        {() =>
          items === null ? null : items.length === 0 && filtered ? (
            <EmptyState compact title="No deadline matches" body="Try another word or filter, or clear the search." />
          ) : items.length === 0 ? (
            <EmptyState
              title="No deadlines on your list yet"
              body="Press Add more deadlines to choose the legal dates and duties that apply to you. You can set a date for each one and get reminders."
              action={<Button onClick={() => setPicker(true)}>Add more deadlines</Button>}
            />
          ) : (
            <div className={s.groups} data-tour="client-deadlines-list">
              {GROUPS.map((g) => {
                const rows = byGroup(g.key);
                if (!rows.length) return null;
                return (
                  <section key={g.key} className={s.group} aria-labelledby={`dl-${g.key}`}>
                    <h2 className={s.groupTitle} id={`dl-${g.key}`}>
                      {g.title} <span className={s.groupCount}>{rows.length}</span>
                    </h2>
                    {g.key === "needsDate" && (
                      <p className={s.groupHelp}>These have no date we could work out, or a date our research could not confirm. Set your own date to get reminders.</p>
                    )}
                    <ul className={s.list} aria-busy={list.stale || undefined}>
                      {rows.map((r) => (
                        <DeadlineItem key={r.id} row={r} free={free} onPatch={patch} onRemove={remove} onAsked={(row) => { replace({ ...row, status: "asked" }); void refresh(); }} />
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          )
        }
      </Loadable>
      {list.error && <ErrorNotice audience="member" onRetry={list.refresh}>{list.error}</ErrorNotice>}
      <ListFooter list={list} audience="member" skeleton={<SkeletonList rows={2} variant="plain" />} endLabel={null} />

      <DeadlinePicker
        open={picker}
        onClose={() => setPicker(false)}
        onAdded={(n) => {
          list.refresh();
          void refresh();
          setToast({ text: n === 1 ? "Added 1 deadline." : n ? `Added ${n} deadlines.` : "Those deadlines were already on your list." });
        }}
      />
      <Toast
        message={toast?.text ?? null}
        tone={toast?.undo ? "neutral" : "success"}
        duration={toast?.undo ? 8000 : 5000}
        onDismiss={() => setToast(null)}
        action={toast?.undo ? { label: "Undo", onClick: toast.undo } : undefined}
      />
    </div>
  );
}

// ─── One deadline ──────────────────────────────────────────────────────────

function DeadlineItem({
  row,
  free,
  onPatch,
  onRemove,
  onAsked,
}: {
  row: DeadlineRow;
  free: boolean;
  onPatch: (row: DeadlineRow, body: DeadlinePatchBody) => Promise<DeadlineRow>;
  onRemove: (row: DeadlineRow) => Promise<void>;
  onAsked: (row: DeadlineRow) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [asked, setAsked] = useState<string | null>(null);
  const done = row.status === "handled";
  const title = cardTitle(row.title);
  const low = row.confidence === "low";

  async function run(key: string, fn: () => Promise<unknown>) {
    setBusy(key);
    setError(null);
    try {
      await fn();
      return true;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "That did not save. Try again.");
      return false;
    } finally {
      setBusy(null);
    }
  }

  const saveDate = (value: string | null) =>
    run("date", () => onPatch(row, { userDueAt: value })).then((ok) => ok && setEditing(false));

  async function ask() {
    await run("ask", async () => {
      const r = await memberApi.askLawyer(row.id);
      setAsked(r.addedTo === "call" && r.callAt ? `Added to your call on ${longDate(r.callAt)}.` : "Saved for your next call. It is added when you book.");
      onAsked(row);
    });
  }

  return (
    <li className={s.item}>
      <div className={s.itemHead}>
        <span className={s.icon} aria-hidden="true">
          <AreaIcon area={row.area} />
        </span>
        <div className={s.when}>
          {row.shownDueAt ? (
            <p className={s.date}>
              {longDate(row.shownDueAt)} {!done && <span className={s.rel}>({relativeDue(row.shownDueAt)})</span>}
            </p>
          ) : (
            <p className={s.dateNone}>{low ? "Ask your lawyer to confirm this date" : "Set a date"}</p>
          )}
          <p className={s.meta}>
            {[AREA_LABELS[row.area] ?? row.area, row.countryName, SOURCE_LABEL[row.source] ?? ""].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className={s.pills}>
          {done && <StatusPill label="Done" tone="success" size="sm" />}
          {row.status === "asked" && <StatusPill label="On your list for the next call" tone="info" size="sm" />}
          {row.userDueAt && <StatusPill label="Your date" size="sm" />}
          {!row.remind && !done && <StatusPill label="Reminders off" size="sm" />}
        </div>
      </div>

      <h3 className={s.title}>{title}</h3>
      <StatusPill label="May require review" size="sm" tone={low ? "warning" : "neutral"} className={s.review} />

      <details className={s.details}>
        <summary className={s.summary}>What this usually means</summary>
        <p className={s.meaning}>{row.meaning}</p>
        {row.dueText && (
          <p className={s.meaning}>
            <span className={s.label}>When:</span> {row.dueText}
          </p>
        )}
        {row.authority && <p className={s.authority}>Source: {row.authority}</p>}
      </details>

      {editing ? (
        <form
          className={s.dateForm}
          onSubmit={(e) => {
            e.preventDefault();
            if (draft) void saveDate(draft);
          }}
        >
          <DateInput label={`Your date for ${title}`} value={draft} onChange={(e) => setDraft(e.target.value)} hint="We remind you 30 and 7 days before it." />
          <div className={s.actions}>
            <Button type="submit" size="sm" busy={busy === "date"} disabled={!draft}>
              Save date
            </Button>
            {row.suggestedDueAt && row.userDueAt !== row.suggestedDueAt && (
              <Button size="sm" variant="secondary" onClick={() => void saveDate(row.suggestedDueAt!.slice(0, 10))} disabled={!!busy}>
                Use the suggested date ({longDate(row.suggestedDueAt)})
              </Button>
            )}
            {row.userDueAt && (
              <Button size="sm" variant="ghost" onClick={() => void saveDate(null)} disabled={!!busy}>
                Clear my date
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={!!busy}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className={s.actions}>
          {!done && (
            <Button
              size="sm"
              variant={row.hasDate ? "secondary" : "primary"}
              onClick={() => {
                setDraft((row.userDueAt ?? row.suggestedDueAt ?? "").slice(0, 10));
                setEditing(true);
              }}
            >
              {row.hasDate ? "Change date" : "Set a date"}
            </Button>
          )}
          <Button size="sm" variant="secondary" busy={busy === "done"} onClick={() => void run("done", () => onPatch(row, { status: done ? "upcoming" : "handled" }))}>
            {done ? "Mark as not done" : "Mark done"}
          </Button>
          {!done && row.status !== "asked" && (free ? (
            <ButtonLink href="/join" size="sm" variant="ghost">
              Join to ask a lawyer
            </ButtonLink>
          ) : (
            <Button size="sm" variant="ghost" busy={busy === "ask"} onClick={() => void ask()}>
              Ask my lawyer
            </Button>
          ))}
          <Button size="sm" variant="ghost" busy={busy === "remove"} onClick={() => void run("remove", () => onRemove(row))}>
            Remove
          </Button>
        </div>
      )}

      {!done && (
        <Switch
          className={s.remind}
          label="Remind me by email"
          hint={row.hasDate ? undefined : "Reminders start once this has a date."}
          checked={row.remind}
          disabled={busy === "remind"}
          onChange={(v) => void run("remind", () => onPatch(row, { remind: v }))}
        />
      )}

      {asked && (
        <p className={s.saved} role="status">
          {asked}
        </p>
      )}
      {error && <ErrorNotice audience="member" variant="inline">{error}</ErrorNotice>}
    </li>
  );
}
