import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createContext, runInContext } from "node:vm";
import { beforeEach, describe, expect, it } from "vitest";

type Json = Record<string, any>;

const dir = dirname(fileURLToPath(import.meta.url));
const ADMIN = "admin-token";

let props: Record<string, string>;
let busy: { start: string; end: string }[];
let inserted: Json[];
let post: (body: Json) => Json;
let defaultConfig: () => Json;

function loadBackend() {
  props = { ADMIN_TOKEN: ADMIN };
  busy = [];
  inserted = [];
  const cache = new Map<string, string>();
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
        getProperty: (k: string) => props[k] ?? null,
        setProperty: (k: string, v: string) => (props[k] = v),
        setProperties: (values: Record<string, string>) => Object.assign(props, values),
        getProperties: () => ({ ...props }),
        deleteProperty: (k: string) => delete props[k],
      }),
    },
    CacheService: {
      getScriptCache: () => ({ get: (k: string) => cache.get(k) ?? null, put: (k: string, v: string) => cache.set(k, v) }),
    },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    Utilities: {
      getUuid: randomUUID,
      DigestAlgorithm: { SHA_256: "sha256" },
      Charset: { UTF_8: "utf8" },
      computeDigest: (_algo: string, text: string) =>
        [...createHash("sha256").update(text).digest()].map(b => (b > 127 ? b - 256 : b)),
    },
    Calendar: {
      Freebusy: { query: () => ({ calendars: { primary: { busy } } }) },
      Events: {
        insert: (event: Json) => {
          inserted.push(event);
          busy.push({ start: event.start.dateTime, end: event.end.dateTime });
          return { hangoutLink: "https://meet.google.com/test" };
        },
      },
    },
    ContentService: {
      MimeType: { JSON: "json" },
      createTextOutput: (text: string) => ({ setMimeType: () => JSON.parse(text) }),
    },
  });
  for (const file of ["Slots.js", "Keys.js", "Config.js", "Code.js"]) {
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

beforeEach(loadBackend);

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
