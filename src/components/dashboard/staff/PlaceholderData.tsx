"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { staffApi } from "@/lib/api";
import {
  getExcludePlaceholder,
  serverExcludePlaceholder,
  setExcludePlaceholder,
  subscribeExcludePlaceholder,
} from "@/lib/placeholderPref";
import { Notice, Switch, useLeaveGuard } from "@/components/ui";
import s from "./PlaceholderData.module.scss";

/**
 * "Exclude placeholder data" for the staff and CSM portals.
 *
 * - `useExcludePlaceholder()`: the viewer's choice (lib/placeholderPref.ts).
 * - `<PlaceholderDataNotice>`: the notice with the switch. The portal frames
 *   render it above every page while placeholder records are loaded.
 * - `<PlaceholderScope>`: wraps the page. When the choice changes it mounts
 *   the page again, so every list, board, figure and chart is read again
 *   under the new choice (lib/api.ts adds the parameter to each read).
 */

/** True while the viewer leaves placeholder data out. */
export function useExcludePlaceholder(): boolean {
  return useSyncExternalStore(subscribeExcludePlaceholder, getExcludePlaceholder, serverExcludePlaceholder);
}

interface Loaded {
  members: number;
  lawyers: number;
}

const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? "" : "s"}`;

function loadedText(l: Loaded): string {
  const parts = [l.members > 0 ? plural(l.members, "example member") : "", l.lawyers > 0 ? plural(l.lawyers, "example lawyer") : ""].filter(Boolean);
  return parts.join(" and ");
}

/**
 * The staff-only notice shown while seed data is in the database, with the
 * switch that leaves it out of every page. Renders nothing when no
 * placeholder records are loaded (and the choice is off).
 */
export function PlaceholderDataNotice() {
  const exclude = useExcludePlaceholder();
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  // Changing the choice reads the page again: ask first when a form has unsaved changes.
  const leave = useLeaveGuard();

  useEffect(() => {
    let alive = true;
    // The count is the same whatever the choice, so one saved answer serves both.
    staffApi
      .get<Loaded>("/api/dashboard/staff/placeholder", { on401: "throw", query: { excludePlaceholder: undefined } })
      .then((r) => alive && setLoaded({ members: Number(r?.members ?? 0), lawyers: Number(r?.lawyers ?? 0) }))
      .catch(() => {
        // The pages report their own loading problems; this notice just stays away.
      });
    return () => {
      alive = false;
    };
  }, []);

  const any = !!loaded && (loaded.members > 0 || loaded.lawyers > 0);
  // Nothing loaded: no notice. One exception: the choice is still on from
  // earlier, so say so and let the viewer turn it off.
  if (!loaded || (!any && !exclude)) return null;

  const toggle = (
    <Switch
      label="Exclude placeholder data"
      checked={exclude}
      onChange={(next) => void leave.guard(() => setExcludePlaceholder(next), { title: "Reload this page without saving?", confirmLabel: "Reload without saving" })}
      data-tour="exclude-placeholder"
    />
  );

  if (exclude) {
    return (
      <Notice
        tone="info"
        variant="banner"
        headingLevel={2}
        className={s.notice}
        title="Placeholder data is left out"
        terms={["placeholderData"]}
        actions={toggle}
        fix={{
          label: "What does this mean?",
          summary: "Only ILP staff see this. Members never see example data.",
          steps: [
            "Every page now counts and lists real records only: figures, charts, boards, lists and exports.",
            "A direct link to an example member still opens that member, marked Placeholder.",
            "To see the examples again, turn off Exclude placeholder data. Your choice is kept in this browser.",
            "Before real members join, ask an admin to remove the examples for good with scripts/removePlaceholders.ts in the server folder.",
          ],
          scene: () => import("@/tutorials/noticeScenes").then((m) => m.placeholderData),
        }}
      >
        {any
          ? `${loadedText(loaded)} ${loaded.members + loaded.lawyers === 1 ? "is" : "are"} hidden on every page. You are looking at real records only.`
          : "No example records are loaded. You can turn this off."}
      </Notice>
    );
  }

  return (
    <Notice
      tone="warning"
      variant="banner"
      headingLevel={2}
      className={s.notice}
      title="Placeholder data is loaded"
      terms={["placeholderData"]}
      actions={toggle}
      fix={{
        summary: "Only ILP staff see this. Members never see example data.",
        steps: [
          "To hide the examples for now, turn on Exclude placeholder data. It applies to every page: figures, charts, boards, lists and exports. Your choice is kept in this browser.",
          "Before real members join, ask an admin to remove the examples for good.",
          "The admin first runs scripts/removePlaceholders.ts with --dry-run in the server folder to see what will go, then runs it again with --confirm-project set to the project id.",
          "Reload this page. This notice disappears once no examples are left.",
        ],
        scene: () => import("@/tutorials/noticeScenes").then((m) => m.placeholderData),
      }}
    >
      {loadedText(loaded)} {loaded.members + loaded.lawyers === 1 ? "is" : "are"} in the database and counted in the figures. Rows marked Placeholder are not real people.
    </Notice>
  );
}

/**
 * The page under the viewer's choice. Changing the choice mounts the page
 * again: every read it makes then carries (or drops) the parameter.
 */
export function PlaceholderScope({ children }: { children: ReactNode }) {
  const exclude = useExcludePlaceholder();
  return (
    <div key={exclude ? "real" : "all"} className={s.scope} data-placeholder={exclude ? "excluded" : "included"}>
      {children}
    </div>
  );
}
