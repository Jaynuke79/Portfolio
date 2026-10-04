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

async function reachDetails(slot: api.Slot) {
  await enterKey("ABCD-EFGH-JKMN-PQRS");
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
});
