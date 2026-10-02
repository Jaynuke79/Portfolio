import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WEEKDAYS } from "@/lib/booking-config";
import type { TimeWindow, WeeklyHours } from "@/lib/schedule-admin-api";

const DEFAULT_WINDOW: TimeWindow = ["09:00", "17:00"];

function addHour(time: string): string {
  const [h, m] = time.split(":").map(Number);
  return `${String(Math.min(h + 1, 23)).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
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
                    className="w-fit"
                    onClick={() => {
                      const lastEnd = windows[windows.length - 1][1];
                      setDay(day, [...windows, [lastEnd, addHour(lastEnd)]]);
                    }}
                  >
                    <Plus />
                    Add window
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
