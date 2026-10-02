import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Slot } from "@/lib/schedule-api";
import type { WeeklyHours } from "@/lib/schedule-admin-api";
import { hourBounds, mergeOpenBlocks, weekdayOfKey, weeksCovering } from "@/lib/open-blocks";
import { formatDateKey, formatSlotTime, formatTimeRange } from "@/lib/slot-calendar";

const HOUR_PX = 44;
const MIN_LABEL_PX = 18;

function minutesOf(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function hourLabel(hour: number): string {
  const suffix = hour < 12 || hour === 24 ? "AM" : "PM";
  return `${hour % 12 === 0 ? 12 : hour % 12} ${suffix}`;
}

interface Props {
  slots: Slot[];
  timeZone: string;
  weeklyHours: WeeklyHours;
  rangeStart: string;
  rangeEnd: string;
}

export default function OpenTimesCalendar({ slots, timeZone, weeklyHours, rangeStart, rangeEnd }: Props) {
  const blocks = useMemo(() => mergeOpenBlocks(slots, timeZone), [slots, timeZone]);
  const weeks = useMemo(() => weeksCovering(rangeStart, rangeEnd), [rangeStart, rangeEnd]);
  const { startHour, endHour } = useMemo(() => hourBounds(weeklyHours, blocks), [weeklyHours, blocks]);
  const [weekIndex, setWeekIndex] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const week = weeks[Math.min(weekIndex, weeks.length - 1)];
  const topOf = (minutes: number) => ((minutes - startHour * 60) / 60) * HOUR_PX;
  const height = (endHour - startHour) * HOUR_PX;
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const canGoBack = weekIndex > 0;
  const canGoForward = weekIndex < weeks.length - 1;

  // On narrow screens the grid scrolls sideways; start at the first day the
  // preview covers rather than at days already past.
  useEffect(() => {
    const scroller = scrollerRef.current;
    const firstDay = scroller?.querySelector<HTMLElement>(`[data-date="${week.find(d => d >= rangeStart) ?? week[0]}"]`);
    const gutter = scroller?.querySelector<HTMLElement>("[data-gutter]");
    if (scroller && firstDay && gutter) scroller.scrollLeft = firstDay.offsetLeft - gutter.offsetWidth;
  }, [week, rangeStart]);

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium" aria-live="polite">
          {formatDateKey(week[0])} – {formatDateKey(week[6])}
        </p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-xs text-muted-foreground" aria-hidden="true">
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-muted" />Your hours</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border-l-2 border-brand bg-brand-soft" />Open</span>
          </div>
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Previous week"
              aria-disabled={!canGoBack}
              className={cn(!canGoBack && "opacity-40")}
              onClick={() => canGoBack && setWeekIndex(i => i - 1)}
            >
              <ChevronLeft />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Next week"
              aria-disabled={!canGoForward}
              className={cn(!canGoForward && "opacity-40")}
              onClick={() => canGoForward && setWeekIndex(i => i + 1)}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      </div>

      <div ref={scrollerRef} className="overflow-x-auto rounded-md border border-border">
        <div className="grid min-w-[640px] grid-cols-[3.5rem_repeat(7,minmax(0,1fr))]">
          <div data-gutter className="sticky left-0 z-10 border-b border-border bg-card" aria-hidden="true" />
          {week.map(dateKey => {
            const inRange = dateKey >= rangeStart && dateKey <= rangeEnd;
            return (
              <div
                key={dateKey}
                data-date={dateKey}
                aria-hidden="true"
                className={cn("border-b border-l border-border px-2 py-2 text-center text-xs", !inRange && "text-muted-foreground/50")}
              >
                <div className="font-medium">{formatDateKey(dateKey, "full").split(",")[0].slice(0, 3)}</div>
                <div>{Number(dateKey.slice(8))}</div>
              </div>
            );
          })}

          <div className="sticky left-0 z-10 bg-card" style={{ height }} aria-hidden="true">
            {hours.map(hour => (
              <span
                key={hour}
                className={cn("absolute right-2 text-[10px] text-muted-foreground", hour === startHour ? "translate-y-0.5" : "-translate-y-1/2")}
                style={{ top: topOf(hour * 60) }}
              >
                {hourLabel(hour)}
              </span>
            ))}
          </div>

          {week.map(dateKey => {
            const inRange = dateKey >= rangeStart && dateKey <= rangeEnd;
            const windows = weeklyHours[String(weekdayOfKey(dateKey))] ?? [];
            const dayBlocks = blocks.filter(b => b.dateKey === dateKey);
            return (
              <div key={dateKey} className="relative border-l border-border" style={{ height }}>
                {hours.map(hour => (
                  <div key={hour} className="absolute inset-x-0 border-t border-border/60" style={{ top: topOf(hour * 60) }} aria-hidden="true" />
                ))}
                {windows.map(([open, close]) => (
                  <div
                    key={open}
                    aria-hidden="true"
                    className="absolute inset-x-0 bg-muted"
                    style={{ top: topOf(minutesOf(open)), height: topOf(minutesOf(close)) - topOf(minutesOf(open)) }}
                  />
                ))}
                {!inRange && <div className="absolute inset-0 bg-background/70" aria-hidden="true" />}
                <ul aria-label={`${formatDateKey(dateKey, "full")}${dayBlocks.length ? "" : ", no open times"}`} className="contents">
                  {dayBlocks.map(block => {
                    const blockHeight = topOf(block.endMinutes) - topOf(block.startMinutes);
                    const range = formatTimeRange(block.start, block.end, timeZone);
                    const startsText = `${block.starts.length} start time${block.starts.length === 1 ? "" : "s"}`;
                    return (
                      <li
                        key={block.start}
                        title={`${range} · starts at ${block.starts.map(s => formatSlotTime(s, timeZone)).join(", ")}`}
                        className="absolute inset-x-1 overflow-hidden rounded-sm border-l-2 border-brand bg-brand-soft px-1.5 text-[11px] leading-tight text-brand"
                        style={{ top: topOf(block.startMinutes), height: Math.max(blockHeight, 4) }}
                      >
                        <span className="sr-only">Open {range}, {startsText}</span>
                        {blockHeight >= MIN_LABEL_PX && (
                          <span aria-hidden="true" className="block break-words pt-0.5 font-medium">{range}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
