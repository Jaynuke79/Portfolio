// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as adminApi from "@/lib/schedule-admin-api";
import OpenTimesPreview from "./open-times-preview";

vi.mock("@/lib/schedule-admin-api", async importOriginal => ({
  ...(await importOriginal<typeof adminApi>()),
  previewSlots: vi.fn(),
}));

const savedConfig: adminApi.BookingConfig = {
  title: "Meet with Jayden",
  description: "",
  timeZone: "UTC",
  calendarId: "primary",
  busyCalendarIds: ["primary"],
  bufferMinutes: 0,
  minLeadHours: 0,
  horizonDays: 30,
  keyDefaults: { expiresInDays: 14, maxUses: 1, typeIds: null },
  notifications: { emailGuest: true, emailOwner: true, ownerEmail: "" },
  weeklyHours: { 1: [["09:00", "17:00"]] },
  types: [
    { id: "15min", name: "15 Minute Chat", durationMinutes: 15 },
    { id: "30min", name: "30 Minute Chat", durationMinutes: 30 },
  ],
};

function slotAt(hour: number) {
  const start = new Date(Date.now() + 2 * 86_400_000);
  start.setUTCHours(hour, 0, 0, 0);
  return { start: start.toISOString(), end: new Date(start.getTime() + 15 * 60_000).toISOString() };
}

afterEach(cleanup);

describe("OpenTimesPreview", () => {
  it("ignores a slow response for a meeting type that is no longer selected", async () => {
    const pending: Record<string, (slots: { start: string; end: string }[]) => void> = {};
    vi.mocked(adminApi.previewSlots).mockImplementation(
      (_token, type) =>
        new Promise(resolve => {
          pending[type] = slots => resolve({ type, timeZone: "UTC", slots });
        })
    );
    render(<OpenTimesPreview token="secret" savedConfig={savedConfig} version="v1" unsaved={false} />);
    fireEvent.click(screen.getByRole("button", { name: "list" }));
    fireEvent.change(screen.getByLabelText("Meeting type to preview"), { target: { value: "30min" } });

    await act(async () => pending["30min"]([slotAt(14)]));
    await act(async () => pending["15min"]([slotAt(10)]));

    const list = screen.getByRole("list").textContent ?? "";
    expect(list).toMatch(/2:00/);
    expect(list).not.toMatch(/10:00/);
  });
});
