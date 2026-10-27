"use client";

/** "Tutorials" from the user menu: replay any tutorial for this role, reset, auto-start switch. */
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { StatusPill } from "../ui/StatusPill";
import { Switch } from "../ui/Switch";
import { useTutorial } from "./context";
import { AUTOSTART_ENV } from "./autostart";
import type { TutorialRole } from "./types";
import s from "./TutorialList.module.scss";

export function TutorialList({ role, onClose }: { role: TutorialRole; onClose: () => void }) {
  const api = useTutorial();
  const list = api.registry?.forRole(role) ?? [];

  return (
    <Dialog
      open
      size="lg"
      onClose={onClose}
      title="Tutorials"
      footer={
        <div className={s.footer}>
          <Button variant="secondary" onClick={() => api.reset()}>
            Reset all tutorials
          </Button>
          <Button onClick={onClose}>Close</Button>
        </div>
      }
    >
      <p className={s.lede}>Short walkthroughs of each screen. Play one again at any time.</p>
      {AUTOSTART_ENV && (
        <Switch
          label="Show a tutorial the first time I open a screen"
          checked={api.autoStartEnabled}
          onChange={(on) => api.setAutoStartEnabled(on)}
        />
      )}
      {list.length === 0 ? (
        <p className={s.empty}>No tutorials for this portal yet.</p>
      ) : (
        <ul className={s.list}>
          {list.map((t) => {
            const seen = api.isSeen(t.id);
            return (
              <li key={t.id} className={s.row}>
                <span className={s.text}>
                  <span className={s.name}>{t.title}</span>
                  {t.summary && <span className={s.summary}>{t.summary}</span>}
                  <span className={s.summary}>
                    {t.steps.length} steps
                  </span>
                </span>
                <StatusPill size="sm" label={seen ? "Seen" : "New"} tone={seen ? "neutral" : "info"} />
                <span className={s.actions}>
                  <Button size="sm" onClick={() => void api.start(t.id)} aria-label={`Play the ${t.title} tutorial`}>
                    Play
                  </Button>
                  {seen && (
                    <Button size="sm" variant="ghost" onClick={() => api.reset(t.id)} aria-label={`Reset the ${t.title} tutorial`}>
                      Reset
                    </Button>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Dialog>
  );
}

export default TutorialList;
