"use client";

import Link from "next/link";
import { ButtonLink, ProgressBar, StatusPill } from "@/components/ui";
import type { StatusTone } from "@/components/ui";
import { PLAN_STANDARD } from "@/lib/contracts";
import { useMember } from "./MemberContext";
import { dateLong } from "./format";
import { nextStepModel } from "./nextStep";
import s from "./MembershipCard.module.scss";

const STATUS: Record<string, { label: string; tone: StatusTone }> = {
  active: { label: "Active", tone: "success" },
  pending: { label: "Waiting for payment", tone: "warning" },
  past_due: { label: "Payment overdue", tone: "warning" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

/** Minutes and calls left this month, renewal date, and the way to book. */
export default function MembershipCard() {
  const { home, matter } = useMember();
  // One primary button per screen: the next-step card owns it when it has one.
  const bookVariant = nextStepModel(home, matter).action ? "secondary" : "primary";
  const m = home.membership;
  const cap = home.capacity;
  const minutesIncluded = m?.minutesIncluded ?? PLAN_STANDARD.minutesIncluded;
  const callsIncluded = m?.callsIncluded ?? PLAN_STANDARD.callsIncluded;
  const st = STATUS[m?.status ?? "pending"] ?? STATUS.pending;

  return (
    <section className={s.card} aria-labelledby="membership-title">
      <div className={s.head}>
        <h2 className={s.title} id="membership-title">
          Your membership
        </h2>
        <StatusPill label={st.label} tone={st.tone} size="sm" srPrefix="Membership status" />
      </div>

      <div className={s.figures}>
        <p className={s.figure}>
          <span className={s.big}>{cap.minutesLeft}</span>
          <span className={s.of}> of {minutesIncluded} minutes left</span>
        </p>
        <p className={s.figure}>
          <span className={s.big}>{cap.callsLeft}</span>
          <span className={s.of}> of {callsIncluded} calls left</span>
        </p>
      </div>
      <ProgressBar
        label="Minutes left this month"
        value={cap.minutesLeft}
        max={minutesIncluded}
        valueText={`${cap.minutesLeft} of ${minutesIncluded} minutes left`}
      />
      {cap.callsBooked > 0 && (
        <p className={s.note}>
          {cap.minutesBooked} minutes are set aside for your booked {cap.callsBooked === 1 ? "call" : "calls"}. They are
          counted once the call is done.
        </p>
      )}
      {m?.periodEnd && m.status !== "cancelled" && (
        <p className={s.note}>
          {m.cancelAtPeriodEnd ? (
            <>
              Ends on {dateLong(m.periodEnd)}. <Link href="/status/money">Keep my membership</Link>
            </>
          ) : (
            <>Renews on {dateLong(m.periodEnd)}, with a fresh {minutesIncluded} minutes.</>
          )}
        </p>
      )}

      {cap.canBook ? (
        <ButtonLink href="/status/book" variant={bookVariant} block className={s.book}>
          Book a call
        </ButtonLink>
      ) : (
        <div className={s.blocked}>
          <p className={s.blockedText}>{cap.reason}</p>
          <ButtonLink href="/status/messages" variant="secondary" block>
            Message your team
          </ButtonLink>
        </div>
      )}
    </section>
  );
}
