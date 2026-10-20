"use client";

import { useState } from "react";
import { providerFetch } from "@/lib/provider";
import type { LawyerClient } from "./types";
import styles from "./notesTab.module.scss";

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

  const notes = (client.notes ?? []).slice().reverse();

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    setError(null);
    try {
      await providerFetch(`/api/provider/clients/${client.id}/notes`, {
        method: "POST",
        body: JSON.stringify({ text: body }),
      });
      setText("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add note.");
    } finally {
      setBusy(false);
    }
  }

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

  return (
    <div className={styles.notes}>
      <form className={styles.composer} onSubmit={addNote}>
        <textarea
          className={styles.textarea}
          placeholder="Write a note…"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          type="submit"
          className={styles.addBtn}
          disabled={busy || !text.trim()}
        >
          {busy ? "Adding…" : "Add note"}
        </button>
      </form>

      {error && <p className={styles.error}>{error}</p>}

      {notes.length === 0 && <p className={styles.empty}>No notes yet.</p>}

      {notes.map((n, i) => {
        const noteId = String(n.createdAt ?? i);
        const isEditing = editingId === noteId;
        return (
          <div key={noteId} className={styles.note}>
            <div className={styles.noteMeta}>
              <span className={styles.noteAuthor}>
                {String(n.author ?? "—").split("@")[0]}
              </span>
              <span className={styles.noteTime}>
                {timeAgo(String(n.createdAt ?? ""))}
              </span>
            </div>

            {isEditing ? (
              <div className={styles.editBox}>
                <textarea
                  className={styles.textarea}
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
              <p className={styles.noteText}>{String(n.text ?? "")}</p>
            )}

            {!isEditing && (
              <div className={styles.noteActions}>
                <button
                  type="button"
                  className={styles.editBtn}
                  onClick={() => {
                    setEditingId(noteId);
                    setEditingText(String(n.text ?? ""));
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