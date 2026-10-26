import type { ReactNode } from "react";
import { cx } from "./cx";
import type { StatusTone } from "./StatusPill";
import s from "./Timeline.module.scss";

export interface TimelineItem {
  id: string;
  title: ReactNode;
  /** ISO timestamp; rendered as a short local date + time. */
  at?: string;
  /** Who did it, e.g. "Mariela Solís (CSM)" or "ILP assistant (AI)". */
  actor?: string;
  body?: ReactNode;
  /** Optional right-hand slot, e.g. a StatusPill. */
  meta?: ReactNode;
  tone?: StatusTone;
}

export interface TimelineProps {
  items: TimelineItem[];
  /** Newest first by default; set false for oldest first (stage history). */
  newestFirst?: boolean;
  emptyLabel?: string;
  className?: string;
  /** Override date formatting. */
  formatAt?: (iso: string) => string;
}

const FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function defaultFormat(iso: string): string {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? iso : FMT.format(t);
}

/** Vertical activity timeline: hairline rail, labeled entries. */
export function Timeline({
  items,
  newestFirst = true,
  emptyLabel = "No activity yet.",
  className,
  formatAt = defaultFormat,
}: TimelineProps) {
  if (!items.length) return <p className={s.empty}>{emptyLabel}</p>;
  const sorted = [...items].sort((a, b) => {
    const ta = a.at ? Date.parse(a.at) : 0;
    const tb = b.at ? Date.parse(b.at) : 0;
    return newestFirst ? tb - ta : ta - tb;
  });
  return (
    <ol className={cx(s.list, className)}>
      {sorted.map((item) => (
        <li key={item.id} className={cx(s.item, s[item.tone ?? "neutral"])}>
          <span className={s.marker} aria-hidden="true" />
          <div className={s.content}>
            <div className={s.head}>
              <span className={s.title}>{item.title}</span>
              {item.meta}
            </div>
            {(item.at || item.actor) && (
              <span className={s.sub}>
                {item.at && <time dateTime={item.at}>{formatAt(item.at)}</time>}
                {item.at && item.actor && " · "}
                {item.actor}
              </span>
            )}
            {item.body && <div className={s.body}>{item.body}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}

export default Timeline;
