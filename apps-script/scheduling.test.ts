import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createContext, runInContext } from "node:vm";
import { describe, expect, it } from "vitest";

type SlotList = { start: string; end: string }[];

interface AppsScriptGlobals {
  wallTimeToEpochMs(dateKey: string, time: string, timeZone: string): number;
  dateKeyInZone(epochMs: number, timeZone: string): string;
  eachDateKey(start: string, end: string): string[];
  buildSlots(opts: Record<string, unknown>): SlotList;
  randomHexFromUuids(uuids: string[]): string;
  formatKeyFromHex(hex: string): string;
  normalizeKey(input: unknown): string;
  isWellFormedKey(normalized: string): boolean;
  keyStatus(record: Record<string, unknown>, nowMs: number): string;
  resolveKeyTerms(body: Record<string, unknown>, ctx: Record<string, unknown>, current: Record<string, unknown> | null): {
    terms?: Record<string, any>;
    error?: string;
  };
  typesForKey(types: { id: string }[], record: Record<string, unknown>): { id: string }[];
  defaultBookingConfig(): Record<string, any>;
  buildConfirmationEmails(input: Record<string, any>): Record<string, any>[];
  validateBookingConfig(input: unknown, current: Record<string, any> | null): {
    config?: Record<string, any>;
    error?: string;
    field?: string;
  };
}

const dir = dirname(fileURLToPath(import.meta.url));
const context = createContext({ Intl, Date, Math, Number, String });
for (const file of ["Slots.js", "Keys.js", "Config.js", "Mail.js"]) {
  runInContext(readFileSync(resolve(dir, file), "utf8"), context);
}
const gs = context as unknown as AppsScriptGlobals;

const DENVER = "America/Denver";
const WEEKDAYS_9_TO_11 = Object.fromEntries(["1", "2", "3", "4", "5"].map(d => [d, [["09:00", "11:00"]]]));

function slots(overrides: Record<string, unknown> = {}): SlotList {
  return gs.buildSlots({
    startDate: "2026-10-06",
    endDate: "2026-10-06",
    timeZone: DENVER,
    weeklyHours: WEEKDAYS_9_TO_11,
    busy: [],
    durationMinutes: 30,
    bufferMinutes: 0,
    earliestMs: 0,
    latestMs: Number.MAX_SAFE_INTEGER,
    ...overrides,
  });
}

describe("wallTimeToEpochMs", () => {
  it("applies the offset in force on that date, across DST", () => {
    expect(new Date(gs.wallTimeToEpochMs("2026-10-06", "09:00", DENVER)).toISOString()).toBe("2026-10-06T15:00:00.000Z");
    expect(new Date(gs.wallTimeToEpochMs("2026-12-07", "09:00", DENVER)).toISOString()).toBe("2026-12-07T16:00:00.000Z");
  });

  it("handles the day DST ends", () => {
    expect(new Date(gs.wallTimeToEpochMs("2026-11-01", "09:00", DENVER)).toISOString()).toBe("2026-11-01T16:00:00.000Z");
  });
});

describe("dateKeyInZone", () => {
  it("reads the calendar date in the given zone, not UTC", () => {
    const lateEveningDenver = Date.parse("2026-10-07T03:30:00Z");
    expect(gs.dateKeyInZone(lateEveningDenver, DENVER)).toBe("2026-10-06");
  });
});

describe("buildSlots", () => {
  it("walks the owner's window on a half-hour grid", () => {
    expect(slots().map(s => s.start)).toEqual([
      "2026-10-06T15:00:00.000Z",
      "2026-10-06T15:30:00.000Z",
      "2026-10-06T16:00:00.000Z",
      "2026-10-06T16:30:00.000Z",
    ]);
  });

  it("offers nothing on a day without configured hours", () => {
    expect(slots({ startDate: "2026-10-04", endDate: "2026-10-04" })).toEqual([]);
  });

  it("pads busy blocks by the buffer and resumes on the next grid step", () => {
    const result = slots({
      busy: [{ start: "2026-10-06T15:30:00Z", end: "2026-10-06T15:50:00Z" }],
      bufferMinutes: 10,
    });
    expect(result.map(s => s.start)).toEqual(["2026-10-06T16:00:00.000Z", "2026-10-06T16:30:00.000Z"]);
  });

  it("only keeps slots that fully fit before the window closes", () => {
    expect(slots({ durationMinutes: 60 }).map(s => s.start)).toEqual([
      "2026-10-06T15:00:00.000Z",
      "2026-10-06T15:30:00.000Z",
      "2026-10-06T16:00:00.000Z",
    ]);
  });

  it("drops slots before the lead time and past the horizon", () => {
    const result = slots({
      earliestMs: Date.parse("2026-10-06T15:15:00Z"),
      latestMs: Date.parse("2026-10-06T16:45:00Z"),
    });
    expect(result.map(s => s.start)).toEqual(["2026-10-06T15:30:00.000Z", "2026-10-06T16:00:00.000Z"]);
  });

  it("ignores busy time on other days", () => {
    const result = slots({ busy: [{ start: "2026-10-05T15:00:00Z", end: "2026-10-05T17:00:00Z" }] });
    expect(result).toHaveLength(4);
  });
});

describe("access keys", () => {
  const uuid = "123e4567-e89b-42d3-a456-426614174000";

  it("strips the fixed UUID version and variant nibbles", () => {
    const hex = gs.randomHexFromUuids([uuid]);
    expect(hex).toHaveLength(30);
    expect(hex).toBe("123e4567e89b2d3456426614174000");
  });

  it("formats 80 bits as four groups of Crockford base32", () => {
    const key = gs.formatKeyFromHex(gs.randomHexFromUuids([uuid, uuid]));
    expect(key).toMatch(/^[0-9A-HJKMNP-TV-Z]{4}(-[0-9A-HJKMNP-TV-Z]{4}){3}$/);
    expect(gs.isWellFormedKey(gs.normalizeKey(key))).toBe(true);
  });

  it("normalizes case, separators and look-alike characters", () => {
    expect(gs.normalizeKey(" abcd-efgh ijkm-nopq ")).toBe("ABCDEFGH1JKMN0PQ");
    expect(gs.normalizeKey(null)).toBe("");
  });

  it("rejects malformed keys", () => {
    expect(gs.isWellFormedKey("ABC")).toBe(false);
    expect(gs.isWellFormedKey("ABCDEFGHJKMNPQRU")).toBe(false);
  });

  it("reports expiry and exhausted uses", () => {
    const now = Date.parse("2026-10-01T00:00:00Z");
    const base = { uses: 0, maxUses: 1, expiresAt: "2026-10-10T00:00:00Z" };
    expect(gs.keyStatus(base, now)).toBe("ok");
    expect(gs.keyStatus({ ...base, uses: 1 }, now)).toBe("used_up");
    expect(gs.keyStatus({ ...base, expiresAt: "2026-09-30T00:00:00Z" }, now)).toBe("expired");
    expect(gs.keyStatus({ ...base, maxUses: null, uses: 99 }, now)).toBe("ok");
  });
});

describe("resolveKeyTerms", () => {
  const NOW = Date.parse("2026-10-01T12:00:00Z");
  const ctx = (defaults: Record<string, unknown> = {}) => ({
    defaults,
    knownTypeIds: ["15min", "30min"],
    timeZone: DENVER,
    nowMs: NOW,
  });
  const resolve = (body: Record<string, unknown>, defaults?: Record<string, unknown>, current: any = null) =>
    gs.resolveKeyTerms(body, ctx(defaults), current);

  it("falls back to built-in defaults: one use, 14 days, every type", () => {
    expect(resolve({}).terms).toEqual({
      label: "",
      maxUses: 1,
      expiresAt: "2026-10-15T12:00:00.000Z",
      typeIds: null,
    });
  });

  it("uses keyDefaults from the config when the request omits a field", () => {
    expect(resolve({}, { expiresInDays: 3, maxUses: 2, typeIds: ["15min"] }).terms).toMatchObject({
      maxUses: 2,
      expiresAt: "2026-10-04T12:00:00.000Z",
      typeIds: ["15min"],
    });
  });

  it("lets the request override every default", () => {
    const { terms } = resolve(
      { label: "Acme", unlimitedUses: true, expiresInDays: 1, allTypes: true },
      { maxUses: 2, typeIds: ["15min"] }
    );
    expect(terms).toEqual({ label: "Acme", maxUses: null, expiresAt: "2026-10-02T12:00:00.000Z", typeIds: null });
  });

  it("expires an exact date at the end of that day in the owner's zone", () => {
    expect(resolve({ expiresOn: "2026-10-31" }).terms!.expiresAt).toBe("2026-11-01T05:59:59.999Z");
  });

  it("rejects bad uses, expiry and types", () => {
    expect(resolve({ maxUses: null }).error).toBe("invalid_uses");
    expect(resolve({ maxUses: 1.5 }).error).toBe("invalid_uses");
    expect(resolve({ expiresInDays: 0 }).error).toBe("invalid_expiry");
    expect(resolve({ expiresInDays: 366 }).error).toBe("invalid_expiry");
    expect(resolve({ expiresOn: "2026-09-01" }).error).toBe("invalid_expiry");
    expect(resolve({ expiresOn: "soon" }).error).toBe("invalid_expiry");
    expect(resolve({ expiresInDays: 3, expiresOn: "2026-10-31" }).error).toBe("invalid_expiry");
    expect(resolve({ typeIds: [] }).error).toBe("invalid_types");
    expect(resolve({ typeIds: ["60min"] }).error).toBe("unknown_type");
    expect(resolve({}, { typeIds: ["gone"] }).error).toBe("unknown_type");
  });

  it("dedupes type ids", () => {
    expect(resolve({ typeIds: ["30min", "30min"] }).terms!.typeIds).toEqual(["30min"]);
  });

  describe("on update", () => {
    const current = {
      label: "Acme",
      maxUses: 1,
      uses: 1,
      expiresAt: "2026-09-20T00:00:00.000Z",
      typeIds: ["15min"],
    };

    it("keeps unspecified fields, even an expiry already in the past", () => {
      expect(resolve({ label: "Acme Corp" }, { maxUses: 5, typeIds: ["30min"] }, current).terms).toEqual({
        label: "Acme Corp",
        maxUses: 1,
        expiresAt: "2026-09-20T00:00:00.000Z",
        typeIds: ["15min"],
      });
    });

    it("extends expiry, adds uses and widens types", () => {
      expect(resolve({ expiresInDays: 7, maxUses: 2, allTypes: true }, {}, current).terms).toMatchObject({
        maxUses: 2,
        expiresAt: "2026-10-08T12:00:00.000Z",
        typeIds: null,
      });
    });
  });
});

describe("typesForKey", () => {
  const types = [{ id: "15min" }, { id: "30min" }, { id: "60min" }];

  it("returns every type for an unrestricted key", () => {
    expect(gs.typesForKey(types, { typeIds: null })).toEqual(types);
    expect(gs.typesForKey(types, {})).toEqual(types);
  });

  it("keeps config order and drops types removed from the config", () => {
    expect(gs.typesForKey(types, { typeIds: ["60min", "15min", "gone"] })).toEqual([{ id: "15min" }, { id: "60min" }]);
  });
});

describe("validateBookingConfig", () => {
  const base = () => gs.defaultBookingConfig();
  const check = (patch: Record<string, unknown>) => gs.validateBookingConfig({ ...base(), ...patch }, null);

  it("accepts the built-in default unchanged", () => {
    expect(gs.validateBookingConfig(base(), null).config).toEqual(base());
  });

  it("sorts windows, drops empty days and strips unknown fields", () => {
    const { config } = check({ weeklyHours: { 1: [["13:00", "17:00"], ["09:00", "12:00"]], 2: [] }, extra: "x" });
    expect(config!.weeklyHours).toEqual({ 1: [["09:00", "12:00"], ["13:00", "17:00"]] });
    expect(config).not.toHaveProperty("extra");
  });

  it("allows back-to-back windows", () => {
    expect(check({ weeklyHours: { 3: [["09:00", "12:00"], ["12:00", "13:00"]] } }).error).toBeUndefined();
  });

  it.each([
    [{ weeklyHours: { 1: [["9:00", "12:00"]] } }, "invalid_window", "weeklyHours"],
    [{ weeklyHours: { 1: [["09:00", "24:00"]] } }, "invalid_window", "weeklyHours"],
    [{ weeklyHours: { 1: [["12:00", "09:00"]] } }, "invalid_window", "weeklyHours"],
    [{ weeklyHours: { 1: [["09:00", "12:00"], ["11:30", "13:00"]] } }, "overlapping_windows", "weeklyHours"],
    [{ weeklyHours: { 7: [["09:00", "12:00"]] } }, "invalid_config", "weeklyHours"],
    [{ timeZone: "Mars/Olympus" }, "invalid_config", "timeZone"],
    [{ title: "  " }, "invalid_config", "title"],
    [{ bufferMinutes: -5 }, "invalid_config", "bufferMinutes"],
    [{ minLeadHours: 1.5 }, "invalid_config", "minLeadHours"],
    [{ horizonDays: 0 }, "invalid_config", "horizonDays"],
    [{ types: [] }, "invalid_config", "types"],
    [{ types: [{ id: "Bad Id", name: "x", durationMinutes: 30 }] }, "invalid_type_id", "types"],
    [{ types: [{ id: "a", name: "x", durationMinutes: 30 }, { id: "a", name: "y", durationMinutes: 15 }] }, "duplicate_type_id", "types"],
    [{ types: [{ id: "a", name: "", durationMinutes: 30 }] }, "invalid_type_name", "types"],
    [{ types: [{ id: "a", name: "x", durationMinutes: 7 }] }, "invalid_type_duration", "types"],
    [{ keyDefaults: { expiresInDays: 0, maxUses: 1, typeIds: null } }, "invalid_expiry", "keyDefaults"],
    [{ keyDefaults: { expiresInDays: 7, maxUses: 0, typeIds: null } }, "invalid_uses", "keyDefaults"],
    [{ keyDefaults: { expiresInDays: 7, maxUses: 1, typeIds: ["60min"] } }, "unknown_type", "keyDefaults"],
    [{ notifications: { emailGuest: true, emailOwner: true, ownerEmail: "not-an-email" } }, "invalid_email", "notifications"],
  ])("rejects %j", (patch, error, field) => {
    expect(check(patch)).toEqual({ error, field });
  });

  it("carries calendar ids over from the current config", () => {
    const current = { ...base(), calendarId: "work@example.com", busyCalendarIds: ["work@example.com", "primary"] };
    const { config } = gs.validateBookingConfig({ ...base(), calendarId: "evil@example.com" }, current);
    expect(config!.calendarId).toBe("work@example.com");
    expect(config!.busyCalendarIds).toEqual(["work@example.com", "primary"]);
  });
});

describe("buildConfirmationEmails", () => {
  const input = (patch: Record<string, any> = {}) => ({
    config: gs.defaultBookingConfig(),
    type: { id: "30min", name: "30 Minute Chat", durationMinutes: 30 },
    guest: { name: "Ada Lovelace", email: "ada@example.com", notes: "" },
    start: "2026-10-06T15:00:00.000Z",
    end: "2026-10-06T15:30:00.000Z",
    meetLink: "https://meet.google.com/abc-defg-hij",
    guestTimeZone: "Europe/London",
    ownerEmail: "owner@example.com",
    keyLabel: "Recruiter at Acme",
    ...patch,
  });
  const byRecipient = (emails: Record<string, any>[]) => Object.fromEntries(emails.map(e => [e.recipient, e]));

  it("emails the guest in their own time zone with replies going to the owner", () => {
    const { guest } = byRecipient(gs.buildConfirmationEmails(input()));
    expect(guest.to).toBe("ada@example.com");
    expect(guest.replyTo).toBe("owner@example.com");
    expect(guest.subject).toBe("Confirmed: 30 Minute Chat on Tuesday, October 6, 2026, 4:00 PM – 4:30 PM GMT+1");
    expect(guest.body).toContain("Google Meet: https://meet.google.com/abc-defg-hij");
    expect(guest.htmlBody).toContain('href="https://meet.google.com/abc-defg-hij"');
  });

  it("emails the owner in the owner's zone, with guest contact, guest time and the private label", () => {
    const { owner } = byRecipient(gs.buildConfirmationEmails(input()));
    expect(owner.to).toBe("owner@example.com");
    expect(owner.replyTo).toBe("ada@example.com");
    expect(owner.body).toContain("When: Tuesday, October 6, 2026, 9:00 AM – 9:30 AM MDT");
    expect(owner.body).toContain("Guest: Ada Lovelace <ada@example.com>");
    expect(owner.body).toContain("Guest time: Tuesday, October 6, 2026, 4:00 PM – 4:30 PM GMT+1");
    expect(owner.body).toContain("Key: Recruiter at Acme");
  });

  it("keeps the private key label out of the guest's email", () => {
    const { guest } = byRecipient(gs.buildConfirmationEmails(input()));
    expect(guest.body).not.toContain("Recruiter");
    expect(guest.htmlBody).not.toContain("Recruiter");
  });

  it("escapes guest-supplied text in HTML and keeps subjects on one line", () => {
    const emails = gs.buildConfirmationEmails(
      input({ guest: { name: 'Eve <a href="x">\nhi', email: "eve@example.com", notes: "line 1\n<script>alert(1)</script>" } })
    );
    for (const email of emails) {
      expect(email.htmlBody).not.toContain("<script>");
      expect(email.htmlBody).not.toContain('<a href="x">');
      expect(email.subject).not.toMatch(/[\r\n]/);
    }
    expect(byRecipient(emails).owner.htmlBody).toContain("line 1<br>&lt;script&gt;");
  });

  it("falls back to the owner's zone for a missing or bogus guest zone", () => {
    for (const guestTimeZone of [null, "Not/AZone"]) {
      const { guest, owner } = byRecipient(gs.buildConfirmationEmails(input({ guestTimeZone })));
      expect(guest.subject).toContain("9:00 AM – 9:30 AM MDT");
      expect(owner.body).not.toContain("Guest time");
    }
  });

  it("respects the notification toggles and a missing owner address", () => {
    const config = { ...gs.defaultBookingConfig(), notifications: { emailGuest: false, emailOwner: true, ownerEmail: "" } };
    expect(gs.buildConfirmationEmails(input({ config })).map(e => e.recipient)).toEqual(["owner"]);
    expect(gs.buildConfirmationEmails(input({ ownerEmail: "" })).map(e => e.recipient)).toEqual(["guest"]);
  });

  it("omits empty optional rows", () => {
    const { guest } = byRecipient(gs.buildConfirmationEmails(input({ meetLink: null })));
    expect(guest.body).not.toContain("Google Meet");
    expect(guest.body).not.toContain("Your notes");
  });
});
