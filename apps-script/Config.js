/*
  Booking settings: the built-in defaults, and the validator every save from the
  admin page passes through. Pure, so it runs unchanged under vitest. The admin
  page is a convenience; this file is what actually keeps a bad save from
  breaking booking or opening hours nobody intended.
*/

function defaultBookingConfig() {
  const workday = [['09:00', '12:00'], ['13:00', '17:00']];
  return {
    title: 'Meet with Jayden',
    description: 'Pick a time that works for you and a Google Meet invite will land in your inbox.',
    timeZone: 'America/Denver',
    calendarId: 'primary',
    busyCalendarIds: ['primary'],
    bufferMinutes: 15,
    minLeadHours: 12,
    horizonDays: 30,
    keyDefaults: { expiresInDays: 14, maxUses: 1, typeIds: null },
    weeklyHours: { 1: workday, 2: workday, 3: workday, 4: workday, 5: [['09:00', '12:00'], ['13:00', '15:00']] },
    types: [
      { id: '15min', name: '15 Minute Chat', durationMinutes: 15 },
      { id: '30min', name: '30 Minute Chat', durationMinutes: 30 },
    ],
  };
}

function isValidTimeZone(timeZone) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return typeof timeZone === 'string' && timeZone.length > 0;
  } catch (err) {
    return false;
  }
}

function minutesOf(time) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

function isIntInRange(value, min, max) {
  return Number.isInteger(value) && value >= min && value <= max;
}

/**
 * Checks an edited config and returns { config } with only known fields, or
 * { error, field } naming the first problem. Calendar ids are not editable from
 * the web and are carried over from `current`.
 */
function validateBookingConfig(input, current) {
  const fail = (field, error) => ({ error: error || 'invalid_config', field });
  if (!input || typeof input !== 'object') return fail('config');

  const title = typeof input.title === 'string' ? input.title.trim() : '';
  if (!title || title.length > 100) return fail('title');
  const description = typeof input.description === 'string' ? input.description.trim() : '';
  if (description.length > 500) return fail('description');
  if (!isValidTimeZone(input.timeZone)) return fail('timeZone');

  if (!isIntInRange(input.bufferMinutes, 0, 240)) return fail('bufferMinutes');
  if (!isIntInRange(input.minLeadHours, 0, 720)) return fail('minLeadHours');
  if (!isIntInRange(input.horizonDays, 1, 365)) return fail('horizonDays');

  if (!Array.isArray(input.types) || input.types.length === 0 || input.types.length > 20) return fail('types');
  const types = [];
  for (const type of input.types) {
    const id = type && type.id;
    const name = type && typeof type.name === 'string' ? type.name.trim() : '';
    if (typeof id !== 'string' || !/^[a-z0-9][a-z0-9-]{0,39}$/.test(id)) return fail('types', 'invalid_type_id');
    if (types.some(t => t.id === id)) return fail('types', 'duplicate_type_id');
    if (!name || name.length > 60) return fail('types', 'invalid_type_name');
    if (!isIntInRange(type.durationMinutes, 5, 480) || type.durationMinutes % 5 !== 0) {
      return fail('types', 'invalid_type_duration');
    }
    types.push({ id, name, durationMinutes: type.durationMinutes });
  }

  if (!input.weeklyHours || typeof input.weeklyHours !== 'object') return fail('weeklyHours');
  const weeklyHours = {};
  for (const day of Object.keys(input.weeklyHours)) {
    if (!/^[0-6]$/.test(day)) return fail('weeklyHours');
    const windows = input.weeklyHours[day];
    if (!Array.isArray(windows) || windows.length > 6) return fail('weeklyHours');
    const parsed = windows
      .map(w => (Array.isArray(w) && w.length === 2 ? { open: w[0], close: w[1], start: minutesOf(w[0]), end: minutesOf(w[1]) } : null))
      .sort((a, b) => (a && b ? a.start - b.start : 0));
    for (let i = 0; i < parsed.length; i++) {
      const w = parsed[i];
      if (!w || w.start === null || w.end === null || w.start >= w.end) return fail('weeklyHours', 'invalid_window');
      if (i > 0 && w.start < parsed[i - 1].end) return fail('weeklyHours', 'overlapping_windows');
    }
    if (parsed.length) weeklyHours[day] = parsed.map(w => [w.open, w.close]);
  }

  const rawDefaults = input.keyDefaults || {};
  const keyDefaults = {
    expiresInDays: rawDefaults.expiresInDays,
    maxUses: rawDefaults.maxUses === undefined ? 1 : rawDefaults.maxUses,
    typeIds: rawDefaults.typeIds === undefined ? null : rawDefaults.typeIds,
  };
  if (!isIntInRange(keyDefaults.expiresInDays, 1, 365)) return fail('keyDefaults', 'invalid_expiry');
  if (keyDefaults.maxUses !== null && !isIntInRange(keyDefaults.maxUses, 1, 1000)) return fail('keyDefaults', 'invalid_uses');
  if (keyDefaults.typeIds !== null) {
    if (!Array.isArray(keyDefaults.typeIds) || keyDefaults.typeIds.length === 0) return fail('keyDefaults', 'invalid_types');
    if (keyDefaults.typeIds.some(id => !types.some(t => t.id === id))) return fail('keyDefaults', 'unknown_type');
  }

  const base = current || defaultBookingConfig();
  return {
    config: {
      title,
      description,
      timeZone: input.timeZone,
      calendarId: base.calendarId,
      busyCalendarIds: base.busyCalendarIds,
      bufferMinutes: input.bufferMinutes,
      minLeadHours: input.minLeadHours,
      horizonDays: input.horizonDays,
      keyDefaults,
      weeklyHours,
      types,
    },
  };
}
