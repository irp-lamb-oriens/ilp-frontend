/**
 * One sizing model for the pictures in the two pinned stories on /attorneys
 * ("Why lawyers join" and "How it works for you"). Plain data and math, so
 * tests/lawyersLanding.test.mjs can check every picture at the desktop sizes
 * we design for.
 *
 * Each picture has a natural size: the size its content is laid out at, with
 * type at 100%. The page draws it in a box and scales it to fit:
 *
 *   k = min(boxW / naturalW, boxH / naturalH)
 *
 * The box is the same for every picture of a story. For the example screens
 * it is anchored on step 2 (the hours screen): 4:3, as wide as its seven
 * columns allow, never taller than the room under the section head, and at
 * most SCREEN_BOX.maxPx wide. A screen with a smaller natural size draws
 * larger. The box CSS (LawyersStory.module.scss, BeatStory.module.scss)
 * repeats these numbers; the test checks they match.
 *
 * Content that would be too tall at a readable scale is cut down in the
 * screen (lawyerScreens.ts, visualData.ts), never drawn smaller.
 */

export interface Size {
  w: number;
  h: number;
}

/** The smallest text inside a picture, in px at natural size (labels, pills, chips). */
export const MIN_TEXT_PX = 12;
/** The smallest rendered size allowed for that text. */
export const MIN_RENDERED_TEXT_PX = 12;
/** So the scale may not drop below 1 at the sizes we design for. */
export const MIN_SCALE = MIN_RENDERED_TEXT_PX / MIN_TEXT_PX;

/** Natural sizes of the four example screens, step order. Step 1 is a little smaller, so it draws a little larger. */
export const SCREEN_SIZES: readonly Size[] = [
  { w: 480, h: 360 },
  { w: 500, h: 375 },
  { w: 500, h: 375 },
  { w: 500, h: 375 },
];

/** Natural sizes of the three "Why lawyers join" pictures (members, hours, member). */
export const WHY_SIZES: readonly Size[] = [
  { w: 380, h: 330 },
  { w: 380, h: 345 },
  { w: 380, h: 355 },
];

/** The example screens' box: 4:3, the height left after `reserveRem`, at most `maxPx` wide, in 7 of 12 columns. */
export const SCREEN_BOX = { aspect: 4 / 3, reserveRem: 20, maxPx: 600, span: 7 } as const;
/** The "Why" pictures' box: the natural aspect, at most `maxPx` wide, in 5 of 12 columns, under a top margin. */
export const WHY_BOX = { reserveRem: 20, maxPx: 440, span: 5 } as const;

/**
 * The pinned stage (BeatStory.module.scss, at 1024px and up): the site nav,
 * the stage padding, the head (heading and rail, the rail labels on two
 * lines at 1024px), the grid gap, and under the picture its caption (two
 * lines at most, checked) with a little room to spare.
 */
export const STAGE = {
  rootPx: 16,
  navPx: 64,
  padTopPx: 32,
  padBottomPx: 32,
  headPx: 90,
  headGapPx: 32,
  containerMaxPx: 1400,
  gutterPx: 32,
  columnGapPx: 32,
  captionGapPx: 12,
  captionLinePx: 21,
  captionCharPx: 7,
  captionLines: 2,
  sparePx: 16,
} as const;

/** Statement pictures sit lower than their text where there is height: clamp(0, 100vh - 45rem, 4rem). */
export const whyDropPx = (vh: number) => Math.min(4 * STAGE.rootPx, Math.max(0, vh - 45 * STAGE.rootPx));

/** Width of `span` of the 12 columns at viewport width vw. */
export function spanPx(vw: number, span: number): number {
  const inner = Math.min(vw, STAGE.containerMaxPx) - 2 * STAGE.gutterPx;
  const col = (inner - 11 * STAGE.columnGapPx) / 12;
  return span * col + (span - 1) * STAGE.columnGapPx;
}

/** Height of the row the beats sit in. */
export const beatsRowPx = (vh: number) => vh - STAGE.navPx - STAGE.padTopPx - STAGE.headPx - STAGE.headGapPx - STAGE.padBottomPx;

/** Height a caption takes under its picture at width w. */
export const captionPx = (caption: string, w: number) =>
  STAGE.captionGapPx + Math.ceil((caption.length * STAGE.captionCharPx) / w) * STAGE.captionLinePx;

/** The example screens' box at a viewport. */
export function screenBox(vw: number, vh: number): Size {
  const w = Math.min(spanPx(vw, SCREEN_BOX.span), (vh - SCREEN_BOX.reserveRem * STAGE.rootPx) * SCREEN_BOX.aspect, SCREEN_BOX.maxPx);
  return { w, h: w / SCREEN_BOX.aspect };
}

/** A "Why" picture's box at a viewport (its own aspect). */
export function whyBox(vw: number, vh: number, natural: Size): Size {
  const r = natural.w / natural.h;
  const w = Math.min(spanPx(vw, WHY_BOX.span), (vh - WHY_BOX.reserveRem * STAGE.rootPx - whyDropPx(vh)) * r, WHY_BOX.maxPx);
  return { w, h: w / r };
}

/** The scale that fits a natural size into a box. */
export const fitScale = (box: Size, natural: Size) => Math.min(box.w / natural.w, box.h / natural.h);
