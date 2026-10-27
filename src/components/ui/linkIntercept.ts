/**
 * Which link clicks the unsaved-changes guard should stop and ask about.
 * Pure (no DOM, no imports) so node:test can check it directly.
 */

export interface ClickInfo {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  defaultPrevented: boolean;
}

export interface AnchorInfo {
  /** The raw href attribute, as written. */
  href: string | null;
  target?: string | null;
  /** The anchor has a download attribute. */
  download?: boolean;
  /** The anchor (or an ancestor) has data-unsaved-guard="off". */
  optOut?: boolean;
}

/**
 * The absolute URL a click would open in this tab of this app, or null when
 * the click should go through untouched: modified or non-primary clicks
 * (new tab or window), other targets, downloads, hash-only links on the same
 * page, other origins and non-http schemes (those leave the page, where the
 * native beforeunload prompt applies), and links to the page already open.
 */
export function guardedHref(click: ClickInfo, anchor: AnchorInfo, currentHref: string): string | null {
  if (click.defaultPrevented) return null;
  if (click.button !== 0) return null;
  if (click.metaKey || click.ctrlKey || click.shiftKey || click.altKey) return null;
  if (anchor.optOut || anchor.download) return null;
  const target = (anchor.target ?? "").trim().toLowerCase();
  if (target !== "" && target !== "_self") return null;
  const raw = anchor.href?.trim();
  if (!raw || raw.startsWith("#")) return null;
  let from: URL;
  let to: URL;
  try {
    from = new URL(currentHref);
    to = new URL(raw, from);
  } catch {
    return null;
  }
  if (to.protocol !== "http:" && to.protocol !== "https:") return null;
  if (to.origin !== from.origin) return null;
  // Same path and query: a hash jump or the page already open, nothing is lost.
  if (to.pathname === from.pathname && to.search === from.search) return null;
  return to.href;
}
