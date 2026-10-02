import { describe, expect, it } from "vitest";
import { KEY_ERRORS, buildConfirmBody, describeScheduleError } from "./schedule-api";

describe("buildConfirmBody", () => {
  it("sends the backend's ISO instant and no time zone", () => {
    const body = buildConfirmBody({
      accessKey: "ABCD-EFGH-JKMN-PQRS",
      typeId: "30min",
      slot: { start: "2026-10-06T15:00:00.000Z", end: "2026-10-06T15:30:00.000Z" },
      name: "  Ada  ",
      email: " ada@example.com ",
      notes: "",
      honeypot: "",
    });
    expect(body).toEqual({
      action: "confirm",
      key: "ABCD-EFGH-JKMN-PQRS",
      type: "30min",
      start: "2026-10-06T15:00:00.000Z",
      name: "Ada",
      email: "ada@example.com",
      notes: "",
      website: "",
    });
    expect(JSON.stringify(body)).not.toMatch(/zone/i);
  });
});

describe("describeScheduleError", () => {
  it("maps known codes and falls back for unknown ones", () => {
    expect(describeScheduleError("key_used_up")).toMatch(/already been used/);
    expect(describeScheduleError("whatever")).toMatch(/Something went wrong/);
  });
});

describe("KEY_ERRORS", () => {
  it("sends a visitor back to the key gate when the key unlocks no meetings", () => {
    expect(KEY_ERRORS.has("key_no_types")).toBe(true);
    expect(describeScheduleError("key_no_types")).toMatch(/isn't set up/);
  });
});
