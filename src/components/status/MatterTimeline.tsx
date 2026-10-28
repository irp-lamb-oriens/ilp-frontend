"use client";

import { IconCheck, StatusPill } from "@/components/ui";
import { useMember } from "./MemberContext";
import { areaLabel, dateShort, stageCopy } from "./format";
import s from "./MatterTimeline.module.scss";

/** Client-visible stages only, in plain words: done, now, later. */
export default function MatterTimeline() {
  const { home, matter } = useMember();
  if (!matter) return null;
  const stages = home.stages;
  const idx = Math.max(0, stages.findIndex((x) => x.id === matter.stage));
  const closed = !!matter.closedAt;

  return (
    <section className={s.wrap} aria-labelledby="timeline-title">
      <div className={s.head}>
        <h2 className={s.title} id="timeline-title">
          {matter.title}
        </h2>
        <p className={s.meta}>
          {[areaLabel(matter.area), matter.lawyerName ? `Lawyer: ${matter.lawyerName}` : "Lawyer to be assigned"].filter(Boolean).join(" · ")}
        </p>
      </div>
      <ol className={s.list}>
        {stages.map((st, i) => {
          const state = closed || i < idx ? "done" : i === idx ? "now" : "later";
          const copy = stageCopy(st.id, st);
          return (
            <li key={st.id} className={`${s.step} ${s[state]}`} aria-current={state === "now" ? "step" : undefined}>
              <span className={s.marker} aria-hidden="true">
                {state === "done" ? <IconCheck /> : i + 1}
              </span>
              <div className={s.body}>
                <p className={s.label}>
                  {copy.label}
                  {state === "now" && <StatusPill label="Where you are" tone="info" size="sm" className={s.pill} />}
                  {state === "done" && <span className={s.srOnly}> (done)</span>}
                </p>
                {state === "now" && (
                  <>
                    <p className={s.desc}>{copy.body}</p>
                    {matter.stageEnteredAt && <p className={s.since}>Since {dateShort(matter.stageEnteredAt)}</p>}
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
