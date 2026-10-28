"use client";

/**
 * Page intro: the What, How, Why block from copy-rules.md.
 *
 * Every hero banner and screen intro answers three things in plain words:
 * what this is, what will happen (2 to 5 numbered steps) and why it matters
 * to the reader. Marketing heroes put them in Golden Circle order
 * ("why-how-what"); working screens, where people came to do a task, use
 * "what-how-why" (the default).
 *
 * `compact` is the dashboard version: smaller type, the three parts side by
 * side from 1024px, and a Hide / Show toggle. The choice is remembered per
 * screen in this browser (localStorage `ilp_intro_collapsed`), so returning
 * users can shrink it and keep it shrunk.
 *
 * `tutorialId` adds a "Watch how it works" button that opens that tutorial in
 * the tutorial modal (hidden when no TutorialProvider is mounted).
 */
import { useEffect, useId, useLayoutEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useTutorialOptional } from "../tutorial/context";
import { cx } from "./cx";
import { Stagger, StaggerItem } from "./Stagger";
import s from "./PageIntro.module.scss";

export type PageIntroOrder = "why-how-what" | "what-how-why";
export type PageIntroPart = "what" | "how" | "why";

export interface PageIntroLabels {
  what?: string;
  how?: string;
  why?: string;
}

export interface PageIntroProps {
  /** Short mono label above the title. At most one eyebrow per three sections (rules.md). */
  eyebrow?: string;
  title: ReactNode;
  /** What this is, in one or two sentences. */
  what: ReactNode;
  /** What will happen, as 2 to 5 short steps. They render as a numbered list. */
  how: ReactNode[];
  /** Why it matters to the reader. */
  why: ReactNode;
  /** "why-how-what" for marketing heroes, "what-how-why" (default) for working screens. */
  order?: PageIntroOrder;
  /** Part headings. Defaults: "What this is", "What happens", "Why it matters to you". */
  labels?: PageIntroLabels;
  /** Hide the part headings visually (screen readers still hear them). */
  hideLabels?: boolean;
  /** Buttons or links under the parts. One primary action at most. */
  actions?: ReactNode;
  /** Optional picture or diagram, shown beside the text from 1024px (below it on phones). */
  illustration?: ReactNode;
  /** Adds "Watch how it works", which opens this tutorial. */
  tutorialId?: string;
  /** Step id to open the tutorial at. */
  tutorialStep?: string;
  /** Label for the tutorial button. Default "Watch how it works". */
  tutorialLabel?: string;
  /** Dashboard variant: smaller, three parts side by side, with a collapse toggle. */
  compact?: boolean;
  /** Key the collapsed state is stored under. Default: the current path. */
  storageKey?: string;
  /** Start collapsed when nothing is stored yet. Default false. */
  defaultCollapsed?: boolean;
  /** h1 (default) on a page; 2 when the page already has an h1. */
  headingLevel?: 1 | 2;
  id?: string;
  className?: string;
}

export const INTRO_STORAGE_KEY = "ilp_intro_collapsed";

const DEFAULT_LABELS: Required<PageIntroLabels> = {
  what: "What this is",
  how: "What happens",
  why: "Why it matters to you",
};

const ORDERS: Record<PageIntroOrder, PageIntroPart[]> = {
  "why-how-what": ["why", "how", "what"],
  "what-how-why": ["what", "how", "why"],
};

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function readCollapsed(): Record<string, boolean> {
  try {
    const raw = window.localStorage.getItem(INTRO_STORAGE_KEY);
    const v = raw ? (JSON.parse(raw) as unknown) : {};
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function writeCollapsed(key: string, collapsed: boolean) {
  try {
    const all = readCollapsed();
    if (collapsed) all[key] = true;
    else delete all[key];
    window.localStorage.setItem(INTRO_STORAGE_KEY, JSON.stringify(all));
  } catch {
    // storage blocked: the toggle still works for this visit
  }
}

/** Collapsed state for one screen, remembered in this browser. */
export function useIntroCollapsed(key: string, enabled: boolean, initial = false): [boolean, (v: boolean) => void] {
  const [collapsed, setCollapsed] = useState(false);
  useIsoLayoutEffect(() => {
    if (!enabled) return;
    const stored = readCollapsed()[key];
    setCollapsed(stored === undefined ? initial : stored);
  }, [key, enabled, initial]);
  const set = (v: boolean) => {
    setCollapsed(v);
    if (enabled) writeCollapsed(key, v);
  };
  return [enabled && collapsed, set];
}

export function PageIntro({
  eyebrow,
  title,
  what,
  how,
  why,
  order = "what-how-why",
  labels,
  hideLabels = false,
  actions,
  illustration,
  tutorialId,
  tutorialStep,
  tutorialLabel = "Watch how it works",
  compact = false,
  storageKey,
  defaultCollapsed = false,
  headingLevel = 1,
  id,
  className,
}: PageIntroProps) {
  const pathname = usePathname() ?? "";
  const tutorial = useTutorialOptional();
  const uid = useId();
  const titleId = `${uid}-title`;
  const bodyId = `${uid}-body`;
  const [collapsed, setCollapsed] = useIntroCollapsed(storageKey ?? (pathname || "page"), compact, defaultCollapsed);
  const L = { ...DEFAULT_LABELS, ...labels };
  const H = headingLevel === 2 ? "h2" : "h1";
  const P = headingLevel === 2 ? "h3" : "h2";

  if (process.env.NODE_ENV !== "production" && (how.length < 2 || how.length > 5)) {
    console.warn(`PageIntro: "how" should have 2 to 5 steps, got ${how.length}.`);
  }

  const parts: Record<PageIntroPart, ReactNode> = {
    what: <p className={s.text}>{what}</p>,
    why: <p className={s.text}>{why}</p>,
    how: (
      <ol className={s.steps}>
        {how.map((stepText, i) => (
          <li key={i} className={s.step}>
            <span className={s.num} aria-hidden="true">
              {i + 1}
            </span>
            <span className={s.stepText}>{stepText}</span>
          </li>
        ))}
      </ol>
    ),
  };

  const watch =
    tutorialId && tutorial ? (
      <button type="button" className={s.watch} onClick={() => void tutorial.start(tutorialId, tutorialStep ? { stepId: tutorialStep } : undefined)}>
        <svg className={s.watchIcon} width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10 8.5v7l5.5-3.5z" fill="currentColor" />
        </svg>
        {tutorialLabel}
      </button>
    ) : null;

  let i = 0;
  return (
    <Stagger>
      <section
        id={id}
        aria-labelledby={titleId}
        className={cx(s.intro, compact ? s.compact : s.full, illustration ? s.withArt : undefined, collapsed && s.collapsed, className)}
        data-order={order}
      >
        <div className={s.main}>
          <div className={s.head}>
            <div className={s.headText}>
              {eyebrow && (
                <StaggerItem index={i++}>
                  <p className={s.eyebrow}>{eyebrow}</p>
                </StaggerItem>
              )}
              <StaggerItem index={i++}>
                <H id={titleId} className={s.title}>
                  {title}
                </H>
              </StaggerItem>
            </div>
            {compact && (
              <button
                type="button"
                className={s.toggle}
                aria-expanded={!collapsed}
                aria-controls={bodyId}
                onClick={() => setCollapsed(!collapsed)}
              >
                <svg className={s.chevron} width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {collapsed ? "Show intro" : "Hide intro"}
              </button>
            )}
          </div>

          <div id={bodyId} className={s.body} hidden={collapsed}>
            <div className={s.parts}>
              {ORDERS[order].map((part) => (
                <StaggerItem key={part} index={i++} className={cx(s.part, s[`part_${part}`])}>
                  <P className={cx(s.label, hideLabels && s.srOnly)}>{L[part]}</P>
                  {parts[part]}
                </StaggerItem>
              ))}
            </div>
            {(actions || watch) && (
              <StaggerItem index={i++} className={s.actions}>
                {actions}
                {watch}
              </StaggerItem>
            )}
          </div>
        </div>
        {illustration && !collapsed && (
          <StaggerItem index={2} className={s.art}>
            {illustration}
          </StaggerItem>
        )}
      </section>
    </Stagger>
  );
}

export default PageIntro;
