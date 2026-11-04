import { describe, expect, it } from "vitest";
import { describeAdminError } from "./schedule-admin-api";

const GENERIC = /Something went wrong/;

describe("describeAdminError", () => {
  it.each([
    ["ambiguous_key_id", /told apart from another one/],
    ["unknown_action", /reload the page/],
  ])("has a specific message for %s", (code, expected) => {
    const message = describeAdminError(code);
    expect(message).toMatch(expected);
    expect(message).not.toMatch(GENERIC);
  });

  it("capitalises standalone fragment messages", () => {
    expect(describeAdminError("ambiguous_key_id")).toMatch(/^That key/);
  });

  it("still falls back for codes nothing describes", () => {
    expect(describeAdminError("whatever")).toMatch(GENERIC);
  });
});
