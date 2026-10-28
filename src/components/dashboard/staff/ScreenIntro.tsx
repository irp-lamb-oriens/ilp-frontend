"use client";

import { createContext, useContext, type ReactNode } from "react";
import { PageIntro, PageIntroSkeleton } from "@/components/ui";
import { STAFF_INTROS, type StaffIntro, type StaffIntroKey } from "./intros";
import s from "./ScreenIntro.module.scss";

/**
 * True below a ScreenIntro: the intro already shows the page title (h1), so
 * PageHeader renders only its status line and actions.
 */
export const IntroTitleContext = createContext(false);
export const useIntroTitleShown = () => useContext(IntroTitleContext);

/**
 * The compact What, How, Why intro at the top of a staff screen, with the
 * screen's tutorial and the meaning of the business words it uses.
 * Collapsed state is remembered per screen (PageIntro, `ilp_intro_collapsed`).
 */
export function ScreenIntro({
  intro,
  title,
  storageKey,
}: {
  intro: StaffIntro;
  /** Overrides the intro title (the member page shows the member's name). */
  title?: ReactNode;
  storageKey?: string;
}) {
  return (
    <div className={s.wrap}>
      <PageIntro
        compact
        title={title ?? intro.title}
        what={intro.what}
        how={intro.how}
        why={intro.why}
        audience="staff"
        terms={intro.terms}
        tutorialId={intro.tutorialId}
        storageKey={storageKey}
      />
    </div>
  );
}

/** Loading placeholder for ScreenIntro (same frame, same remembered Hide / Show). */
export function ScreenIntroSkeleton({ storageKey }: { storageKey?: string }) {
  return (
    <div className={s.wrap}>
      <PageIntroSkeleton storageKey={storageKey} />
    </div>
  );
}

/**
 * Route wrapper: the screen's intro, then the screen. Inside, PageHeader
 * drops its own h1 and keeps its status line and actions.
 */
export function StaffScreen({ intro, children }: { intro: StaffIntroKey; children: ReactNode }) {
  return (
    <>
      <ScreenIntro intro={STAFF_INTROS[intro]} />
      <IntroTitleContext.Provider value={true}>{children}</IntroTitleContext.Provider>
    </>
  );
}
