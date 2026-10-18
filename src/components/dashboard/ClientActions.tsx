"use client";

import { useCallback, useEffect, useState } from "react";
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
      setError(err instanceof Error ? err.message : "Failed to load actions.");
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
    <div style={{ display: "grid", gap: "0.5rem" }}>
      <p style={{ color: "#7a8a96", fontSize: "0.85rem", margin: 0 }}>
        Stage: <strong style={{ color: "#4a5a66" }}>{stage}</strong>
      </p>
      {message && <p style={{ color: "#1f7a5c", fontSize: "0.85rem", margin: 0 }}>{message}</p>}
      {error && <p style={{ color: "#c0392b", fontSize: "0.85rem", margin: 0 }}>{error}</p>}

      {actions.length === 0 && <p style={{ color: "#7a8a96" }}>No actions for this stage.</p>}
      {actions.map((a) => (
        <div
          key={a.actionKey}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
            padding: "0.6rem",
            border: "1px solid rgba(18,59,93,0.14)",
            borderRadius: 10,
          }}
        >
          <div>
            <div style={{ fontWeight: 600, color: "#202a33", fontSize: "0.9rem" }}>{a.label}</div>
            <div style={{ color: "#7a8a96", fontSize: "0.8rem" }}>{a.description}</div>
          </div>
          <button
            type="button"
            disabled={busy === a.actionKey}
            onClick={() => run(a)}
            style={{
              padding: "0.4rem 0.9rem",
              border: "none",
              borderRadius: 999,
              background: "#5cccf7",
              color: "#123b5d",
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
              opacity: busy === a.actionKey ? 0.5 : 1,
            }}
          >
            {busy === a.actionKey ? "…" : "Run"}
          </button>
        </div>
      ))}
    </div>
  );
}