"use client";

import { useMember } from "./MemberContext";
import { dateLong, relativeDue, timeOfDay } from "./format";
import s from "./UpcomingCalls.module.scss";

export default function UpcomingCalls() {
  const { home } = useMember();
  if (!home.upcomingCalls.length) return null;
  return (
    <section className={s.wrap} aria-labelledby="calls-title">
      <h2 className={s.title} id="calls-title">
        Your booked {home.upcomingCalls.length === 1 ? "call" : "calls"}
      </h2>
      <ul className={s.list}>
        {home.upcomingCalls.map((c) => (
          <li key={c.id} className={s.item}>
            <p className={s.when}>
              {dateLong(c.scheduledAt)}, {timeOfDay(c.scheduledAt)} <span className={s.rel}>({relativeDue(c.scheduledAt)})</span>
            </p>
            <p className={s.meta}>
              {c.durationMin ?? 20} minutes{c.lawyerName ? ` with ${c.lawyerName}` : ""} · Costa Rica time
            </p>
            {c.question && <p className={s.question}>{c.question.split("\n")[0]}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
