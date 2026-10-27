"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, StatusPill, SkeletonRegion, StaggerItem, useSkeleton } from "@/components/ui";
import type { StatusTone } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { PLAN_STANDARD } from "@/lib/contracts";
import { membershipApi, type MembershipBillingView } from "./membershipApi";
import { useMember } from "./MemberContext";
import { dateLong, money } from "./format";
import { PlanSkeleton } from "./StatusSkeletons";
import s from "./MembershipBilling.module.scss";

const STATUS: Record<string, { label: string; tone: StatusTone }> = {
  active: { label: "Active", tone: "success" },
  pending: { label: "Waiting for payment", tone: "warning" },
  past_due: { label: "Payment overdue", tone: "warning" },
  cancelled: { label: "Ended", tone: "neutral" },
};

/**
 * Money section, below the balance: the membership itself. Plan and price,
 * renewal or end date, a past-due notice with the way to fix it, and the
 * quiet way out ("Cancel membership") or back in ("Keep my membership").
 */
export default function MembershipBilling() {
  const { refresh } = useMember();
  const [data, setData] = useState<MembershipBillingView | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [loaded, setLoaded] = useState(false);
  const { showSkeleton, skeletonVisible } = useSkeleton(!loaded);

  useEffect(() => {
    membershipApi
      .get()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoaded(true));
  }, []);

  const m = data?.membership;
  if (showSkeleton) {
    return (
      <SkeletonRegion label="Loading your membership plan" visible={skeletonVisible}>
        <PlanSkeleton />
      </SkeletonRegion>
    );
  }
  if (!data || !m) return null;
  const st = m.cancelAtPeriodEnd && m.status !== "cancelled"
    ? { label: "Ending", tone: "neutral" as StatusTone }
    : STATUS[m.status] ?? STATUS.pending;

  async function keep() {
    setBusy(true);
    setError(null);
    try {
      setData(await membershipApi.undoCancel());
      void refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "That did not work. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function updateCard() {
    setBusy(true);
    setError(null);
    try {
      const { url } = await membershipApi.billingPortal();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We could not open the payment page. Please try again.");
      setBusy(false);
    }
  }

  return (
    <StaggerItem as="section" index={1} className={s.card} aria-labelledby="plan-title">
      <div className={s.head}>
        <h2 className={s.title} id="plan-title">
          Your membership plan
        </h2>
        <StatusPill label={st.label} tone={st.tone} size="sm" srPrefix="Membership" />
      </div>
      <p className={s.price}>
        {money(PLAN_STANDARD.monthlyCents)} a month · {PLAN_STANDARD.minutesIncluded} minutes, up to {PLAN_STANDARD.callsIncluded}{" "}
        calls
      </p>

      {m.status === "past_due" && (
        <div className={s.notice} role="status">
          <p className={s.noticeText}>
            {data.access.inGrace
              ? `Your last payment did not go through. Your access continues until ${dateLong(data.access.graceEndsAt)} while you update it.`
              : data.access.message}
          </p>
          {m.paidBy === "card" && data.mode === "stripe" ? (
            <Button onClick={updateCard} busy={busy}>
              Update your card
            </Button>
          ) : (
            <Link className={s.link} href="/status/messages">
              Message your team about payment
            </Link>
          )}
        </div>
      )}

      {m.status === "cancelled" ? (
        <p className={s.line}>Your membership ended{m.cancelledAt ? ` on ${dateLong(m.cancelledAt)}` : ""}. Your profile and documents stay here for you.</p>
      ) : m.cancelAtPeriodEnd ? (
        <div className={s.ending}>
          <p className={s.line}>
            Your membership ends on {dateLong(m.periodEnd)}. Until then everything works as usual, including calls you have
            booked.
          </p>
          <Button variant="secondary" onClick={keep} busy={busy}>
            Keep my membership
          </Button>
        </div>
      ) : (
        m.status !== "pending" && <p className={s.line}>Renews on {dateLong(m.periodEnd)}.</p>
      )}

      {error && (
        <p className={s.err} role="alert">
          {error}
        </p>
      )}

      {(m.status === "active" || m.status === "past_due") && !m.cancelAtPeriodEnd && (
        <Link className={s.cancel} href="/status/money/cancel">
          Cancel membership
        </Link>
      )}
    </StaggerItem>
  );
}
