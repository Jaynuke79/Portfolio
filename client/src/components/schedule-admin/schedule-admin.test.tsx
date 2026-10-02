// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as adminApi from "@/lib/schedule-admin-api";
import { ScheduleApiError } from "@/lib/schedule-api";
import ScheduleAdmin from "./index";

vi.mock("@/lib/schedule-api", async importOriginal => ({
  ...(await importOriginal<typeof import("@/lib/schedule-api")>()),
  isSchedulingConfigured: () => true,
}));

vi.mock("@/lib/schedule-admin-api", async importOriginal => ({
  ...(await importOriginal<typeof adminApi>()),
  getConfig: vi.fn(),
  saveConfig: vi.fn(),
  previewSlots: vi.fn(),
  listKeys: vi.fn(),
  issueKey: vi.fn(),
  updateKey: vi.fn(),
  revokeKey: vi.fn(),
}));

function config(): adminApi.BookingConfig {
  return {
    title: "Meet with Jayden",
    description: "",
    timeZone: "America/Denver",
    calendarId: "primary",
    busyCalendarIds: ["primary"],
    bufferMinutes: 15,
    minLeadHours: 12,
    horizonDays: 30,
    keyDefaults: { expiresInDays: 14, maxUses: 1, typeIds: ["15min"] },
    weeklyHours: { 1: [["09:00", "17:00"]] },
    types: [
      { id: "15min", name: "15 Minute Chat", durationMinutes: 15 },
      { id: "30min", name: "30 Minute Chat", durationMinutes: 30 },
    ],
  };
}

async function signIn(token = "secret") {
  render(<ScheduleAdmin />);
  fireEvent.change(screen.getByLabelText("Admin token"), { target: { value: token } });
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
  });
}

async function clickSave() {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  });
}

beforeEach(() => {
  sessionStorage.clear();
  vi.mocked(adminApi.getConfig).mockReset().mockResolvedValue({ config: config(), version: "v1" });
  vi.mocked(adminApi.saveConfig).mockReset();
  vi.mocked(adminApi.previewSlots).mockReset().mockResolvedValue({ type: "15min", timeZone: "America/Denver", slots: [] });
  vi.mocked(adminApi.listKeys).mockReset().mockResolvedValue({ keys: [] });
});

afterEach(cleanup);

describe("ScheduleAdmin", () => {
  it("stays locked when the token is rejected", async () => {
    vi.mocked(adminApi.getConfig).mockRejectedValue(new ScheduleApiError("forbidden"));
    await signIn("wrong");
    expect(screen.getByRole("alert").textContent).toMatch(/isn't valid/);
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(sessionStorage.getItem("schedule-admin-token")).toBeNull();
  });

  it("saves edited weekly hours with the version it loaded", async () => {
    vi.mocked(adminApi.saveConfig).mockImplementation(async (_t, saved) => ({ config: saved, version: "v2" }));
    await signIn();
    fireEvent.click(screen.getByRole("checkbox", { name: "Tuesday" }));
    fireEvent.change(screen.getByLabelText("Tuesday window 1 end"), { target: { value: "12:00" } });
    await clickSave();

    const [token, saved, version] = vi.mocked(adminApi.saveConfig).mock.calls[0];
    expect(token).toBe("secret");
    expect(version).toBe("v1");
    expect(saved.weeklyHours).toEqual({ 1: [["09:00", "17:00"]], 2: [["09:00", "12:00"]] });
    expect(screen.getByRole("status").textContent).toMatch(/Saved/);
  });

  it("offers a reload instead of overwriting newer settings", async () => {
    vi.mocked(adminApi.saveConfig).mockRejectedValue(new ScheduleApiError("config_conflict"));
    await signIn();
    fireEvent.click(screen.getByRole("checkbox", { name: "Tuesday" }));
    await clickSave();

    expect(screen.getByRole("status").textContent).toMatch(/another tab/);
    expect(screen.getByRole("button", { name: "Reload latest" })).toBeTruthy();
  });

  it("drops a removed type from the new-key defaults", async () => {
    vi.mocked(adminApi.saveConfig).mockImplementation(async (_t, saved) => ({ config: saved, version: "v2" }));
    await signIn();
    fireEvent.click(screen.getByRole("tab", { name: "Meeting types" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove 15 Minute Chat" }));
    await clickSave();

    const saved = vi.mocked(adminApi.saveConfig).mock.calls[0][1];
    expect(saved.types.map(t => t.id)).toEqual(["30min"]);
    expect(saved.keyDefaults.typeIds).toBeNull();
  });

  it("refuses to save an emptied number field", async () => {
    await signIn();
    fireEvent.click(screen.getByRole("tab", { name: "Booking rules" }));
    fireEvent.change(screen.getByLabelText("Uses"), { target: { value: "" } });
    await clickSave();

    expect(adminApi.saveConfig).not.toHaveBeenCalled();
    expect(screen.getByRole("status").textContent).toMatch(/New key uses needs a number/);
  });

  it("moves between tabs with the arrow keys", async () => {
    await signIn();
    fireEvent.keyDown(screen.getByRole("tab", { name: "Availability" }), { key: "ArrowLeft" });
    expect(screen.getByRole("tab", { name: "Access keys" }).getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Access keys" }));
  });
});
