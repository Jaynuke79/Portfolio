import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createContext, runInContext } from "node:vm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Json = Record<string, any>;

const dir = dirname(fileURLToPath(import.meta.url));
const ADMIN = "admin-token";

let props: Record<string, string>;
let busy: { start: string; end: string }[];
let busyOn: Record<string, { start: string; end: string }[]>;
let freebusyQueries: string[][];
let freebusyLags: boolean;
let unreadableCalendars: Record<string, "errors" | "missing">;
let inserted: Json[];
let insertFailures: number;
let propertyWritesFail: boolean;
let post: (body: Json) => Json;
let defaultConfig: () => Json;
let sentMail: Json[];
let mailFailsFor: string | null;
let interleave: { at: "insert" | "configRead"; run: () => void } | null;
let lockHeld: boolean;
let lockWaiters: (() => void)[];
let blockedOnLock: boolean;
let scriptCache: Map<string, { value: string; expiresAt: number }>;

function loadBackend(files = ["Slots.js", "Keys.js", "Config.js", "Mail.js", "Code.js"]) {
  props = { ADMIN_TOKEN: ADMIN };
  busy = [];
  busyOn = { primary: busy };
  freebusyQueries = [];
  freebusyLags = false;
  unreadableCalendars = {};
  inserted = [];
  insertFailures = 0;
  propertyWritesFail = false;
  sentMail = [];
  mailFailsFor = null;
  interleave = null;
  lockHeld = false;
  lockWaiters = [];
  blockedOnLock = false;
  const interleaveAt = (point: "insert" | "configRead") => {
    if (interleave?.at !== point) return;
    const { run } = interleave;
    interleave = null;
    run();
  };
  const cache = (scriptCache = new Map());
  const context = createContext({
    console: { log() {}, error() {} },
    Intl,
    Date,
    Math,
    Number,
    String,
    JSON,
    Object,
    Error,
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (k: string) => {
          if (k === "BOOKING_CONFIG") interleaveAt("configRead");
          return props[k] ?? null;
        },
        setProperty: (k: string, v: string) => {
          if (propertyWritesFail) throw new Error("Properties service unavailable");
          props[k] = v;
        },
        setProperties: (values: Record<string, string>) => Object.assign(props, values),
        getProperties: () => ({ ...props }),
        deleteProperty: (k: string) => delete props[k],
      }),
    },
    CacheService: {
      getScriptCache: () => ({
        get: (k: string) => {
          const entry = cache.get(k);
          return entry && entry.expiresAt > Date.now() ? entry.value : null;
        },
        put: (k: string, value: string, ttlSeconds?: number) =>
          cache.set(k, { value, expiresAt: ttlSeconds === undefined ? Infinity : Date.now() + ttlSeconds * 1000 }),
      }),
    },
    LockService: {
      getScriptLock: () => ({
        waitLock() {
          if (lockHeld) {
            blockedOnLock = true;
            throw new Error("Lock wait would block");
          }
          lockHeld = true;
        },
        releaseLock() {
          lockHeld = false;
          lockWaiters.splice(0).forEach(waiter => waiter());
        },
      }),
    },
    Utilities: {
      getUuid: randomUUID,
      DigestAlgorithm: { SHA_256: "sha256" },
      Charset: { UTF_8: "utf8" },
      computeDigest: (_algo: string, text: string) =>
        [...createHash("sha256").update(text).digest()].map(b => (b > 127 ? b - 256 : b)),
    },
    Calendar: {
      Freebusy: {
        query: ({ items }: { items: { id: string }[] }) => {
          freebusyQueries.push(items.map(item => item.id));
          const readable = items.filter(({ id }) => unreadableCalendars[id] !== "missing");
          return {
            calendars: Object.fromEntries(
              readable.map(({ id }) => [
                id,
                unreadableCalendars[id] === "errors"
                  ? { busy: [], errors: [{ domain: "global", reason: "notFound" }] }
                  : { busy: busyOn[id] ?? [] },
              ])
            ),
          };
        },
      },
      Events: {
        insert: (event: Json, calendarId: string) => {
          interleaveAt("insert");
          if (insertFailures > 0) {
            insertFailures--;
            throw new Error("Calendar service unavailable");
          }
          inserted.push(event);
          if (!freebusyLags) (busyOn[calendarId] ??= []).push({ start: event.start.dateTime, end: event.end.dateTime });
          return { hangoutLink: "https://meet.google.com/test" };
        },
      },
    },
    MailApp: {
      sendEmail: (message: Json) => {
        if (mailFailsFor === message.to) throw new Error("Service invoked too many times");
        sentMail.push(message);
      },
      getRemainingDailyQuota: () => 100,
    },
    Session: { getEffectiveUser: () => ({ getEmail: () => "owner@example.com" }) },
    ContentService: {
      MimeType: { JSON: "json" },
      createTextOutput: (text: string) => ({ setMimeType: () => JSON.parse(text) }),
    },
  });
  for (const file of files) {
    runInContext(readFileSync(resolve(dir, file), "utf8"), context);
  }
  const globals = context as unknown as { doPost(e: Json): Json; defaultBookingConfig(): Json };
  const doPost = globals.doPost;
  defaultConfig = globals.defaultBookingConfig;
  post = body => doPost({ postData: { contents: JSON.stringify(body) } });
}

function issue(extra: Json = {}): Json {
  return post({ action: "issueKey", adminToken: ADMIN, ...extra });
}

function upcomingSlots(key: string, type = "30min"): { start: string; end: string }[] {
  const dayKey = (offsetDays: number) => new Date(Date.now() + offsetDays * 86400000).toISOString().slice(0, 10);
  return post({ action: "slots", key, type, start: dayKey(2), end: dayKey(10) }).slots;
}

function confirm(key: string, start: string, extra: Json = {}): Json {
  return post({ action: "confirm", key, type: "30min", start, name: "Ada", email: "ada@example.com", ...extra });
}

/**
 * Sends `body` as if from a second request arriving while another action is
 * mid-flight. A real waitLock would park it until the lock frees, so if it hits
 * the held lock it is replayed once the running action releases.
 */
function concurrently(body: Json, results: Json[]) {
  blockedOnLock = false;
  const result = post(body);
  if (blockedOnLock) lockWaiters.push(() => results.push(post(body)));
  else results.push(result);
}

beforeEach(() => loadBackend());

describe("admin actions", () => {
  it("require the admin token", () => {
    expect(post({ action: "listKeys", adminToken: "wrong" })).toEqual({ ok: false, error: "forbidden" });
    expect(post({ action: "issueKey" })).toEqual({ ok: false, error: "forbidden" });
  });

  it("reject malformed key options rather than minting an unlimited key", () => {
    expect(issue({ maxUses: "abc" }).error).toBe("invalid_uses");
    expect(issue({ maxUses: null }).error).toBe("invalid_uses");
    expect(issue({ unlimitedUses: true }).maxUses).toBeNull();
  });

  it("issue keys from the config's keyDefaults", () => {
    const config = defaultConfig();
    props.BOOKING_CONFIG = JSON.stringify({ ...config, keyDefaults: { maxUses: 2, expiresInDays: 3, typeIds: ["15min"] } });
    const issued = issue();
    expect(issued).toMatchObject({ maxUses: 2, typeIds: ["15min"], status: "ok" });
    expect(Date.parse(issued.expiresAt) - Date.now()).toBeGreaterThan(2.9 * 86400000);
  });

  it("serve the built-in config until the first save", () => {
    const { config, version } = post({ action: "getConfig", adminToken: ADMIN });
    expect(config.types.map((t: Json) => t.id)).toEqual(["15min", "30min"]);
    expect(config.keyDefaults).toEqual({ expiresInDays: 14, maxUses: 1, typeIds: null });
    expect(version).toBeNull();
    expect(post({ action: "getConfig" }).error).toBe("forbidden");
  });

  it("throttle repeated bad admin tokens without locking out the owner", () => {
    for (let i = 0; i < 10; i++) expect(post({ action: "listKeys", adminToken: "wrong" }).error).toBe("forbidden");
    expect(post({ action: "listKeys", adminToken: "wrong" }).error).toBe("rate_limited");
    expect(post({ action: "listKeys", adminToken: ADMIN }).ok).toBe(true);
  });

  it("update an existing key's expiry, uses and types", () => {
    const { key, id } = issue({ typeIds: ["15min"] });
    confirm(key, upcomingSlots(key, "15min")[0].start, { type: "15min" });
    expect(post({ action: "access", key }).error).toBe("key_used_up");

    const updated = post({ action: "updateKey", adminToken: ADMIN, id, maxUses: 2, allTypes: true, expiresInDays: 30 });
    expect(updated).toMatchObject({ ok: true, maxUses: 2, uses: 1, typeIds: null, status: "ok" });
    expect(post({ action: "access", key }).types.map((t: Json) => t.id)).toEqual(["15min", "30min"]);
  });

  it("revive an expired key by extending it", () => {
    const { key, id } = issue();
    const hash = Object.keys(props).find(name => name.startsWith(`key:${id}`))!;
    props[hash] = JSON.stringify({ ...JSON.parse(props[hash]), expiresAt: "2020-01-01T00:00:00.000Z" });
    expect(post({ action: "access", key }).error).toBe("key_expired");

    expect(post({ action: "updateKey", adminToken: ADMIN, id, label: "renamed" }).status).toBe("expired");
    expect(post({ action: "updateKey", adminToken: ADMIN, id, expiresOn: "2020-02-01" }).error).toBe("invalid_expiry");
    post({ action: "updateKey", adminToken: ADMIN, id, expiresInDays: 2 });
    expect(post({ action: "access", key }).ok).toBe(true);
  });

  it("reject updates to unknown keys or with unknown types", () => {
    expect(post({ action: "updateKey", adminToken: ADMIN, id: "abcdef123456", label: "x" }).error).toBe("invalid_key_id");
    const { id } = issue();
    expect(post({ action: "updateKey", adminToken: ADMIN, id, typeIds: ["60min"] }).error).toBe("unknown_type");
  });

  it("store only a hash of the issued key", () => {
    const { key } = issue({ label: "Recruiter" });
    expect(JSON.stringify(props)).not.toContain(key);
    expect(JSON.stringify(props)).not.toContain(key.replace(/-/g, ""));
  });
});

describe("visitor access", () => {
  it("rejects missing, unknown and revoked keys", () => {
    expect(post({ action: "access" }).error).toBe("invalid_key");
    expect(post({ action: "access", key: "ZZZZ-ZZZZ-ZZZZ-ZZZZ" }).error).toBe("invalid_key");

    const { key, id } = issue();
    expect(post({ action: "revokeKey", adminToken: ADMIN, id }).ok).toBe(true);
    expect(post({ action: "access", key }).error).toBe("invalid_key");
  });

  it("accepts a key typed in lowercase with spaces", () => {
    const { key } = issue();
    expect(post({ action: "access", key: key.toLowerCase().replace(/-/g, " ") })).toMatchObject({
      ok: true,
      title: "Meet with Jayden",
    });
  });

  it("gates slot reads behind the key", () => {
    expect(post({ action: "slots", type: "30min", start: "2026-10-01", end: "2026-10-02" }).error).toBe("invalid_key");
  });

  it("throttles repeated bad keys without locking out valid ones", () => {
    const { key } = issue();
    for (let i = 0; i < 30; i++) expect(post({ action: "access", key: "ZZZZ-ZZZZ-ZZZZ-ZZZZ" }).error).toBe("invalid_key");
    expect(post({ action: "access", key: "ZZZZ-ZZZZ-ZZZZ-ZZZZ" }).error).toBe("rate_limited");
    expect(post({ action: "access", key }).ok).toBe(true);
  });
});

describe("meeting-type restrictions", () => {
  it("only offer a restricted key its allowed types", () => {
    const { key } = issue({ typeIds: ["15min"] });
    expect(post({ action: "access", key }).types.map((t: Json) => t.id)).toEqual(["15min"]);
  });

  it("refuse slots and bookings for types the key does not allow", () => {
    const { key } = issue({ typeIds: ["15min"] });
    expect(post({ action: "slots", key, type: "30min", start: "2026-10-05", end: "2026-10-06" }).error).toBe("unknown_type");
    const start = upcomingSlots(key, "15min")[0].start;
    expect(confirm(key, start).error).toBe("unknown_type");
    expect(inserted).toHaveLength(0);
    expect(confirm(key, start, { type: "15min" }).ok).toBe(true);
  });

  it("report a key whose types were all removed from the config", () => {
    const { key } = issue({ typeIds: ["15min"] });
    const config = defaultConfig();
    props.BOOKING_CONFIG = JSON.stringify({ ...config, types: config.types.filter((t: Json) => t.id !== "15min") });
    expect(post({ action: "access", key }).error).toBe("key_no_types");
  });
});

describe("revoking a key while it is in use", () => {
  it("keeps the key revoked when a booking with it is in flight", () => {
    const { key, id } = issue({ maxUses: 3 });
    const revoked: Json[] = [];
    interleave = { at: "insert", run: () => concurrently({ action: "revokeKey", adminToken: ADMIN, id }, revoked) };
    expect(confirm(key, upcomingSlots(key)[0].start).ok).toBe(true);
    expect(revoked).toEqual([{ ok: true, revoked: id }]);
    expect(post({ action: "access", key }).error).toBe("invalid_key");
  });

  it("keeps the booking but not the key when its property is deleted outside the lock", () => {
    const { key, id } = issue({ maxUses: 3 });
    const property = Object.keys(props).find(name => name.startsWith(`key:${id}`))!;
    interleave = { at: "insert", run: () => delete props[property] };
    expect(confirm(key, upcomingSlots(key)[0].start).ok).toBe(true);
    expect(inserted).toHaveLength(1);
    expect(props[property]).toBeUndefined();
  });

  it("keeps the key revoked when an edit to it is in flight", () => {
    const { key, id } = issue();
    const revoked: Json[] = [];
    interleave = { at: "configRead", run: () => concurrently({ action: "revokeKey", adminToken: ADMIN, id }, revoked) };
    expect(post({ action: "updateKey", adminToken: ADMIN, id, label: "renamed" }).ok).toBe(true);
    expect(revoked).toEqual([{ ok: true, revoked: id }]);
    expect(post({ action: "access", key }).error).toBe("invalid_key");
    expect(post({ action: "listKeys", adminToken: ADMIN }).keys).toEqual([]);
  });
});

describe("confirm", () => {
  it("books an offered slot and consumes a single-use key", () => {
    const { key } = issue({ label: "Recruiter" });
    const slots = upcomingSlots(key);
    expect(confirm(key, slots[0].start, { notes: "Hi" })).toMatchObject({ ok: true, meetLink: "https://meet.google.com/test" });
    expect(confirm(key, slots[3].start).error).toBe("key_used_up");
  });

  it("keeps the private key label out of the guest-visible invite", () => {
    const { key } = issue({ label: "Recruiter at Acme" });
    confirm(key, upcomingSlots(key)[0].start, { notes: "Hi" });
    expect(inserted[0].description).toBe("Hi");
    expect(inserted[0].extendedProperties.private.bookingKeyLabel).toBe("Recruiter at Acme");
  });

  it("refuses a slot another visitor already took", () => {
    const first = issue().key;
    const second = issue().key;
    const start = upcomingSlots(first)[0].start;
    expect(confirm(first, start).ok).toBe(true);
    expect(confirm(second, start).error).toBe("slot_taken");
  });

  it("refuses start times that were never offered", () => {
    const { key } = issue();
    expect(confirm(key, "2030-01-01T00:07:00Z").error).toBe("slot_taken");
  });

  it("creates nothing for honeypot submissions", () => {
    const { key } = issue();
    expect(confirm(key, upcomingSlots(key)[0].start, { website: "spam" })).toMatchObject({ ok: true, meetLink: null });
    expect(inserted).toHaveLength(0);
  });

  it("validates guest details", () => {
    const { key } = issue();
    const start = upcomingSlots(key)[0].start;
    expect(confirm(key, start, { email: "nope" }).error).toBe("invalid_email");
    expect(confirm(key, start, { name: " " }).error).toBe("invalid_name");
  });
});

describe("double-booking guard", () => {
  const BOOKING_CALENDAR = "bookings@example.com";

  it("counts events on the booking calendar as busy even when busyCalendarIds omits it", () => {
    props.BOOKING_CONFIG = JSON.stringify({ ...defaultConfig(), calendarId: BOOKING_CALENDAR, busyCalendarIds: ["primary"] });
    const first = issue().key;
    const slot = upcomingSlots(first)[0];
    busyOn[BOOKING_CALENDAR] = [{ start: slot.start, end: slot.end }];
    expect(upcomingSlots(first).map(s => s.start)).not.toContain(slot.start);
    expect(confirm(first, slot.start).error).toBe("slot_taken");
    expect(freebusyQueries.at(-1)).toEqual([BOOKING_CALENDAR, "primary"]);
  });

  it("queries a booking calendar that is also a busy calendar only once", () => {
    const { key } = issue();
    upcomingSlots(key);
    expect(freebusyQueries.at(-1)).toEqual(["primary"]);
  });

  it("refuses a second confirm for a just-booked slot before free/busy reports it", () => {
    freebusyLags = true;
    const first = issue().key;
    const second = issue().key;
    const start = upcomingSlots(first)[0].start;
    expect(confirm(first, start).ok).toBe(true);
    expect(confirm(second, start).error).toBe("slot_taken");
    expect(upcomingSlots(second).map(s => s.start)).not.toContain(start);
    expect(inserted).toHaveLength(1);
  });

  it("remembers every booking made in quick succession", () => {
    freebusyLags = true;
    const keys = [issue().key, issue().key, issue().key];
    const [a, b] = upcomingSlots(keys[0]).filter((_, i) => i % 2 === 0);
    expect(confirm(keys[0], a.start).ok).toBe(true);
    expect(confirm(keys[1], b.start, { email: "bob@example.com" }).ok).toBe(true);
    expect(confirm(keys[2], a.start, { email: "cy@example.com" }).error).toBe("slot_taken");
    expect(confirm(keys[2], b.start, { email: "cy@example.com" }).error).toBe("slot_taken");
  });
});

describe("config editing", () => {
  function save(config: Json, version: string | null) {
    return post({ action: "saveConfig", adminToken: ADMIN, config, version });
  }

  it("saves a valid config and serves it to visitors", () => {
    const config = defaultConfig();
    config.types.push({ id: "60min", name: "Deep Dive", durationMinutes: 60 });
    config.weeklyHours = { 2: [["10:00", "12:00"]] };
    const saved = save(config, null);
    expect(saved.ok).toBe(true);

    const { key } = issue();
    expect(post({ action: "access", key }).types.map((t: Json) => t.id)).toEqual(["15min", "30min", "60min"]);
    const tuesdaysOnly = upcomingSlots(key, "60min").map(s => new Date(s.start).getUTCDay());
    expect(new Set(tuesdaysOnly)).toEqual(new Set([2]));
  });

  it("rejects a save from a stale tab", () => {
    const first = save(defaultConfig(), null);
    expect(save(defaultConfig(), null).error).toBe("config_conflict");
    expect(save({ ...defaultConfig(), title: "New" }, first.version).ok).toBe(true);
  });

  it("names the field that failed validation and keeps the old config", () => {
    const bad = { ...defaultConfig(), weeklyHours: { 1: [["09:00", "12:00"], ["11:00", "13:00"]] } };
    expect(save(bad, null).error).toBe("overlapping_windows:weeklyHours");
    expect(props.BOOKING_CONFIG).toBeUndefined();
  });

  it("keeps calendar ids out of reach of the web", () => {
    const saved = save({ ...defaultConfig(), calendarId: "someone-else@example.com", busyCalendarIds: [] }, null);
    expect(saved.config.calendarId).toBe("primary");
    expect(saved.config.busyCalendarIds).toEqual(["primary"]);
  });

  it("previews upcoming slots from the live calendar", () => {
    const preview = post({ action: "previewSlots", adminToken: ADMIN, type: "30min" });
    expect(preview).toMatchObject({ ok: true, type: "30min", timeZone: "America/Denver" });
    expect(preview.slots.length).toBeGreaterThan(0);
    busy.push({ start: preview.slots[0].start, end: preview.slots[0].end });
    expect(post({ action: "previewSlots", adminToken: ADMIN, type: "30min" }).slots[0].start).not.toBe(preview.slots[0].start);
  });
});

describe("confirmation emails", () => {
  it("emails the guest and the owner after a booking", () => {
    const { key } = issue({ label: "Recruiter" });
    const result = confirm(key, upcomingSlots(key)[0].start, { guestTimeZone: "Asia/Tokyo" });
    expect(result.emailed).toEqual({ guest: true, owner: true });
    expect(sentMail.map(m => [m.to, m.replyTo])).toEqual([
      ["ada@example.com", "owner@example.com"],
      ["owner@example.com", "ada@example.com"],
    ]);
    expect(sentMail[0].name).toBe("Meet with Jayden");
    expect(sentMail[0].subject).toMatch(/GMT\+9$/);
    expect(sentMail[1].subject).toMatch(/M[SD]T$/);
    expect(sentMail[1].body).toContain("Key: Recruiter");
  });

  it("keeps the booking when an email fails, and reports which one", () => {
    mailFailsFor = "ada@example.com";
    const { key } = issue();
    const result = confirm(key, upcomingSlots(key)[0].start);
    expect(result).toMatchObject({ ok: true, emailed: { guest: false, owner: true } });
    expect(inserted).toHaveLength(1);
    expect(post({ action: "access", key }).error).toBe("key_used_up");
  });

  it("sends to the configured owner address, and only what is switched on", () => {
    props.BOOKING_CONFIG = JSON.stringify({
      ...defaultConfig(),
      notifications: { emailGuest: false, emailOwner: true, ownerEmail: "alerts@example.com" },
    });
    const { key } = issue();
    expect(confirm(key, upcomingSlots(key)[0].start).emailed).toEqual({ guest: false, owner: true });
    expect(sentMail.map(m => m.to)).toEqual(["alerts@example.com"]);
  });

  it("sends nothing for honeypot or rejected bookings", () => {
    const { key } = issue();
    const start = upcomingSlots(key)[0].start;
    confirm(key, start, { website: "spam" });
    confirm(key, "2030-01-01T00:07:00Z");
    expect(sentMail).toHaveLength(0);
  });

  it("keeps booking working if Mail.js was never pasted into the project", () => {
    loadBackend(["Slots.js", "Keys.js", "Config.js", "Code.js"]);
    const { key } = issue();
    expect(post({ action: "access", key }).ok).toBe(true);
    const result = confirm(key, upcomingSlots(key)[0].start);
    expect(result).toMatchObject({ ok: true, emailed: { guest: false, owner: false } });
    expect(inserted).toHaveLength(1);
  });

  it("fills notification defaults for configs saved before the feature existed", () => {
    const legacy = defaultConfig();
    delete legacy.notifications;
    props.BOOKING_CONFIG = JSON.stringify(legacy);
    const { config } = post({ action: "getConfig", adminToken: ADMIN });
    expect(config.notifications).toEqual({ emailGuest: true, emailOwner: true, ownerEmail: "" });
  });

  it("validates and saves notification settings from the admin page", () => {
    const bad = post({
      action: "saveConfig",
      adminToken: ADMIN,
      config: { ...defaultConfig(), notifications: { emailGuest: true, emailOwner: true, ownerEmail: "nope" } },
      version: null,
    });
    expect(bad.error).toBe("invalid_email:notifications");
    const good = post({
      action: "saveConfig",
      adminToken: ADMIN,
      config: { ...defaultConfig(), notifications: { emailGuest: true, emailOwner: false, ownerEmail: " me@example.com " } },
      version: null,
    });
    expect(good.config.notifications).toEqual({ emailGuest: true, emailOwner: false, ownerEmail: "me@example.com" });
  });
});

const MONDAY_MORNING_DENVER = new Date("2026-10-05T16:00:00Z");

function onFixedClock(at: Date) {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(at);
    loadBackend();
  });
  afterEach(() => vi.useRealTimers());
}

describe("booking rate limits", () => {
  const HOUR_MS = 60 * 60 * 1000;
  onFixedClock(MONDAY_MORNING_DENVER);

  function bookNext(key: string, email: string): Json {
    return confirm(key, upcomingSlots(key)[0].start, { email });
  }

  it("allows three bookings per email in six hours, then refuses without booking", () => {
    const { key } = issue({ maxUses: 10 });
    for (let i = 0; i < 3; i++) expect(bookNext(key, "ada@example.com").ok).toBe(true);

    expect(bookNext(key, "ADA@example.com").error).toBe("rate_limited");
    expect(inserted).toHaveLength(3);
    expect(post({ action: "listKeys", adminToken: ADMIN }).keys[0].uses).toBe(3);
    expect(bookNext(key, "bob@example.com").ok).toBe(true);
  });

  it("lets the same email book again once the six-hour window has passed", () => {
    const { key } = issue({ maxUses: 10 });
    for (let i = 0; i < 3; i++) bookNext(key, "ada@example.com");
    vi.setSystemTime(MONDAY_MORNING_DENVER.getTime() + 6 * HOUR_MS - 1000);
    expect(bookNext(key, "ada@example.com").error).toBe("rate_limited");
    vi.setSystemTime(MONDAY_MORNING_DENVER.getTime() + 6 * HOUR_MS + 1000);
    expect(bookNext(key, "ada@example.com").ok).toBe(true);
  });

  it("counts only the bookings in the trailing six hours, so spaced-out bookings never lock an email out", () => {
    const { key } = issue({ maxUses: 10 });
    for (const hours of [0, 5, 10]) {
      vi.setSystemTime(MONDAY_MORNING_DENVER.getTime() + hours * HOUR_MS);
      expect(bookNext(key, "ada@example.com").ok).toBe(true);
    }
    vi.setSystemTime(MONDAY_MORNING_DENVER.getTime() + 12 * HOUR_MS);
    expect(bookNext(key, "ada@example.com").ok).toBe(true);
  });

  it("refuses a fourth booking until the oldest of three in six hours is more than six hours old", () => {
    const { key } = issue({ maxUses: 10 });
    for (const hours of [0, 2, 4]) {
      vi.setSystemTime(MONDAY_MORNING_DENVER.getTime() + hours * HOUR_MS);
      expect(bookNext(key, "ada@example.com").ok).toBe(true);
    }
    vi.setSystemTime(MONDAY_MORNING_DENVER.getTime() + 6 * HOUR_MS - 1000);
    expect(bookNext(key, "ada@example.com").error).toBe("rate_limited");
    vi.setSystemTime(MONDAY_MORNING_DENVER.getTime() + 6 * HOUR_MS + 1000);
    expect(bookNext(key, "ada@example.com").ok).toBe(true);
    expect(bookNext(key, "ada@example.com").error).toBe("rate_limited");
  });

  it("ignores a count left in the cache by the old per-email counter", () => {
    const { key } = issue({ maxUses: 10 });
    scriptCache.set("rl:email:ada@example.com", { value: "3", expiresAt: Infinity });
    for (let i = 0; i < 3; i++) expect(bookNext(key, "ada@example.com").ok).toBe(true);
    expect(bookNext(key, "ada@example.com").error).toBe("rate_limited");
  });

  it("caps all bookings at twenty per clock hour and resets when the next hour starts", () => {
    vi.setSystemTime(new Date("2026-10-05T16:40:00Z"));
    for (let i = 0; i < 20; i++) expect(bookNext(issue().key, `guest${i}@example.com`).ok).toBe(true);

    const { key } = issue();
    vi.setSystemTime(new Date("2026-10-05T16:59:59Z"));
    expect(bookNext(key, "late@example.com").error).toBe("rate_limited");
    expect(inserted).toHaveLength(20);

    vi.setSystemTime(new Date("2026-10-05T17:00:01Z"));
    expect(bookNext(key, "late@example.com").ok).toBe(true);
  });
});

describe("bookkeeping around the calendar insert", () => {
  onFixedClock(MONDAY_MORNING_DENVER);

  function keyProperty(id: string): string {
    return Object.keys(props).find(name => name.startsWith(`key:${id}`))!;
  }

  function hourlyCounts(): string[] {
    return [...scriptCache].filter(([name]) => name.startsWith("rl:hour:")).map(([, entry]) => entry.value);
  }

  it("counts only inserts that succeed toward the rate limits", () => {
    const { key } = issue({ maxUses: 10 });
    insertFailures = 3;
    for (let i = 0; i < 3; i++) expect(confirm(key, upcomingSlots(key)[0].start).error).toBe("server_error");
    expect(hourlyCounts()).toEqual([]);

    expect(confirm(key, upcomingSlots(key)[0].start).ok).toBe(true);
    expect(hourlyCounts()).toEqual(["1"]);
    expect(inserted).toHaveLength(1);
  });

  it("gives the key its use back when the insert throws", () => {
    const { key } = issue();
    insertFailures = 1;
    expect(confirm(key, upcomingSlots(key)[0].start).error).toBe("server_error");
    expect(post({ action: "listKeys", adminToken: ADMIN }).keys[0].uses).toBe(0);
    expect(confirm(key, upcomingSlots(key)[0].start).ok).toBe(true);
    expect(post({ action: "access", key }).error).toBe("key_used_up");
  });

  it("does not bring back a key deleted while a failing insert runs", () => {
    const { key, id } = issue({ maxUses: 3 });
    const property = keyProperty(id);
    insertFailures = 1;
    interleave = { at: "insert", run: () => delete props[property] };
    expect(confirm(key, upcomingSlots(key)[0].start).error).toBe("server_error");
    expect(props[property]).toBeUndefined();
  });

  it("reports a booking whose property writes fail after the insert as booked, and still uses up the key", () => {
    const { key } = issue();
    const slots = upcomingSlots(key);
    interleave = { at: "insert", run: () => (propertyWritesFail = true) };
    expect(confirm(key, slots[0].start)).toMatchObject({
      ok: true,
      start: slots[0].start,
      meetLink: "https://meet.google.com/test",
      emailed: { guest: true, owner: true },
    });
    expect(sentMail).toHaveLength(2);

    propertyWritesFail = false;
    expect(confirm(key, slots[3].start).error).toBe("key_used_up");
    expect(inserted).toHaveLength(1);
  });
});

describe("unreadable calendars", () => {
  const BOOKING_CALENDAR = "bookings@example.com";
  onFixedClock(MONDAY_MORNING_DENVER);

  it("refuses to list slots when free/busy reports an error for a calendar", () => {
    const { key } = issue();
    unreadableCalendars.primary = "errors";
    expect(post({ action: "slots", key, type: "30min", start: "2026-10-05", end: "2026-10-09" }).error).toBe(
      "calendar_unavailable"
    );
    expect(post({ action: "previewSlots", adminToken: ADMIN, type: "30min" }).error).toBe("calendar_unavailable");
  });

  it("refuses to book when a calendar is missing from the free/busy answer, and keeps the key", () => {
    props.BOOKING_CONFIG = JSON.stringify({ ...defaultConfig(), calendarId: BOOKING_CALENDAR, busyCalendarIds: ["primary"] });
    const { key } = issue();
    const start = upcomingSlots(key)[0].start;
    unreadableCalendars[BOOKING_CALENDAR] = "missing";

    expect(confirm(key, start).error).toBe("calendar_unavailable");
    expect(inserted).toHaveLength(0);
    expect(sentMail).toHaveLength(0);
    delete unreadableCalendars[BOOKING_CALENDAR];
    expect(confirm(key, start).ok).toBe(true);
  });
});

describe("slot range checks", () => {
  onFixedClock(MONDAY_MORNING_DENVER);

  function slotsBetween(start: unknown, end: unknown): Json {
    return post({ action: "slots", key: issue().key, type: "30min", start, end });
  }

  it("rejects missing, malformed and backwards ranges before reading the calendar", () => {
    expect(slotsBetween(undefined, "2026-10-09").error).toBe("invalid_range");
    expect(slotsBetween("2026-10-05", undefined).error).toBe("invalid_range");
    expect(slotsBetween("2026-10-5", "2026-10-09").error).toBe("invalid_range");
    expect(slotsBetween("2026-10-05T00:00", "2026-10-09").error).toBe("invalid_range");
    expect(slotsBetween("2026-10-09", "2026-10-05").error).toBe("invalid_range");
    expect(freebusyQueries).toEqual([]);
  });

  it("accepts a single day and up to 45 days, and refuses 46", () => {
    expect(slotsBetween("2026-10-05", "2026-10-05").ok).toBe(true);
    expect(slotsBetween("2026-10-01", "2026-11-14").ok).toBe(true);
    const queriesBefore = freebusyQueries.length;
    expect(slotsBetween("2026-10-01", "2026-11-15").error).toBe("invalid_range");
    expect(freebusyQueries).toHaveLength(queriesBefore);
  });
});
