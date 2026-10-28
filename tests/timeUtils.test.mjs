// Run: npm test  (node --test, Node 22.18+ strips the TypeScript types).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  findOverlaps,
  formatTime12,
  nextWindow,
  parseTimeInput,
  rangeError,
  slotCount,
  stepTime,
  timeOptions,
  validateWindows,
  weeklySlotTotal,
} from "../src/components/ui/timeUtils.ts";

test("parseTimeInput reads the common ways people type a time", () => {
  assert.equal(parseTimeInput("8:30"), "08:30");
  assert.equal(parseTimeInput("830"), "08:30");
  assert.equal(parseTimeInput("0830"), "08:30");
  assert.equal(parseTimeInput("8.30"), "08:30");
  assert.equal(parseTimeInput("8h30"), "08:30");
  assert.equal(parseTimeInput("8:30p"), "20:30");
  assert.equal(parseTimeInput("8:30 PM"), "20:30");
  assert.equal(parseTimeInput("12am"), "00:00");
  assert.equal(parseTimeInput("12 pm"), "12:00");
  assert.equal(parseTimeInput("20:30"), "20:30");
  assert.equal(parseTimeInput("2030"), "20:30");
  assert.equal(parseTimeInput("3"), "15:00"); // business-hours guess
  assert.equal(parseTimeInput("03:00"), "03:00"); // leading zero means 24-hour
  assert.equal(parseTimeInput("9"), "09:00");
  assert.equal(parseTimeInput("noon"), "12:00");
  assert.equal(parseTimeInput("midnight"), "00:00");
  assert.equal(parseTimeInput("midnight", true), "24:00");
  assert.equal(parseTimeInput("24:00"), null);
  assert.equal(parseTimeInput("24:00", true), "24:00");
  assert.equal(parseTimeInput("25:00"), null);
  assert.equal(parseTimeInput("8:75"), null);
  assert.equal(parseTimeInput("13pm"), null);
  assert.equal(parseTimeInput("soon"), null);
  assert.equal(parseTimeInput(""), null);
});

test("formatTime12", () => {
  assert.equal(formatTime12("00:00"), "12:00 AM");
  assert.equal(formatTime12("08:30"), "8:30 AM");
  assert.equal(formatTime12("12:00"), "12:00 PM");
  assert.equal(formatTime12("13:45"), "1:45 PM");
  assert.equal(formatTime12("24:00"), "12:00 AM (end of day)");
  assert.equal(formatTime12("bad"), "");
});

test("stepTime snaps to the grid and clamps", () => {
  assert.equal(stepTime("08:30", 1), "08:45");
  assert.equal(stepTime("08:37", 1), "08:45");
  assert.equal(stepTime("08:37", -1), "08:30");
  assert.equal(stepTime("08:30", -1), "08:15");
  assert.equal(stepTime("23:50", 1), "23:59");
  assert.equal(stepTime("23:50", 1, 15, "00:00", "24:00"), "24:00");
  assert.equal(stepTime("00:05", -1), "00:00");
  assert.equal(stepTime("", 1), "00:15");
});

test("timeOptions", () => {
  assert.equal(timeOptions(15).length, 96);
  assert.deepEqual(timeOptions(60, "08:00", "10:00"), ["08:00", "09:00", "10:00"]);
});

test("slotCount and rangeError", () => {
  assert.equal(slotCount("08:30", "12:00"), 10);
  assert.equal(slotCount("08:30", "08:49"), 0);
  assert.equal(slotCount("12:00", "08:00"), 0);
  assert.equal(slotCount("22:00", "24:00"), 6);
  assert.equal(rangeError("08:30", "12:00"), null);
  assert.match(rangeError("12:00", "08:00"), /after the start/);
  assert.match(rangeError("08:30", "08:30"), /after the start/);
  assert.match(rangeError("08:30", "08:45"), /at least 20 minutes/);
  assert.match(rangeError("", "08:45"), /start time/);
});

test("findOverlaps ignores touching windows and other days", () => {
  const w = [
    { day: 1, start: "08:30", end: "12:00" },
    { day: 1, start: "12:00", end: "16:00" },
    { day: 2, start: "09:00", end: "13:00" },
  ];
  assert.equal(findOverlaps(w).size, 0);
  const bad = [...w, { day: 1, start: "11:00", end: "13:00" }];
  const o = findOverlaps(bad);
  assert.deepEqual([...o.keys()].sort(), [0, 1, 3]);
  assert.equal(o.get(3), 0);
  const v = validateWindows(bad);
  assert.match(v.get(3), /Overlaps 8:30 AM to 12:00 PM/);
  assert.equal(v.has(2), false);
});

test("weeklySlotTotal with and without the daily cap", () => {
  const days = [1, 2, 3, 4, 5].flatMap((day) => [
    { day, start: "08:30", end: "12:00" },
    { day, start: "13:30", end: "16:30" },
  ]);
  assert.equal(weeklySlotTotal(days), 95); // (10 + 9) x 5
  assert.equal(weeklySlotTotal(days, 20, 6), 30);
});

test("nextWindow", () => {
  assert.deepEqual(nextWindow([]), { start: "09:00", end: "11:00" });
  assert.deepEqual(nextWindow([{ start: "08:30", end: "12:00" }]), { start: "12:00", end: "14:00" });
  assert.deepEqual(nextWindow([{ start: "20:00", end: "23:00" }]), { start: "23:00", end: "24:00" });
  assert.equal(nextWindow([{ start: "20:00", end: "24:00" }]), null);
});
