"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { IconArrowLeft, SkeletonRegion, Stagger, StaggerItem, useSkeleton, ErrorNotice } from "@/components/ui";
import { MemberDocumentsList } from "@/components/documents/MemberDocumentsList";
import BriefPanel from "./BriefPanel";
import CallPanel from "./CallPanel";
import LawyerIntro from "./LawyerIntro";
import { errorText, lawyerApi, type Brief } from "./lawyerApi";
import { LawyerCallSkeleton } from "./LawyerSkeletons";
import s from "./CallView.module.scss";

/** One call: the pre-call brief on the left, the call flow on the right. */
export default function CallView({ consultationId }: { consultationId: string }) {
  const [brief, setBrief] = useState<Brief | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setBrief(await lawyerApi.brief(consultationId));
    } catch (err) {
      setError(errorText(err, "Could not load this call."));
    }
  }, [consultationId]);

  useEffect(() => {
    load();
  }, [load]);

  const { showSkeleton, skeletonVisible } = useSkeleton(!brief && !error);
  if (error) {
    return (
      <StaggerItem>
        <ErrorNotice audience="lawyer" variant="block" title="This call did not load" onRetry={load}>{error}</ErrorNotice>
      </StaggerItem>
    );
  }
  if (showSkeleton || !brief) {
    return (
      <SkeletonRegion label="Loading the brief" visible={skeletonVisible}>
        <LawyerCallSkeleton />
      </SkeletonRegion>
    );
  }

  return (
    <Stagger>
    <div className={s.page}>
      <nav className={s.crumbs} aria-label="Breadcrumb">
        <Link href="/lawyer" className={s.back}>
          <IconArrowLeft /> Back to Today
        </Link>
      </nav>
      <LawyerIntro screen="call" />
      <div className={s.cols}>
        <div className={s.briefCol} data-tour="lawyer-call-brief">
          <StaggerItem index={0}>
            <BriefPanel brief={brief} />
          </StaggerItem>
          <StaggerItem index={2}>
          <MemberDocumentsList
            clientId={brief.consultation.clientId}
            role="lawyer"
            title="Member's documents"
            matterTitle={(id) => brief.matters.find((m) => m.id === id)?.title}
          />
          </StaggerItem>
        </div>
        <StaggerItem index={1} className={s.callCol}>
          <CallPanel brief={brief} onChanged={setBrief} />
        </StaggerItem>
      </div>
    </div>
    </Stagger>
  );
}
