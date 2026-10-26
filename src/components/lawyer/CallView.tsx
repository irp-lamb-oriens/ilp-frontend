"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button, EmptyState } from "@/components/ui";
import BriefPanel from "./BriefPanel";
import CallPanel from "./CallPanel";
import { errorText, lawyerApi, type Brief } from "./lawyerApi";
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

  if (error) {
    return <EmptyState title="This call did not load" body={error} action={<Button onClick={load}>Try again</Button>} />;
  }
  if (!brief) return <p className={s.loading} aria-busy="true">Loading the brief…</p>;

  return (
    <div className={s.page}>
      <nav className={s.crumbs} aria-label="Breadcrumb">
        <Link href="/lawyer" className={s.back}>← Today</Link>
      </nav>
      <div className={s.cols}>
        <div className={s.briefCol}>
          <BriefPanel brief={brief} />
        </div>
        <div className={s.callCol}>
          <CallPanel brief={brief} onChanged={setBrief} />
        </div>
      </div>
    </div>
  );
}
