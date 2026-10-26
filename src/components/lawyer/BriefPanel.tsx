"use client";

import { AgingBadge, ProgressBar, StatusPill } from "@/components/ui";
import { areaLabel, fmtDate, fmtShortDate, fmtTime, WHO_LABEL, type Brief } from "./lawyerApi";
import { ConsentPill } from "./pills";
import s from "./BriefPanel.module.scss";

const cap = (v: string | null | undefined) => (v ? v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, " ") : null);

function dependentsText(v: unknown): string | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  if (Number.isFinite(n)) return n === 0 ? "no dependents" : `${n} ${n === 1 ? "dependent" : "dependents"}`;
  return String(v);
}

/**
 * One-screen pre-call brief built from the living profile: who, household,
 * residency, assets, open matters, obligations inside 60 days, the member's
 * question and profile completeness. Sized to fit a 1366×768 laptop screen.
 */
export default function BriefPanel({ brief, showWhen = true }: { brief: Brief; showWhen?: boolean }) {
  const { who, household, residency, assets, matters, obligations, completeness, membership, consultation: c } = brief;
  const pct = Math.round(completeness.score * 100);
  const facts = [who.age ? `${who.age}` : null, who.nationality, who.country === "CR" ? "in Costa Rica" : who.country].filter(Boolean).join(" · ");
  const householdLine = [cap(household.maritalStatus), dependentsText(household.dependents)].filter(Boolean).join(", ") || "Not given yet";
  const residencyLine = residency.status
    ? `${cap(residency.status)}${residency.expiresAt ? `, expires ${fmtDate(residency.expiresAt)}` : ""}`
    : "Not given yet";

  return (
    <article className={s.brief} aria-label={`Pre-call brief for ${who.name}`}>
      <header className={s.head}>
        <div>
          <h2 className={s.name}>{who.name}</h2>
          <p className={s.facts}>{facts}</p>
        </div>
        {showWhen && c.scheduledAt && (
          <div className={s.whenCol}>
            <p className={s.when}>
              {fmtShortDate(c.scheduledAt)} · {fmtTime(c.scheduledAt)} · {c.durationMin} min
            </p>
            <ConsentPill state={c.consent?.recording ?? "pending"} />
          </div>
        )}
      </header>

      <section className={s.question} aria-label="Member's question">
        <span className={s.label}>Their question</span>
        <p className={s.qText}>{c.question ? `“${c.question}”` : "No question written. Ask what they want to leave the call with."}</p>
      </section>

      <dl className={s.grid}>
        <div className={s.cell}>
          <dt className={s.label}>Household</dt>
          <dd>{householdLine}</dd>
        </div>
        <div className={s.cell}>
          <dt className={s.label}>Residency</dt>
          <dd>{residencyLine}</dd>
        </div>
        <div className={s.cell}>
          <dt className={s.label}>Property</dt>
          <dd>{assets.property.owns ? assets.property.location ?? "Owns property" : "None listed"}</dd>
        </div>
        <div className={s.cell}>
          <dt className={s.label}>Company</dt>
          <dd>{assets.company.has ? assets.company.type ?? "Has a company" : "None listed"}</dd>
        </div>
        <div className={s.cell}>
          <dt className={s.label}>Vehicle</dt>
          <dd>{assets.vehicle.owns ? "Owns a vehicle" : "None listed"}</dd>
        </div>
        <div className={s.cell}>
          <dt className={s.label}>Membership</dt>
          <dd>{membership.minutesLeft} min · {membership.callsLeft} {membership.callsLeft === 1 ? "call" : "calls"} left</dd>
        </div>
      </dl>

      <div className={s.split}>
        <section aria-labelledby="brief-matters">
          <h3 id="brief-matters" className={s.h3}>Open matters</h3>
          {matters.length === 0 ? (
            <p className={s.none}>No open matter yet.</p>
          ) : (
            <ul className={s.items}>
              {matters.slice(0, 3).map((m) => (
                <li key={m.id} className={s.item}>
                  <span className={s.itemTitle}>{m.title}</span>
                  <span className={s.itemMeta}>
                    {areaLabel(m.area)} · {m.stageLabel} <AgingBadge since={m.stageEnteredAt} suffix="in stage" />
                  </span>
                  {m.nextStep && (
                    <span className={s.itemNext}>
                      Next: {m.nextStep.what} ({WHO_LABEL[m.nextStep.who]}{m.nextStep.dueAt ? `, ${fmtShortDate(m.nextStep.dueAt)}` : ""})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="brief-obl">
          <h3 id="brief-obl" className={s.h3}>Due in the next 60 days</h3>
          {obligations.length === 0 ? (
            <p className={s.none}>Nothing on file in the next 60 days.</p>
          ) : (
            <ul className={s.items}>
              {obligations.slice(0, 4).map((o) => (
                <li key={o.id} className={s.obl}>
                  <span className={s.oblDate}>{fmtShortDate(o.dueAt)}</span>
                  <span className={s.oblTitle}>{o.title}</span>
                  {o.overdue && <StatusPill label="Overdue" tone="danger" size="sm" />}
                </li>
              ))}
              {obligations.length > 4 && <li className={s.none}>{obligations.length - 4} more on the Deadlines tab</li>}
            </ul>
          )}
        </section>
      </div>

      <footer className={s.foot}>
        <ProgressBar
          label="Profile completeness"
          value={completeness.score}
          valueText={`${pct}%${completeness.consultationReady ? " · consultation-ready" : " · below 70%, confirm the gaps on the call"}`}
          tone={completeness.consultationReady ? "success" : "warning"}
        />
        {brief.priorSummaries[0] && (
          <p className={s.prior}>
            <span className={s.label}>Last call, {fmtShortDate(brief.priorSummaries[0].scheduledAt)}</span> {brief.priorSummaries[0].text}
          </p>
        )}
      </footer>
    </article>
  );
}
