"use client";

import { Reveal, RevealTitle } from "@/components/motion/Motion";
import s from "./GutenbergList.module.scss";

export interface GutenbergItem {
  kicker?: string;
  title: string;
  body: string;
}

/**
 * Gutenberg-diagram list: each block takes the side opposite the block before
 * it (start -> end -> start ...) and enters from that side, so reading flows
 * on a zig-zag down the page instead of a flat column. `rhythm="stair"` steps
 * blocks progressively inward instead of alternating.
 */
export default function GutenbergList({
  items,
  rhythm = "zigzag",
  tone = "light",
}: {
  items: GutenbergItem[];
  rhythm?: "zigzag" | "stair";
  tone?: "light" | "dark";
}) {
  return (
    <ol className={`${s.list} ${tone === "dark" ? s.dark : ""}`}>
      {items.map((item, i) => {
        const side = rhythm === "zigzag" ? (i % 2 === 0 ? "start" : "end") : "stair";
        const style =
          rhythm === "stair"
            ? ({ "--step": `${Math.min(i, 3) * 12}%` } as React.CSSProperties)
            : undefined;
        return (
          <li key={item.title} className={`${s.row} ${s[side]}`} style={style}>
            <Reveal className={s.block} from={side === "end" ? "right" : "left"}>
              <span className={s.index}>{item.kicker ?? String(i + 1).padStart(2, "0")}</span>
              <RevealTitle as="h3" text={item.title} className={s.title} />
              <p className={s.body}>{item.body}</p>
            </Reveal>
          </li>
        );
      })}
    </ol>
  );
}