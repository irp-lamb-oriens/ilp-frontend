/**
 * The sync engine in the browser (SYNC): the outbox wired to the API client,
 * and the start-up work every page does once.
 *
 *   import { sendOrQueue } from "@/lib/sync";
 *   const out = await sendOrQueue("client", "PATCH", "/api/.../profile", { values }, "Your details");
 *   if (out.queued) show "Saved on this device" else use out.data
 *
 * See lib/sync/outbox.ts for what may be queued. Everything else in the
 * engine (the device copy, receipts, retries) needs no call: lib/api does it.
 */

import { ApiError, createApiClient, liveSessionSpaces, onBeforeLogout, ROLE_CONFIG, sessionSpaceFor, type ApiRole } from "../api";
import { emitSync } from "./events";
import { createOutbox, newChangeKey, type OutboxItem, type SendResult } from "./outbox";
import { isUnreachable, SYNC_ENABLED } from "./policy";
import { localStore, serverHasReceipts } from "./runtime";

export { onSync, type SyncEvent } from "./events";

function statusOf(err: unknown): number | null {
  return err instanceof ApiError ? err.status : null;
}

function inProgress(err: unknown): boolean {
  return err instanceof ApiError && err.status === 409 && (err.body as { code?: unknown } | null)?.code === "request_in_progress";
}

async function sendItem(item: OutboxItem, space: string): Promise<SendResult> {
  const role = item.role as ApiRole;
  // Only the sign-in that saved the change may send it.
  if (!ROLE_CONFIG[role] || sessionSpaceFor(role) !== space) return { kind: "retry" };
  try {
    await createApiClient(role).request(item.path, {
      method: item.method,
      body: item.body,
      headers: { "Idempotency-Key": item.id },
      on401: "throw",
    });
    return { kind: "sent" };
  } catch (err) {
    const status = statusOf(err);
    // 401: the sign-in ended; dropping the session reports the change as lost.
    if (isUnreachable(status) || status === 401 || status === 429 || inProgress(err)) return { kind: "retry" };
    return { kind: "rejected", reason: err instanceof Error ? err.message : "The server did not accept it." };
  }
}

const outbox = createOutbox({ store: localStore, send: sendItem, emit: emitSync });

/** One tab at a time sends a sign-in's waiting changes (receipts cover the rest). */
async function flushSpace(space: string): Promise<void> {
  if (!outbox.waiting(space)) return;
  const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
  if (locks?.request) {
    await locks.request(`ilp-sync:${space}`, { ifAvailable: true }, async (lock) => {
      if (lock) await outbox.flush(space);
    });
  } else {
    await outbox.flush(space);
  }
}

/** Send whatever is waiting for every current sign-in. Costs nothing when nothing waits. */
export async function flushOutbox(): Promise<void> {
  if (!SYNC_ENABLED) return;
  for (const space of new Set(liveSessionSpaces())) {
    try {
      await flushSpace(space);
    } catch {
      // next page view tries again
    }
  }
}

/** How many changes wait on this device for a role's sign-in. */
export function waitingChanges(role: ApiRole): number {
  const space = sessionSpaceFor(role);
  return space ? outbox.waiting(space) : 0;
}

export type SendOrQueue<T> = { queued: false; data: T } | { queued: true };

/**
 * Send a change now; when the server cannot be reached, keep it on the device
 * and send it later. Any other failure throws as usual. Use only for changes
 * that are safe to arrive late (profile details, notes): see outbox.ts.
 */
export async function sendOrQueue<T>(
  role: ApiRole,
  method: OutboxItem["method"],
  path: string,
  body: unknown,
  label: string,
): Promise<SendOrQueue<T>> {
  const client = createApiClient(role);
  const receipts = SYNC_ENABLED && serverHasReceipts();
  const id = newChangeKey();
  try {
    const data = await client.request<T>(path, { method, body, headers: receipts ? { "Idempotency-Key": id } : undefined });
    return { queued: false, data };
  } catch (err) {
    const space = sessionSpaceFor(role);
    const aborted = (err as { name?: string } | null)?.name === "AbortError";
    if (receipts && space && !aborted && isUnreachable(statusOf(err)) && outbox.add(space, { id, role, method, path, body, label })) {
      return { queued: true };
    }
    throw err;
  }
}

let started = false;

/** Once per page: clear what belongs to no current sign-in, send what is waiting, and listen for the connection coming back. */
export function startSync(): void {
  if (started || typeof window === "undefined" || !SYNC_ENABLED) return;
  started = true;
  try {
    localStore.sweep(liveSessionSpaces());
  } catch {
    // storage unavailable
  }
  onBeforeLogout(async (role) => {
    const space = sessionSpaceFor(role);
    if (!space || !outbox.waiting(space)) return;
    await Promise.race([flushSpace(space), new Promise((r) => setTimeout(r, 3000))]);
  });
  const go = () => void flushOutbox();
  window.addEventListener("online", go);
  document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && go());
  go();
}
