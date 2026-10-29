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
import { ButtonLink, Notice, Stagger, StaggerItem } from "@/components/ui";
import { PLAN_STANDARD } from "@/lib/contracts";
import { isFreeAccount } from "./api";
import ArrangingLawyer from "./ArrangingLawyer"; // ROUTING
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
  if (isFreeAccount(home)) return <FreeOverview />;
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
          {home.lawyerMatch?.status === "arranging" && (
            <StaggerItem index={1}>
              <ArrangingLawyer salesCall={home.lawyerMatch.salesCall} />
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

/**
 * DEADLINES: a free account (deadlines saved from the free check). Its
 * deadlines first, then a calm note about the membership. No calls, money or
 * messages.
 */
function FreeOverview() {
  const { home } = useMember();
  const first = home.member.firstName;
  return (
    <>
      <MemberIntro
        screen="overview-free"
        collapseOnPhone
        title={first ? `Hello, ${first}` : "Your ILP home"}
        what="This is your free ILP account. It keeps the legal deadlines you chose in the free check and reminds you before each date."
        how={[
          "Open Deadlines to set a date for each one, mark it done or add more.",
          "Keep your answers up to date in Profile, so the suggested dates stay right.",
          "Join ILP when you would like a lawyer to tell you which dates apply to you.",
        ]}
        why="A missed date can bring late fees or a lapsed status. Reminders 30 and 7 days before give you time to act."
        tutorialId="client.deadlines"
      />
      <Stagger>
        <div className={s.free}>
          <StaggerItem index={0}>
            <Obligations />
          </StaggerItem>
          <StaggerItem index={1}>
            <Notice
              tone="info"
              headingLevel={2}
              title="A lawyer can check these dates with you"
              actions={<ButtonLink href="/join" variant="secondary">See what membership includes</ButtonLink>}
            >
              ILP members talk their dates through with a lawyer licensed in their country, on up to {PLAN_STANDARD.callsIncluded} calls of {PLAN_STANDARD.callLengthMin} minutes a month. Your free account stays as it is if you do not join.
            </Notice>
          </StaggerItem>
          <StaggerItem index={2}>
            <NotificationOptIn />
          </StaggerItem>
        </div>
      </Stagger>
    </>
  );
}
