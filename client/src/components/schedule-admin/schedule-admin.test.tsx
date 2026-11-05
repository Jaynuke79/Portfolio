// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as adminApi from "@/lib/schedule-admin-api";
import { ScheduleApiError } from "@/lib/schedule-api";
import App from "@/App";
import ScheduleAdmin from "./index";

vi.mock("@/pages/home", () => ({ default: () => <p>Home page</p> }));
vi.mock("@/components/scheduler", () => ({ default: () => <p>Visitor scheduler</p> }));

vi.mock("@/lib/schedule-api", async importOriginal => ({
  ...(await importOriginal<typeof import("@/lib/schedule-api")>()),
  isSchedulingConfigured: () => true,
}));

vi.mock("@/lib/schedule-admin-api", async importOriginal => ({
  ...(await importOriginal<typeof adminApi>()),
  getConfig: vi.fn(),
  saveConfig: vi.fn(),
  previewSlots: vi.fn(),
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
    keyDefaults: { expiresInDays: 14, maxUses: 1, typeIds: ["15min"] },
    notifications: { emailGuest: true, emailOwner: true, ownerEmail: "" },
    weeklyHours: { 1: [["09:00", "17:00"]] },
    types: [
      { id: "15min", name: "15 Minute Chat", durationMinutes: 15 },
      { id: "30min", name: "30 Minute Chat", durationMinutes: 30 },
    ],
  };
}

async function signIn(token = "secret") {
  render(<ScheduleAdmin />);
  fireEvent.change(screen.getByLabelText("Admin token"), { target: { value: token } });
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
  });
}

async function enterToken(token = "secret") {
  fireEvent.change(screen.getByLabelText("Admin token"), { target: { value: token } });
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
  });
}

async function openAdminRoute() {
  history.replaceState(null, "", "/#schedule/admin");
  render(<App />);
  await enterToken();
}

function navigateTo(url: string) {
  act(() => {
    history.pushState(null, "", url);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });
}

async function clickSave() {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  });
}

beforeEach(() => {
  sessionStorage.clear();
  vi.mocked(adminApi.getConfig).mockReset().mockResolvedValue({ config: config(), version: "v1" });
  vi.mocked(adminApi.saveConfig).mockReset();
  vi.mocked(adminApi.previewSlots).mockReset().mockResolvedValue({ type: "15min", timeZone: "America/Denver", slots: [] });
  vi.mocked(adminApi.listKeys).mockReset().mockResolvedValue({ keys: [] });
});

afterEach(() => {
  cleanup();
  history.replaceState(null, "", "/");
});

describe("ScheduleAdmin", () => {
  it("stays locked when the token is rejected", async () => {
    vi.mocked(adminApi.getConfig).mockRejectedValue(new ScheduleApiError("forbidden"));
    await signIn("wrong");
    expect(screen.getByRole("alert").textContent).toMatch(/isn't valid/);
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(sessionStorage.getItem("schedule-admin-token")).toBeNull();
  });

  it("signs out when a wrong token is rate limited", async () => {
    sessionStorage.setItem("schedule-admin-token", "wrong");
    vi.mocked(adminApi.getConfig).mockRejectedValue(new ScheduleApiError("rate_limited"));
    await act(async () => {
      render(<ScheduleAdmin />);
    });
    expect(screen.getByRole("alert").textContent).toMatch(/Too many attempts/);
    expect(sessionStorage.getItem("schedule-admin-token")).toBeNull();
  });

  it("keeps the stored token when the network fails on sign-in", async () => {
    sessionStorage.setItem("schedule-admin-token", "secret");
    vi.mocked(adminApi.getConfig).mockRejectedValueOnce(new ScheduleApiError("network_error"));
    await act(async () => {
      render(<ScheduleAdmin />);
    });
    expect(screen.getByRole("alert").textContent).not.toMatch(/isn't valid/);
    expect(sessionStorage.getItem("schedule-admin-token")).toBe("secret");

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    });
    expect(adminApi.getConfig).toHaveBeenLastCalledWith("secret");
    expect(screen.getByRole("tablist")).toBeTruthy();
  });

  it("stays signed in when reloading the latest settings hits a server error", async () => {
    vi.mocked(adminApi.saveConfig).mockRejectedValue(new ScheduleApiError("config_conflict"));
    await signIn();
    fireEvent.click(screen.getByRole("checkbox", { name: "Tuesday" }));
    await clickSave();

    vi.mocked(adminApi.getConfig).mockRejectedValueOnce(new ScheduleApiError("server_error"));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Reload latest" }));
    });
    expect(screen.getByRole("tablist")).toBeTruthy();
    expect(sessionStorage.getItem("schedule-admin-token")).toBe("secret");
    expect(screen.getByRole("status").textContent).not.toMatch(/another tab/);
  });

  it("keeps edits made while a save is in flight", async () => {
    let finishSave: (result: adminApi.VersionedConfig) => void = () => {};
    vi.mocked(adminApi.saveConfig).mockImplementationOnce(() => new Promise(resolve => (finishSave = resolve)));
    await signIn();
    fireEvent.click(screen.getByRole("checkbox", { name: "Tuesday" }));
    await clickSave();
    const sent = vi.mocked(adminApi.saveConfig).mock.calls[0][1];

    fireEvent.click(screen.getByRole("checkbox", { name: "Wednesday" }));
    await act(async () => finishSave({ config: sent, version: "v2" }));

    expect((screen.getByRole("checkbox", { name: "Wednesday" }) as HTMLInputElement).checked).toBe(true);
    expect(screen.getByRole("status").textContent).toMatch(/unsaved changes/);

    vi.mocked(adminApi.saveConfig).mockImplementationOnce(async (_t, saved) => ({ config: saved, version: "v3" }));
    await clickSave();
    const [, resent, version] = vi.mocked(adminApi.saveConfig).mock.calls[1];
    expect(version).toBe("v2");
    expect(Object.keys(resent.weeklyHours).sort()).toEqual(["1", "2", "3"]);
  });

  it("saves edited weekly hours with the version it loaded", async () => {
    vi.mocked(adminApi.saveConfig).mockImplementation(async (_t, saved) => ({ config: saved, version: "v2" }));
    await signIn();
    fireEvent.click(screen.getByRole("checkbox", { name: "Tuesday" }));
    fireEvent.change(screen.getByLabelText("Tuesday window 1 end"), { target: { value: "12:00" } });
    await clickSave();

    const [token, saved, version] = vi.mocked(adminApi.saveConfig).mock.calls[0];
    expect(token).toBe("secret");
    expect(version).toBe("v1");
    expect(saved.weeklyHours).toEqual({ 1: [["09:00", "17:00"]], 2: [["09:00", "12:00"]] });
    expect(screen.getByRole("status").textContent).toMatch(/Saved/);
  });

  it("offers a reload instead of overwriting newer settings", async () => {
    vi.mocked(adminApi.saveConfig).mockRejectedValue(new ScheduleApiError("config_conflict"));
    await signIn();
    fireEvent.click(screen.getByRole("checkbox", { name: "Tuesday" }));
    await clickSave();

    expect(screen.getByRole("status").textContent).toMatch(/another tab/);
    expect(screen.getByRole("button", { name: "Reload latest" })).toBeTruthy();
  });

  it("drops a removed type from the new-key defaults", async () => {
    vi.mocked(adminApi.saveConfig).mockImplementation(async (_t, saved) => ({ config: saved, version: "v2" }));
    await signIn();
    fireEvent.click(screen.getByRole("tab", { name: "Meeting types" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove 15 Minute Chat" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove type" }));
    await clickSave();

    const saved = vi.mocked(adminApi.saveConfig).mock.calls[0][1];
    expect(saved.types.map(t => t.id)).toEqual(["30min"]);
    expect(saved.keyDefaults.typeIds).toBeNull();
  });

  it("gives a re-added type a fresh id once its old one is retired", async () => {
    vi.mocked(adminApi.saveConfig).mockImplementation(async (_t, sent) => ({
      config: { ...sent, retiredTypeIds: ["15min"] },
      version: "v2",
    }));
    await signIn();
    fireEvent.click(screen.getByRole("tab", { name: "Meeting types" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove 15 Minute Chat" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove type" }));
    await clickSave();

    fireEvent.change(screen.getByLabelText("New meeting type"), { target: { value: "15min" } });
    fireEvent.click(screen.getByRole("button", { name: "Add type" }));
    await clickSave();

    const resent = vi.mocked(adminApi.saveConfig).mock.calls[1][1];
    expect(resent.types.map(t => t.id)).toEqual(["30min", "15min-2"]);
  });

  it("gives a type removed and re-added in one draft a fresh id", async () => {
    vi.mocked(adminApi.saveConfig).mockImplementation(async (_t, sent) => ({ config: sent, version: "v2" }));
    await signIn();
    fireEvent.click(screen.getByRole("tab", { name: "Meeting types" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove 15 Minute Chat" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove type" }));
    fireEvent.change(screen.getByLabelText("New meeting type"), { target: { value: "15min" } });
    fireEvent.click(screen.getByRole("button", { name: "Add type" }));
    await clickSave();

    const sent = vi.mocked(adminApi.saveConfig).mock.calls[0][1];
    expect(sent.types.map(t => t.id)).toEqual(["30min", "15min-2"]);
  });

  it("refuses to save an emptied number field", async () => {
    await signIn();
    fireEvent.click(screen.getByRole("tab", { name: "Booking rules" }));
    fireEvent.change(screen.getByLabelText("Uses"), { target: { value: "" } });
    await clickSave();

    expect(adminApi.saveConfig).not.toHaveBeenCalled();
    expect(screen.getByRole("status").textContent).toMatch(/New key uses needs a number/);
  });

  it("saves confirmation email settings", async () => {
    vi.mocked(adminApi.saveConfig).mockImplementation(async (_t, saved) => ({ config: saved, version: "v2" }));
    await signIn();
    fireEvent.click(screen.getByRole("tab", { name: "Booking rules" }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Email the guest/ }));
    fireEvent.change(screen.getByLabelText("Send my copy to"), { target: { value: "alerts@example.com" } });
    await clickSave();

    expect(vi.mocked(adminApi.saveConfig).mock.calls[0][1].notifications).toEqual({
      emailGuest: false,
      emailOwner: true,
      ownerEmail: "alerts@example.com",
    });
  });

  it("moves between tabs with the arrow keys", async () => {
    await signIn();
    fireEvent.keyDown(screen.getByRole("tab", { name: "Availability" }), { key: "ArrowLeft" });
    expect(screen.getByRole("tab", { name: "Access keys" }).getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Access keys" }));
  });

  it.each([
    ["Availability", "Weekly hours"],
    ["Meeting types", "Meeting types"],
    ["Booking rules", "Booking rules"],
    ["Access keys", "Access keys"],
  ])("opens the %s tab with an h2 and no skipped heading levels", async (tabName, heading) => {
    await signIn();
    await act(async () => {
      fireEvent.click(screen.getByRole("tab", { name: tabName }));
    });

    expect(screen.getByRole("heading", { level: 1, name: "Scheduling admin" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 2 }).map(h => h.textContent)).toEqual([heading]);
    const levels = screen.getAllByRole("heading").map(h => Number(h.tagName.slice(1)));
    levels.forEach((level, i) => expect(level).toBeLessThanOrEqual((levels[i - 1] ?? 0) + 1));
  });

  it("clears a save error once the draft is edited again", async () => {
    await signIn();
    fireEvent.click(screen.getByRole("tab", { name: "Booking rules" }));
    fireEvent.change(screen.getByLabelText("Uses"), { target: { value: "" } });
    await clickSave();
    expect(screen.getByRole("status").textContent).toMatch(/needs a number/);

    fireEvent.change(screen.getByLabelText("Uses"), { target: { value: "3" } });
    expect(screen.getByRole("status").textContent).toMatch(/unsaved changes/);
  });

  it("keeps the conflict message while the draft is edited", async () => {
    vi.mocked(adminApi.saveConfig).mockRejectedValue(new ScheduleApiError("config_conflict"));
    await signIn();
    fireEvent.click(screen.getByRole("checkbox", { name: "Tuesday" }));
    await clickSave();
    fireEvent.click(screen.getByRole("checkbox", { name: "Wednesday" }));

    expect(screen.getByRole("status").textContent).toMatch(/another tab/);
    expect(screen.getByRole("button", { name: "Reload latest" })).toBeTruthy();
  });

  it("does not show the last session's saved note or tab after signing back in", async () => {
    vi.mocked(adminApi.saveConfig).mockImplementation(async (_t, saved) => ({ config: saved, version: "v2" }));
    await signIn();
    fireEvent.click(screen.getByRole("checkbox", { name: "Tuesday" }));
    await clickSave();
    expect(screen.getByRole("status").textContent).toMatch(/Saved/);
    fireEvent.click(screen.getByRole("tab", { name: "Booking rules" }));

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await enterToken();

    expect(screen.queryByText(/Saved\. Visitors/)).toBeNull();
    expect(screen.getByRole("tab", { name: "Availability" }).getAttribute("aria-selected")).toBe("true");
  });

  it("signs out right away when nothing is unsaved", async () => {
    await signIn();
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(screen.getByLabelText("Admin token")).toBeTruthy();
  });

  it("asks before signing out with unsaved changes", async () => {
    await signIn();
    fireEvent.click(screen.getByRole("checkbox", { name: "Tuesday" }));
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    expect(screen.getByText("You have unsaved changes. Sign out and discard them?")).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Discard and sign out" }));
    fireEvent.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(screen.queryByRole("button", { name: "Discard and sign out" })).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Sign out" }));
    expect((screen.getByRole("checkbox", { name: "Tuesday" }) as HTMLInputElement).checked).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    fireEvent.keyDown(screen.getByRole("button", { name: "Discard and sign out" }), { key: "Escape" });
    expect(screen.queryByRole("button", { name: "Discard and sign out" })).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Sign out" }));

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    fireEvent.click(screen.getByRole("button", { name: "Discard and sign out" }));
    expect(screen.getByLabelText("Admin token")).toBeTruthy();
    expect(sessionStorage.getItem("schedule-admin-token")).toBeNull();
  });
});

describe("sign-out confirmation", () => {
  it("closes once nothing is unsaved and stays closed on the next edit", async () => {
    await signIn();
    fireEvent.click(screen.getByRole("checkbox", { name: "Tuesday" }));
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    fireEvent.click(screen.getByRole("button", { name: "Discard" }));
    expect(screen.queryByText("You have unsaved changes. Sign out and discard them?")).toBeNull();

    fireEvent.click(screen.getByRole("checkbox", { name: "Wednesday" }));
    expect(screen.queryByText("You have unsaved changes. Sign out and discard them?")).toBeNull();
  });
});

describe("leaving #schedule/admin", () => {
  it("asks first and stays put when unsaved changes are kept", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    await openAdminRoute();
    fireEvent.click(screen.getByRole("checkbox", { name: "Tuesday" }));
    navigateTo("/");

    expect(confirm).toHaveBeenCalledWith("You have unsaved scheduling changes. Leave and discard them?");
    expect(window.location.hash).toBe("#schedule/admin");
    expect(screen.queryByText("Home page")).toBeNull();
    expect((screen.getByRole("checkbox", { name: "Tuesday" }) as HTMLInputElement).checked).toBe(true);
    confirm.mockRestore();
  });

  it("leaves when the admin agrees to discard", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    await openAdminRoute();
    fireEvent.click(screen.getByRole("checkbox", { name: "Tuesday" }));
    navigateTo("/#schedule");

    expect(confirm).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Visitor scheduler")).toBeTruthy();
    confirm.mockRestore();
  });

  it("leaves without asking when nothing is unsaved", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    await openAdminRoute();
    navigateTo("/");

    expect(confirm).not.toHaveBeenCalled();
    expect(screen.getByText("Home page")).toBeTruthy();
    confirm.mockRestore();
  });
});
