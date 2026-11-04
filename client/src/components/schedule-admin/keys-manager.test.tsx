// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as adminApi from "@/lib/schedule-admin-api";
import { ScheduleApiError } from "@/lib/schedule-api";
import KeysManager from "./keys-manager";

vi.mock("@/lib/schedule-admin-api", async importOriginal => ({
  ...(await importOriginal<typeof adminApi>()),
  listKeys: vi.fn(),
  issueKey: vi.fn(),
  updateKey: vi.fn(),
  revokeKey: vi.fn(),
}));

function config(): adminApi.BookingConfig {
  return {
    title: "Meet with Jayden",
    description: "",
    timeZone: "America/Denver",
    calendarId: "primary",
    busyCalendarIds: ["primary"],
    bufferMinutes: 15,
    minLeadHours: 12,
    horizonDays: 30,
    keyDefaults: { expiresInDays: 14, maxUses: 1, typeIds: null },
    notifications: { emailGuest: true, emailOwner: true, ownerEmail: "" },
    weeklyHours: { 1: [["09:00", "17:00"]] },
    types: [
      { id: "15min", name: "15 Minute Chat", durationMinutes: 15 },
      { id: "30min", name: "30 Minute Chat", durationMinutes: 30 },
    ],
  };
}

function key(id: string, label: string, overrides: Partial<adminApi.AccessKey> = {}): adminApi.AccessKey {
  return {
    id,
    label,
    maxUses: 1,
    uses: 0,
    createdAt: "2026-11-01T00:00:00Z",
    expiresAt: "2027-11-01T00:00:00Z",
    typeIds: null,
    status: "ok",
    ...overrides,
  };
}

async function renderWith(keys: adminApi.AccessKey[]) {
  vi.mocked(adminApi.listKeys).mockResolvedValue({ keys });
  await act(async () => {
    render(<KeysManager token="secret" config={config()} />);
  });
}

function row(label: string): HTMLElement {
  return screen.getByText(label).closest("li")!;
}

async function click(element: HTMLElement) {
  await act(async () => {
    fireEvent.click(element);
  });
}

beforeEach(() => {
  vi.mocked(adminApi.listKeys).mockReset();
  vi.mocked(adminApi.updateKey).mockReset().mockImplementation(async (_t, id) => key(id, ""));
  vi.mocked(adminApi.revokeKey).mockReset();
});

afterEach(cleanup);

describe("KeysManager", () => {
  it("saves a label-only edit without sending expiry fields", async () => {
    await renderWith([key("k1", "Acme")]);
    await click(within(row("Acme")).getByRole("button", { name: "Edit" }));

    expect(screen.getByRole("radio", { name: /Keep current/ })).toHaveProperty("checked", true);
    fireEvent.change(screen.getByLabelText("Private label", { selector: "li input" }), { target: { value: "Acme recruiter" } });
    await click(screen.getByRole("button", { name: "Save key" }));

    expect(adminApi.updateKey).toHaveBeenCalledWith("secret", "k1", { label: "Acme recruiter", maxUses: 1, allTypes: true });
  });

  it("saves a key whose meeting type was deleted", async () => {
    await renderWith([key("k1", "Acme", { typeIds: ["deleted", "30min"] })]);
    await click(within(row("Acme")).getByRole("button", { name: "Edit" }));
    await click(screen.getByRole("button", { name: "Save key" }));

    expect(adminApi.updateKey).toHaveBeenCalledWith("secret", "k1", { label: "Acme", maxUses: 1, typeIds: ["30min"] });
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows a revoke error only under the key it belongs to", async () => {
    vi.mocked(adminApi.revokeKey).mockRejectedValue(new ScheduleApiError("invalid_key_id"));
    await renderWith([key("k1", "Acme"), key("k2", "Globex")]);

    await click(within(row("Acme")).getByRole("button", { name: "Revoke" }));
    await click(within(row("Acme")).getByRole("button", { name: "Confirm revoke" }));
    expect(within(row("Acme")).getByRole("alert").textContent).toMatch(/no longer exists/);

    await click(within(row("Globex")).getByRole("button", { name: "Revoke" }));
    expect(within(row("Globex")).queryByRole("alert")).toBeNull();
  });
});
