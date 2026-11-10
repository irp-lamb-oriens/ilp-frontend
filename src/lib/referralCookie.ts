/**
 * REFERRALS: the ilp_ref cookie (no imports, so the edge middleware and the
 * /r/<code> route can use it). Value: "<code>|<ISO time first seen>".
 */

export const REF_COOKIE = "ilp_ref";
export const REF_DAYS = 90;
export const REF_CODE_RE = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;

/** Cookie value for a code seen at `at`. */
export function refCookieValue(code: string, at: string): string {
  return encodeURIComponent(`${code}|${at}`);
}

/** Parse a cookie value; null when it is not a valid code and date. */
export function parseRefCookie(raw: string | undefined | null): { ref: string; refAt: string } | null {
  if (!raw) return null;
  let v = raw;
  try {
    v = decodeURIComponent(raw);
  } catch {
    return null;
  }
  const [code, at] = v.split("|");
  const ref = (code ?? "").trim().toLowerCase();
  if (!REF_CODE_RE.test(ref) || !at || Number.isNaN(Date.parse(at))) return null;
  return { ref, refAt: at };
}

/** The browser's referral, to spread into a public form body. Empty object when there is none. */
export function readRef(): { ref?: string; refAt?: string } {
  if (typeof document === "undefined") return {};
  const m = document.cookie.match(/(?:^|;\s*)ilp_ref=([^;]+)/);
  return parseRefCookie(m?.[1]) ?? {};
}
