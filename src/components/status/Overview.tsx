"use client";

import { useMember } from "./MemberContext";
import NextStepCard from "./NextStepCard";
import MembershipCard from "./MembershipCard";
import MatterTimeline from "./MatterTimeline";
import Obligations from "./Obligations";
import UpcomingCalls from "./UpcomingCalls";
import WelcomeBanner from "./WelcomeBanner";
import NotificationOptIn from "./NotificationOptIn";
import s from "./Overview.module.scss";

/**
 * Answers "what happens next and what do I owe?". Phone order: next step,
 * membership, calls, dates, timeline. Desktop: wide main column, narrow rail.
 */
export default function Overview() {
  const { home, welcome } = useMember();
  return (
    <div className={s.grid}>
      <div className={s.lead}>
        {welcome ? (
          <WelcomeBanner />
        ) : (
          <p className={s.hello}>Hello{home.member.firstName ? `, ${home.member.firstName}` : ""}.</p>
        )}
        <NextStepCard />
      </div>
      <div className={s.rail}>
        <MembershipCard />
        <UpcomingCalls />
      </div>
      <div className={s.main}>
        <Obligations />
        <NotificationOptIn />
        <MatterTimeline />
      </div>
    </div>
  );
}
