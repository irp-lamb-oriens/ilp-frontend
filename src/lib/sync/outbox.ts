/**
 * The outbox (SYNC): changes a person saved while the server could not be
 * reached. They wait on the device, in order, and go out the next time a page
 * of the site is open with a connection. A change leaves the outbox only when
 * the server has answered it, so "sent" always means "the server has it".
 *
 * Every waiting change has its own key. The server keeps a receipt per key
 * (server: helper/idempotency.ts), so a change that is sent twice (two tabs,
 * a lost answer, a reload mid-send) still runs once.
 *
 * Rules:
 *   - strict order: when one change cannot be sent, the ones behind it wait;
 *   - a change the server refuses for good (a 4xx) is removed and reported,
 *     never retried forever;
 *   - a change waits at most 72 hours; at most 50 changes and 200 KB wait;
 *   - changes belong to one sign-in and are dropped when it ends;
 *   - only calls that opt in are ever queued. Payments, sign-in, bookings,
 *     consents and file uploads never are.
 *
 * Pure: storage, the sender and the clock are passed in.
 */

import type { LocalStore } from "./localStore";
import type { SyncEvent } from "./events";

export interface OutboxItem {
  /** The idempotency key: the same on every attempt. */
  id: string;
  role: string;
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  body: unknown;
  /** What the person saved, in their words ("Your details"). */
  label: string;
  at: number;
  tries: number;
}

export type SendResult = { kind: "sent" } | { kind: "retry" } | { kind: "rejected"; reason: string };

export const OUTBOX_MAX_ITEMS = 50;
export const OUTBOX_MAX_CHARS = 200 * 1024;
export const OUTBOX_MAX_AGE_MS = 72 * 60 * 60 * 1000;

export interface Outbox {
  /** Keep a change for later. False when the outbox is full or storage is unavailable. */
  add(space: string, item: Omit<OutboxItem, "at" | "tries">): boolean;
  waiting(space: string): number;
  /** Send what is waiting, oldest first. Safe to call from several tabs at once. */
  flush(space: string): Promise<{ sent: number; rejected: number; waiting: number }>;
}

/** A new key for one change. */
export function newChangeKey(): string {
  try {
    return `c_${crypto.randomUUID().replace(/-/g, "")}`;
  } catch {
    let out = "c_";
    for (let i = 0; i < 4; i++) out += Math.random().toString(36).slice(2, 10);
    return out.padEnd(24, "0");
  }
}

export function createOutbox(o: {
  store: LocalStore;
  send: (item: OutboxItem, space: string) => Promise<SendResult>;
  emit?: (e: SyncEvent) => void;
  now?: () => number;
}): Outbox {
  const now = o.now ?? Date.now;
  const emit = o.emit ?? (() => {});
  const running = new Map<string, Promise<{ sent: number; rejected: number; waiting: number }>>();

  const read = (space: string) => o.store.readOutbox<OutboxItem>(space).filter((i) => i && typeof i.id === "string");
  /** Remove one change from the stored list as it is now (another tab may have changed it). */
  const take = (space: string, id: string): number => {
    const left = read(space).filter((i) => i.id !== id);
    o.store.writeOutbox(space, left);
    return left.length;
  };

  async function run(space: string) {
    let sent = 0;
    let rejected = 0;
    for (;;) {
      const item = read(space)[0];
      if (!item) break;
      if (now() - item.at > OUTBOX_MAX_AGE_MS) {
        take(space, item.id);
        emit({ type: "lost", count: 1 });
        continue;
      }
      let result: SendResult;
      try {
        result = await o.send(item, space);
      } catch {
        result = { kind: "retry" };
      }
      if (result.kind === "sent") {
        sent++;
        emit({ type: "sent", waiting: take(space, item.id), label: item.label });
      } else if (result.kind === "rejected") {
        rejected++;
        emit({ type: "rejected", waiting: take(space, item.id), label: item.label, reason: result.reason });
      } else {
        const list = read(space);
        const mine = list.find((i) => i.id === item.id);
        if (mine) {
          mine.tries = (mine.tries ?? 0) + 1;
          o.store.writeOutbox(space, list);
        }
        break; // keep the order: nothing behind it goes first
      }
    }
    return { sent, rejected, waiting: read(space).length };
  }

  return {
    add(space, item) {
      const list = read(space);
      if (list.some((i) => i.id === item.id)) return true;
      const next = [...list, { ...item, at: now(), tries: 0 }];
      if (next.length > OUTBOX_MAX_ITEMS || JSON.stringify(next).length > OUTBOX_MAX_CHARS) return false;
      if (!o.store.writeOutbox(space, next)) return false;
      emit({ type: "queued", waiting: next.length, label: item.label });
      return true;
    },
    waiting: (space) => read(space).length,
    flush(space) {
      const going = running.get(space);
      if (going) return going;
      const p = run(space).finally(() => running.delete(space));
      running.set(space, p);
      return p;
    },
  };
}
