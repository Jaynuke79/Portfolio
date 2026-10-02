/*
  Web-app endpoint behind j2a3e.com/#schedule. Deployed "execute as me,
  accessible to anyone", so it reads and writes the owner's calendar without an
  OAuth app; every visitor action is gated by an access key the owner issues.
  Apps Script cannot set HTTP status codes, so every response is 200 with
  { ok, error? } and callers branch on `error`. All actions are POSTs with a
  text/plain JSON body: that keeps browser requests free of CORS preflights
  (which Apps Script cannot answer) and keeps keys out of URLs and logs.
*/

const MAX_RANGE_DAYS = 45;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const KEY_PROPERTY_PREFIX = 'key:';
const KEY_ID_LENGTH = 12;
const BAD_KEY_LIMIT_PER_10_MIN = 30;
const BAD_ADMIN_LIMIT_PER_10_MIN = 10;
const PREVIEW_DAYS = 14;
const PER_EMAIL_LIMIT = 3;
const PER_EMAIL_WINDOW_SECONDS = 6 * 60 * 60;
const GLOBAL_HOURLY_LIMIT = 20;

class BookingError extends Error {}

const VISITOR_ACTIONS = {
  access: (body, keyHash, record) => describeBooking(record),
  slots: (body, keyHash, record) => listSlots(body, record),
  confirm: (body, keyHash) => confirmBooking(body, keyHash),
};

const ADMIN_ACTIONS = {
  issueKey: body => issueKey(body),
  updateKey: body => updateKey(body),
  listKeys: () => listKeys(),
  revokeKey: body => revokeKey(body),
  getConfig: () => getConfig(),
  saveConfig: body => saveConfig(body),
  previewSlots: body => previewSlots(body),
};

function doPost(e) {
  let payload;
  try {
    const body = JSON.parse((e.postData && e.postData.contents) || '{}');
    payload = Object.assign({ ok: true }, route(body));
  } catch (err) {
    if (!(err instanceof BookingError)) console.error(err);
    payload = { ok: false, error: err instanceof BookingError ? err.message : 'server_error' };
  }
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Run once from the Apps Script editor before deploying. It confirms that this
 * runtime's Intl agrees with the tested time-zone math, that free/busy answers
 * for the configured calendars, and that BOOKING_CONFIG parses. It also
 * triggers the Calendar consent prompt.
 */
function checkSetup() {
  const config = readConfig();
  const probe = new Date(wallTimeToEpochMs('2026-10-06', '09:00', 'America/Denver')).toISOString();
  console.log(`Time-zone math: ${probe === '2026-10-06T15:00:00.000Z' ? 'OK' : `WRONG (${probe})`}`);
  const now = Date.now();
  console.log(`Busy blocks in the next 7 days: ${fetchBusy(config, now, now + 7 * 86400000).length}`);
  console.log(`Meeting types: ${config.types.map(t => t.id).join(', ')}; admin token set: ${Boolean(
    PropertiesService.getScriptProperties().getProperty('ADMIN_TOKEN')
  )}`);
  const defaults = resolveKeyTerms(
    {},
    { defaults: config.keyDefaults || {}, knownTypeIds: config.types.map(t => t.id), timeZone: config.timeZone, nowMs: now },
    null
  );
  console.log(`Key defaults: ${defaults.error ? `INVALID (${defaults.error})` : JSON.stringify(defaults.terms)}`);
}

function route(body) {
  if (Object.prototype.hasOwnProperty.call(ADMIN_ACTIONS, body.action)) {
    requireAdmin(body.adminToken);
    return ADMIN_ACTIONS[body.action](body);
  }
  if (Object.prototype.hasOwnProperty.call(VISITOR_ACTIONS, body.action)) {
    const { keyHash, record } = requireKey(body.key);
    return VISITOR_ACTIONS[body.action](body, keyHash, record);
  }
  throw new BookingError('unknown_action');
}

/** The saved config, or the built-in default until the admin page first saves. */
function readConfig() {
  const raw = PropertiesService.getScriptProperties().getProperty('BOOKING_CONFIG');
  return raw ? JSON.parse(raw) : defaultBookingConfig();
}

function sha256Hex(text) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8)
    .map(b => ((b + 256) % 256).toString(16).padStart(2, '0'))
    .join('');
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Counts a failed guess and reports whether guessing is currently throttled.
 * Apps Script can't see caller IPs, so the counter is global; it is only ever
 * consulted after a credential has failed, so junk traffic slows other
 * guessers but can never lock out a valid key or token.
 */
function recordFailedGuess(kind, limit) {
  const cache = CacheService.getScriptCache();
  const failKey = `rl:bad${kind}:${Math.floor(Date.now() / 600000)}`;
  const failures = Number(cache.get(failKey) || 0) + 1;
  cache.put(failKey, String(failures), 600);
  return failures > limit;
}

function requireAdmin(token) {
  const expected = PropertiesService.getScriptProperties().getProperty('ADMIN_TOKEN');
  if (expected && typeof token === 'string' && timingSafeEqual(sha256Hex(token), sha256Hex(expected))) return;
  throw new BookingError(recordFailedGuess('admin', BAD_ADMIN_LIMIT_PER_10_MIN) ? 'rate_limited' : 'forbidden');
}

function readKeyRecord(keyHash) {
  const raw = PropertiesService.getScriptProperties().getProperty(KEY_PROPERTY_PREFIX + keyHash);
  return raw ? JSON.parse(raw) : null;
}

function writeKeyRecord(keyHash, record) {
  PropertiesService.getScriptProperties().setProperty(KEY_PROPERTY_PREFIX + keyHash, JSON.stringify(record));
}

function requireKey(input) {
  const normalized = normalizeKey(input);
  const keyHash = isWellFormedKey(normalized) ? sha256Hex(normalized) : null;
  const record = keyHash ? readKeyRecord(keyHash) : null;
  if (!record) {
    throw new BookingError(recordFailedGuess('key', BAD_KEY_LIMIT_PER_10_MIN) ? 'rate_limited' : 'invalid_key');
  }
  const status = keyStatus(record, Date.now());
  if (status !== 'ok') throw new BookingError(`key_${status}`);
  return { keyHash, record };
}

function keyTermsOrThrow(body, current) {
  const config = readConfig();
  const { terms, error } = resolveKeyTerms(
    body,
    {
      defaults: config.keyDefaults || {},
      knownTypeIds: config.types.map(t => t.id),
      timeZone: config.timeZone,
      nowMs: Date.now(),
    },
    current
  );
  if (error) throw new BookingError(error);
  return terms;
}

function keyIdOf(keyHash) {
  return keyHash.slice(0, KEY_ID_LENGTH);
}

function keySummary(keyHash, record) {
  return Object.assign({ id: keyIdOf(keyHash) }, record, { status: keyStatus(record, Date.now()) });
}

function findKeyHash(rawId) {
  const id = typeof rawId === 'string' ? rawId.toLowerCase() : '';
  if (!/^[0-9a-f]{6,64}$/.test(id)) throw new BookingError('invalid_key_id');
  const matches = Object.keys(PropertiesService.getScriptProperties().getProperties())
    .filter(name => name.startsWith(KEY_PROPERTY_PREFIX + id));
  if (matches.length !== 1) throw new BookingError(matches.length ? 'ambiguous_key_id' : 'invalid_key_id');
  return matches[0].slice(KEY_PROPERTY_PREFIX.length);
}

function issueKey(body) {
  const terms = keyTermsOrThrow(body, null);
  const key = formatKeyFromHex(randomHexFromUuids([Utilities.getUuid(), Utilities.getUuid()]));
  const keyHash = sha256Hex(normalizeKey(key));
  const record = Object.assign({}, terms, { uses: 0, createdAt: new Date().toISOString() });
  writeKeyRecord(keyHash, record);
  return Object.assign({ key }, keySummary(keyHash, record));
}

function updateKey(body) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const keyHash = findKeyHash(body.id);
    const current = readKeyRecord(keyHash);
    const record = Object.assign({}, current, keyTermsOrThrow(body, current));
    writeKeyRecord(keyHash, record);
    return keySummary(keyHash, record);
  } finally {
    lock.releaseLock();
  }
}

function listKeys() {
  const all = PropertiesService.getScriptProperties().getProperties();
  const keys = Object.keys(all)
    .filter(name => name.startsWith(KEY_PROPERTY_PREFIX))
    .map(name => keySummary(name.slice(KEY_PROPERTY_PREFIX.length), JSON.parse(all[name])))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { keys };
}

function revokeKey(body) {
  const keyHash = findKeyHash(body.id);
  PropertiesService.getScriptProperties().deleteProperty(KEY_PROPERTY_PREFIX + keyHash);
  return { revoked: keyIdOf(keyHash) };
}

function getConfig() {
  return {
    config: readConfig(),
    version: PropertiesService.getScriptProperties().getProperty('BOOKING_CONFIG_VERSION'),
  };
}

/**
 * Saves only when `version` matches what is stored, so a second admin tab
 * holding stale settings gets `config_conflict` instead of overwriting.
 */
function saveConfig(body) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const props = PropertiesService.getScriptProperties();
    const storedVersion = props.getProperty('BOOKING_CONFIG_VERSION');
    if ((body.version || null) !== storedVersion) throw new BookingError('config_conflict');

    const { config, error, field } = validateBookingConfig(body.config, readConfig());
    if (error) throw new BookingError(`${error}:${field}`);

    const version = new Date().toISOString();
    props.setProperties({ BOOKING_CONFIG: JSON.stringify(config), BOOKING_CONFIG_VERSION: version });
    return { config, version };
  } finally {
    lock.releaseLock();
  }
}

/** The slots a visitor would see over the next two weeks, from the saved config and live calendar. */
function previewSlots(body) {
  const config = readConfig();
  const type = config.types.find(t => t.id === body.type) || config.types[0];
  const now = Date.now();
  const start = dateKeyInZone(now, config.timeZone);
  const end = dateKeyInZone(now + PREVIEW_DAYS * 86400000, config.timeZone);
  return { type: type.id, timeZone: config.timeZone, slots: slotsFor(config, type, start, end) };
}

function resolveType(config, typeId, record) {
  const type = typesForKey(config.types, record).find(t => t.id === typeId);
  if (!type) throw new BookingError('unknown_type');
  return type;
}

function describeBooking(record) {
  const config = readConfig();
  const types = typesForKey(config.types, record);
  if (types.length === 0) throw new BookingError('key_no_types');
  return {
    title: config.title,
    description: config.description || '',
    types: types.map(t => ({ id: t.id, name: t.name, durationMinutes: t.durationMinutes })),
    horizonDays: config.horizonDays,
  };
}

function bookingWindow(config) {
  const now = Date.now();
  return {
    earliestMs: now + config.minLeadHours * 60 * 60 * 1000,
    latestMs: now + config.horizonDays * 24 * 60 * 60 * 1000,
  };
}

function fetchBusy(config, timeMinMs, timeMaxMs) {
  const ids = config.busyCalendarIds && config.busyCalendarIds.length ? config.busyCalendarIds : ['primary'];
  const result = Calendar.Freebusy.query({
    timeMin: new Date(timeMinMs).toISOString(),
    timeMax: new Date(timeMaxMs).toISOString(),
    items: ids.map(id => ({ id })),
  });
  const busy = [];
  for (const id of ids) {
    const calendar = result.calendars[id];
    // An unreadable calendar would make its meetings look free, so refuse to
    // offer anything rather than risk a double booking.
    if (!calendar || (calendar.errors && calendar.errors.length)) throw new BookingError('calendar_unavailable');
    busy.push(...calendar.busy);
  }
  return busy;
}

function slotsFor(config, type, startDate, endDate) {
  const { earliestMs, latestMs } = bookingWindow(config);
  const rangeStart = wallTimeToEpochMs(startDate, '00:00', config.timeZone);
  const rangeEnd = wallTimeToEpochMs(endDate, '23:59', config.timeZone) + 60 * 1000;
  return buildSlots({
    startDate,
    endDate,
    timeZone: config.timeZone,
    weeklyHours: config.weeklyHours,
    busy: fetchBusy(config, rangeStart, rangeEnd),
    durationMinutes: type.durationMinutes,
    bufferMinutes: config.bufferMinutes,
    earliestMs,
    latestMs,
  });
}

function listSlots(body, record) {
  const config = readConfig();
  const type = resolveType(config, body.type, record);
  const { start, end } = body;
  if (!DATE_KEY_PATTERN.test(start || '') || !DATE_KEY_PATTERN.test(end || '') || end < start) {
    throw new BookingError('invalid_range');
  }
  if (eachDateKey(start, end).length > MAX_RANGE_DAYS) throw new BookingError('invalid_range');
  return { slots: slotsFor(config, type, start, end) };
}

function validateGuest(body) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const notes = typeof body.notes === 'string' ? body.notes.trim() : '';
  if (!name || name.length > 100) throw new BookingError('invalid_name');
  if (!EMAIL_PATTERN.test(email) || email.length > 254) throw new BookingError('invalid_email');
  if (notes.length > 1000) throw new BookingError('invalid_notes');
  return { name, email, notes };
}

function enforceRateLimit(email) {
  const cache = CacheService.getScriptCache();
  const emailKey = `rl:email:${email}`;
  const hourKey = `rl:hour:${Math.floor(Date.now() / 3600000)}`;
  const emailCount = Number(cache.get(emailKey) || 0);
  const hourCount = Number(cache.get(hourKey) || 0);
  if (emailCount >= PER_EMAIL_LIMIT || hourCount >= GLOBAL_HOURLY_LIMIT) throw new BookingError('rate_limited');
  cache.put(emailKey, String(emailCount + 1), PER_EMAIL_WINDOW_SECONDS);
  cache.put(hourKey, String(hourCount + 1), 3600);
}

function confirmBooking(body, keyHash) {
  const config = readConfig();
  const guest = validateGuest(body);

  // Bots that fill the hidden field get the success shape with nothing behind
  // it, so they learn nothing about why their submission went nowhere.
  if (body.website) return { start: body.start, meetLink: null };

  const startMs = new Date(body.start).getTime();
  if (!Number.isFinite(startMs)) throw new BookingError('invalid_slot');
  const startIso = new Date(startMs).toISOString();

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    // The key and the slot are both re-read inside the lock: two tabs sharing a
    // single-use key, or two visitors racing for one time, cannot both pass.
    const record = readKeyRecord(keyHash);
    if (!record) throw new BookingError('invalid_key');
    const status = keyStatus(record, Date.now());
    if (status !== 'ok') throw new BookingError(`key_${status}`);
    const type = resolveType(config, body.type, record);

    const dateKey = dateKeyInZone(startMs, config.timeZone);
    const offered = slotsFor(config, type, dateKey, dateKey).find(s => s.start === startIso);
    if (!offered) throw new BookingError('slot_taken');

    enforceRateLimit(guest.email);

    const event = Calendar.Events.insert(
      {
        summary: `${type.name} with ${guest.name}`,
        description: guest.notes,
        extendedProperties: { private: { bookingKeyLabel: record.label || '' } },
        start: { dateTime: offered.start },
        end: { dateTime: offered.end },
        attendees: [{ email: guest.email, displayName: guest.name }],
        conferenceData: {
          createRequest: { requestId: Utilities.getUuid(), conferenceSolutionKey: { type: 'hangoutsMeet' } },
        },
      },
      config.calendarId || 'primary',
      { conferenceDataVersion: 1, sendUpdates: 'all' }
    );

    writeKeyRecord(keyHash, Object.assign({}, record, { uses: record.uses + 1, lastUsedAt: new Date().toISOString() }));
    return { start: offered.start, end: offered.end, meetLink: event.hangoutLink || null };
  } finally {
    lock.releaseLock();
  }
}
