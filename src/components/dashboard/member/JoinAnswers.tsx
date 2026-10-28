"use client";

import { DOCUMENTS_ON_HAND, type DocumentOnHand, type Membership, PROFILE_DETAIL_FIELDS, PROFILE_SECTIONS } from "@/lib/contracts";
import { FIELD_META } from "@/components/status/profileFields";
import s from "./member.module.scss";

const DOC_LABEL: Record<DocumentOnHand, string> = {
  passport: "Passport",
  dimex: "DIMEX or residency card",
  property_title: "Property title or plano",
  company_books: "Company books",
  vehicle_papers: "Vehicle papers",
};

const URGENCY: Record<string, string> = {
  deadline: "There is a deadline",
  soon: "In the next few weeks",
  no_rush: "No rush",
};

function value(key: string, v: unknown): string | null {
  if (v === undefined || v === null || v === "") return null;
  if (v === true) return "Yes";
  if (v === false) return "No";
  const opt = FIELD_META[key]?.options?.find((o) => o.value === String(v));
  return opt ? opt.label : String(v);
}

const day = (iso: string) => new Date(iso).toLocaleDateString("en-US", { dateStyle: "medium", timeZone: "UTC" });

/**
 * T3: what the member told us when joining. The main question, how urgent it
 * is, the documents they already have (a checklist for the welcome call) and
 * the profile details that do not count toward completion.
 */
export function JoinAnswers({ membership, profile }: { membership: Membership | null; profile: Record<string, unknown> }) {
  const intake = membership?.intake;
  const details = PROFILE_SECTIONS.flatMap((sec) => PROFILE_DETAIL_FIELDS[sec])
    .map((k) => [k, value(k, profile[k])] as const)
    .filter((x): x is readonly [string, string] => x[1] !== null);
  if (!intake && !details.length) return null;
  const have = new Set(intake?.documentsOnHand ?? []);

  return (
    <section className={s.block} aria-labelledby="join-answers-title">
      <h2 className={s.blockTitle} id="join-answers-title">
        From the join form
      </h2>
      {intake && (
        <>
          <p className={s.label}>First question</p>
          <p>{intake.question}</p>
          <p className={s.meta}>
            {URGENCY[intake.urgency] ?? intake.urgency}
            {intake.deadlineAt ? `, by ${day(intake.deadlineAt)}` : ""} · sent {day(intake.submittedAt)}
          </p>
          <p className={s.label}>Documents they say they have</p>
          <ul className={s.sections} aria-label="Documents on hand">
            {DOCUMENTS_ON_HAND.map((d) => (
              <li key={d} className={s.sectionRow}>
                <span>{DOC_LABEL[d]}</span>
                <span className={have.has(d) ? undefined : s.missing}>{have.has(d) ? "Has it" : "Not yet"}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {details.length > 0 && (
        <dl className={s.facts}>
          {details.map(([k, v]) => (
            <div key={k}>
              <dt>{FIELD_META[k]?.label ?? k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
