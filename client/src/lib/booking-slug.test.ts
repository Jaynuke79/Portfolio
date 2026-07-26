import { describe, expect, it } from "vitest";
import { parseBookingSlug } from "./booking-slug";

describe("parseBookingSlug", () => {
  it("extracts the slug from a booking hash", () => {
    expect(parseBookingSlug("#book/30minchat")).toBe("30minchat");
    expect(parseBookingSlug("#book/some-long-slug")).toBe("some-long-slug");
  });

  it("returns null for an empty slug", () => {
    expect(parseBookingSlug("#book/")).toBeNull();
  });

  it("returns null for non-booking hashes", () => {
    expect(parseBookingSlug("")).toBeNull();
    expect(parseBookingSlug("#contact")).toBeNull();
    expect(parseBookingSlug("#booking/30minchat")).toBeNull();
  });
});
