import s from "./Narrator.module.scss";

/**
 * The narrator's isotype: a play triangle (rounded joins) with two sound arcs
 * to its right and a small chevron under it. Read together: press play, a
 * voice speaks, the page moves down. Stroke-based, currentColor (the
 * accent). Chosen over two drafts: a vertical track with a dot under the
 * triangle read as a keyhole at small sizes, and a double chevron made the
 * glyph busy; one chevron keeps it a single, quiet mark.
 *
 * `animated` (the overlay button): the arcs pulse outward in turn and the
 * chevron drifts down and back; nothing moves with reduced motion. The
 * small "Play narration" button uses it still.
 */
export default function Isotype({ size = 44, animated = false }: { size?: number; animated?: boolean }) {
  return (
    <svg
      className={animated ? `${s.iso} ${s.isoAnimated}` : s.iso}
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
      <g transform="translate(-4 -2.5)">
        <path d="M15 11 L31 21 L15 31 Z" />
        <path className={s.isoArc1} d="M35 17.4 A5 5 0 0 1 35 24.6" />
        <path className={s.isoArc2} d="M39 13.8 A9.5 9.5 0 0 1 39 28.2" />
        <path className={s.isoChevron} d="M18 37.5 L21.5 40.5 L25 37.5" />
      </g>
    </svg>
  );
}
