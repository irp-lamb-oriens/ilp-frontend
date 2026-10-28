"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { PageIntro, type PageIntroProps } from "@/components/ui";
import s from "./MemberIntro.module.scss";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const PHONE = "(max-width: 767px)";

export interface MemberIntroProps extends Omit<PageIntroProps, "compact" | "order" | "storageKey"> {
  /** Screen key the Hide intro / Show intro choice is remembered under (ilp_intro_collapsed). */
  screen: string;
  /**
   * Start collapsed on phones (and when `collapsed` is true) until the member
   * opens it. Overview uses it so the next step card stays above the fold.
   */
  collapseOnPhone?: boolean;
}

/**
 * The member version of PageIntro: compact, what-how-why, collapsible and
 * remembered per screen, at member reading size.
 */
export default function MemberIntro({ screen, collapseOnPhone = false, defaultCollapsed = false, ...rest }: MemberIntroProps) {
  const [phone, setPhone] = useState(false);
  useIsoLayoutEffect(() => {
    if (!collapseOnPhone) return;
    try {
      const mq = window.matchMedia(PHONE);
      setPhone(mq.matches);
    } catch {
      // no matchMedia: keep the default
    }
  }, [collapseOnPhone]);

  return (
    <div className={s.wrap}>
      <PageIntro
        {...rest}
        compact
        order="what-how-why"
        storageKey={`status:${screen}`}
        defaultCollapsed={defaultCollapsed || (collapseOnPhone && phone)}
        className={s.intro}
      />
    </div>
  );
}
