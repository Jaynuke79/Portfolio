import type { Slot } from "@/lib/schedule-api";
import type { WeeklyHours } from "@/lib/schedule-admin-api";
import { dateKeyInZone } from "@/lib/slot-calendar";

/** Matches the backend's slot grid, so consecutive starts are exactly one step apart. */
const SLOT_STEP_MS = 30 * 60 * 1000;
const DAY_MS = 86400000;

export interface OpenBlock {
  dateKey: string;
  start: string;
  end: string;
  startMinutes: number;
  endMinutes: number;
  starts: string[];
}

/** Minutes since midnight of an instant, read on the wall clock of `timeZone`. */
export function wallMinutes(iso: string, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", hour: "2-digit", minute: "2-digit" }).formatToParts(
    new Date(iso)
  );
  const value = (type: string) => Number(parts.find(p => p.type === type)?.value ?? 0);
  return value("hour") * 60 + value("minute");
}

/**
 * Collapses bookable starts into the continuous open stretches a calendar
 * should draw: starts one grid step apart belong to the same block, which runs
 * from the first start to the end of the last slot. Drawing raw slots instead
 * would stack overlapping boxes whenever a meeting is longer than the step.
 */
export function mergeOpenBlocks(slots: Slot[], timeZone: string): OpenBlock[] {
  const sorted = [...slots].sort((a, b) => a.start.localeCompare(b.start));
  const blocks: OpenBlock[] = [];
  for (const slot of sorted) {
    const dateKey = dateKeyInZone(slot.start, timeZone);
    const last = blocks[blocks.length - 1];
    const lastStartMs = last ? new Date(last.starts[last.starts.length - 1]).getTime() : 0;
    if (last && last.dateKey === dateKey && new Date(slot.start).getTime() - lastStartMs <= SLOT_STEP_MS) {
      last.starts.push(slot.start);
      if (slot.end > last.end) last.end = slot.end;
    } else {
      blocks.push({ dateKey, start: slot.start, end: slot.end, startMinutes: 0, endMinutes: 0, starts: [slot.start] });
    }
  }
  for (const block of blocks) {
    block.startMinutes = wallMinutes(block.start, timeZone);
    const endsSameDay = dateKeyInZone(block.end, timeZone) === block.dateKey;
    block.endMinutes = endsSameDay ? wallMinutes(block.end, timeZone) : 24 * 60;
  }
  return blocks;
}

function keyToUtcMs(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function utcMsToKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Monday-first weeks, as date keys, that together cover [startKey, endKey]. */
export function weeksCovering(startKey: string, endKey: string): string[][] {
  const startMs = keyToUtcMs(startKey);
  const mondayOffset = (new Date(startMs).getUTCDay() + 6) % 7;
  const weeks: string[][] = [];
  for (let monday = startMs - mondayOffset * DAY_MS; monday <= keyToUtcMs(endKey); monday += 7 * DAY_MS) {
    weeks.push(Array.from({ length: 7 }, (_, i) => utcMsToKey(monday + i * DAY_MS)));
  }
  return weeks;
}

export function weekdayOfKey(dateKey: string): number {
  return new Date(keyToUtcMs(dateKey)).getUTCDay();
}

export function addDaysToKey(dateKey: string, days: number): string {
  return utcMsToKey(keyToUtcMs(dateKey) + days * DAY_MS);
}

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Whole-hour bounds wide enough for every configured window and open block. */
export function hourBounds(weeklyHours: WeeklyHours, blocks: OpenBlock[]): { startHour: number; endHour: number } {
  const starts = [...Object.values(weeklyHours).flat().map(w => toMinutes(w[0])), ...blocks.map(b => b.startMinutes)];
  const ends = [...Object.values(weeklyHours).flat().map(w => toMinutes(w[1])), ...blocks.map(b => b.endMinutes)];
  if (starts.length === 0) return { startHour: 9, endHour: 17 };
  return { startHour: Math.floor(Math.min(...starts) / 60), endHour: Math.ceil(Math.max(...ends) / 60) };
}
