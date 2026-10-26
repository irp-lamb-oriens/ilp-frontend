"use client";

import { useId, useState } from "react";
import { staffApi } from "@/lib/api";
import type { CsmTask } from "@/lib/contracts";
import { Button } from "@/components/ui";
import { ErrorText } from "../staff/PageHeader";
import s from "./member.module.scss";

/** Close a CSM task. The outcome is required (server enforces it too). */
export function CloseTaskForm({ task, onClosed }: { task: CsmTask; onClosed: (t: CsmTask) => void }) {
  const id = useId();
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
      <label className={s.field} htmlFor={id}>
        Outcome
      </label>
      <textarea
        id={id}
        className={s.textarea}
        value={outcome}
        onChange={(e) => setOutcome(e.target.value)}
        placeholder="Called Mark, profile reviewed, he will upload his DIMEX by Friday."
        aria-invalid={!!error || undefined}
        required
      />
      {error && <ErrorText>{error}</ErrorText>}
      <Button type="submit" busy={busy}>
        Close task
      </Button>
    </form>
  );
}
