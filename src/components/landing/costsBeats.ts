/**
 * Layout constants and link targets for "What a missed date can cost you"
 * (CostsStory.tsx). Plain math, so tests/homepage.test.mjs can check it.
 */
import { beatAnchorProgress, beatRanges, zigzag, type BeatRange, type ZigzagSlot } from "@/components/motion/storyMath";
import { COSTS, COSTS_HEAD } from "./content";

/** Height of the pinned track on wide screens. Kept in step with $costs-track-vh in CostsStory.module.scss. */
export const COSTS_TRACK_VH = 320;

/** Progress 0 when the track's top is 35% down the viewport, so the first beat plays in as the stage pins. */
export const COSTS_START_AT = 0.35;

/**
 * Enter, hold and exit windows of the three beats, with an empty gap between
 * one beat's exit and the next one's enter; the last one holds to the end.
 */
export const COSTS_RANGES: BeatRange[] = beatRanges(COSTS.length);

/**
 * Gutenberg Z per beat: Fines text top left with its picture bottom right,
 * Doubt text top right with its picture bottom left, Retelling as Fines.
 * Tablets use the same sides for their alternating rows.
 */
export const COSTS_ZIGZAG: ZigzagSlot[] = zigzag(COSTS.length);

/** Fragment id of beat i (0-based): "costs-fines", "costs-doubt", "costs-retelling". */
export const costAnchorId = (i: number) => `${COSTS_HEAD.anchor}-${COSTS[i].id}`;

/** The progress a link to beat i lands on (late in its hold, the body read). */
export const costAnchorProgress = (i: number) => beatAnchorProgress(COSTS_RANGES[i]);

/** The beat a URL hash points at, or null ("#costs-doubt" → 1). */
export function parseCostHash(hash: string): number | null {
  const id = hash.replace(/^#/, "");
  const i = COSTS.findIndex((_, k) => costAnchorId(k) === id);
  return i >= 0 ? i : null;
}

/* The Fines picture: three dates on a strip that slides left past a fixed
 * "today" marker. Positions are shares of the strip (twice the frame wide);
 * the strip travels FINES_SHIFT of its own width over the beat's timeline. */
export const FINES_TODAY = 0.45; // marker, share of the frame
export const FINES_AT = [0.25, 0.45, 0.65]; // date centres, share of the strip
export const FINES_SHIFT = 0.5; // strip travel, share of the strip

/** Timeline point (0..1) at which date i reaches the today marker. */
export function finesCross(i: number): number {
  const frameAt = FINES_AT[i] * 2; // strip is 2 frames wide
  return Math.round(((frameAt - FINES_TODAY) / 2 / FINES_SHIFT) * 1000) / 1000;
}
