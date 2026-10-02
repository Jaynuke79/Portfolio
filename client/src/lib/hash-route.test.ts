import { describe, expect, it } from "vitest";
import { routeForHash } from "./hash-route";

describe("routeForHash", () => {
  it("maps the booking page and its admin page", () => {
    expect(routeForHash("#schedule")).toBe("schedule");
    expect(routeForHash("#schedule/admin")).toBe("schedule-admin");
  });

  it("sends everything else, including retired links, home", () => {
    expect(routeForHash("#schedule/abc")).toBe("home");
    expect(routeForHash("#book/30minchat")).toBe("home");
    expect(routeForHash("#contact")).toBe("home");
    expect(routeForHash("")).toBe("home");
  });
});
