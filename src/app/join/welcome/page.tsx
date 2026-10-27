"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { trackFunnel } from "@/lib/funnel";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FunnelHeader from "@/app/check/FunnelHeader";
import { setRoleToken } from "@/lib/api";
import { type JoinStatus, PRICE, joinStatus, longDate, portalSession } from "../joinApi";
import { Skeleton, SkeletonRegion, SkeletonText } from "@/components/ui";
import s from "@/app/check/funnel.module.scss";

const POLL_MS = 3000;
const POLL_LIMIT = 40; // about two minutes while Stripe confirms

/**
 * After join: waits for the membership to turn active (Stripe webhook or
 * staff mark-paid), then opens the member's home in /status with ?welcome=1.
 */
export default function WelcomePage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<JoinStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const polls = useRef(0);

  const openHome = useCallback(
    async (t: string, st: JoinStatus) => {
      setOpening(true);
      try {
        const res = await portalSession(t);
        // The body carries the member's session token: keep it for the client
        // role (sent as Authorization: Bearer). loginRequired = existing
        // client, sign in by code.
        if (res.token && res.projectId && !res.loginRequired) {
          setRoleToken("client", res.token);
          router.push(`/status/${encodeURIComponent(res.projectId)}?welcome=1`);
          return;
        }
      } catch {
        // fall through to the sign-in page
      }
      router.push(`/status?project=${encodeURIComponent(st.projectId)}&welcome=1`);
    },
    [router],
  );

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("t");
    if (!t) {
      setError("This page needs the link from your sign-up. You can sign in with your email instead.");
      return;
    }
    setToken(t);
  }, []);

  useEffect(() => {
    if (!token) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    const tick = async () => {
      try {
        const st = await joinStatus(token);
        if (stopped) return;
        setStatus(st);
        polls.current += 1;
        const keepWaiting = st.status === "pending" && st.mode === "stripe" && polls.current < POLL_LIMIT;
        if (keepWaiting) timer = setTimeout(tick, POLL_MS);
      } catch (err) {
        if (!stopped) setError(err instanceof Error ? err.message : "We could not load your membership.");
      }
    };
    void tick();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [token]);

  const active = status?.status === "active";

  // P2 funnel: the visitor's membership is paid and active.
  useEffect(() => {
    if (active) trackFunnel("join_paid");
  }, [active]);

  return (
    <div className={s.page}>
      <FunnelHeader />
      <main className={s.main}>
        {error ? (
          <>
            <h1 className={s.title}>Let us find your membership</h1>
            <p className={s.help}>{error}</p>
            <Link href="/status" className={s.primary}>Sign in with my email</Link>
          </>
        ) : !status ? (
          <SkeletonRegion label="Loading your membership">
            <WelcomeSkeleton />
          </SkeletonRegion>
        ) : active ? (
          <>
            <h1 className={s.title}>Welcome to ILP</h1>
            <p className={s.help}>Your membership is active. Here is what you have this month.</p>
            <section className={s.statusCard} aria-label="Your membership">
              <div className={s.totalRow}>
                <span>Call minutes</span>
                <span className={s.totalStrong}>{status.minutesIncluded} of {status.minutesIncluded} left</span>
              </div>
              <div className={s.totalRow}>
                <span>Calls</span>
                <span className={s.totalStrong}>{status.callsIncluded} of {status.callsIncluded} left</span>
              </div>
              {status.periodEnd && (
                <div className={s.totalRow}>
                  <span>Renews</span>
                  <span>{longDate(status.periodEnd)}</span>
                </div>
              )}
            </section>
            <p className={s.help}>
              Next, your ILP team will reach out within one business day to welcome you and review your profile.
              Completing your profile now makes your first call faster.
            </p>
            <button
              type="button"
              className={`${s.primary} ${s.primaryWide}`}
              disabled={opening}
              onClick={() => token && void openHome(token, status)}
            >
              {opening ? "Opening…" : "Go to my ILP home"}
            </button>
          </>
        ) : status.mode === "stripe" && polls.current < POLL_LIMIT ? (
          <>
            <h1 className={s.title}>Confirming your payment</h1>
            <p className={s.help} role="status">This usually takes a few seconds. Please keep this page open.</p>
          </>
        ) : (
          <>
            <h1 className={s.title}>You are almost in</h1>
            <p className={s.help}>
              We have your details. Our team will email {status.email} with payment details for {PRICE.dueToday}{" "}
              within one business day, and your membership starts as soon as payment is confirmed.
            </p>
            <p className={s.help}>
              Once it is active, sign in with your email to see your profile and book your first call.
            </p>
            <Link href={`/status?project=${encodeURIComponent(status.projectId)}`} className={s.ghost}>
              Go to sign in
            </Link>
          </>
        )}
      </main>
    </div>
  );
}

/** The active-membership welcome: heading, intro, minutes / calls / renewal card, next step, button. */
function WelcomeSkeleton() {
  return (
    <div aria-hidden="true">
      <Skeleton shape="line" size="xl" width="60" className={s.title} />
      <SkeletonText lines={1} className={s.help} />
      <div className={s.statusCard}>
        {[0, 1, 2].map((i) => (
          <div key={i} className={s.totalRow}>
            <Skeleton shape="line" size="md" width="25" />
            <Skeleton shape="line" size="md" width="25" />
          </div>
        ))}
      </div>
      <SkeletonText lines={2} className={s.help} />
      <Skeleton shape="block" size="sm" width="pill-lg" />
    </div>
  );
}
