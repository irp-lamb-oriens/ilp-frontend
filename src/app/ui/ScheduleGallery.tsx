"use client";

import { useState } from "react";
import {
  ChipSelect,
  DateListInput,
  NumberStepper,
  Switch,
  TimeInput,
  TimeRangeInput,
  WeeklyHoursEditor,
  type WeeklyWindowValue,
} from "@/components/ui";
import s from "./ScheduleGallery.module.scss";

const AREAS = [
  { value: "real_estate", label: "Real estate" },
  { value: "corporate", label: "Corporate" },
  { value: "immigration", label: "Immigration" },
  { value: "tax", label: "Tax" },
  { value: "vehicle", label: "Vehicle" },
  { value: "notary", label: "Notary" },
];

const weekdays = (start: string, end: string): WeeklyWindowValue[] =>
  ([1, 2, 3, 4, 5] as const).map((day) => ({ day, start, end }));

/** Time, schedule and list inputs (lawyer availability) in every state. */
export default function ScheduleGallery() {
  const [time, setTime] = useState("08:30");
  const [range, setRange] = useState({ start: "08:30", end: "12:00" });
  const [on, setOn] = useState(true);
  const [week, setWeek] = useState<WeeklyWindowValue[]>([...weekdays("08:30", "12:00"), ...weekdays("13:30", "16:30")]);
  // Tuesday's second window overlaps its first, to show the inline error.
  const [clash, setClash] = useState<WeeklyWindowValue[]>([
    { day: 1, start: "09:00", end: "12:00" },
    { day: 2, start: "09:00", end: "12:00" },
    { day: 2, start: "11:30", end: "14:00" },
  ]);
  const [areas, setAreas] = useState(["real_estate", "notary"]);
  const [dates, setDates] = useState(["2026-12-24", "2026-12-25", "2027-01-01"]);
  const [lead, setLead] = useState(18);
  const [calls, setCalls] = useState(6);

  return (
    <div className={s.wrap}>
      <p className={s.note}>
        Values keep their stored formats: times are 24-hour <code>&quot;HH:MM&quot;</code> (shown as &ldquo;8:30 AM&rdquo;),
        dates <code>&quot;YYYY-MM-DD&quot;</code>. In a time field, ArrowUp/ArrowDown move 15 minutes, PageUp/PageDown an hour,
        and typing &ldquo;830&rdquo;, &ldquo;2:15p&rdquo; or &ldquo;14:00&rdquo; works. Tab into any control to see the focus ring.
      </p>

      <div className={s.grid}>
        <div className={s.col}>
          <h3 className={s.h3}>TimeInput</h3>
          <TimeInput label="Call starts" value={time} onChange={setTime} hint={`Stored as "${time}".`} />
          <TimeInput label="Office opens" value="07:00" onChange={() => undefined} error="Calls cannot start before 7:30 AM." />
          <TimeInput label="Office closes" value="17:00" onChange={() => undefined} disabled />
          <TimeInput label="Compact (label hidden)" hideLabel value="13:45" onChange={() => undefined} noIcon />
        </div>

        <div className={s.col}>
          <h3 className={s.h3}>TimeRangeInput</h3>
          <TimeRangeInput label="Morning hours" value={range} onChange={setRange} hint="Ranges must fit one 20-minute call." />
          <TimeRangeInput label="Ends before it starts" value={{ start: "14:00", end: "12:00" }} onChange={() => undefined} />
          <TimeRangeInput label="Too short for a call" value={{ start: "09:00", end: "09:15" }} onChange={() => undefined} />
          <TimeRangeInput label="Locked" value={{ start: "13:30", end: "16:30" }} onChange={() => undefined} disabled />
        </div>

        <div className={s.col}>
          <h3 className={s.h3}>Switch and NumberStepper</h3>
          <Switch label="Available on Saturday" checked={on} onChange={setOn} hint={on ? "Members can book Saturday calls." : "No Saturday calls."} />
          <Switch label="Read busy times from Google Calendar" checked={false} onChange={() => undefined} disabled />
          <NumberStepper label="Minimum notice before a call" value={lead} onChange={setLead} min={0} max={168} presets={[0, 2, 4, 12, 18, 24, 48, 72, 168]} unit={["hour", "hours"]} />
          <NumberStepper label="Most calls in one day" value={calls} onChange={setCalls} min={1} max={20} unit={["call", "calls"]} />
          <NumberStepper label="Calls this week" value={0} onChange={() => undefined} min={1} max={20} error="Allow at least one call." />
          <NumberStepper label="Call length" value={20} onChange={() => undefined} unit={["minute", "minutes"]} disabled />
        </div>

        <div className={s.col}>
          <h3 className={s.h3}>ChipSelect and DateListInput</h3>
          <ChipSelect label="Specialties" hint="Members without a lawyer are routed by these." options={AREAS} value={areas} onChange={setAreas} />
          <ChipSelect label="Pick up to two" options={AREAS.slice(0, 4)} value={["tax"]} onChange={() => undefined} max={2} error="Choose at least two areas." />
          <DateListInput label="Days off" value={dates} onChange={setDates} min="2026-10-27" addLabel="Add day off" />
          <DateListInput label="Holidays" value={[]} onChange={() => undefined} disabled emptyText="No holidays set." />
        </div>
      </div>

      <h3 className={s.h3}>WeeklyHoursEditor</h3>
      <div className={s.panel}>
        <WeeklyHoursEditor value={week} onChange={setWeek} maxPerDay={calls} idPrefix="g-week" />
      </div>

      <h3 className={s.h3}>WeeklyHoursEditor: overlapping ranges</h3>
      <div className={s.panel}>
        <WeeklyHoursEditor value={clash} onChange={setClash} days={[1, 2, 3]} idPrefix="g-clash" />
      </div>

      <h3 className={s.h3}>WeeklyHoursEditor: disabled</h3>
      <div className={s.panel}>
        <WeeklyHoursEditor value={weekdays("09:00", "12:00").slice(0, 2)} onChange={() => undefined} days={[1, 2, 6]} disabled idPrefix="g-off" />
      </div>
    </div>
  );
}
