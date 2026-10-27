"use client";

import { createContext, useContext, useEffect, useId, useMemo, useRef, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./Button";
import { Dialog } from "./Dialog";
import { guardedHref } from "./linkIntercept";

/**
 * Unsaved-changes guard, one registry for the whole app.
 *
 *   useUnsavedChanges(dirty)                 // a form opts in with one line
 *   const leave = useLeaveGuard();           // code that navigates or discards
 *   leave.push("/lawyer");  leave.guard(() => logout());
 *   if (await leave.confirmLeave({ title: "Switch lawyer?" })) switchLawyer();
 *
 * <UnsavedChangesGuard /> (mounted once in the root layout) does the rest
 * while any registered form is dirty:
 * - stops same-origin link clicks (next/link or plain <a>) in the capture
 *   phase, asks, and replays the click if the person leaves;
 * - pushes a sentinel history entry so browser Back can be asked about and
 *   undone ("Keep editing" puts the sentinel back);
 * - renders the confirm Dialog ("Keep editing" / "Leave without saving").
 * Reloads and tab closes keep the browser's own beforeunload prompt.
 * A link can opt out with data-unsaved-guard="off" on it or an ancestor.
 *
 * Drawers: a form registered inside a <Drawer> also belongs to that drawer's
 * scope, so Esc, × and the scrim ask before closing it (confirmDiscard).
 */

export interface LeaveOptions {
  /** Dialog title. Default "Leave without saving?" */
  title?: string;
  /** Dialog text. Default: the dirty form's message, else a generic line. */
  message?: string;
  /** Label of the discard button. Default "Leave without saving". */
  confirmLabel?: string;
}

const DEFAULT_MESSAGE = "You have changes that are not saved yet. If you leave now, they will be lost.";
const SENTINEL = "__ilpUnsaved";
const RELEASE_MS = 1500;

type Pending = { opts: LeaveOptions; release: boolean; waiters: Array<(ok: boolean) => void> };

// ── Registry (module state; one per tab) ───────────────────────────────────
type FormEntry = { message?: string; scope: string | null };
const forms = new Map<string, FormEntry>();
let pending: Pending | null = null;
let hosts = 0;
let releasedUntil = 0;
let version = 0;
const subscribers = new Set<() => void>();

function emit() {
  version++;
  subscribers.forEach((f) => f());
}

function subscribe(f: () => void) {
  subscribers.add(f);
  return () => {
    subscribers.delete(f);
  };
}

const getVersion = () => version;
const isDirty = () => forms.size > 0;
/** True for a moment after the person chose to leave, so what follows is not asked again. */
const isReleased = () => Date.now() < releasedUntil;

function setForm(id: string, dirty: boolean, message?: string, scope: string | null = null) {
  const had = forms.has(id);
  if (dirty) {
    const prev = forms.get(id);
    if (prev && prev.message === message && prev.scope === scope) return;
    forms.delete(id); // re-insert so the latest form's message wins
    forms.set(id, { message, scope });
    emit();
  } else if (had) {
    forms.delete(id);
    emit();
  }
}

/** Some form registered inside this drawer scope is dirty. */
export const isScopeDirty = (scope: string) => {
  for (const f of forms.values()) if (f.scope === scope) return true;
  return false;
};

function currentMessage(scope?: string): string {
  let msg: string | undefined;
  forms.forEach((f) => {
    if (f.message && (scope === undefined || f.scope === scope)) msg = f.message;
  });
  return msg ?? DEFAULT_MESSAGE;
}

let warnedNoHost = false;

/** Open the dialog (or, with no host mounted, window.confirm) and resolve with the choice. */
function ask(opts: LeaveOptions, release: boolean, scope?: string): Promise<boolean> {
  const full: LeaveOptions = { ...opts, message: opts.message ?? currentMessage(scope) };
  if (hosts === 0) {
    // <UnsavedChangesGuard /> lives in the root layout; without it, ask natively.
    if (process.env.NODE_ENV !== "production" && !warnedNoHost) {
      warnedNoHost = true;
      console.warn("[UnsavedChanges] <UnsavedChangesGuard /> is not mounted, so the unsaved-changes prompt falls back to window.confirm. Mount it once in the root layout.");
    }
    const ok = typeof window !== "undefined" && window.confirm(full.message);
    if (ok && release) releasedUntil = Date.now() + RELEASE_MS;
    return Promise.resolve(ok);
  }
  return new Promise((resolve) => {
    if (pending) pending.waiters.push(resolve);
    else {
      pending = { opts: full, release, waiters: [resolve] };
      emit();
    }
  });
}

/**
 * Ask before leaving. Resolves true at once when nothing is dirty;
 * otherwise opens the dialog and resolves with the choice.
 */
export function confirmLeave(opts: LeaveOptions = {}): Promise<boolean> {
  if (!isDirty() || isReleased()) return Promise.resolve(true);
  return ask(opts, true);
}

/**
 * Ask before discarding edits in place (closing a drawer). With `scope`,
 * only forms registered inside that drawer count; `force` asks even when
 * none is registered (Drawer confirmClose). Does not release navigation.
 */
export function confirmDiscard(opts: LeaveOptions = {}, scope?: string, force = false): Promise<boolean> {
  const dirty = force || (scope ? isScopeDirty(scope) : isDirty());
  if (!dirty) return Promise.resolve(true);
  return ask(opts, false, scope);
}

function settle(ok: boolean) {
  const p = pending;
  pending = null;
  if (ok && p?.release) releasedUntil = Date.now() + RELEASE_MS;
  emit();
  p?.waiters.forEach((w) => w(ok));
}

/** Drawer scope for forms rendered inside it (set by Drawer). */
const ScopeContext = createContext<string | null>(null);
export const UnsavedScope = ScopeContext.Provider;

// ── History sentinel (browser Back) ────────────────────────────────────────
let ignorePops = 0;
let popWaiters: Array<() => void> = [];
let sentinelUrl: string | null = null;

const onSentinel = () => typeof window !== "undefined" && !!(window.history.state as Record<string, unknown> | null)?.[SENTINEL];

function pushSentinel() {
  if (onSentinel()) return;
  sentinelUrl = window.location.href;
  // Copy the router's own state (Next.js keeps __NA and its tree here) so a
  // popstate onto either entry restores the same page.
  window.history.pushState({ ...((window.history.state as object | null) ?? {}), [SENTINEL]: true }, "", window.location.href);
}

/** Take the sentinel entry off the stack (before a guarded navigation, or once saved). */
function dropSentinel(): Promise<void> {
  if (!onSentinel()) return Promise.resolve();
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };
    popWaiters.push(finish);
    ignorePops++;
    window.history.back();
    window.setTimeout(() => {
      if (!done) {
        ignorePops = Math.max(0, ignorePops - 1);
        finish();
      }
    }, 400);
  });
}

/** Ask, then run `go` (after removing the sentinel) if the person leaves. */
async function runGuarded(go: () => void, opts?: LeaveOptions): Promise<boolean> {
  if (!(await confirmLeave(opts))) return false;
  await dropSentinel();
  go();
  return true;
}

// ── Hooks ───────────────────────────────────────────────────────────────────

/**
 * Register a form's dirty state. While any registered form is dirty, reloads,
 * tab closes, in-app links, browser Back and guarded navigation ask first.
 */
export function useUnsavedChanges(dirty: boolean, message?: string): void {
  const id = useId();
  const scope = useContext(ScopeContext);
  useEffect(() => {
    setForm(id, dirty, message, scope);
  }, [id, dirty, message, scope]);
  useEffect(() => () => setForm(id, false), [id]);
  // Reload / tab close: the browser's own prompt (custom text is ignored by browsers).
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      if (isReleased()) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
}

export interface LeaveGuard {
  confirmLeave: (opts?: LeaveOptions) => Promise<boolean>;
  /** Run `fn` (a logout, a router call, a discard) only if nothing is dirty or the person agrees. */
  guard: (fn: () => void, opts?: LeaveOptions) => Promise<boolean>;
  push: (href: string) => Promise<boolean>;
  replace: (href: string) => Promise<boolean>;
}

/** Guarded navigation for code paths (search submit, logout, router.push). */
export function useLeaveGuard(): LeaveGuard {
  const router = useRouter();
  return useMemo(
    () => ({
      confirmLeave,
      guard: (fn, opts) => runGuarded(fn, opts),
      push: (href) => runGuarded(() => router.push(href)),
      replace: (href) => runGuarded(() => router.replace(href)),
    }),
    [router],
  );
}

// ── Host ────────────────────────────────────────────────────────────────────

/** Mount once (root layout). Intercepts links and Back, and shows the dialog. */
export function UnsavedChangesGuard() {
  const router = useRouter();
  useSyncExternalStore(subscribe, getVersion, getVersion);
  const dirty = isDirty();
  const bypass = useRef(false);

  useEffect(() => {
    hosts++;
    return () => {
      hosts--;
    };
  }, []);

  // Sentinel while dirty; removed again when the form is saved or discarded in place.
  useEffect(() => {
    if (!dirty) return;
    pushSentinel();
    return () => {
      if (!isReleased()) void dropSentinel();
    };
  }, [dirty]);

  // Links: capture phase on window runs before next/link's own handler.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (bypass.current || !isDirty() || isReleased()) return;
      const a = (e.target as Element | null)?.closest?.("a[href]");
      if (!(a instanceof HTMLAnchorElement)) return;
      const to = guardedHref(
        e,
        {
          href: a.getAttribute("href"),
          target: a.getAttribute("target"),
          download: a.hasAttribute("download"),
          optOut: !!a.closest('[data-unsaved-guard="off"]'),
        },
        window.location.href,
      );
      if (!to) return;
      e.preventDefault();
      e.stopPropagation();
      void runGuarded(() => {
        if (a.isConnected) {
          // Replay the click so next/link keeps its own options (replace, scroll).
          bypass.current = true;
          try {
            a.click();
          } finally {
            bypass.current = false;
          }
        } else {
          const u = new URL(to);
          router.push(`${u.pathname}${u.search}${u.hash}`);
        }
      });
    };
    window.addEventListener("click", onClick, true);
    return () => window.removeEventListener("click", onClick, true);
  }, [router]);

  // Back/Forward: leaving the sentinel lands on the same page's real entry; ask there.
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      if (ignorePops > 0) {
        ignorePops--;
        const w = popWaiters;
        popWaiters = [];
        w.forEach((f) => f());
        return;
      }
      if (!isDirty() || isReleased()) return;
      if ((e.state as Record<string, unknown> | null)?.[SENTINEL]) return;
      if (sentinelUrl !== window.location.href) return; // already somewhere else
      void confirmLeave().then((ok) => {
        if (ok) window.history.back();
        else pushSentinel();
      });
    };
    window.addEventListener("popstate", onPop, true);
    return () => window.removeEventListener("popstate", onPop, true);
  }, []);

  // Keep the last texts while the dialog fades out.
  const lastOpts = useRef<LeaveOptions>({});
  if (pending) lastOpts.current = pending.opts;
  const o = lastOpts.current;
  return (
    <Dialog
      open={!!pending}
      onClose={() => settle(false)}
      role="alertdialog"
      title={o.title ?? "Leave without saving?"}
      footer={
        <>
          <Button variant="secondary" onClick={() => settle(false)} data-autofocus>
            Keep editing
          </Button>
          <Button variant="danger" onClick={() => settle(true)}>
            {o.confirmLabel ?? "Leave without saving"}
          </Button>
        </>
      }
    >
      <p>{o.message}</p>
    </Dialog>
  );
}

export default UnsavedChangesGuard;
