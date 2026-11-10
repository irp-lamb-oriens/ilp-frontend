import { NextResponse, type NextRequest } from "next/server";
import { REF_CODE_RE, REF_COOKIE, REF_DAYS, refCookieValue } from "@/lib/referralCookie";

/**
 * REFERRALS: short partner link, /r/<code>. Asks the API where the code
 * points (it counts the click), keeps the code in the first-party ilp_ref
 * cookie and redirects. Unknown or paused codes go to the home page.
 */
export const dynamic = "force-dynamic";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

export async function GET(req: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  const { code: raw } = await ctx.params;
  const code = String(raw ?? "").trim().toLowerCase();
  const home = new URL("/", req.url);
  if (!REF_CODE_RE.test(code)) return NextResponse.redirect(home, 302);
  let target: string | null = null;
  try {
    const res = await fetch(`${API}/api/referrals/resolve/${encodeURIComponent(code)}`, { cache: "no-store", headers: { accept: "application/json" } });
    if (res.ok) {
      const data = (await res.json()) as { url?: string };
      target = typeof data.url === "string" && /^https?:\/\//.test(data.url) ? data.url : null;
    }
  } catch {
    target = null;
  }
  const out = NextResponse.redirect(target ?? home, 302);
  out.headers.set("Cache-Control", "no-store");
  if (target) {
    out.cookies.set(REF_COOKIE, refCookieValue(code, new Date().toISOString()), {
      path: "/",
      maxAge: REF_DAYS * 86400,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }
  return out;
}
