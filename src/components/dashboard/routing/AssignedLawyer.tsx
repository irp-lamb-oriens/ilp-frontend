"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Notice, Select, Skeleton, StatusPill, TextInput } from "@/components/ui";
import { COUNTRIES, type RoutingCandidate } from "@/lib/contracts";
import { AREA_LABEL_OF, LANGUAGE_LABEL, ratingText, routingApi, type MemberRouting } from "@/lib/routing";
import s from "./routing.module.scss";

const TRIGGER: Record<string, string> = {
  activation: "when the membership started",
  booking: "when the member opened booking",
  reroute: "when staff ran routing again",
  override: "by a staff choice",
  sweep: "by the automatic retry",
  matter: "when the matter opened",
};
const BREAKDOWN: Array<[keyof RoutingCandidate["breakdown"], string]> = [
  ["specialty", "Specialty"],
  ["continuity", "Same lawyer as before"],
  ["rating", "Rating"],
  ["earliestSlot", "Earliest time"],
  ["load", "Load this week"],
  ["region", "Region"],
  ["clientType", "Client type"],
];
const when = (iso: string) => new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

/**
 * Member page: the assigned lawyer, "Why this lawyer" (the router's ranking
 * with each score and reason, and why the others were not offered), the
 * waiting state with the sales call, and staff actions: run routing again or
 * choose a lawyer by hand (an override, recorded with who and why).
 */
export function AssignedLawyer({ clientId, lawyers, onChanged }: { clientId: string; lawyers: Array<{ id: string; name: string }>; onChanged: () => void }) {
  const [data, setData] = useState<MemberRouting | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [pick, setPick] = useState("");
  const [note, setNote] = useState("");

  const load = useCallback(() => {
    routingApi.member(clientId).then(setData).catch((e) => setError(e instanceof Error ? e.message : "Routing could not be loaded."));
  }, [clientId]);
  useEffect(load, [load]);

  async function reroute() {
    setBusy("reroute");
    setError(null);
    setMsg(null);
    try {
      const r = await routingApi.reroute(clientId);
      const name = r.decision.candidates[0]?.name;
      setMsg(r.providerId ? `Routing chose ${name ?? "a lawyer"}.` : `No lawyer matches yet: ${r.decision.noMatchReason ?? "see the reasons below"}`);
      load();
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Routing could not run.");
    } finally {
      setBusy(null);
    }
  }

  async function override() {
    if (!pick) return;
    setBusy("override");
    setError(null);
    setMsg(null);
    try {
      const r = await routingApi.override(clientId, pick, note.trim());
      setMsg(`Assigned ${lawyers.find((l) => l.id === pick)?.name ?? "the lawyer"}.${r.moved.length ? ` ${r.moved.length} upcoming call${r.moved.length === 1 ? "" : "s"} moved.` : ""}${r.cancelled.length ? ` ${r.cancelled.length} call${r.cancelled.length === 1 ? "" : "s"} cancelled (the new lawyer was not free then); the member was asked to book again.` : ""}`);
      setPick("");
      setNote("");
      load();
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "The lawyer could not be assigned.");
    } finally {
      setBusy(null);
    }
  }

  const d = data?.decision ?? null;
  const sales = data?.salesCalls.find((c) => c.status === "booked");
  return (
    <section className={s.block} aria-label="Lawyer">
      <div className={s.blockHead}>
        <h2 className={s.blockTitle}>Lawyer</h2>
        {data ? (
          <StatusPill size="sm" tone={data.assigned ? (data.assigned.bookable ? "neutral" : "warning") : data.gap ? "warning" : "neutral"} label={data.assigned ? data.assigned.name : data.gap ? "Waiting for a match" : "Unassigned"} />
        ) : (
          <Skeleton shape="line" size="sm" width="25" />
        )}
      </div>
      {data?.gap && (
        <Notice
          tone="warning"
          title="No lawyer matches this member yet"
          fix={{
            summary: data.gap.reason,
            steps: [
              "The member was emailed that we are arranging their lawyer, and their home page says so.",
              sales ? `A short call with the sales team is booked for ${when(sales.scheduledAt)} (${sales.salesEmail ?? data.salesEmails[0]}).` : `No sales time was free: ${data.salesEmails[0]} has a task to set one with the member.`,
              "Add the missing specialty to a lawyer, or approve a lawyer licensed in the member's country, then press Run routing again.",
              "Or choose a lawyer below. That assignment is recorded as a staff choice.",
            ],
          }}
        >
          Waiting since {data.gap.createdAt.slice(0, 10)}, {data.gap.attempts} attempt{data.gap.attempts === 1 ? "" : "s"} so far.
        </Notice>
      )}
      {d && (
        <details className={s.why}>
          <summary>Why this lawyer</summary>
          <p className={s.note}>
            Decided {TRIGGER[d.trigger] ?? d.trigger} on {when(d.at)}{d.overriddenBy ? `, chosen by ${d.overriddenBy}${d.overrideNote ? `: ${d.overrideNote}` : ""}` : ""}.
            {" "}Needs: {COUNTRIES[d.request.country]?.name}, {d.request.specialtyId ? d.request.specialtyId.replace(/_/g, " ") : AREA_LABEL_OF[d.request.area ?? ""] ?? "general question"}, {d.request.languages.map((l) => LANGUAGE_LABEL[l] ?? l).join(" or ")}
            {d.request.urgencyDays != null ? `, a due date in ${d.request.urgencyDays} days` : ""}{d.request.region ? `, ${d.request.region}` : ""}.
          </p>
          {d.noMatchReason && <p className={s.note}>{d.noMatchReason}</p>}
          {d.candidates.length > 0 && (
            <ol className={s.cands}>
              {d.candidates.map((c) => (
                <li key={c.providerId}>
                  <div className={s.candHead}>
                    <strong>{c.name}</strong>
                    <span className={s.meta}>score {c.score} · {ratingText(c.ratingScore, c.reviewCount)}</span>
                  </div>
                  <p className={s.meta}>{BREAKDOWN.filter(([k]) => c.breakdown[k]).map(([k, label]) => `${label} ${c.breakdown[k]}`).join(" · ")}</p>
                  <ul className={s.reasons}>{c.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
                </li>
              ))}
            </ol>
          )}
          {d.rejected.length > 0 && (
            <details className={s.why}>
              <summary>Not offered ({d.rejected.length})</summary>
              <ul className={s.reasons}>
                {d.rejected.map((r) => <li key={r.providerId}><strong>{r.name}</strong>: {r.reasons.join("; ")}</li>)}
              </ul>
            </details>
          )}
          <p className={s.meta}>Rules {d.rulesVersion}. Ratings are staff-only and only change the order.</p>
        </details>
      )}
      {data && !d && <p className={s.note}>No routing decision on file. This member was assigned before automatic routing, or by hand.</p>}
      <div className={s.actions}>
        <Button variant="secondary" size="sm" busy={busy === "reroute"} onClick={reroute}>Run routing again</Button>
      </div>
      <Select label={data?.assigned ? "Choose another lawyer" : "Choose a lawyer"} value={pick} onChange={(e) => setPick(e.target.value)}>
        <option value="">Choose a lawyer</option>
        {lawyers.filter((l) => l.id !== data?.assigned?.id).map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
      </Select>
      {pick && <TextInput label="Why (kept with the decision)" optional value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} />}
      <Button variant="secondary" disabled={!pick} busy={busy === "override"} onClick={override}>Assign lawyer</Button>
      {msg && <p className={s.ok} role="status">{msg}</p>}
      {error && <p className={s.err} role="alert">{error}</p>}
    </section>
  );
}
