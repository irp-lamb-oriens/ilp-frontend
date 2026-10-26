"use client";

import { useState } from "react";
import { staffApi } from "@/lib/api";
import type { CsmTask } from "@/lib/contracts";
import { Button, TextArea } from "@/components/ui";
import s from "./member.module.scss";

/** Close a CSM task. The outcome is required (server enforces it too). */
export function CloseTaskForm({ task, onClosed }: { task: CsmTask; onClosed: (t: CsmTask) => void }) {
  const [outcome, setOutcome] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function close(e: React.FormEvent) {
    e.preventDefault();
    if (!outcome.trim()) {
      setError("Write what happened before closing the task.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const t = await staffApi.post<CsmTask>(`/api/staff/csm-tasks/${encodeURIComponent(task.id)}/close`, { outcome: outcome.trim() });
      onClosed(t ?? { ...task, status: "done", outcome: outcome.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "The task could not be closed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className={s.actions} onSubmit={close} noValidate>
      <TextArea
        label="Outcome"
        value={outcome}
        onChange={(e) => setOutcome(e.target.value)}
        placeholder="Called Mark, profile reviewed, he will upload his DIMEX by Friday."
        error={error ?? undefined}
        required
      />
      <Button type="submit" busy={busy}>
        Close task
      </Button>
    </form>
  );
}
