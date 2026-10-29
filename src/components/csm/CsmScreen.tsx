"use client";

import type { ReactNode } from "react";
import { IntroTitleContext, ScreenIntro } from "../dashboard/staff/ScreenIntro";
import { CSM_INTROS, type CsmIntroKey } from "./intros";

/** A CSM page: its What, How, Why intro, then the page (whose PageHeader drops its own h1). */
export function CsmScreen({ intro, children }: { intro: CsmIntroKey; children: ReactNode }) {
  return (
    <>
      <ScreenIntro intro={CSM_INTROS[intro]} storageKey={`/csm/${intro}`} />
      <IntroTitleContext.Provider value={true}>{children}</IntroTitleContext.Provider>
    </>
  );
}
