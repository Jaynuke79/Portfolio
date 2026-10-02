import { useId, useMemo } from "react";
import { ChevronLeft, ChevronRight, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Slot } from "@/lib/schedule-api";
import {
  formatDateKey,
  formatMonthLabel,
  formatSlotTime,
  monthCells,
  timeZoneOptions,
} from "@/lib/slot-calendar";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Props {
  year: number;
  month: number;
  canGoBack: boolean;
  canGoForward: boolean;
  onMonthChange: (delta: number) => void;
  slotsByDate: Map<string, Slot[]>;
  loading: boolean;
  selectedDate: string | null;
  onSelectDate: (dateKey: string) => void;
  onSelectSlot: (slot: Slot) => void;
  timeZone: string;
  onTimeZoneChange: (zone: string) => void;
}

export default function SchedulerCalendar({
  year,
  month,
  canGoBack,
  canGoForward,
  onMonthChange,
  slotsByDate,
  loading,
  selectedDate,
  onSelectDate,
  onSelectSlot,
  timeZone,
  onTimeZoneChange,
}: Props) {
  const zoneSelectId = useId();
  const monthLabelId = useId();
  const cells = useMemo(() => monthCells(year, month), [year, month]);
  const zones = useMemo(() => timeZoneOptions(timeZone), [timeZone]);
  const daySlots = selectedDate ? slotsByDate.get(selectedDate) ?? [] : [];

  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_14rem]">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 id={monthLabelId} className="text-lg font-semibold tracking-tight" aria-live="polite">
            {formatMonthLabel(year, month)}
          </h2>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Previous month"
              aria-disabled={!canGoBack}
              className={cn(!canGoBack && "opacity-40")}
              onClick={() => canGoBack && onMonthChange(-1)}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Next month"
              aria-disabled={!canGoForward}
              className={cn(!canGoForward && "opacity-40")}
              onClick={() => canGoForward && onMonthChange(1)}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground" aria-hidden="true">
          {WEEKDAYS.map(day => (
            <div key={day} className="py-1">{day}</div>
          ))}
        </div>
        <div role="group" aria-labelledby={monthLabelId} aria-busy={loading} className="grid grid-cols-7 gap-1">
          {cells.map((dateKey, i) => {
            if (!dateKey) return <div key={`pad-${i}`} />;
            const count = slotsByDate.get(dateKey)?.length ?? 0;
            const available = count > 0;
            const selected = dateKey === selectedDate;
            return (
              <button
                key={dateKey}
                type="button"
                aria-disabled={!available}
                aria-pressed={selected}
                aria-label={`${formatDateKey(dateKey, "full")}, ${
                  available ? `${count} time${count === 1 ? "" : "s"} available` : "no availability"
                }`}
                onClick={() => available && onSelectDate(dateKey)}
                className={cn(
                  "aspect-square rounded-md text-sm transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
                  selected
                    ? "bg-brand font-semibold text-primary-foreground"
                    : available
                      ? "bg-brand-soft font-medium text-brand hover:bg-brand hover:text-primary-foreground"
                      : "cursor-default text-muted-foreground/50"
                )}
              >
                {Number(dateKey.slice(8))}
              </button>
            );
          })}
        </div>
        {loading && <p className="mt-3 text-sm text-muted-foreground">Loading availability…</p>}
        {!loading && slotsByDate.size === 0 && (
          <p className="mt-3 text-sm text-muted-foreground">No open times this month — try the next one.</p>
        )}

        <div className="mt-6 grid gap-2">
          <label htmlFor={zoneSelectId} className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="h-4 w-4" aria-hidden="true" />
            Time zone
          </label>
          <select
            id={zoneSelectId}
            value={timeZone}
            onChange={e => onTimeZoneChange(e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
          >
            {zones.map(zone => (
              <option key={zone} value={zone}>{zone.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium">
          {selectedDate ? formatDateKey(selectedDate, "full") : "Select a day"}
        </h3>
        {selectedDate && (
          <ul className="grid max-h-80 gap-2 overflow-y-auto pr-1">
            {daySlots.map(slot => (
              <li key={slot.start}>
                <Button variant="outline" className="w-full" onClick={() => onSelectSlot(slot)}>
                  {formatSlotTime(slot.start, timeZone)}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
