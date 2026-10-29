/**
 * Beat configs for the /attorneys scroll sections (LawyersStory.tsx): the
 * windows, Gutenberg Z sides, track heights and fragment ids. Plain data and
 * math, so tests/lawyersLanding.test.mjs can check the no-overlap invariant.
 */
import type { StoryBeat } from "@/components/motion/BeatStory";
import { beatRanges, zigzag, type BeatRange, type ZigzagSlot } from "@/components/motion/storyMath";
import { LAWYERS_HOW, LAWYERS_WHY } from "./content";

/** "Why lawyers join": three statements, one per sentence. */
export const WHY_BEATS: StoryBeat[] = LAWYERS_WHY.beats.map((b) => ({
  id: b.id,
  eyebrow: b.eyebrow,
  rail: b.rail,
  body: b.text,
  mark: b.mark,
  caption: b.caption,
}));

/** Fragment id of step i (0-based): "lawyers-step-1" … "-4". */
export const lawyerStepId = (i: number) => `lawyers-step-${i + 1}`;

/** "How it works for you": four steps, title then body, each with an example screen. */
export const HOW_BEATS: StoryBeat[] = LAWYERS_HOW.steps.map((st, i, all) => ({
  id: lawyerStepId(i),
  eyebrow: `Step ${i + 1} of ${all.length}`,
  rail: st.rail,
  title: st.title,
  titleMark: "titleMark" in st ? st.titleMark : undefined,
  body: st.body || undefined,
  mark: "mark" in st ? st.mark : undefined,
  caption: st.caption,
}));

/** Track heights (vh) of the pinned sections: about 110vh of scroll per beat. */
export const WHY_TRACK_VH = 330;
export const HOW_TRACK_VH = 440;

export const WHY_RANGES: BeatRange[] = beatRanges(WHY_BEATS.length);
export const HOW_RANGES: BeatRange[] = beatRanges(HOW_BEATS.length);

export const WHY_SLOTS: ZigzagSlot[] = zigzag(WHY_BEATS.length);
export const HOW_SLOTS: ZigzagSlot[] = zigzag(HOW_BEATS.length);
