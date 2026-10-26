"use client";

import { useMember } from "./MemberContext";
import { areaLabel } from "./format";
import s from "./MatterSwitcher.module.scss";
import { Select } from "@/components/ui";

/** Native select: one tap on a phone, keyboard friendly everywhere. */
export default function MatterSwitcher() {
  const { home, matterId, setMatterId } = useMember();
  if (home.matters.length < 2) return null;
  return (
    <div className={s.wrap}>
      <Select label="Matter" id="matter-switcher" value={matterId ?? ""} onChange={(e) => setMatterId(e.target.value)}>
        {home.matters.map((m) => (
          <option key={m.id} value={m.id}>
            {m.title}
            {m.area ? ` (${areaLabel(m.area)})` : ""}
            {m.closedAt ? " · done" : ""}
          </option>
        ))}
      </Select>
    </div>
  );
}
