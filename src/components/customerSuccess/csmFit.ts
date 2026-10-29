/**
 * Natural sizes of the pictures on /customer-success, on the same sizing
 * model as /attorneys (lawyers/visualFit.ts): each picture is laid out at its
 * natural size with type at 100% and scaled to one shared box,
 * k = min(boxW / naturalW, boxH / naturalH). The boxes, the stage and the
 * box CSS are the lawyers' (BeatStory.module.scss, LawyersStory.module.scss),
 * so both landings draw their screens at the same size.
 * tests/csmLanding.test.mjs checks every picture at the desktop sizes we
 * design for: inside its columns and the pinned stage, never under 12px text.
 *
 * Content that would be too tall at a readable scale is cut down in the
 * screen (csmScreens.ts, visualData.ts), never drawn smaller.
 */
import type { Size } from "@/components/lawyers/visualFit";

export { MIN_SCALE, MIN_TEXT_PX, MIN_RENDERED_TEXT_PX, SCREEN_BOX, WHY_BOX, STAGE, beatsRowPx, captionPx, fitScale, screenBox, spanPx, whyBox, whyDropPx } from "@/components/lawyers/visualFit";
export type { Size } from "@/components/lawyers/visualFit";

/** The four example CSM portal screens, step order: all at the anchor size (4:3). */
export const CSM_SCREEN_SIZES: readonly Size[] = [
  { w: 500, h: 375 },
  { w: 500, h: 375 },
  { w: 500, h: 375 },
  { w: 500, h: 375 },
];

/** The three "Why the role matters" pictures (members, between calls, your part). */
export const CSM_WHY_SIZES: readonly Size[] = [
  { w: 380, h: 330 },
  { w: 380, h: 345 },
  { w: 380, h: 355 },
];
