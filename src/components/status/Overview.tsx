"use client";

import { useMember } from "./MemberContext";
import NextStepCard from "./NextStepCard";
import MembershipCard from "./MembershipCard";
import MatterTimeline from "./MatterTimeline";
import Obligations from "./Obligations";
import UpcomingCalls from "./UpcomingCalls";
import WelcomeBanner from "./WelcomeBanner";
import NotificationOptIn from "./NotificationOptIn";
import PostCallRating from "./PostCallRating";
import { Stagger, StaggerItem } from "@/components/ui";
import s from "./Overview.module.scss";

/**
 * Answers "what happens next and what do I owe?". Phone order: next step,
 * membership, calls, dates, timeline. Desktop: wide main column, narrow rail.
 */
export default function Overview() {
  const { home, welcome } = useMember();
  // First load: the next step lands first, then membership, calls, dates and
  // the timeline, in phone reading order.
  return (
    <Stagger>
      <div className={s.grid}>
        <div className={s.lead}>
          <StaggerItem index={0}>
            {welcome ? (
              <WelcomeBanner />
            ) : (
              <p className={s.hello}>Hello{home.member.firstName ? `, ${home.member.firstName}` : ""}.</p>
            )}
          </StaggerItem>
          <StaggerItem index={1}>
            <NextStepCard />
          </StaggerItem>
          <StaggerItem index={2}>
            <PostCallRating />
          </StaggerItem>
        </div>
        <div className={s.rail}>
          <StaggerItem index={2}>
            <MembershipCard />
          </StaggerItem>
          <StaggerItem index={3}>
            <UpcomingCalls />
          </StaggerItem>
        </div>
        <div className={s.main}>
          <StaggerItem index={4}>
            <Obligations />
          </StaggerItem>
          <StaggerItem index={5}>
            <NotificationOptIn />
          </StaggerItem>
          <StaggerItem index={5}>
            <MatterTimeline />
          </StaggerItem>
        </div>
      </div>
    </Stagger>
  );
}
