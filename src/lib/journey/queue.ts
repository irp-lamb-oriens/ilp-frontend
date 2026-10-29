/**
 * The event queue (JOURNEYS): events wait in memory and go out in one POST
 * when 20 are waiting, 5 seconds after the first one, or at once when the
 * page is hidden or closed (`flush(true)`, a keepalive request or a beacon).
 * One POST carries at most JOURNEY_BATCH_MAX (50) events. Pure apart from
 * the injected transport and timers, so tests can drive it.
 */
import { JOURNEY_BATCH_MAX, type JourneyEventInput } from "@/lib/contracts";

export type Transport = (events: JourneyEventInput[], opts: { beacon: boolean }) => void;

export interface QueueOptions {
  transport: Transport;
  maxWaiting?: number;
  intervalMs?: number;
  /** Most events kept while offline; the oldest are dropped first. */
  cap?: number;
  setTimer?: (fn: () => void, ms: number) => unknown;
  clearTimer?: (t: unknown) => void;
}

export interface EventQueue {
  push(e: JourneyEventInput): void;
  flush(beacon?: boolean): void;
  clear(): void;
  size(): number;
}

export const FLUSH_COUNT = 20;
export const FLUSH_MS = 5000;

export function createQueue(o: QueueOptions): EventQueue {
  const maxWaiting = o.maxWaiting ?? FLUSH_COUNT;
  const intervalMs = o.intervalMs ?? FLUSH_MS;
  const cap = o.cap ?? 500;
  const setTimer = o.setTimer ?? ((fn, ms) => setTimeout(fn, ms));
  const clearTimer = o.clearTimer ?? ((t) => clearTimeout(t as ReturnType<typeof setTimeout>));
  let buf: JourneyEventInput[] = [];
  let timer: unknown = null;

  const stop = () => {
    if (timer !== null) clearTimer(timer);
    timer = null;
  };

  const q: EventQueue = {
    push(e) {
      buf.push(e);
      if (buf.length > cap) buf = buf.slice(buf.length - cap);
      if (buf.length >= maxWaiting) q.flush();
      else if (timer === null) timer = setTimer(() => {
        timer = null;
        q.flush();
      }, intervalMs);
    },
    flush(beacon = false) {
      stop();
      while (buf.length) {
        const chunk = buf.splice(0, JOURNEY_BATCH_MAX);
        try {
          o.transport(chunk, { beacon });
        } catch {
          // measurement never breaks the page
        }
      }
    },
    clear() {
      stop();
      buf = [];
    },
    size: () => buf.length,
  };
  return q;
}
