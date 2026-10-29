/**
 * Narrator input rules (landing narrator). Plain functions, no DOM.
 * When the visitor scrolls the page themselves, the narrator pauses its
 * audio and stops scrolling; Resume continues from the same moment.
 */

/** Keys that scroll the page when focus is not in a field. */
export const SCROLL_KEYS: ReadonlySet<string> = new Set([
  "ArrowUp",
  "ArrowDown",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  " ",
  "Spacebar",
]);

/** An input event, reduced to what decides whether the visitor took over the scroll. */
export interface InputLike {
  type: string;
  key?: string;
  /** The event started inside the narrator's own controls. */
  insidePlayer?: boolean;
  /** The event target is a text field, select or editable element. */
  editable?: boolean;
}

/**
 * True when the visitor is scrolling the page themselves: a wheel or a touch
 * drag anywhere outside the player, or a scroll key outside the player and
 * outside a field.
 */
export function isUserScrollIntent(e: InputLike): boolean {
  if (e.insidePlayer) return false;
  if (e.type === "wheel" || e.type === "touchmove") return true;
  if (e.type === "keydown") return !e.editable && !!e.key && SCROLL_KEYS.has(e.key);
  return false;
}
