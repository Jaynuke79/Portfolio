import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WEEKDAYS } from "@/lib/booking-config";
import type { TimeWindow, WeeklyHours } from "@/lib/schedule-admin-api";
import { cn } from "@/lib/utils";

const DEFAULT_WINDOW: TimeWindow = ["09:00", "17:00"];
const LAST_MINUTE_OF_DAY = 23 * 60 + 59;

function minutesOf(time: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

function formatMinutes(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function nextWindow(windows: TimeWindow[]): TimeWindow | null {
  const ends = windows.map(([, end]) => minutesOf(end));
  if (ends.some(end => end === null)) return null;
  const latestEnd = Math.max(...(ends as number[]));
  if (latestEnd >= LAST_MINUTE_OF_DAY) return null;
  return [formatMinutes(latestEnd), formatMinutes(Math.min(latestEnd + 60, LAST_MINUTE_OF_DAY))];
}

interface Props {
  weeklyHours: WeeklyHours;
  onChange: (next: WeeklyHours) => void;
}

export default function WeeklyHoursEditor({ weeklyHours, onChange }: Props) {
  const setDay = (day: string, windows: TimeWindow[]) => {
    const next = { ...weeklyHours };
    if (windows.length) next[day] = windows;
    else delete next[day];
    onChange(next);
  };

  return (
    <ul className="divide-y divide-border rounded-md border border-border">
      {WEEKDAYS.map(({ day, name }) => {
        const windows = weeklyHours[day] ?? [];
        const open = windows.length > 0;
        const addable = open ? nextWindow(windows) : null;
        return (
          <li key={day} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
            <label className="flex w-36 shrink-0 items-center gap-2 pt-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={open}
                onChange={e => setDay(day, e.target.checked ? [DEFAULT_WINDOW] : [])}
                className="h-4 w-4 accent-[hsl(var(--brand))]"
              />
              {name}
            </label>
            {open ? (
              <div className="grid flex-1 gap-2">
                {windows.map(([start, end], i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2">
                    <Input
                      type="time"
                      step={300}
                      value={start}
                      aria-label={`${name} window ${i + 1} start`}
                      onChange={e => setDay(day, windows.map((w, j) => (j === i ? [e.target.value, w[1]] : w)))}
                      className="h-10 w-32"
                    />
                    <span className="text-sm text-muted-foreground" aria-hidden="true">to</span>
                    <Input
                      type="time"
                      step={300}
                      value={end}
                      aria-label={`${name} window ${i + 1} end`}
                      onChange={e => setDay(day, windows.map((w, j) => (j === i ? [w[0], e.target.value] : w)))}
                      className="h-10 w-32"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${name} window ${i + 1}`}
                      onClick={() => setDay(day, windows.filter((_, j) => j !== i))}
                    >
                      <X />
                    </Button>
                  </div>
                ))}
                {windows.length < 6 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-disabled={!addable}
                    className={cn("w-fit", !addable && "opacity-40")}
                    onClick={() => addable && setDay(day, [...windows, addable])}
                  >
                    <Plus />
                    Add window
                    {!addable && <span className="sr-only">(no time left in the day)</span>}
                  </Button>
                )}
              </div>
            ) : (
              <p className="pt-2 text-sm text-muted-foreground">Unavailable</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
