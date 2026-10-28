"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Loadable, Skeleton, ErrorNotice } from "@/components/ui";
import s from "./crm.module.scss";
import { dashboardFetch } from "@/lib/api";

interface ClientAction {
  actionKey: string;
  label: string;
  description: string;
  confirm?: boolean;
}

interface ActionResult {
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
}

/**
 * R5.3 — action buttons for the selected client. Lists stage-scoped actions
 * from GET /api/dashboard/clients/:id/actions and runs them via POST
 * /api/dashboard/clients/:id/actions/:actionKey.
 */
export default function ClientActions({
  clientId,
  stage,
}: {
  clientId: string;
  stage: string;
}) {
  const [actions, setActions] = useState<ClientAction[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await dashboardFetch<{ actions: ClientAction[] }>(
        `/api/dashboard/clients/${clientId}/actions`,
      );
      setActions(res.actions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The actions did not load.");
    } finally {
      setLoaded(true);
    }
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  async function run(action: ClientAction) {
    if (action.confirm && !window.confirm(`Run "${action.label}"?`)) return;
    setBusy(action.actionKey);
    setMessage(null);
    setError(null);
    try {
      const res = await dashboardFetch<{ success: boolean; result?: ActionResult }>(
        `/api/dashboard/clients/${clientId}/actions/${action.actionKey}`,
        { method: "POST", body: JSON.stringify({ args: {} }) },
      );
      setMessage(
        res.result?.message ?? (res.success ? `Ran "${action.label}".` : "Action did not complete."),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className={s.stack}>
      <p className={s.meta}>
        Stage: <strong>{stage}</strong>
      </p>
      {message && (
        <p className={s.ok} role="status">
          {message}
        </p>
      )}
      {error && (
        <ErrorNotice audience="staff">{error}</ErrorNotice>
      )}

      <Loadable loading={!loaded} label="Loading actions" className={s.stack} skeleton={<ActionsSkeleton />}>
        {() => actions.length === 0 && <p className={s.meta}>No actions for this stage.</p>}
      </Loadable>
      {actions.map((a) => (
        <div key={a.actionKey} className={s.item}>
          <div className={s.itemText}>
            <div className={s.itemTitle}>{a.label}</div>
            <div className={s.itemSub}>{a.description}</div>
          </div>
          <Button size="sm" busy={busy === a.actionKey} onClick={() => run(a)}>
            Run
          </Button>
        </div>
      ))}
    </div>
  );
}

/** Two stage actions: label, description, Run. */
function ActionsSkeleton() {
  return (
    <>
      {[0, 1].map((i) => (
        <div key={i} className={s.item} aria-hidden="true">
          <div className={s.itemTextSk}>
            <Skeleton shape="line" size="md" width={i ? "40" : "60"} />
            <Skeleton shape="line" size="sm" width="75" />
          </div>
          <Skeleton shape="pill" size="lg" width="pill-sm" />
        </div>
      ))}
    </>
  );
}
