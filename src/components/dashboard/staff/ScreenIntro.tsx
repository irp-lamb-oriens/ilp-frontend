"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { PageIntro } from "@/components/ui";
import type { GlossaryEntry, TermKey } from "@/tutorials/glossary";
import { STAFF_INTROS, type StaffIntro, type StaffIntroKey } from "./intros";
import s from "./ScreenIntro.module.scss";

/**
 * True below a ScreenIntro: the intro already shows the page title (h1), so
 * PageHeader renders only its status line and actions.
 */
export const IntroTitleContext = createContext(false);
export const useIntroTitleShown = () => useContext(IntroTitleContext);

const LABELS = { what: "What this screen is", how: "What you do here", why: "Why it matters" };

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
        labels={LABELS}
        tutorialId={intro.tutorialId}
        storageKey={storageKey}
      />
      {intro.terms && intro.terms.length > 0 && <ScreenTerms terms={intro.terms} />}
    </div>
  );
}

/** "Words on this screen": glossary meanings, loaded the first time it opens. */
function ScreenTerms({ terms }: { terms: TermKey[] }) {
  const [rows, setRows] = useState<Array<{ key: string; word: string; meaning: string }> | null>(null);
  function load(open: boolean) {
    if (!open || rows) return;
    void import("@/tutorials/glossary").then(({ GLOSSARY }) => {
      const table = GLOSSARY as Record<string, GlossaryEntry>;
      setRows(terms.filter((k) => table[k]).map((k) => ({ key: k, word: table[k].word, meaning: table[k].meaning })));
    });
  }
  return (
    <details className={s.terms} onToggle={(e) => load((e.currentTarget as HTMLDetailsElement).open)}>
      <summary className={s.termsSummary}>
        <svg className={s.termsIcon} width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3 2.5h7.5L13 5v8.5H3z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M5.5 7h5M5.5 9.5h5M5.5 12h3" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        Words on this screen
        <span className={s.termsCount}>{terms.length}</span>
      </summary>
      {rows ? (
        <dl className={s.termsList}>
          {rows.map((r) => (
            <div key={r.key} className={s.term}>
              <dt>{r.word}</dt>
              <dd>{r.meaning}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className={s.termsLoading}>Loading the meanings.</p>
      )}
    </details>
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
