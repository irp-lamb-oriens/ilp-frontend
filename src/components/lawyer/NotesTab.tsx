"use client";

import { useEffect, useState } from "react";
import { providerFetch } from "@/lib/provider";
import type { LawyerClient } from "./types";
import styles from "./notesTab.module.scss";
import { IconClose, IconNote, TextArea, useUnsavedChanges, ErrorNotice } from "@/components/ui";

interface Collaborator {
  email: string;
  name?: string;
}

function timeAgo(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return iso;
  }
}

function aiNoteText(n: unknown): string {
  if (n == null) return "";
  if (typeof n === "string") return n;
  if (typeof n === "object") {
    const o = n as Record<string, unknown>;
    const cand = o.text ?? o.note ?? o.message ?? o.content ?? o.value ?? o.body;
    if (typeof cand === "string") return cand;
    try {
      return JSON.stringify(n);
    } catch {
      return String(n);
    }
  }
  return String(n);
}

export default function NotesTab({
  client,
  onRefreshed,
}: {
  client: LawyerClient;
  onRefreshed: (client: LawyerClient) => void;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  useUnsavedChanges(text.trim() !== "" || editingId !== null, "Your note is not saved yet. If you leave now, it will be lost.");
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const notes = (client.notes ?? []).slice().reverse();

  const notifications = (client.pendingActions ?? [])
    .filter(
      (a) =>
        a.status === "pending" &&
        (a.type === "client_comment" || a.type === "note_mention"),
    )
    .slice()
    .sort(
      (a, b) =>
        new Date(String(b.triggeredAt ?? "")).getTime() -
        new Date(String(a.triggeredAt ?? "")).getTime(),
    );

  useEffect(() => {
    providerFetch<{ collaborators: Array<Record<string, unknown>> }>(
      "/api/provider/collaborators",
    )
      .then((res) => {
        setCollaborators(
          (res.collaborators ?? [])
            .filter((c) => c && typeof c.email === "string")
            .map((c) => ({
              email: String(c.email),
              name: typeof c.name === "string" ? c.name : undefined,
            })),
        );
      })
      .catch(() => {
        // non-fatal; the picker just shows empty
      });
  }, []);

  async function refresh() {
    try {
      const res = await providerFetch<{ notes: Array<Record<string, unknown>> }>(
        `/api/provider/clients/${client.id}/notes`,
      );
      onRefreshed({ ...client, notes: res.notes ?? [] });
    } catch {
      // non-fatal; keep local state
    }
  }

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    setError(null);
    try {
      await providerFetch(`/api/provider/clients/${client.id}/notes`, {
        method: "POST",
        body: JSON.stringify({ text: body, recipients }),
      });
      setText("");
      setRecipients([]);
      setPickerOpen(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add note.");
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit(noteId: string) {
    const body = editingText.trim();
    if (!body || busy) return;
    setBusy(true);
    setError(null);
    try {
      await providerFetch(`/api/provider/clients/${client.id}/notes/${noteId}`, {
        method: "PATCH",
        body: JSON.stringify({ text: body }),
      });
      setEditingId(null);
      setEditingText("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to edit note.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteNote(noteId: string) {
    if (!window.confirm("Delete this note?")) return;
    setBusy(true);
    setError(null);
    try {
      await providerFetch(`/api/provider/clients/${client.id}/notes/${noteId}`, {
        method: "DELETE",
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete note.");
    } finally {
      setBusy(false);
    }
  }

  async function resolveNotification(actionId: string) {
    if (resolvingId) return;
    setResolvingId(actionId);
    setError(null);
    try {
      await providerFetch(
        `/api/provider/clients/${client.id}/pending-actions/${actionId}/resolve`,
        { method: "POST", body: JSON.stringify({ resolution: "done" }) },
      );
      onRefreshed({
        ...client,
        pendingActions: (client.pendingActions ?? []).map((a) =>
          a.actionId === actionId ? { ...a, status: "done" } : a,
        ),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark as read.");
    } finally {
      setResolvingId(null);
    }
  }

  function toggleRecipient(email: string) {
    setRecipients((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email],
    );
  }

  function recipientName(email: string): string {
    const c = collaborators.find((x) => x.email === email);
    return c?.name || email.split("@")[0];
  }

  return (
    <div className={styles.notes}>
      {notifications.length > 0 && (
        <div className={styles.notifications}>
          {notifications.map((n) => {
            const actionId = String(n.actionId ?? "");
            const meta = (n.meta ?? {}) as Record<string, unknown>;
            return (
              <div key={actionId} className={styles.notification}>
                <span className={styles.notificationIcon} aria-hidden="true">
                  <IconNote />
                </span>
                <div className={styles.notificationBody}>
                  <span className={styles.notificationTitle}>
                    {String(n.title ?? "")}
                  </span>
                  {typeof meta.body === "string" && (
                    <span className={styles.notificationPreview}>
                      {meta.body}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className={styles.resolveBtn}
                  disabled={resolvingId === actionId}
                  onClick={() => resolveNotification(actionId)}
                >
                  {resolvingId === actionId ? "Marking…" : "Mark read"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <form className={styles.composer} onSubmit={addNote}>
        <TextArea
          label="New note"
          hideLabel
          placeholder="Write a note…"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <div className={styles.recipientRow}>
          <button
            type="button"
            className={styles.recipientToggle}
            onClick={() => setPickerOpen((o) => !o)}
            aria-expanded={pickerOpen}
          >
            {recipients.length > 0
              ? `Notify ${recipients.length} teammate${recipients.length > 1 ? "s" : ""}`
              : "Notify teammates"}
          </button>

          {recipients.length > 0 && (
            <div className={styles.recipientChips}>
              {recipients.map((email) => (
                <span key={email} className={styles.recipientChip}>
                  {recipientName(email)}
                  <button
                    type="button"
                    className={styles.recipientRemove}
                    onClick={() => toggleRecipient(email)}
                    aria-label={`Remove ${email}`}
                  >
                    <IconClose />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {pickerOpen && (
          <div className={styles.picker}>
            {collaborators.length === 0 && (
              <span className={styles.pickerEmpty}>No teammates configured.</span>
            )}
            {collaborators.map((c) => (
              <button
                key={c.email}
                type="button"
                className={`${styles.pickerItem} ${
                  recipients.includes(c.email) ? styles.pickerItemActive : ""
                }`}
                onClick={() => toggleRecipient(c.email)}
              >
                <span className={styles.pickerName}>{recipientName(c.email)}</span>
                <span className={styles.pickerEmail}>{c.email}</span>
              </button>
            ))}
          </div>
        )}

        <button
          type="submit"
          className={styles.addBtn}
          disabled={busy || !text.trim()}
        >
          {busy ? "Adding…" : "Add note"}
        </button>
      </form>

      {error && <ErrorNotice audience="lawyer">{error}</ErrorNotice>}

      {notes.length === 0 && <p className={styles.empty}>No notes yet.</p>}

      {notes.map((n, i) => {
        const noteId = String(n.createdAt ?? i);
        const isEditing = editingId === noteId;
        return (
          <div key={noteId} className={styles.note}>
            <div className={styles.noteMeta}>
              <span className={styles.noteAuthor}>
                {String(n.author ?? "Unknown author").split("@")[0]}
              </span>
              <span className={styles.noteTime}>
                {timeAgo(String(n.createdAt ?? ""))}
              </span>
            </div>

            {isEditing ? (
              <div className={styles.editBox}>
                <TextArea
                  label="Edit note"
                  hideLabel
                  rows={3}
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                />
                <div className={styles.editActions}>
                  <button
                    type="button"
                    className={styles.saveBtn}
                    disabled={busy || !editingText.trim()}
                    onClick={() => saveEdit(noteId)}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    disabled={busy}
                    onClick={() => {
                      setEditingId(null);
                      setEditingText("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className={styles.noteText}>{aiNoteText(n.text)}</p>
            )}

            {!isEditing && (
              <div className={styles.noteActions}>
                <button
                  type="button"
                  className={styles.editBtn}
                  onClick={() => {
                    setEditingId(noteId);
                    setEditingText(aiNoteText(n.text));
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className={styles.deleteBtn}
                  onClick={() => deleteNote(noteId)}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}