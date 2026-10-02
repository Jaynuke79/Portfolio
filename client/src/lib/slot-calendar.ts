import type { Slot } from "@/lib/schedule-api";

/** Backend date ranges are in the owner's zone; padding covers any offset gap. */
const RANGE_PAD_DAYS = 2;

function toDateKey(utcMs: number): string {
  return new Date(utcMs).toISOString().slice(0, 10);
}

function dateKeyToUtcMs(dateKey: string): number {
  const [year, month, day] = dateKey.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

export function dateKeyInZone(iso: string | number, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

export function groupSlotsByDate(slots: Slot[], timeZone: string): Map<string, Slot[]> {
  const byDate = new Map<string, Slot[]>();
  for (const slot of slots) {
    const key = dateKeyInZone(slot.start, timeZone);
    byDate.set(key, [...(byDate.get(key) ?? []), slot]);
  }
  return byDate;
}

/** Calendar cells for a month starting on Sunday; `null` pads the first week. */
export function monthCells(year: number, month: number): (string | null)[] {
  const leading = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (string | null)[] = Array(leading).fill(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(toDateKey(Date.UTC(year, month, day)));
  return cells;
}

export function monthFetchRange(year: number, month: number): { start: string; end: string } {
  const dayMs = 86400000;
  return {
    start: toDateKey(Date.UTC(year, month, 1) - RANGE_PAD_DAYS * dayMs),
    end: toDateKey(Date.UTC(year, month + 1, 0) + RANGE_PAD_DAYS * dayMs),
  };
}

export function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const d = new Date(Date.UTC(year, month + delta, 1));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
}

export function formatMonthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    Date.UTC(year, month, 1)
  );
}

export function formatDateKey(dateKey: string, style: "long" | "full" = "long"): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: style === "full" ? "long" : undefined,
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(dateKeyToUtcMs(dateKey));
}

export function formatSlotTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone }).format(new Date(iso));
}

export function formatSlotDateTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
    timeZoneName: "short",
  }).format(new Date(iso));
}

export function visitorTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function timeZoneOptions(current: string): string[] {
  const zones = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [];
  return zones.includes(current) ? zones : [current, ...zones];
}

/** "9:00–9:45 AM", or "11:30 AM–1:00 PM" when the range crosses noon. */
export function formatTimeRange(startIso: string, endIso: string, timeZone: string): string {
  const parts = (iso: string) => {
    const p = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone }).formatToParts(new Date(iso));
    const time = p.filter(x => x.type === "hour" || x.type === "minute" || (x.type === "literal" && x.value === ":")).map(x => x.value).join("");
    return { time, period: p.find(x => x.type === "dayPeriod")?.value ?? "" };
  };
  const start = parts(startIso);
  const end = parts(endIso);
  return start.period === end.period
    ? `${start.time}–${end.time} ${end.period}`.trim()
    : `${start.time} ${start.period}–${end.time} ${end.period}`.trim();
}
