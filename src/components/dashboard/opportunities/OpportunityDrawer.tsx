"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { OpportunityStage } from "@/lib/contracts";
import {
  Button,
  DateInput,
  Drawer,
  Loadable,
  MoneyInput,
  Select,
  Skeleton,
  StatusPill,
  TextArea,
  TextInput,
  dateInputValue,
  isoFromDateInput,
  useForm,
  useUnsavedChanges,
  validators,
} from "@/components/ui";
import { ErrorText } from "../staff/PageHeader";
import { dueLabel, shortDate, usd } from "../staff/format";
import {
  areaOptions,
  draftQuoteFor,
  isClosedStage,
  memberQuotes,
  oppApi,
  quoteIdOf,
  SOURCE_LABEL,
  sourceHref,
  STAGE_LABEL,
  STAGE_TONE,
  STAGES,
  type MemberQuote,
  type OpportunityRow,
} from "./oppApi";
import s from "./opportunities.module.scss";

interface Props {
  opportunity: OpportunityRow | null;
  /** Preselect a target stage, e.g. "won" picked from the board's Move to menu. */
  initialStage?: OpportunityStage | null;
  onClose: () => void;
  onChanged: (row: OpportunityRow) => void;
}

/** Opportunity drawer: member, source, value, next action, quote link, and stage with outcome on close. */
export function OpportunityDrawer({ opportunity, initialStage, onClose, onChanged }: Props) {
  return (
    <Drawer
      open={!!opportunity}
      onClose={onClose}
      size="lg"
      title={opportunity?.title ?? "Opportunity"}
      subtitle={opportunity ? `${opportunity.memberName} · ${STAGE_LABEL[opportunity.stage]}` : undefined}
    >
      {opportunity && (
        <OpportunityDetail key={opportunity.id} o={opportunity} initialStage={initialStage ?? null} onChanged={onChanged} />
      )}
    </Drawer>
  );
}

function OpportunityDetail({ o, initialStage, onChanged }: { o: OpportunityRow; initialStage: OpportunityStage | null; onChanged: (row: OpportunityRow) => void }) {
  return (
    <div className={s.detail}>
      <dl className={s.facts}>
        <div>
          <dt>Member</dt>
          <dd>
            <Link className={s.link} href={`/dashboard/members/${encodeURIComponent(o.clientId)}`}>
              {o.memberName}
            </Link>
          </dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>
            <Link className={s.link} href={sourceHref(o)}>
              {SOURCE_LABEL[o.source.kind]}
            </Link>
          </dd>
        </div>
        <div>
          <dt>Stage</dt>
          <dd>
            <StatusPill size="sm" label={STAGE_LABEL[o.stage]} tone={STAGE_TONE[o.stage]} />
          </dd>
        </div>
        <div>
          <dt>Estimated legal fees</dt>
          <dd>{o.valueCents != null ? usd(o.valueCents) : "Not set"}</dd>
        </div>
        <div>
          <dt>Owner</dt>
          <dd>{o.ownerEmail ?? "Unassigned"}</dd>
        </div>
        <div>
          <dt>Opened</dt>
          <dd>{shortDate(o.createdAt)}</dd>
        </div>
      </dl>
      <p className={s.note}>Legal fees are GMV paid to the lawyer through ILP, not ILP revenue. Lawyers and members never see this value.</p>

      <StagePanel key={o.stage} o={o} initialStage={initialStage} onChanged={onChanged} />
      <QuotePanel key={o.quote?.id ?? "none"} o={o} onChanged={onChanged} />
      <EditPanel o={o} onChanged={onChanged} />
    </div>
  );
}

function StagePanel({ o, initialStage, onChanged }: { o: OpportunityRow; initialStage: OpportunityStage | null; onChanged: (row: OpportunityRow) => void }) {
  const closed = isClosedStage(o.stage);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const f = useForm({
    initial: { stage: (initialStage && initialStage !== o.stage ? initialStage : "") as string, outcome: "" },
    rules: {
      stage: [validators.required("Choose a stage.")],
      outcome: [(v, all) => (isClosedStage(all.stage as OpportunityStage) && v.trim().length < 3 ? "Say what happened: an outcome is required to close." : null)],
    },
    onSubmit: async (v) => {
      onChanged(await oppApi.move(o.id, v.stage as OpportunityStage, v.outcome.trim() || undefined));
    },
  });
  useUnsavedChanges(f.dirty, "The stage change is not saved yet. If you leave now, it will be lost.");
  const target = f.values.stage as OpportunityStage | "";
  const needsOutcome = target === "won" || target === "lost";

  if (closed) {
    return (
      <section className={s.panel} aria-label="Outcome">
        <h3 className={s.panelTitle}>Outcome</h3>
        <p className={s.outcome}>{o.outcome}</p>
        <p className={s.meta}>Closed {shortDate(o.closedAt)}</p>
        {error && <ErrorText>{error}</ErrorText>}
        <div>
          <Button
            variant="secondary"
            size="sm"
            busy={busy}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                onChanged(await oppApi.move(o.id, "negotiating"));
              } catch (e) {
                setError(e instanceof Error ? e.message : "Could not reopen.");
              } finally {
                setBusy(false);
              }
            }}
          >
            Reopen as negotiating
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className={s.panel} aria-label="Stage">
      <h3 className={s.panelTitle}>Move stage</h3>
      <form className={s.form} onSubmit={f.handleSubmit} noValidate>
        <Select
          label="New stage"
          required
          placeholder="Choose a stage"
          options={STAGES.filter((x) => x.id !== o.stage).map((x) => ({ value: x.id, label: x.label }))}
          {...f.text("stage")}
        />
        {needsOutcome && (
          <TextArea
            label="Outcome"
            required
            autoGrow
            rows={2}
            hint={target === "won" ? "What was agreed, e.g. “Accepted the S.A. clean-up at US$1,850; lawyer starts Nov 4.”" : "Why it was lost, e.g. “Member chose a notary in Liberia.”"}
            {...f.text("outcome")}
          />
        )}
        {f.submitError && <ErrorText>{f.submitError}</ErrorText>}
        <div>
          <Button type="submit" busy={f.submitting} variant={needsOutcome ? "primary" : "secondary"}>
            {target === "won" ? "Mark won" : target === "lost" ? "Mark lost" : "Move"}
          </Button>
        </div>
      </form>
    </section>
  );
}

function QuotePanel({ o, onChanged }: { o: OpportunityRow; onChanged: (row: OpportunityRow) => void }) {
  const [quotes, setQuotes] = useState<MemberQuote[] | null>(null);
  const [pick, setPick] = useState("");
  const [busy, setBusy] = useState<"link" | "draft" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const closed = isClosedStage(o.stage);

  useEffect(() => {
    if (o.quote || closed) return;
    memberQuotes(o.clientId)
      .then(setQuotes)
      .catch(() => setQuotes([]));
  }, [o.clientId, o.quote, closed]);

  async function run(kind: "link" | "draft") {
    setBusy(kind);
    setError(null);
    try {
      onChanged(kind === "draft" ? await draftQuoteFor(o) : await oppApi.linkQuote(o.id, pick));
    } catch (e) {
      setError(e instanceof Error ? e.message : "The quote could not be linked.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className={s.panel} aria-label="Quote">
      <h3 className={s.panelTitle}>Quote</h3>
      {o.quote ? (
        <div className={s.quoteRow}>
          <div>
            <p className={s.quoteTitle}>{o.quote.title || "Untitled quote"}</p>
            <p className={s.meta}>
              {usd(o.quote.totalCents)} · {o.quote.status ? o.quote.status.replace(/_/g, " ") : "draft"}
            </p>
          </div>
          <StatusPill size="sm" label={o.quote.accepted ? "Accepted by member" : "Waiting on member"} tone={o.quote.accepted ? "success" : "info"} />
        </div>
      ) : closed ? (
        <p className={s.meta}>No quote was linked.</p>
      ) : (
        <>
          <p className={s.meta}>Linking a quote moves the opportunity to quoted. When the member accepts it, the opportunity is marked won.</p>
          {quotes === null && (
            <Loadable
              loading
              label="Loading this member's quotes"
              className={s.inlineForm}
              skeleton={
                <>
                  <div>
                    <Skeleton shape="line" size="sm" width="40" />
                    <Skeleton shape="block" size="sm" />
                  </div>
                  <Skeleton shape="block" size="sm" width="pill-lg" />
                </>
              }
            >
              {null}
            </Loadable>
          )}
          {quotes && quotes.length > 0 && (
            <div className={s.inlineForm}>
              <Select
                label="Existing quote on this member"
                placeholder="Choose a quote"
                value={pick}
                onChange={(e) => setPick(e.target.value)}
                options={quotes.map((q) => ({
                  value: quoteIdOf(q),
                  label: `${q.title || "Untitled"} · ${q.status ?? "draft"}${typeof q.total === "number" ? ` · ${usd(Math.round(q.total * 100))}` : ""}`,
                }))}
              />
              <Button variant="secondary" disabled={!pick} busy={busy === "link"} onClick={() => run("link")}>
                Link quote
              </Button>
            </div>
          )}
          <div>
            <Button variant="secondary" busy={busy === "draft"} onClick={() => run("draft")}>
              Draft a new quote
            </Button>
          </div>
          <p className={s.meta}>Drafts are priced in the client CRM (Pipeline), then sent for approval.</p>
        </>
      )}
      {error && <ErrorText>{error}</ErrorText>}
    </section>
  );
}

function EditPanel({ o, onChanged }: { o: OpportunityRow; onChanged: (row: OpportunityRow) => void }) {
  const [saved, setSaved] = useState(false);
  const f = useForm({
    initial: {
      title: o.title,
      area: o.area,
      valueCents: (o.valueCents ?? null) as number | null | undefined,
      ownerEmail: o.ownerEmail ?? "",
      nextWhat: o.nextAction?.what ?? "",
      nextDue: dateInputValue(o.nextAction?.dueAt),
    },
    rules: {
      title: [validators.required("Give the opportunity a short title."), validators.maxLength(160)],
      valueCents: [validators.money()],
      ownerEmail: [validators.email()],
      nextDue: [(v, all) => (v && !all.nextWhat.trim() ? "Say what the next action is." : null)],
    },
    onSubmit: async (v) => {
      setSaved(false);
      const row = await oppApi.update(o.id, {
        title: v.title,
        area: v.area,
        valueCents: v.valueCents ?? null,
        ownerEmail: v.ownerEmail,
        nextAction: v.nextWhat.trim() ? { what: v.nextWhat.trim(), dueAt: isoFromDateInput(v.nextDue) } : null,
      });
      setSaved(true);
      onChanged(row);
    },
  });
  useUnsavedChanges(f.dirty, "The opportunity details are not saved yet. If you leave now, they will be lost.");
  const due = o.nextAction?.dueAt ? dueLabel(o.nextAction.dueAt) : null;

  return (
    <section className={s.panel} aria-label="Details">
      <div className={s.panelHead}>
        <h3 className={s.panelTitle}>Details and next action</h3>
        {due && <StatusPill size="sm" label={`Next action ${due.text}`} tone={due.tone} />}
      </div>
      <form className={s.form} onSubmit={f.handleSubmit} noValidate>
        <TextInput label="Title" required {...f.text("title")} />
        <div className={s.pair}>
          <Select label="Legal area" options={areaOptions(o.area)} {...f.text("area")} />
          <MoneyInput label="Estimated legal fees" optional hint="Lawyer's fee for the work (GMV)." {...f.money("valueCents")} />
        </div>
        <TextInput label="Owner (CSM email)" type="email" optional {...f.text("ownerEmail")} />
        <div className={s.pair}>
          <TextInput label="Next action" optional placeholder="Send the proposal" {...f.text("nextWhat")} />
          <DateInput label="Due" optional {...f.text("nextDue")} />
        </div>
        {f.submitError && <ErrorText>{f.submitError}</ErrorText>}
        <div className={s.actionsRow}>
          <Button type="submit" variant="secondary" busy={f.submitting}>
            Save details
          </Button>
          {saved && (
            <span className={s.ok} role="status">
              Saved
            </span>
          )}
        </div>
      </form>
    </section>
  );
}
