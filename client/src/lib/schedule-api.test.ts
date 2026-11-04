import { afterEach, describe, expect, it, vi } from "vitest";
import { KEY_ERRORS, buildConfirmBody, describeScheduleError } from "./schedule-api";

describe("callScheduleApi", () => {
  const API_URL = "https://script.example.test/exec";

  async function loadWithFetch(fetchImpl: () => Promise<Response>) {
    vi.stubEnv("VITE_SCHEDULE_API_URL", API_URL);
    const fetchMock = vi.fn(fetchImpl);
    vi.stubGlobal("fetch", fetchMock);
    vi.resetModules();
    const api = await import("./schedule-api");
    return { api, fetchMock };
  }

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("posts a text/plain JSON body and returns the payload", async () => {
    const { api, fetchMock } = await loadWithFetch(async () => new Response(JSON.stringify({ ok: true, slots: [] })));
    await expect(api.callScheduleApi({ action: "slots", key: "K" })).resolves.toEqual({ ok: true, slots: [] });
    expect(fetchMock).toHaveBeenCalledWith(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "slots", key: "K" }),
    });
  });

  it("reports a network error when the reply is not JSON", async () => {
    const { api } = await loadWithFetch(async () => new Response("<html>Service unavailable</html>", { status: 503 }));
    const call = api.callScheduleApi({ action: "access" });
    await expect(call).rejects.toBeInstanceOf(api.ScheduleApiError);
    await expect(call).rejects.toMatchObject({ code: "network_error" });
  });

  it("reports a network error when fetch itself fails", async () => {
    const { api } = await loadWithFetch(() => Promise.reject(new TypeError("Failed to fetch")));
    await expect(api.callScheduleApi({ action: "access" })).rejects.toMatchObject({ code: "network_error" });
  });

  it("passes the backend's error code through, or server_error when it gives none", async () => {
    const { api, fetchMock } = await loadWithFetch(async () => new Response(JSON.stringify({ ok: false, error: "slot_taken" })));
    await expect(api.callScheduleApi({ action: "confirm" })).rejects.toMatchObject({ code: "slot_taken" });
    fetchMock.mockImplementationOnce(async () => new Response(JSON.stringify({ ok: false })));
    await expect(api.callScheduleApi({ action: "confirm" })).rejects.toMatchObject({ code: "server_error" });
  });

  it("refuses to call anything when no API URL is configured", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("VITE_SCHEDULE_API_URL", "");
    vi.resetModules();
    const api = await import("./schedule-api");
    expect(api.isSchedulingConfigured()).toBe(false);
    await expect(api.callScheduleApi({ action: "access" })).rejects.toMatchObject({ code: "not_configured" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("buildConfirmBody", () => {
  const input = {
    accessKey: "ABCD-EFGH-JKMN-PQRS",
    typeId: "30min",
    slot: { start: "2026-10-06T15:00:00.000Z", end: "2026-10-06T15:30:00.000Z" },
    name: "  Ada  ",
    email: " ada@example.com ",
    notes: "",
    honeypot: "",
    guestTimeZone: "Europe/London",
  };

  it("sends the backend's ISO instant, trimmed details and the zone for the guest's email", () => {
    expect(buildConfirmBody(input)).toEqual({
      action: "confirm",
      key: "ABCD-EFGH-JKMN-PQRS",
      type: "30min",
      start: "2026-10-06T15:00:00.000Z",
      name: "Ada",
      email: "ada@example.com",
      notes: "",
      website: "",
      guestTimeZone: "Europe/London",
    });
  });

  it("books the same instant whatever zone the guest is viewing", () => {
    const tokyo = buildConfirmBody({ ...input, guestTimeZone: "Asia/Tokyo" });
    expect(tokyo.start).toBe(buildConfirmBody(input).start);
  });
});

describe("describeScheduleError", () => {
  it("maps known codes and falls back for unknown ones", () => {
    expect(describeScheduleError("key_used_up")).toMatch(/already been used/);
    expect(describeScheduleError("whatever")).toMatch(/Something went wrong/);
  });
});

describe("describeScheduleError for booking failures", () => {
  const GENERIC = /Something went wrong/;

  it.each([
    ["invalid_slot", /can't be booked/],
    ["invalid_range", /dates couldn't be loaded/],
    ["unknown_action", /reload the page/],
  ])("has a specific message for %s", (code, expected) => {
    const message = describeScheduleError(code);
    expect(message).toMatch(expected);
    expect(message).not.toMatch(GENERIC);
  });
});

describe("KEY_ERRORS", () => {
  it("sends a visitor back to the key gate when the key unlocks no meetings", () => {
    expect(KEY_ERRORS.has("key_no_types")).toBe(true);
    expect(describeScheduleError("key_no_types")).toMatch(/isn't set up/);
  });
});
