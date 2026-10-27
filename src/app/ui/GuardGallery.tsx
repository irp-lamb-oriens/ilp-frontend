"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Dialog, Drawer, TextArea, useLeaveGuard, useUnsavedChanges } from "@/components/ui";
import s from "./ScheduleGallery.module.scss";

/** Dialog and the unsaved-changes guard, live. */
export default function GuardGallery() {
  const [open, setOpen] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [draft, setDraft] = useState("");
  const [saved, setSaved] = useState<string | null>(null);
  const dirty = draft.trim() !== "" && draft !== saved;
  useUnsavedChanges(dirty, "The gallery note is not saved yet. If you leave now, it will be lost.");
  const leave = useLeaveGuard();

  return (
    <div className={s.wrap}>
      <p className={s.note}>
        A form opts in with one line, <code>useUnsavedChanges(dirty)</code>. While it is dirty, links to other pages, browser
        Back, the shell&apos;s search and logout, and <code>useLeaveGuard().push()</code> ask first; reload and tab close keep
        the browser&apos;s own prompt. Esc or &ldquo;Keep editing&rdquo; stays. Hash links, new-tab clicks and{" "}
        <code>target=&quot;_blank&quot;</code> links are never stopped.
      </p>
      <div className={s.grid}>
        <div className={s.col}>
          <h3 className={s.h3}>Dialog</h3>
          <div>
            <Button variant="secondary" onClick={() => setOpen(true)}>
              Delete a note
            </Button>
          </div>
          {deleted && <p className={s.note}>Deleted (sample only).</p>}
          <div>
            <Button variant="secondary" onClick={() => setDrawer(true)}>
              Open a drawer with a form
            </Button>
          </div>
          <Drawer open={drawer} onClose={() => setDrawer(false)} title="Close task" subtitle="Type an outcome, then press Esc, × or the backdrop.">
            <DrawerForm onDone={() => setDrawer(false)} />
          </Drawer>
          <Dialog
            open={open}
            onClose={() => setOpen(false)}
            role="alertdialog"
            title="Delete this note?"
            footer={
              <>
                <Button variant="secondary" onClick={() => setOpen(false)} data-autofocus>
                  Keep note
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    setDeleted(true);
                    setOpen(false);
                  }}
                >
                  Delete note
                </Button>
              </>
            }
          >
            <p>&ldquo;Called Ana Solís about the S.A. books&rdquo; will be removed from the timeline for everyone.</p>
          </Dialog>
        </div>
        <div className={s.col}>
          <h3 className={s.h3}>Unsaved-changes guard</h3>
          <TextArea
            label="Draft note"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type here, then try a link below or browser Back."
            hint={dirty ? "Unsaved changes." : "Nothing to lose yet."}
          />
          <div>
            <Button size="sm" onClick={() => setSaved(draft)} disabled={!dirty}>
              Save note
            </Button>
          </div>
          <ul className={s.note}>
            <li>
              <Link href="/pricing">Pricing (next/link, asks)</Link>
            </li>
            <li>
              <button type="button" className={s.linkBtn} onClick={() => void leave.push("/about")}>
                About (router push through useLeaveGuard, asks)
              </button>
            </li>
            <li>
              <a href="#schedule">Time and schedule (hash link, never asks)</a>
            </li>
            <li>
              <a href="/pricing" target="_blank" rel="noreferrer">
                Pricing in a new tab (never asks)
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/** A form inside a Drawer: one useUnsavedChanges line makes Esc, × and the backdrop ask. */
function DrawerForm({ onDone }: { onDone: () => void }) {
  const [outcome, setOutcome] = useState("");
  useUnsavedChanges(outcome.trim() !== "", "The outcome you wrote is not saved yet. If you close now, it will be lost.");
  return (
    <div className={s.col}>
      <TextArea label="Outcome" value={outcome} onChange={(e) => setOutcome(e.target.value)} placeholder="Called Marco Villalobos; he uploads his DIMEX by Friday." />
      <div>
        <Button onClick={onDone} disabled={!outcome.trim()}>
          Close task
        </Button>
      </div>
    </div>
  );
}
