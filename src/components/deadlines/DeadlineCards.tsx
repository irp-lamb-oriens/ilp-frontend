"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button, IconChevronLeft, IconChevronRight, ProgressBar, StatusPill, cx } from "@/components/ui";
import { AREA_LABELS, cardDateLine, cardTitle, type DeadlineCardItem, groupByArea } from "@/lib/deadlines";
import { AreaIcon } from "./AreaIcon";
import s from "./DeadlineCards.module.scss";

export interface DeadlineCardsProps {
  items: DeadlineCardItem[];
  selected: ReadonlySet<string>;
  onChange: (next: Set<string>) => void;
  /** Area headings: h2 on a page, h3 inside a section or a drawer. */
  headingLevel?: 2 | 3;
  /** The selection bar: "sticky" at the bottom of the page, "shell" above the member app's phone tab bar, "none" when the caller shows its own. */
  bar?: "sticky" | "shell" | "none";
  actionLabel?: string;
  onAction?: () => void;
  actionBusy?: boolean;
  actionDisabled?: boolean;
  /** Shown in the bar beside the count, e.g. a second action. */
  barExtra?: ReactNode;
  /** One line above the cards. */
  intro?: ReactNode;
  /** Words for the count: ["item", "items"]. */
  noun?: [string, string];
}

type Mode = "all" | "steps";
const EASE = [0.23, 1, 0.32, 1] as const;

/**
 * DEADLINES: deadline cards people include or skip.
 *
 * - Grouped by area, each with "Include all" and "Skip all".
 * - Desktop: a gallery grid. Phones: one swipeable row per area with
 *   scroll-snap, previous and next buttons, position dots and "3 of 8".
 * - "Review one by one": a single card at a time; Include or Skip moves on.
 * - The whole card toggles on click; on a focused card Space toggles and the
 *   arrow keys move between cards.
 * - Motion is transform and opacity only; reduced motion keeps the fades.
 */
export function DeadlineCards({
  items,
  selected,
  onChange,
  headingLevel = 2,
  bar = "sticky",
  actionLabel,
  onAction,
  actionBusy,
  actionDisabled,
  barExtra,
  intro,
  noun = ["item", "items"],
}: DeadlineCardsProps) {
  const [mode, setMode] = useState<Mode>("all");
  const rootRef = useRef<HTMLDivElement>(null);
  const groups = useMemo(() => groupByArea(items), [items]);
  const ordered = useMemo(() => groups.flatMap(([, list]) => list), [groups]);
  const count = items.filter((i) => selected.has(i.id)).length;

  const set = useCallback(
    (ids: string[], on: boolean) => {
      const next = new Set(selected);
      for (const id of ids) {
        if (on) next.add(id);
        else next.delete(id);
      }
      onChange(next);
    },
    [selected, onChange],
  );
  const toggle = useCallback((id: string) => set([id], !selected.has(id)), [set, selected]);

  /** Arrow keys: move focus to the previous or next card anywhere in the list. */
  const moveFocus = useCallback((from: HTMLElement, dir: 1 | -1) => {
    const cards = Array.from(rootRef.current?.querySelectorAll<HTMLElement>("[data-deadline-card]") ?? []);
    const i = cards.indexOf(from);
    const next = cards[i + dir];
    if (!next) return;
    next.focus({ preventScroll: true });
    next.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, []);

  const H = headingLevel === 2 ? "h2" : "h3";
  const countText = `${count} ${count === 1 ? noun[0] : noun[1]} selected`;

  return (
    <div className={s.root} ref={rootRef}>
      <div className={s.head}>
        {intro && <p className={s.intro}>{intro}</p>}
        <div className={s.modes} role="group" aria-label="How to show the cards">
          <button type="button" className={cx(s.mode, mode === "all" && s.modeOn)} aria-pressed={mode === "all"} onClick={() => setMode("all")}>
            All cards
          </button>
          <button type="button" className={cx(s.mode, mode === "steps" && s.modeOn)} aria-pressed={mode === "steps"} onClick={() => setMode("steps")}>
            Review one by one
          </button>
        </div>
      </div>

      {mode === "all" ? (
        groups.map(([area, list]) => (
          <AreaRow
            key={area}
            area={area}
            items={list}
            selected={selected}
            H={H}
            onToggle={toggle}
            onSet={set}
            onMove={moveFocus}
          />
        ))
      ) : (
        <StepReview items={ordered} selected={selected} onSet={set} onDone={() => setMode("all")} />
      )}

      {bar !== "none" && (
        <div className={cx(s.bar, bar === "shell" && s.barShell)}>
          <p className={s.count} aria-live="polite">
            {countText}
          </p>
          <div className={s.barActions}>
            {barExtra}
            {actionLabel && onAction && (
              <Button onClick={onAction} busy={actionBusy} disabled={actionDisabled ?? count === 0}>
                {actionLabel}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── One area: heading, bulk actions, gallery or carousel ─────────────────

function AreaRow({
  area,
  items,
  selected,
  H,
  onToggle,
  onSet,
  onMove,
}: {
  area: string;
  items: DeadlineCardItem[];
  selected: ReadonlySet<string>;
  H: "h2" | "h3";
  onToggle: (id: string) => void;
  onSet: (ids: string[], on: boolean) => void;
  onMove: (from: HTMLElement, dir: 1 | -1) => void;
}) {
  const headId = useId();
  const trackRef = useRef<HTMLUListElement>(null);
  const [pos, setPos] = useState(0);
  const reduce = useReducedMotion();
  const ids = items.map((i) => i.id);
  const on = items.filter((i) => selected.has(i.id)).length;
  const label = AREA_LABELS[area] ?? area;

  // Phones: which card of the swipeable row is in view.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const first = el.firstElementChild as HTMLElement | null;
        if (!first) return;
        const step = first.offsetWidth + parseFloat(getComputedStyle(el).columnGap || "0");
        setPos(Math.max(0, Math.min(items.length - 1, Math.round(el.scrollLeft / (step || 1)))));
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", onScroll);
    };
  }, [items.length]);

  const go = (i: number) => {
    const el = trackRef.current;
    const card = el?.children[i] as HTMLElement | undefined;
    if (!el || !card) return;
    el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <section className={s.area} aria-labelledby={headId}>
      <div className={s.areaHead}>
        <H className={s.areaTitle} id={headId}>
          <AreaIcon area={area} className={s.areaIcon} />
          {label}
          <span className={s.areaCount}>
            {on} of {items.length} included
          </span>
        </H>
        <div className={s.bulk}>
          <Button size="sm" variant="ghost" onClick={() => onSet(ids, true)} disabled={on === items.length} aria-label={`Include all in ${label}`}>
            Include all
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onSet(ids, false)} disabled={on === 0} aria-label={`Skip all in ${label}`}>
            Skip all
          </Button>
        </div>
      </div>
      <ul className={s.track} ref={trackRef} aria-label={`${label}: ${items.length} ${items.length === 1 ? "card" : "cards"}`}>
        {items.map((item, i) => (
          <li key={item.id} className={s.slide} aria-roledescription="card" aria-label={`${i + 1} of ${items.length}`}>
            <DeadlineCard item={item} on={selected.has(item.id)} onToggle={() => onToggle(item.id)} onSet={(v) => onSet([item.id], v)} onMove={onMove} />
          </li>
        ))}
      </ul>
      {items.length > 1 && (
        <div className={s.controls}>
          <button type="button" className={s.nav} onClick={() => go(pos - 1)} disabled={pos === 0} aria-label={`Previous card in ${label}`}>
            <IconChevronLeft />
          </button>
          <div className={s.dots}>
            {items.map((item, i) => (
              <button
                key={item.id}
                type="button"
                className={cx(s.dot, i === pos && s.dotOn, selected.has(item.id) && s.dotIncluded)}
                aria-label={`Card ${i + 1} of ${items.length}${selected.has(item.id) ? ", included" : ""}`}
                aria-current={i === pos ? "true" : undefined}
                onClick={() => go(i)}
              />
            ))}
          </div>
          <span className={s.position} aria-live="polite">
            {pos + 1} of {items.length}
          </span>
          <button type="button" className={s.nav} onClick={() => go(pos + 1)} disabled={pos >= items.length - 1} aria-label={`Next card in ${label}`}>
            <IconChevronRight />
          </button>
        </div>
      )}
    </section>
  );
}

// ─── One card ──────────────────────────────────────────────────────────────

export function DeadlineCard({
  item,
  on,
  onToggle,
  onSet,
  onMove,
  headingLevel = 3,
}: {
  item: DeadlineCardItem;
  on: boolean;
  onToggle: () => void;
  onSet: (on: boolean) => void;
  onMove?: (from: HTMLElement, dir: 1 | -1) => void;
  headingLevel?: 3 | 4;
}) {
  const titleId = useId();
  const stateId = useId();
  const meaningId = useId();
  const [open, setOpen] = useState(false);
  const low = item.confidence === "low";
  const title = cardTitle(item.title);
  const T = headingLevel === 3 ? "h3" : "h4";

  // A click anywhere on the card toggles it, except on its own buttons and links.
  const onClick = (e: MouseEvent<HTMLElement>) => {
    if ((e.target as HTMLElement).closest("button, a")) return;
    onToggle();
  };
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onToggle();
    } else if (onMove && (e.key === "ArrowRight" || e.key === "ArrowDown")) {
      e.preventDefault();
      onMove(e.currentTarget, 1);
    } else if (onMove && (e.key === "ArrowLeft" || e.key === "ArrowUp")) {
      e.preventDefault();
      onMove(e.currentTarget, -1);
    }
  };

  return (
    <article
      className={cx(s.card, on && s.cardOn, low && s.cardLow)}
      data-deadline-card=""
      tabIndex={0}
      aria-labelledby={titleId}
      aria-describedby={stateId}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      <div className={s.cardTop}>
        <span className={s.icon}>
          <AreaIcon area={item.area} />
        </span>
        <span className={cx(s.date, !item.dueAt && s.dateNone)}>{cardDateLine(item)}</span>
      </div>
      <T className={s.title} id={titleId}>
        {title}
      </T>
      <div className={s.pills}>
        <StatusPill label="May require review" size="sm" tone={low ? "warning" : "neutral"} />
        {item.matches && <StatusPill label="Matches your answers" size="sm" tone="info" />}
      </div>
      {item.meaning && (
        <div className={s.meaningWrap}>
          <button type="button" className={s.more} aria-expanded={open} aria-controls={meaningId} onClick={() => setOpen((v) => !v)}>
            What this usually means
          </button>
          <p className={s.meaning} id={meaningId} data-open={open ? "true" : undefined}>
            <span className={s.meaningLabel}>What this usually means:</span> {item.meaning}
          </p>
        </div>
      )}
      {!item.dueAt && item.dueText && (
        <p className={s.when}>
          <span className={s.whenLabel}>When:</span> {item.dueText}
        </p>
      )}
      {item.authority && <p className={s.authority}>Source: {item.authority}</p>}
      <div className={s.choice} role="group" aria-label={`Include or skip: ${title}`}>
        <button type="button" className={cx(s.choiceBtn, on && s.choiceInclude)} aria-pressed={on} onClick={() => onSet(true)}>
          Include
        </button>
        <button type="button" className={cx(s.choiceBtn, !on && s.choiceSkip)} aria-pressed={!on} onClick={() => onSet(false)}>
          Skip
        </button>
      </div>
      <span id={stateId} className={s.sr}>
        {on ? "Included. Press Space to skip it." : "Skipped. Press Space to include it."}
      </span>
    </article>
  );
}

// ─── Review one by one ─────────────────────────────────────────────────────

function StepReview({
  items,
  selected,
  onSet,
  onDone,
}: {
  items: DeadlineCardItem[];
  selected: ReadonlySet<string>;
  onSet: (ids: string[], on: boolean) => void;
  onDone: () => void;
}) {
  const [i, setI] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const reduce = useReducedMotion();
  const headRef = useRef<HTMLParagraphElement>(null);
  const finished = i >= items.length;
  const item = items[Math.min(i, items.length - 1)];
  const included = items.filter((x) => selected.has(x.id)).length;

  useEffect(() => {
    headRef.current?.focus({ preventScroll: true });
  }, [i]);

  const decide = (on: boolean) => {
    if (!item) return;
    onSet([item.id], on);
    setDir(1);
    setI((n) => n + 1);
  };
  const back = () => {
    setDir(-1);
    setI((n) => Math.max(0, n - 1));
  };

  const motionProps = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.15 } }
    : {
      initial: { opacity: 0, x: 24 * dir },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -24 * dir },
      transition: { duration: 0.22, ease: EASE },
    };

  if (!items.length) return null;

  return (
    <section className={s.steps} aria-label="Review one by one">
      <ProgressBar
        label={finished ? "All cards reviewed" : `Card ${i + 1} of ${items.length}`}
        value={Math.min(i, items.length)}
        max={items.length}
        valueText={`${included} included`}
      />
      <p className={s.sr} ref={headRef} tabIndex={-1} aria-live="polite">
        {finished ? `You reviewed all ${items.length} cards. ${included} included.` : `Card ${i + 1} of ${items.length}: ${cardTitle(item.title)}`}
      </p>
      <div className={s.stepStage}>
        <AnimatePresence mode="wait" initial={false}>
          {finished ? (
            <motion.div key="done" className={s.stepDone} {...motionProps}>
              <p className={s.stepDoneTitle}>
                You reviewed all {items.length} cards. {included} {included === 1 ? "is" : "are"} included.
              </p>
              <div className={s.stepButtons}>
                <Button variant="secondary" onClick={back}>
                  Back to the last card
                </Button>
                <Button onClick={onDone}>See all cards</Button>
              </div>
            </motion.div>
          ) : (
            <motion.div key={item.id} {...motionProps}>
              <DeadlineCard
                item={item}
                on={selected.has(item.id)}
                onToggle={() => onSet([item.id], !selected.has(item.id))}
                onSet={(v) => decide(v)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {!finished && (
        <div className={s.stepButtons}>
          <Button variant="ghost" onClick={back} disabled={i === 0}>
            Back
          </Button>
          <Button variant="secondary" onClick={() => decide(false)}>
            Skip
          </Button>
          <Button onClick={() => decide(true)}>Include</Button>
        </div>
      )}
    </section>
  );
}

export default DeadlineCards;
