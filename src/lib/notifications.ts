/**
 * lib/notifications.ts — the bell (COMMS-P3). Server: API/notifications.
 * Staff, admins and CSMs read /api/notifications; lawyers /api/provider/notifications.
 */

import type { ApiClient } from "./api";
import type { AppNotification } from "./contracts";

export type BellItem = AppNotification & { read: boolean };

export interface BellResponse {
  items: BellItem[];
  unread: number;
}

export interface BellSource {
  list(limit?: number): Promise<BellResponse>;
  markRead(ids: string[]): Promise<number>;
  markAll(): Promise<number>;
}

/** The bell API for one portal client; `base` is "/api/notifications" or "/api/provider/notifications". */
export function bellSource(client: ApiClient, base: "/api/notifications" | "/api/provider/notifications"): BellSource {
  return {
    list: (limit = 30) => client.get<BellResponse>(base, { query: { limit }, on401: "throw" }),
    markRead: (ids) => client.post<{ marked: number }>(`${base}/read`, { ids }, { on401: "throw" }).then((r) => r.marked),
    markAll: () => client.post<{ marked: number }>(`${base}/read-all`, {}, { on401: "throw" }).then((r) => r.marked),
  };
}

/** Pure: where an item's link goes in this portal. CSM links open on /csm, staff links on /dashboard. */
export function bellHref(item: Pick<AppNotification, "link" | "clientId">, portal: "staff" | "csm" | "lawyer"): string | null {
  const link = item.link ?? null;
  if (!link) return null;
  if (portal === "csm" && link.startsWith("/dashboard/members/") && item.clientId) return `/csm/book/${encodeURIComponent(item.clientId)}`;
  if (portal === "staff" && link.startsWith("/csm/book/") && item.clientId) return `/dashboard/members/${encodeURIComponent(item.clientId)}`;
  return link;
}

/** Pure: "Payment failed" items first among unread, then newest. */
export function sortBell(items: BellItem[]): BellItem[] {
  const rank = (i: BellItem) => (i.read ? 2 : i.severity === "urgent" ? 0 : 1);
  return [...items].sort((a, b) => rank(a) - rank(b) || String(b.createdAt).localeCompare(String(a.createdAt)));
}
