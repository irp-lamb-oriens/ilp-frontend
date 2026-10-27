"use client";

/**
 * Mounted once in the root layout. Holds the registry (configs load on first
 * use), the seen / dismissed store, the open tutorial and step, and renders
 * the modal, the Tutorials list and the page spotlight.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { TutorialContext, type CloseReason, type ActiveTutorial, type TutorialApi } from "./context";
import { createRegistry, type TutorialRegistry } from "./registry";
import { createTutorialStore, noopTutorialSync, type TutorialStore, type TutorialSync } from "./storage";
import { TutorialModal } from "./TutorialModal";
import { TutorialList } from "./TutorialList";
import { TourSpotlight } from "./TourSpotlight";
import type { Tutorial, TutorialRole } from "./types";

const SESSION_KEY = "ilp_tutorials_skipped";

function safeLocal(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function sessionSkipped(): string[] {
  try {
    return JSON.parse(window.sessionStorage.getItem(SESSION_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function addSessionSkip(id: string) {
  try {
    const cur = sessionSkipped();
    if (!cur.includes(id)) window.sessionStorage.setItem(SESSION_KEY, JSON.stringify([...cur, id]));
  } catch {
    // session storage blocked: the skip still counts in localStorage
  }
}

export function wasSkippedThisSession(id: string): boolean {
  return sessionSkipped().includes(id);
}

export interface TutorialProviderProps {
  /** Tutorials given directly (gallery, tests). */
  tutorials?: Tutorial[];
  /** Or loaded on first use, so pages without tutorials do not ship the configs. */
  load?: () => Promise<Tutorial[]>;
  /** Server mirror of the seen state. Default: none. */
  sync?: TutorialSync;
  children: ReactNode;
}

export function TutorialProvider({ tutorials, load, sync = noopTutorialSync, children }: TutorialProviderProps) {
  const [registry, setRegistry] = useState<TutorialRegistry | null>(() => (tutorials ? createRegistry(tutorials) : null));
  const loading = useRef<Promise<TutorialRegistry> | null>(null);
  const storeRef = useRef<TutorialStore | null>(null);
  const [rev, setRev] = useState(0);
  const [active, setActive] = useState<ActiveTutorial | null>(null);
  const [listRole, setListRole] = useState<TutorialRole | null>(null);
  const [spot, setSpot] = useState<{ target: string; title: string; body: string } | null>(null);
  const activeRef = useRef<ActiveTutorial | null>(null);
  activeRef.current = active;
  const syncRef = useRef(sync);
  syncRef.current = sync;

  const store = useCallback((): TutorialStore => {
    if (!storeRef.current) {
      storeRef.current = createTutorialStore(safeLocal(), {
        onChange: (st) => {
          setRev((r) => r + 1);
          void syncRef.current.push(st).catch(() => undefined);
        },
      });
    }
    return storeRef.current;
  }, []);

  // Pull the server copy once (no-op by default).
  useEffect(() => {
    let off = false;
    void syncRef.current
      .pull()
      .then((st) => {
        if (st && !off) store().replace(st);
      })
      .catch(() => undefined);
    return () => {
      off = true;
    };
  }, [store]);

  const ensureLoaded = useCallback(async (): Promise<TutorialRegistry> => {
    if (registry) return registry;
    if (!load) {
      const empty = createRegistry([]);
      setRegistry(empty);
      return empty;
    }
    if (!loading.current) {
      loading.current = load().then((list) => {
        const r = createRegistry(list);
        setRegistry(r);
        return r;
      });
    }
    return loading.current;
  }, [registry, load]);

  const start = useCallback<TutorialApi["start"]>(
    async (id, opts = {}) => {
      const r = await ensureLoaded();
      const t = r.get(id);
      if (!t || t.steps.length === 0) return false;
      setSpot(null);
      setListRole(null);
      setActive({ tutorial: t, step: Math.max(0, Math.min(t.steps.length - 1, opts.step ?? 0)), auto: !!opts.auto });
      return true;
    },
    [ensureLoaded],
  );

  const goTo = useCallback((step: number) => {
    setActive((a) => (a ? { ...a, step: Math.max(0, Math.min(a.tutorial.steps.length - 1, step)) } : a));
  }, []);

  const close = useCallback(
    (reason: CloseReason = "skip", dontShow = false) => {
      setActive((a) => {
        if (!a) return a;
        const { id, version } = a.tutorial;
        if (dontShow) store().markDismissed(id, version);
        else if (reason === "done") store().markDone(id, version);
        else if (a.auto) {
          store().markSkipped(id, version);
          addSessionSkip(id);
        }
        return null;
      });
      setSpot(null);
    },
    [store],
  );

  const clearSpot = useCallback(() => setSpot(null), []);

  const api = useMemo<TutorialApi>(
    () => ({
      registry,
      active,
      start,
      next: () => setActive((a) => (a && a.step < a.tutorial.steps.length - 1 ? { ...a, step: a.step + 1 } : a)),
      back: () => setActive((a) => (a && a.step > 0 ? { ...a, step: a.step - 1 } : a)),
      goTo,
      close,
      shouldAutoStart: (id) => {
        const t = registry?.get(id);
        return t ? store().shouldAutoStart(id, t.version, { skippedThisSession: wasSkippedThisSession(id) }) : false;
      },
      isSeen: (id) => {
        const t = registry?.get(id);
        return t ? store().isSeen(id, t.version) : false;
      },
      reset: (id) => store().reset(id),
      autoStartEnabled: store().read().autoStart,
      setAutoStartEnabled: (on) => store().setAutoStart(on),
      ensureLoaded,
      openList: (role) => {
        void ensureLoaded().then(() => setListRole(role));
      },
      spotlight: (target) => {
        const a = activeRef.current;
        if (!a) return;
        const st = a.tutorial.steps[a.step];
        setSpot({ target, title: st.title, body: st.body });
      },
    }),
    // rev: re-read the store after every change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [registry, active, start, goTo, close, ensureLoaded, store, rev],
  );

  return (
    <TutorialContext.Provider value={api}>
      {children}
      {active && (
        <TutorialModal
          active={active}
          hidden={!!spot}
          onNext={api.next}
          onBack={api.back}
          onClose={close}
          onSpotlight={api.spotlight}
        />
      )}
      {spot && <TourSpotlight target={spot.target} title={spot.title} body={spot.body} onDone={clearSpot} />}
      {listRole && <TutorialList role={listRole} onClose={() => setListRole(null)} />}
    </TutorialContext.Provider>
  );
}

export default TutorialProvider;
