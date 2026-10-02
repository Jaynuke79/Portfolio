/*
  Pure scheduling math, free of Apps Script services so it runs unchanged under
  vitest. Every wall-clock value is interpreted in the owner's time zone; the
  visitor's zone never reaches this file — the browser only re-renders the ISO
  instants produced here.
*/

function slotStepMs() {
  return 30 * 60 * 1000;
}

function zonedParts(epochMs, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(epochMs));
  const values = {};
  for (const part of parts) {
    if (part.type !== 'literal') values[part.type] = Number(part.value);
  }
  return values;
}

function zoneOffsetMs(epochMs, timeZone) {
  const p = zonedParts(epochMs, timeZone);
  const wallAsUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return wallAsUtc - Math.floor(epochMs / 1000) * 1000;
}

/**
 * The instant a wall-clock time occurs in `timeZone`. The offset is sampled
 * twice so a time on the far side of a DST switch picks up the offset that is
 * actually in force then, not the one from the naive UTC guess.
 */
function wallTimeToEpochMs(dateKey, time, timeZone) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const naive = Date.UTC(year, month - 1, day, hour, minute);
  const firstPass = naive - zoneOffsetMs(naive, timeZone);
  return naive - zoneOffsetMs(firstPass, timeZone);
}

function dateKeyInZone(epochMs, timeZone) {
  const p = zonedParts(epochMs, timeZone);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

function eachDateKey(startKey, endKey) {
  const [sy, sm, sd] = startKey.split('-').map(Number);
  const [ey, em, ed] = endKey.split('-').map(Number);
  const keys = [];
  for (let t = Date.UTC(sy, sm - 1, sd); t <= Date.UTC(ey, em - 1, ed); t += 86400000) {
    keys.push(new Date(t).toISOString().slice(0, 10));
  }
  return keys;
}

function weekdayOf(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/**
 * Bookable slots across a date range. `weeklyHours` maps a weekday (0 = Sunday)
 * to wall-clock windows like [["09:00", "12:00"], ["13:00", "17:00"]]. Busy
 * blocks are padded by the buffer, the free remainder of each window is walked
 * on a half-hour grid anchored to the window's start, and anything outside
 * [earliestMs, latestMs] is dropped.
 */
function buildSlots({
  startDate,
  endDate,
  timeZone,
  weeklyHours,
  busy,
  durationMinutes,
  bufferMinutes,
  earliestMs,
  latestMs,
}) {
  const durationMs = durationMinutes * 60 * 1000;
  const bufferMs = bufferMinutes * 60 * 1000;
  const step = slotStepMs();
  const padded = busy
    .map(b => ({
      start: new Date(b.start).getTime() - bufferMs,
      end: new Date(b.end).getTime() + bufferMs,
    }))
    .sort((a, b) => a.start - b.start);

  const slots = [];
  for (const dateKey of eachDateKey(startDate, endDate)) {
    const windows = weeklyHours[String(weekdayOf(dateKey))] || [];
    for (const [open, close] of windows) {
      const windowStart = wallTimeToEpochMs(dateKey, open, timeZone);
      const windowEnd = wallTimeToEpochMs(dateKey, close, timeZone);

      let cursor = windowStart;
      const free = [];
      for (const block of padded) {
        if (block.end <= windowStart || block.start >= windowEnd) continue;
        if (block.start > cursor) free.push({ start: cursor, end: block.start });
        cursor = Math.max(cursor, block.end);
      }
      if (cursor < windowEnd) free.push({ start: cursor, end: windowEnd });

      for (const interval of free) {
        let t = windowStart + Math.ceil((interval.start - windowStart) / step) * step;
        for (; t + durationMs <= interval.end; t += step) {
          if (t >= earliestMs && t + durationMs <= latestMs) {
            slots.push({ start: new Date(t).toISOString(), end: new Date(t + durationMs).toISOString() });
          }
        }
      }
    }
  }
  return slots;
}
