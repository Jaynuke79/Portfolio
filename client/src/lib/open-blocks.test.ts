import { describe, expect, it } from "vitest";
import { addDaysToKey, hourBounds, mergeOpenBlocks, wallMinutes, weekdayOfKey, weeksCovering } from "./open-blocks";

const DENVER = "America/Denver";
const slot = (start: string, minutes: number) => ({
  start,
  end: new Date(Date.parse(start) + minutes * 60000).toISOString(),
});

describe("wallMinutes", () => {
  it("reads the owner's wall clock, not UTC", () => {
    expect(wallMinutes("2026-10-06T15:30:00Z", DENVER)).toBe(9 * 60 + 30);
    expect(wallMinutes("2026-10-06T06:00:00Z", DENVER)).toBe(0);
  });
});

describe("mergeOpenBlocks", () => {
  it("merges overlapping hour-long slots into one stretch", () => {
    const blocks = mergeOpenBlocks(
      [slot("2026-10-06T16:30:00Z", 60), slot("2026-10-06T16:00:00Z", 60), slot("2026-10-06T17:00:00Z", 60)],
      DENVER
    );
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({ dateKey: "2026-10-06", startMinutes: 600, endMinutes: 720 });
    expect(blocks[0].starts).toHaveLength(3);
  });

  it("merges short slots on consecutive grid steps, gaps from busy time split them", () => {
    const blocks = mergeOpenBlocks(
      [slot("2026-10-02T15:00:00Z", 15), slot("2026-10-02T15:30:00Z", 15), slot("2026-10-02T17:30:00Z", 15)],
      DENVER
    );
    expect(blocks.map(b => [b.startMinutes, b.endMinutes])).toEqual([
      [540, 585],
      [690, 705],
    ]);
  });

  it("never merges across days", () => {
    const blocks = mergeOpenBlocks([slot("2026-10-06T23:30:00Z", 30), slot("2026-10-07T00:00:00Z", 30)], "UTC");
    expect(blocks.map(b => b.dateKey)).toEqual(["2026-10-06", "2026-10-07"]);
    expect(blocks[0].endMinutes).toBe(24 * 60);
  });
});

describe("weeksCovering", () => {
  it("returns Monday-first weeks spanning the range", () => {
    const weeks = weeksCovering("2026-10-01", "2026-10-15");
    expect(weeks.map(w => [w[0], w[6]])).toEqual([
      ["2026-09-28", "2026-10-04"],
      ["2026-10-05", "2026-10-11"],
      ["2026-10-12", "2026-10-18"],
    ]);
  });

  it("starts on the same day when the range begins on a Monday", () => {
    expect(weeksCovering("2026-10-05", "2026-10-06")[0][0]).toBe("2026-10-05");
  });
});

describe("date key helpers", () => {
  it("reads weekdays and adds days across month ends", () => {
    expect(weekdayOfKey("2026-10-04")).toBe(0);
    expect(addDaysToKey("2026-10-30", 3)).toBe("2026-11-02");
  });
});

describe("hourBounds", () => {
  it("spans every window and block, rounded out to whole hours", () => {
    const blocks = mergeOpenBlocks([slot("2026-10-06T22:30:00Z", 30)], DENVER);
    expect(hourBounds({ 1: [["08:30", "12:00"]], 2: [["13:00", "15:15"]] }, blocks)).toEqual({ startHour: 8, endHour: 17 });
  });

  it("falls back to a business day when nothing is open", () => {
    expect(hourBounds({}, [])).toEqual({ startHour: 9, endHour: 17 });
  });
});
