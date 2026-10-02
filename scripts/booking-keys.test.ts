import { describe, expect, it } from "vitest";
import { buildRequest, parseArgs } from "./booking-keys.mjs";

function request(...argv: string[]) {
  return buildRequest(parseArgs(argv));
}

describe("booking-keys CLI", () => {
  it("leaves omitted options to the server's keyDefaults", () => {
    expect(request("issue")).toEqual({ action: "issueKey" });
  });

  it("passes every key option through", () => {
    expect(
      request("issue", "--label", "Recruiter at Acme", "--uses", "3", "--days", "7", "--types", "15min, 30min")
    ).toEqual({
      action: "issueKey",
      label: "Recruiter at Acme",
      maxUses: 3,
      expiresInDays: 7,
      typeIds: ["15min", "30min"],
    });
  });

  it("supports an exact expiry date and all meeting types", () => {
    expect(request("issue", "--expires", "2026-10-31", "--types", "all")).toEqual({
      action: "issueKey",
      expiresOn: "2026-10-31",
      allTypes: true,
    });
  });

  it("only mints an unlimited key when asked explicitly", () => {
    expect(request("issue", "--uses", "unlimited")).toEqual({ action: "issueKey", unlimitedUses: true });
  });

  it("refuses malformed or conflicting options instead of sending them", () => {
    expect(request("issue", "--uses", "abc")).toBeNull();
    expect(request("issue", "--uses", "0")).toBeNull();
    expect(request("issue", "--days", "-1")).toBeNull();
    expect(request("issue", "--days", "400")).toBeNull();
    expect(request("issue", "--expires", "10/31/2026")).toBeNull();
    expect(request("issue", "--days", "7", "--expires", "2026-10-31")).toBeNull();
    expect(request("issue", "--types", ",")).toBeNull();
    expect(request("issue", "--typo", "x")).toBeNull();
    expect(request("issue", "--days")).toBeNull();
  });

  it("updates only the fields given, and needs at least one", () => {
    expect(request("update", "abc123def456", "--expires", "2026-11-15", "--types", "30min")).toEqual({
      action: "updateKey",
      id: "abc123def456",
      expiresOn: "2026-11-15",
      typeIds: ["30min"],
    });
    expect(request("update", "abc123def456")).toBeNull();
    expect(request("update", "--days", "3")).toBeNull();
  });

  it("builds list, types and revoke requests", () => {
    expect(request("list")).toEqual({ action: "listKeys" });
    expect(request("types")).toEqual({ action: "getConfig" });
    expect(request("revoke", "abc123def456")).toEqual({ action: "revokeKey", id: "abc123def456" });
    expect(request("revoke")).toBeNull();
    expect(request("bogus")).toBeNull();
  });
});
