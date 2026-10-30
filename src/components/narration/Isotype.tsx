import type { CSSProperties } from "react";
import { introVars } from "@/lib/narration/intro";
import s from "./Narrator.module.scss";

/**
 * The narrator's isotype: a play triangle (rounded joins) with two sound arcs
 * to its right: press play and a voice speaks. Stroke-based, currentColor.
 * The group is placed by its optical centre, between the centre of its
 * bounding box (x 28.7) and the centre of its ink (x 25.9, the triangle
 * carries most of the strokes): x 27 moved to 24, y 21 to 24, so the mark
 * sits centred in the round button at 46px and in the small button at 24px.
 * (A small chevron under the triangle, for "the page moves", was dropped:
 * the mark reads better as one shape.)
 *
 * `animated` (the overlay button): the arcs pulse outward in turn; nothing
 * moves with reduced motion. `white` is the copy that fades in over the
 * blue one, part by part, in the start sequence (lib/narration/intro.ts).
 */
export default function Isotype({ size = 44, animated = false, white = false }: { size?: number; animated?: boolean; white?: boolean }) {
  const cls = [s.iso, animated && s.isoAnimated, white && s.isoWhite].filter(Boolean).join(" ");
  const part = (id: "tri" | "arc1" | "arc2") => (white ? (introVars(id) as CSSProperties) : undefined);
  return (
    <svg
      className={cls}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={size < 32 ? 3 : 2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <g transform="translate(-3 3)">
        <path className={s.isoTri} style={part("tri")} d="M15 11 L31 21 L15 31 Z" />
        <path className={s.isoArc1} style={part("arc1")} d="M35 17.4 A5 5 0 0 1 35 24.6" />
        <path className={s.isoArc2} style={part("arc2")} d="M39 13.8 A9.5 9.5 0 0 1 39 28.2" />
      </g>
    </svg>
  );
}
