import { useCallback, useEffect, useId, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type MeetingType, type Slot, ScheduleApiError } from "@/lib/schedule-api";
import { type BookingConfig, describeAdminError, previewSlots } from "@/lib/schedule-admin-api";
import OpenTimesCalendar from "@/components/schedule-admin/open-times-calendar";
import { addDaysToKey } from "@/lib/open-blocks";
import { dateKeyInZone, formatDateKey, formatSlotTime, groupSlotsByDate } from "@/lib/slot-calendar";
import { cn } from "@/lib/utils";

const PREVIEW_DAYS = 14;

interface Props {
  token: string;
  savedConfig: BookingConfig;
  version: string | null;
  unsaved: boolean;
}

export default function OpenTimesPreview({ token, savedConfig, version, unsaved }: Props) {
  const selectId = useId();
  const [typeId, setTypeId] = useState(savedConfig.types[0].id);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"calendar" | "list">("calendar");

  const type: MeetingType = savedConfig.types.find(t => t.id === typeId) ?? savedConfig.types[0];

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSlots((await previewSlots(token, type.id)).slots);
    } catch (err) {
      setError(describeAdminError(err instanceof ScheduleApiError ? err.code : "server_error"));
      setSlots(null);
    } finally {
      setLoading(false);
    }
  }, [token, type.id]);

  useEffect(() => {
    void load();
  }, [load, version]);

  const days: [string, Slot[]][] = slots ? Array.from(groupSlotsByDate(slots, savedConfig.timeZone).entries()) : [];
  const rangeStart = dateKeyInZone(Date.now(), savedConfig.timeZone);
  const rangeEnd = addDaysToKey(rangeStart, PREVIEW_DAYS);

  return (
    <section className="grid gap-4 rounded-md border border-border p-4" aria-labelledby={`${selectId}-heading`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 id={`${selectId}-heading`} className="text-base font-semibold">Open times visitors will see</h3>
          <p className="text-sm text-muted-foreground">
            Your saved hours minus everything busy on your Google Calendar, next 14 days ({savedConfig.timeZone.replace(/_/g, " ")}).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor={selectId} className="sr-only">Meeting type to preview</label>
          <select
            id={selectId}
            value={type.id}
            onChange={e => setTypeId(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
          >
            {savedConfig.types.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <div className="flex rounded-md border border-input p-0.5" role="group" aria-label="Preview layout">
            {(["calendar", "list"] as const).map(option => (
              <button
                key={option}
                type="button"
                aria-pressed={view === option}
                onClick={() => setView(option)}
                className={cn(
                  "rounded px-2.5 py-1 text-xs capitalize transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
                  view === option ? "bg-brand-soft font-medium text-brand" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {option}
              </button>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw />
            Refresh
          </Button>
        </div>
      </div>

      {unsaved && <p className="text-sm text-muted-foreground">Save your changes to see them reflected here.</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {loading && <p className="text-sm text-muted-foreground">Reading your calendar…</p>}
      {!loading && slots && slots.length === 0 && (
        <p className="text-sm">No open times in the next 14 days. Widen your hours or clear some calendar time.</p>
      )}
      {!loading && slots && view === "calendar" && (
        <OpenTimesCalendar
          slots={slots}
          timeZone={savedConfig.timeZone}
          weeklyHours={savedConfig.weeklyHours}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
        />
      )}
      {!loading && view === "list" && days.length > 0 && (
        <ul className="grid gap-3">
          {days.map(([dateKey, daySlots]) => (
            <li key={dateKey} className="grid gap-1 sm:grid-cols-[10rem_1fr]">
              <span className="text-sm font-medium">{formatDateKey(dateKey, "full")}</span>
              <span className="text-sm text-muted-foreground">
                {daySlots.map(s => formatSlotTime(s.start, savedConfig.timeZone)).join(" · ")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
