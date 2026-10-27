"use client";

/**
 * Notice: the one component for every prerequisite, warning, disclaimer,
 * alert and banner in the three portals (see docs/workstreams/NOTICES.md).
 *
 * Look: no fill, a 1px dashed border and an outline icon in the tone color;
 * the text stays the normal text color. Every notice can carry a "How to fix
 * this" panel: plain numbered steps for a beginner, glossary meanings for the
 * words it uses, and "Show me", which plays the matching tutorial step or a
 * one-off mock scene in the tutorial modal.
 *
 * Warning and danger notices must say how to resolve them: the types require
 * `fix` for those tones, and tests/notices.test.mjs checks every call site.
 */
import Link from "next/link";
import { createElement, useEffect, useId, useState, type ReactNode } from "react";
import { useTutorialOptional } from "../tutorial/context";
import type { Scene } from "../tutorial/types";
import type { GlossaryEntry, TermKey } from "../../tutorials/glossary";
import { cx } from "./cx";
import { IconChevronDown, IconClose, IconDanger, IconInfo, IconNote, IconSuccess, IconWarning } from "./icons";
import s from "./Notice.module.scss";

export type NoticeTone = "info" | "success" | "warning" | "danger" | "neutral";
export type NoticeVariant = "block" | "inline" | "banner";
export type NoticeHeading = 1 | 2 | 3 | 4 | 5 | 6 | "none";

export interface NoticeFix {
  /** One sentence above the steps ("This takes about a minute."). */
  summary?: string;
  /** Plain numbered steps, written for someone new to the screen. */
  steps: string[];
  /** Tutorial to open from "Show me" (e.g. "lawyer.availability"). */
  tutorialId?: string;
  /** Step id inside that tutorial (e.g. "weekly"). */
  tutorialStep?: string;
  /**
   * Or a one-off mock scene to play instead of a tutorial. Pass a loader
   * (`() => import("@/tutorials/noticeScenes").then((m) => m.x)`) so the
   * scene code loads only when someone presses "Show me".
   */
  scene?: Scene | (() => Promise<Scene>);
  learnMoreHref?: string;
  learnMoreLabel?: string;
  /** Disclosure label. Default: "What does this mean?" for neutral, else "How to fix this". */
  label?: string;
}

interface NoticeBase {
  title: ReactNode;
  /** The message. Optional for one-line notices whose title says it all. */
  children?: ReactNode;
  variant?: NoticeVariant;
  /** Heading level of the title. Default 3 (block, banner) or "none" (inline). */
  headingLevel?: NoticeHeading;
  /** Stable key; with `dismissible` the dismissal is remembered in this browser. */
  id?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  /** Direct fix first (Button / ButtonLink), then secondary actions. */
  actions?: ReactNode;
  /** Glossary keys the message uses; meanings show in the fix panel. */
  terms?: TermKey[];
  /** Danger only: announce immediately (role="alert"). Use for failures the person just caused. */
  urgent?: boolean;
  /** Override the computed ARIA role. */
  role?: "status" | "alert" | "note" | "region" | "none";
  className?: string;
  "data-tour"?: string;
}

/** Warning and danger must explain how to resolve them. */
export type NoticeProps = NoticeBase &
  ({ tone: "warning" | "danger"; fix: NoticeFix } | { tone?: "info" | "success" | "neutral"; fix?: NoticeFix });

const ICON: Record<NoticeTone, (p: { className?: string }) => ReactNode> = {
  info: IconInfo,
  success: IconSuccess,
  warning: IconWarning,
  danger: IconDanger,
  neutral: IconNote,
};

/** Spoken before the title so tone never relies on color. */
const TONE_WORD: Record<NoticeTone, string> = {
  info: "Note",
  success: "Done",
  warning: "Warning",
  danger: "Problem",
  neutral: "Notice",
};

const STORE_KEY = "ilp_notices_dismissed";

function readDismissed(): string[] {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    const v = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function remember(id: string) {
  try {
    const cur = readDismissed();
    if (!cur.includes(id)) window.localStorage.setItem(STORE_KEY, JSON.stringify([...cur, id].slice(-200)));
  } catch {
    // storage blocked: the notice stays hidden for this page view only
  }
}

/** Forget remembered dismissals (one id, or all). For the gallery and settings. */
export function resetNoticeDismissals(id?: string) {
  try {
    if (!id) window.localStorage.removeItem(STORE_KEY);
    else window.localStorage.setItem(STORE_KEY, JSON.stringify(readDismissed().filter((x) => x !== id)));
  } catch {
    // nothing stored
  }
}

function roleFor(tone: NoticeTone, urgent: boolean | undefined): NoticeBase["role"] {
  if (tone === "danger" && urgent) return "alert";
  if (tone === "neutral") return "note";
  return "status";
}

type Meaning = { key: string; word: string; meaning: string };

export function Notice(props: NoticeProps) {
  const {
    tone = "info",
    title,
    children,
    variant = "block",
    headingLevel,
    id,
    dismissible = false,
    onDismiss,
    actions,
    fix,
    terms,
    urgent,
    role,
    className,
  } = props;
  const uid = useId();
  const titleId = `${uid}-title`;
  const panelId = `${uid}-fix`;
  const tutorial = useTutorialOptional();
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [meanings, setMeanings] = useState<Meaning[] | null>(null);

  // Remembered dismissals are read after mount (no storage on the server).
  useEffect(() => {
    if (dismissible && id && readDismissed().includes(id)) setHidden(true);
  }, [dismissible, id]);

  // Glossary loads only when the panel first opens.
  useEffect(() => {
    if (!open || !terms?.length || meanings) return;
    let off = false;
    void import("../../tutorials/glossary").then(({ GLOSSARY }) => {
      if (off) return;
      const table = GLOSSARY as Record<string, GlossaryEntry>;
      setMeanings(terms.filter((k) => table[k]).map((k) => ({ key: k, word: table[k].word, meaning: table[k].meaning })));
    });
    return () => {
      off = true;
    };
  }, [open, terms, meanings]);

  if (hidden) return null;

  const level = headingLevel ?? (variant === "inline" ? "none" : 3);
  const Icon = ICON[tone];
  const canShow = !!tutorial && !!fix && (!!fix.tutorialId || !!fix.scene);
  const label = fix?.label ?? (tone === "neutral" ? "What does this mean?" : "How to fix this");
  const titleText = typeof title === "string" ? title : undefined;
  const computedRole = role ?? roleFor(tone, urgent);

  function dismiss() {
    if (id) remember(id);
    setHidden(true);
    onDismiss?.();
  }

  function showMe() {
    if (!tutorial || !fix) return;
    if (fix.tutorialId) void tutorial.start(fix.tutorialId, { stepId: fix.tutorialStep });
    else if (fix.scene) {
      const t = titleText ?? "How to fix this";
      const sc = fix.scene;
      if (typeof sc === "function") void sc().then((x) => tutorial.startScene(x, t, fix.summary ?? ""));
      else tutorial.startScene(sc, t, fix.summary ?? "");
    }
  }

  const heading = createElement(
    level === "none" ? "p" : (`h${level}` as const),
    { id: titleId, className: s.title },
    <span className={s.sr}>{TONE_WORD[tone]}: </span>,
    title,
  );

  return (
    <section
      className={cx(s.notice, s[tone], s[variant], className)}
      role={computedRole === "none" ? undefined : computedRole}
      aria-labelledby={titleId}
      data-notice-id={id}
      data-tour={props["data-tour"]}
    >
      <span className={s.icon} aria-hidden="true">
        <Icon />
      </span>
      <div className={s.main}>
        {heading}
        {children && <div className={s.body}>{children}</div>}
        {(actions || fix) && (
          <div className={s.actions}>
            {actions}
            {fix && (
              <button
                type="button"
                className={s.toggle}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpen((v) => !v)}
              >
                <span>{label}</span>
                <IconChevronDown className={cx(s.chev, open && s.chevOpen)} />
              </button>
            )}
          </div>
        )}
        {fix && (
          <div id={panelId} className={s.fix} hidden={!open}>
            {fix.summary && <p className={s.summary}>{fix.summary}</p>}
            <ol className={s.steps}>
              {fix.steps.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ol>
            {meanings && meanings.length > 0 && (
              <dl className={s.terms} aria-label="What the words mean">
                {meanings.map((m) => (
                  <div key={m.key} className={s.term}>
                    <dt>{m.word}</dt>
                    <dd>{m.meaning}</dd>
                  </div>
                ))}
              </dl>
            )}
            {(canShow || fix.learnMoreHref) && (
              <div className={s.fixActions}>
                {canShow && (
                  <button type="button" className={s.showMe} onClick={showMe}>
                    Show me
                  </button>
                )}
                {fix.learnMoreHref && (
                  <Link className={s.more} href={fix.learnMoreHref}>
                    {fix.learnMoreLabel ?? "Learn more"}
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      {dismissible && (
        <button
          type="button"
          className={s.dismiss}
          onClick={dismiss}
          aria-label={titleText ? `Dismiss: ${titleText}` : "Dismiss this notice"}
        >
          <IconClose />
        </button>
      )}
    </section>
  );
}

export default Notice;
