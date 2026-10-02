import { describe, expect, it } from "vitest";
import { addMonths, dateKeyInZone, formatTimeRange, groupSlotsByDate, monthCells, monthFetchRange } from "./slot-calendar";

describe("groupSlotsByDate", () => {
  const slots = [
    { start: "2026-10-06T15:00:00Z", end: "2026-10-06T15:30:00Z" },
    { start: "2026-10-06T23:30:00Z", end: "2026-10-07T00:00:00Z" },
  ];

  it("files each slot under its date in the viewer's zone", () => {
    const denver = groupSlotsByDate(slots, "America/Denver");
    expect([...denver.keys()]).toEqual(["2026-10-06"]);
    expect(denver.get("2026-10-06")).toHaveLength(2);

    const tokyo = groupSlotsByDate(slots, "Asia/Tokyo");
    expect([...tokyo.keys()]).toEqual(["2026-10-07"]);

    const berlin = groupSlotsByDate(slots, "Europe/Berlin");
    expect([...berlin.keys()]).toEqual(["2026-10-06", "2026-10-07"]);
  });
});

describe("dateKeyInZone", () => {
  it("uses YYYY-MM-DD", () => {
    expect(dateKeyInZone("2026-01-02T12:00:00Z", "UTC")).toBe("2026-01-02");
  });
});

describe("monthCells", () => {
  it("pads the first week so day 1 lands on its weekday", () => {
    const cells = monthCells(2026, 9);
    expect(cells.slice(0, 5)).toEqual([null, null, null, null, "2026-10-01"]);
    expect(cells.filter(Boolean)).toHaveLength(31);
    expect(cells.at(-1)).toBe("2026-10-31");
  });
});

describe("monthFetchRange", () => {
  it("pads the month so zone offsets can't hide edge days", () => {
    expect(monthFetchRange(2026, 9)).toEqual({ start: "2026-09-29", end: "2026-11-02" });
    expect(monthFetchRange(2026, 11)).toEqual({ start: "2026-11-29", end: "2027-01-02" });
  });
});

describe("addMonths", () => {
  it("rolls over year boundaries", () => {
    expect(addMonths(2026, 11, 1)).toEqual({ year: 2027, month: 0 });
    expect(addMonths(2026, 0, -1)).toEqual({ year: 2025, month: 11 });
  });
});

describe("formatTimeRange", () => {
  it("states AM/PM once when both ends share it", () => {
    expect(formatTimeRange("2026-10-06T15:00:00Z", "2026-10-06T15:45:00Z", "America/Denver")).toBe("9:00–9:45 AM");
  });

  it("states both when the range crosses noon", () => {
    expect(formatTimeRange("2026-10-06T17:30:00Z", "2026-10-06T19:00:00Z", "America/Denver")).toBe("11:30 AM–1:00 PM");
  });
});
