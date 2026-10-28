"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { trackFunnel } from "@/lib/funnel";
import FunnelHeader from "@/app/check/FunnelHeader";
import { Notice, PageIntro } from "@/components/ui";
import JoinForm from "@/components/join/JoinForm";
import { PRICE, type PaymentsMode, type StoredCheck, getPlan, loadCheck } from "./joinApi";
import s from "@/components/join/join.module.scss";

/**
 * /join (W3, guided form T3): what joining is, then five short steps that
 * collect what ILP needs to start the member's first matter and first call.
 */
export default function JoinPage() {
  const [mode, setMode] = useState<PaymentsMode>("manual");
  const [check, setCheck] = useState<StoredCheck | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    const stored = loadCheck();
    setCheck(stored);
    setLoaded(true);
    setCancelled(new URLSearchParams(window.location.search).get("cancelled") === "1");
    void getPlan().then((p) => setMode(p.mode));
    trackFunnel("join_started", { leadId: stored?.leadId });
  }, []);

  const findings = check?.findings.length ?? 0;

  return (
    <div className={s.page}>
      <FunnelHeader note="Secure sign-up" />
      <main className={s.wrap}>
        <PageIntro
          className={s.intro}
          eyebrow="Join ILP"
          title="Become a member"
          what={`A legal membership for Colombia, Costa Rica, Mexico, Panama, Portugal and Spain: ${PRICE.monthly} a month plus a ${PRICE.activation} activation fee, with up to ${PRICE.calls} calls of ${PRICE.callLength} minutes a month with a lawyer licensed in your country.${
            findings ? ` The ${findings} ${findings === 1 ? "date" : "dates"} from your free check go on your profile.` : ""
          }`}
          how={[
            "Tell us about you and your household.",
            "Choose your country and tell us about your situation there.",
            "Write the question you want to ask first.",
            "Check the plan, agree to the terms and pay.",
          ]}
          why="Your lawyer reads these answers before your first call, so the 20 minutes go to your question instead of background."
          tutorialId="public.member-home"
          tutorialLabel="See your ILP home"
        />

        {cancelled && (
          <Notice tone="info" title="Payment was not completed">
            Nothing was charged. Your answers are still here: go to the last step and press the payment button again.
          </Notice>
        )}

        {loaded && <JoinForm mode={mode} check={check} />}

        <p className={s.railNote}>
          Already a member? <Link href="/status">Sign in</Link>.
        </p>
      </main>
    </div>
  );
}
