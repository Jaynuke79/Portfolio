import { describe, expect, it } from "vitest";
import { configNumberProblem, describeKeyTypes, formFromDefaults, formFromKey, newTypeId, termsFromForm } from "./booking-config";

describe("newTypeId", () => {
  it("slugs the name and avoids existing ids", () => {
    expect(newTypeId("Deep Dive (60)!", [])).toBe("deep-dive-60");
    expect(newTypeId("Chat", ["chat", "chat-2"])).toBe("chat-3");
    expect(newTypeId("  ", [])).toBe("meeting");
  });
});

describe("termsFromForm", () => {
  const defaults = formFromDefaults({ expiresInDays: 14, maxUses: 1, typeIds: null });

  it("turns the default form into explicit terms", () => {
    expect(termsFromForm(defaults)).toEqual({
      terms: { label: "", maxUses: 1, expiresInDays: 14, allTypes: true },
    });
  });

  it("supports unlimited uses, a fixed date and specific types", () => {
    const form = { ...defaults, label: " Acme ", unlimitedUses: true, expiryMode: "date" as const, date: "2026-10-31", allTypes: false, typeIds: ["30min"] };
    expect(termsFromForm(form)).toEqual({
      terms: { label: "Acme", unlimitedUses: true, expiresOn: "2026-10-31", typeIds: ["30min"] },
    });
  });

  it("reports the first invalid field", () => {
    expect(termsFromForm({ ...defaults, uses: "0" })).toEqual({ error: expect.stringMatching(/Uses/) });
    expect(termsFromForm({ ...defaults, days: "400" })).toEqual({ error: expect.stringMatching(/Expiry/) });
    expect(termsFromForm({ ...defaults, expiryMode: "date", date: "" })).toEqual({ error: expect.stringMatching(/date/) });
    expect(termsFromForm({ ...defaults, allTypes: false, typeIds: [] })).toEqual({ error: expect.stringMatching(/meeting type/) });
  });
});

describe("formFromKey", () => {
  it("prefills an edit form with the key's expiry date in the owner's zone", () => {
    const form = formFromKey(
      {
        id: "abc",
        label: "Acme",
        maxUses: null,
        uses: 3,
        createdAt: "2026-10-01T00:00:00Z",
        expiresAt: "2026-11-01T05:59:59.999Z",
        typeIds: ["15min"],
        status: "ok",
      },
      "America/Denver"
    );
    expect(form).toMatchObject({ unlimitedUses: true, expiryMode: "date", date: "2026-10-31", allTypes: false, typeIds: ["15min"] });
  });
});

describe("describeKeyTypes", () => {
  it("names types and flags ones removed from the config", () => {
    const types = [{ id: "15min", name: "15 Minute Chat" }];
    expect(describeKeyTypes(null, types)).toBe("All types");
    expect(describeKeyTypes(["15min", "60min"], types)).toBe("15 Minute Chat, 60min (removed)");
  });
});

describe("configNumberProblem", () => {
  const base = { bufferMinutes: 15, minLeadHours: 12, horizonDays: 30, keyDefaults: { expiresInDays: 14, maxUses: 1, typeIds: null } };

  it("passes complete numbers and unlimited uses", () => {
    expect(configNumberProblem(base)).toBeNull();
    expect(configNumberProblem({ ...base, keyDefaults: { ...base.keyDefaults, maxUses: null } })).toBeNull();
  });

  it("flags an emptied uses field instead of letting it become unlimited", () => {
    expect(configNumberProblem({ ...base, keyDefaults: { ...base.keyDefaults, maxUses: NaN } })).toBe("New key uses needs a number.");
    expect(configNumberProblem({ ...base, bufferMinutes: NaN })).toBe("Buffer needs a number.");
  });
});
