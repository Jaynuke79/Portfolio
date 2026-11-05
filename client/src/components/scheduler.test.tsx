// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "@/lib/schedule-api";
import Scheduler from "./scheduler";

vi.mock("@/lib/schedule-api", async importOriginal => {
  const actual = await importOriginal<typeof api>();
  return {
    ...actual,
    isSchedulingConfigured: () => true,
    fetchBookingInfo: vi.fn(),
    fetchSlots: vi.fn(),
    confirmBooking: vi.fn(),
  };
});

const INFO: api.BookingInfo = {
  title: "Meet with Jayden",
  description: "",
  types: [
    { id: "15min", name: "15 Minute Chat", durationMinutes: 15 },
    { id: "30min", name: "30 Minute Chat", durationMinutes: 30 },
  ],
  horizonDays: 30,
};

function slotTomorrowAtNoonUtc(): api.Slot {
  const start = new Date();
  start.setUTCDate(start.getUTCDate() + 1);
  start.setUTCHours(12, 0, 0, 0);
  return { start: start.toISOString(), end: new Date(start.getTime() + 30 * 60000).toISOString() };
}

async function enterKey(value: string) {
  fireEvent.change(screen.getByLabelText("Access key"), { target: { value } });
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  });
}

async function reachDetails(slot: api.Slot, { keyEntered = false } = {}) {
  if (!keyEntered) await enterKey("ABCD-EFGH-JKMN-PQRS");
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: /30 Minute Chat/ }));
  });
  const zone = screen.getByLabelText("Time zone");
  await act(async () => {
    fireEvent.change(zone, { target: { value: "Africa/Abidjan" } });
  });
  const day = Number(slot.start.slice(8, 10));
  if (!screen.queryByRole("button", { name: new RegExp(`\\b${day}, 1 time available`) })) {
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    });
  }
  fireEvent.click(screen.getByRole("button", { name: new RegExp(`\\b${day}, 1 time available`) }));
  fireEvent.click(screen.getByRole("button", { name: "12:00 PM" }));
}

beforeEach(() => {
  sessionStorage.clear();
  vi.mocked(api.fetchBookingInfo).mockReset();
  vi.mocked(api.fetchSlots).mockReset();
  vi.mocked(api.confirmBooking).mockReset();
});

afterEach(cleanup);

describe("Scheduler", () => {
  it("keeps the calendar hidden until a key is accepted", async () => {
    vi.mocked(api.fetchBookingInfo).mockRejectedValue(new api.ScheduleApiError("invalid_key"));
    render(<Scheduler />);
    await enterKey("nope");

    expect(screen.getByRole("alert").textContent).toMatch(/wasn't recognized/);
    expect(api.fetchSlots).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("Time zone")).toBeNull();
  });

  it("books a slot end to end with the backend's instant", async () => {
    const slot = slotTomorrowAtNoonUtc();
    vi.mocked(api.fetchBookingInfo).mockResolvedValue(INFO);
    vi.mocked(api.fetchSlots).mockResolvedValue([slot]);
    vi.mocked(api.confirmBooking).mockResolvedValue({
      start: slot.start,
      end: slot.end,
      meetLink: "https://meet.google.com/abc",
      emailed: { guest: true, owner: true },
    });
    render(<Scheduler />);
    await reachDetails(slot);

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Ada" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "ada@example.com" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Confirm booking" }));
    });

    expect(api.confirmBooking).toHaveBeenCalledWith(
      expect.objectContaining({ accessKey: "ABCD-EFGH-JKMN-PQRS", typeId: "30min", slot, honeypot: "", guestTimeZone: "Africa/Abidjan" })
    );
    expect(screen.getByRole("heading", { name: "You're booked" })).toBeTruthy();
    expect(screen.getByText(/A confirmation email and calendar invite are on their way to/)).toBeTruthy();
    expect(screen.getByRole("link", { name: /Google Meet/ }).getAttribute("href")).toBe("https://meet.google.com/abc");
    expect(sessionStorage.getItem("schedule-access-key")).toBeNull();
  });

  it("promises only the calendar invite when the backend reports no confirmation email", async () => {
    const slot = slotTomorrowAtNoonUtc();
    vi.mocked(api.fetchBookingInfo).mockResolvedValue(INFO);
    vi.mocked(api.fetchSlots).mockResolvedValue([slot]);
    vi.mocked(api.confirmBooking).mockResolvedValue({ start: slot.start, end: slot.end, meetLink: null });
    render(<Scheduler />);
    await reachDetails(slot);
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Ada" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "ada@example.com" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Confirm booking" }));
    });

    expect(screen.getByText(/A calendar invite is on its way to/)).toBeTruthy();
    expect(screen.queryByText(/confirmation email/)).toBeNull();
  });

  it("sends the visitor back to pick again when the slot was taken", async () => {
    const slot = slotTomorrowAtNoonUtc();
    vi.mocked(api.fetchBookingInfo).mockResolvedValue(INFO);
    vi.mocked(api.fetchSlots).mockResolvedValue([slot]);
    vi.mocked(api.confirmBooking).mockRejectedValue(new api.ScheduleApiError("slot_taken"));
    render(<Scheduler />);
    await reachDetails(slot);

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Ada" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "ada@example.com" } });
    const fetchesBefore = vi.mocked(api.fetchSlots).mock.calls.length;
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Confirm booking" }));
    });

    expect(screen.getByRole("alert").textContent).toMatch(/just taken/);
    expect(screen.getByLabelText("Time zone")).toBeTruthy();
    expect(vi.mocked(api.fetchSlots).mock.calls.length).toBeGreaterThan(fetchesBefore);
  });

  it("moves focus to the new step's heading after choosing a type and a time", async () => {
    const slot = slotTomorrowAtNoonUtc();
    vi.mocked(api.fetchBookingInfo).mockResolvedValue(INFO);
    vi.mocked(api.fetchSlots).mockResolvedValue([slot]);
    render(<Scheduler />);
    await enterKey("ABCD-EFGH-JKMN-PQRS");
    expect(document.activeElement).toBe(screen.getByRole("heading", { name: "Choose a meeting type" }));

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /30 Minute Chat/ }));
    });
    expect(document.activeElement).toBe(screen.getByRole("heading", { name: "Pick a time" }));

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Change meeting type" }));
    });
    await reachDetails(slot, { keyEntered: true });
    expect(document.activeElement).toBe(screen.getByRole("heading", { name: "Your details" }));
  });

  it("leaves focus alone when a stored key unlocks the flow on page load", async () => {
    sessionStorage.setItem("schedule-access-key", "ABCD-EFGH-JKMN-PQRS");
    vi.mocked(api.fetchBookingInfo).mockResolvedValue(INFO);
    await act(async () => {
      render(<Scheduler />);
    });

    expect(screen.getByRole("heading", { name: "Choose a meeting type" })).toBeTruthy();
    expect(document.activeElement).toBe(document.body);
  });

  it("drops the previous type's slots when the meeting type changes", async () => {
    const slot = slotTomorrowAtNoonUtc();
    vi.mocked(api.fetchBookingInfo).mockResolvedValue(INFO);
    vi.mocked(api.fetchSlots).mockImplementation((_key, typeId) =>
      typeId === "30min" ? Promise.resolve([slot]) : new Promise(() => {})
    );
    render(<Scheduler />);
    await enterKey("ABCD-EFGH-JKMN-PQRS");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /30 Minute Chat/ }));
    });
    expect(screen.queryAllByRole("button", { name: /\d+ times? available/ }).length).toBeGreaterThan(0);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Change meeting type" }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /15 Minute Chat/ }));
    });

    expect(screen.queryAllByRole("button", { name: /\d+ times? available/ })).toEqual([]);
    expect(screen.queryByRole("button", { name: "12:00 PM" })).toBeNull();
  });

  describe("on a fixed date", () => {
    const MID_OCTOBER = new Date("2026-10-15T18:00:00Z");
    const OCT_20_3PM_UTC: api.Slot = { start: "2026-10-20T15:00:00.000Z", end: "2026-10-20T15:30:00.000Z" };
    const NOV_10_5PM_UTC: api.Slot = { start: "2026-11-10T17:00:00.000Z", end: "2026-11-10T17:30:00.000Z" };

    function serveSlots(all: api.Slot[]) {
      vi.mocked(api.fetchSlots).mockImplementation(async (_key, _type, start, end) =>
        all.filter(s => s.start.slice(0, 10) >= start && s.start.slice(0, 10) <= end)
      );
    }

    async function openCalendar(now: Date, zone = "Africa/Abidjan") {
      vi.setSystemTime(now);
      vi.mocked(api.fetchBookingInfo).mockResolvedValue(INFO);
      render(<Scheduler />);
      await enterKey("ABCD-EFGH-JKMN-PQRS");
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /30 Minute Chat/ }));
      });
      await act(async () => {
        fireEvent.change(screen.getByLabelText("Time zone"), { target: { value: zone } });
      });
    }

    const day = (label: string) => screen.getByRole("button", { name: new RegExp(`^\\w+day, ${label}, `) });
    const month = (delta: "Previous month" | "Next month") =>
      act(async () => {
        fireEvent.click(screen.getByRole("button", { name: delta }));
      });

    beforeEach(() => vi.useFakeTimers({ toFake: ["Date"] }));
    afterEach(() => vi.useRealTimers());

    it("pages between months within the booking horizon", async () => {
      serveSlots([OCT_20_3PM_UTC, NOV_10_5PM_UTC]);
      await openCalendar(MID_OCTOBER);
      expect(screen.getByRole("heading", { name: "October 2026" })).toBeTruthy();
      expect(day("October 20").getAttribute("aria-label")).toMatch(/1 time available$/);

      const fetches = vi.mocked(api.fetchSlots).mock.calls.length;
      expect(screen.getByRole("button", { name: "Previous month" }).getAttribute("aria-disabled")).toBe("true");
      await month("Previous month");
      expect(screen.getByRole("heading", { name: "October 2026" })).toBeTruthy();
      expect(vi.mocked(api.fetchSlots).mock.calls.length).toBe(fetches);

      await month("Next month");
      expect(screen.getByRole("heading", { name: "November 2026" })).toBeTruthy();
      expect(vi.mocked(api.fetchSlots).mock.lastCall).toEqual(["ABCD-EFGH-JKMN-PQRS", "30min", "2026-10-30", "2026-12-02"]);
      expect(day("November 10").getAttribute("aria-label")).toMatch(/1 time available$/);

      expect(screen.getByRole("button", { name: "Next month" }).getAttribute("aria-disabled")).toBe("true");
      await month("Next month");
      expect(screen.getByRole("heading", { name: "November 2026" })).toBeTruthy();

      await month("Previous month");
      expect(screen.getByRole("heading", { name: "October 2026" })).toBeTruthy();
      expect(day("October 20").getAttribute("aria-label")).toMatch(/1 time available$/);
    });

    it("jumps once to next month when this month has nothing open", async () => {
      serveSlots([NOV_10_5PM_UTC]);
      await openCalendar(new Date("2026-10-28T18:00:00Z"));
      expect(screen.getByRole("heading", { name: "November 2026" })).toBeTruthy();
      expect(vi.mocked(api.fetchSlots).mock.calls.map(call => call.slice(2))).toEqual([
        ["2026-09-29", "2026-11-02"],
        ["2026-10-30", "2026-12-02"],
      ]);
      expect(day("November 10").getAttribute("aria-label")).toMatch(/1 time available$/);
    });

    it("stays on next month rather than chasing availability further", async () => {
      vi.mocked(api.fetchBookingInfo).mockResolvedValue({ ...INFO, horizonDays: 90 });
      serveSlots([]);
      vi.setSystemTime(new Date("2026-10-28T18:00:00Z"));
      render(<Scheduler />);
      await enterKey("ABCD-EFGH-JKMN-PQRS");
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /30 Minute Chat/ }));
      });
      expect(screen.getByRole("heading", { name: "November 2026" })).toBeTruthy();
      await act(async () => {});
      expect(screen.getByRole("heading", { name: "November 2026" })).toBeTruthy();
      expect(api.fetchSlots).toHaveBeenCalledTimes(2);
      expect(screen.getByText(/No open times this month/)).toBeTruthy();
    });

    it("re-labels slots for the visitor's time zone but books the same instant", async () => {
      serveSlots([OCT_20_3PM_UTC]);
      vi.mocked(api.confirmBooking).mockResolvedValue({ start: OCT_20_3PM_UTC.start, end: OCT_20_3PM_UTC.end, meetLink: null });
      await openCalendar(MID_OCTOBER);
      const fetches = vi.mocked(api.fetchSlots).mock.calls.length;

      fireEvent.click(day("October 20"));
      expect(screen.getByRole("button", { name: "3:00 PM" })).toBeTruthy();

      await act(async () => {
        fireEvent.change(screen.getByLabelText("Time zone"), { target: { value: "Asia/Tokyo" } });
      });
      expect(screen.getByRole("heading", { name: "Select a day" })).toBeTruthy();
      expect(day("October 20").getAttribute("aria-label")).toMatch(/no availability$/);
      fireEvent.click(day("October 21"));
      expect(screen.getByRole("button", { name: "12:00 AM" })).toBeTruthy();

      await act(async () => {
        fireEvent.change(screen.getByLabelText("Time zone"), { target: { value: "America/Denver" } });
      });
      fireEvent.click(day("October 20"));
      fireEvent.click(screen.getByRole("button", { name: "9:00 AM" }));
      expect(screen.getByText(/Tuesday, October 20 at 9:00 AM MDT/)).toBeTruthy();
      expect(vi.mocked(api.fetchSlots).mock.calls.length).toBe(fetches);

      fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Ada" } });
      fireEvent.change(screen.getByLabelText("Email"), { target: { value: "ada@example.com" } });
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Confirm booking" }));
      });
      expect(api.confirmBooking).toHaveBeenCalledWith(
        expect.objectContaining({ slot: OCT_20_3PM_UTC, guestTimeZone: "America/Denver" })
      );
    });
  });

  it("returns to the key gate when the key stops working mid-flow", async () => {
    vi.mocked(api.fetchBookingInfo).mockResolvedValue(INFO);
    vi.mocked(api.fetchSlots).mockRejectedValue(new api.ScheduleApiError("key_expired"));
    render(<Scheduler />);
    await enterKey("ABCD-EFGH-JKMN-PQRS");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /15 Minute Chat/ }));
    });

    expect(screen.getByLabelText("Access key")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toMatch(/expired/);
  });

  it("nests the month and day headings under the time step heading", async () => {
    const slot = slotTomorrowAtNoonUtc();
    vi.mocked(api.fetchBookingInfo).mockResolvedValue(INFO);
    vi.mocked(api.fetchSlots).mockResolvedValue([slot]);
    render(<Scheduler />);
    await enterKey("ABCD-EFGH-JKMN-PQRS");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /30 Minute Chat/ }));
    });

    expect(screen.getAllByRole("heading", { level: 2 }).map(h => h.textContent)).toEqual(["Pick a time"]);
    const monthLabel = screen.getByRole("heading", { level: 3 });
    expect(monthLabel.textContent).toMatch(/^\w+ \d{4}$/);
    expect(monthLabel.getAttribute("aria-live")).toBe("polite");
    expect(screen.getByRole("group", { name: monthLabel.textContent ?? "" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 4, name: "Select a day" })).toBeTruthy();
  });
});
