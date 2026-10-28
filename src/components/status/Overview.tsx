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
import MemberIntro from "./MemberIntro";
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
  const first = home.member.firstName;
  return (
    <>
      {/* Collapsed on phones (and on the welcome visit) so the next step card stays above the fold at 390px. */}
      <MemberIntro
        screen="overview"
        collapseOnPhone
        defaultCollapsed={welcome}
        title={first ? `Hello, ${first}` : "Your ILP home"}
        what="This is your ILP home. It shows your next step, the call minutes you have left this month, and legal dates that may need attention."
        how={[
          "Look at Your next step first. It says what is needed, who does it and by when.",
          "Book a call when you have a question. Each call is 20 minutes with your lawyer.",
          "After a call, your lawyer confirms the next steps and they appear here.",
          "Press Ask my lawyer on any date you would like checked on your next call.",
        ]}
        why="You can see at a glance where your legal matters stand and whether anything is waiting for you."
        tutorialId="client.overview"
      />
    <Stagger>
      <div className={s.grid}>
        <div className={s.lead}>
          {welcome && (
            <StaggerItem index={0}>
              <WelcomeBanner />
            </StaggerItem>
          )}
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
    </>
  );
}
