"use client";

import { ButtonLink, StatusPill } from "@/components/ui";
import { useMember } from "./MemberContext";
import { nextStepModel } from "./nextStep";
import { dateLong, daysUntil, relativeDue, whoLabel } from "./format";
import s from "./NextStepCard.module.scss";

const ORIGIN: Record<string, string> = {
  lawyer: "Confirmed by your lawyer after your call.",
  matter: "Set by your ILP team for this matter.",
  profile: "Your lawyer reads your profile before every call.",
  booking: "Calls are included in your membership.",
  call: "",
};

/** One card: what is needed, from whom, by when. Always the first thing on Overview. */
export default function NextStepCard() {
  const { home, matter } = useMember();
  const m = nextStepModel(home, matter);
  const overdue = (daysUntil(m.dueAt) ?? 1) < 0;

  return (
    <section className={s.card} aria-labelledby="next-step-title">
      <p className={s.kicker} id="next-step-title">
        Your next step
      </p>
      <p className={s.what}>{m.what}</p>
      <dl className={s.facts}>
        <div className={s.fact}>
          <dt>Who</dt>
          <dd>{whoLabel(m.who, m.whoName)}</dd>
        </div>
        {m.dueAt && (
          <div className={s.fact}>
            <dt>By when</dt>
            <dd>
              {dateLong(m.dueAt)} <span className={s.rel}>({relativeDue(m.dueAt)})</span>
              {overdue && <StatusPill label="Overdue" tone="warning" size="sm" className={s.pill} />}
            </dd>
          </div>
        )}
      </dl>
      {m.action && (
        <ButtonLink href={m.action.href} block className={s.cta}>
          {m.action.label}
        </ButtonLink>
      )}
      {m.more.length > 0 && (
        <div className={s.more}>
          <p className={s.moreTitle}>Also agreed after your call</p>
          <ul className={s.moreList}>
            {m.more.map((x, i) => (
              <li key={i}>
                {x.what}
                <span className={s.moreMeta}>
                  {" "}· {whoLabel(x.who, matter?.lawyerName)}
                  {x.dueAt ? `, ${relativeDue(x.dueAt)}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {ORIGIN[m.origin] && <p className={s.origin}>{ORIGIN[m.origin]}</p>}
    </section>
  );
}
