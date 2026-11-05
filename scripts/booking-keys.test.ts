import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createContext, runInContext } from "node:vm";
import { describe, expect, it } from "vitest";
import { buildRequest, isCalendarDateKey, parseArgs } from "./booking-keys.mjs";

function loadKeysJsDateCheck(): (value: string) => boolean {
  const context = createContext({ Date, Number, String });
  runInContext(readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../apps-script/Keys.js"), "utf8"), context);
  return (context as unknown as { isCalendarDateKey(value: string): boolean }).isCalendarDateKey;
}

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

  it("accepts the last day of a month, including a leap day", () => {
    expect(request("issue", "--expires", "2026-12-31")).toEqual({ action: "issueKey", expiresOn: "2026-12-31" });
    expect(request("issue", "--expires", "2028-02-29")).toEqual({ action: "issueKey", expiresOn: "2028-02-29" });
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
    expect(request("issue", "--expires", "2026-11-31")).toBeNull();
    expect(request("issue", "--expires", "2026-02-30")).toBeNull();
    expect(request("issue", "--days", "7", "--expires", "2026-10-31")).toBeNull();
    expect(request("issue", "--types", ",")).toBeNull();
    expect(request("issue", "--typo", "x")).toBeNull();
    expect(request("issue", "--days")).toBeNull();
  });

  it("never takes another flag as an option's value", () => {
    expect(parseArgs(["issue", "--label", "--uses", "3"]).options).toEqual({ label: undefined, uses: "3" });
    expect(request("issue", "--label", "--uses", "3")).toBeNull();
    expect(request("issue", "--uses", "3", "--label", "--days", "7")).toBeNull();
    expect(request("update", "abc123def456", "--expires", "--types", "all")).toBeNull();
    expect(request("issue", "--days", "-1")).toBeNull();
    expect(request("issue", "--label", "-x-")).toEqual({ action: "issueKey", label: "-x-" });
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

describe("isCalendarDateKey, in the CLI and in Keys.js", () => {
  const cases: [string, boolean][] = [
    ["2026-10-31", true],
    ["2026-12-31", true],
    ["2028-02-29", true],
    ["2000-02-29", true],
    ["2026-01-01", true],
    ["2026-02-29", false],
    ["1900-02-29", false],
    ["2026-02-30", false],
    ["2026-11-31", false],
    ["2026-13-01", false],
    ["2026-00-10", false],
    ["2026-10-00", false],
    ["2026-10-5", false],
    ["26-10-05", false],
    ["2026-10-05T00:00", false],
    [" 2026-10-05", false],
    ["10/31/2026", false],
    ["", false],
  ];
  const copies = { "booking-keys.mjs": isCalendarDateKey, "Keys.js": loadKeysJsDateCheck() };

  for (const [copy, check] of Object.entries(copies)) {
    it.each(cases)(`${copy}: %s -> %s`, (value, expected) => {
      expect(check(value)).toBe(expected);
    });
  }
});
