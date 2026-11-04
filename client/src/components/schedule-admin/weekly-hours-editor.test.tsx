// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createContext, runInContext } from "node:vm";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { TimeWindow, WeeklyHours } from "@/lib/schedule-admin-api";
import WeeklyHoursEditor from "./weekly-hours-editor";

interface ConfigGlobals {
  defaultBookingConfig(): Record<string, unknown>;
  validateBookingConfig(input: unknown, current: unknown): { config?: unknown; error?: string; field?: string };
}

const appsScriptDir = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../apps-script");
const backend = createContext({ Intl, Date, Math, Number, String }) as unknown as ConfigGlobals;
runInContext(readFileSync(resolve(appsScriptDir, "Config.js"), "utf8"), backend as unknown as object);

function backendVerdict(weeklyHours: WeeklyHours) {
  const current = backend.defaultBookingConfig();
  return backend.validateBookingConfig({ ...current, weeklyHours }, current);
}

function renderMonday(windows: TimeWindow[]) {
  const onChange = vi.fn<(next: WeeklyHours) => void>();
  render(<WeeklyHoursEditor weeklyHours={{ 1: windows }} onChange={onChange} />);
  const addButton = screen.getAllByRole("button", { name: /add window/i })[0];
  return { onChange, addButton };
}

afterEach(cleanup);

describe("WeeklyHoursEditor Add window", () => {
  it("greys out but keeps focusable when no valid window fits after the last one", () => {
    const { onChange, addButton } = renderMonday([["09:00", "23:59"]]);

    expect(addButton.getAttribute("aria-disabled")).toBe("true");
    expect(addButton.hasAttribute("disabled")).toBe(false);
    addButton.focus();
    expect(document.activeElement).toBe(addButton);

    fireEvent.click(addButton);
    expect(onChange).not.toHaveBeenCalled();
  });

  it.each<[string, TimeWindow[], TimeWindow]>([
    ["22:30", [["09:00", "22:30"]], ["22:30", "23:30"]],
    ["23:00", [["09:00", "23:00"]], ["23:00", "23:59"]],
    ["the latest end, not the last row", [["12:00", "17:00"], ["08:00", "11:30"]], ["17:00", "18:00"]],
  ])("adds a window the backend accepts after %s", (_label, windows, expected) => {
    const { onChange, addButton } = renderMonday(windows);

    expect(addButton.getAttribute("aria-disabled")).not.toBe("true");
    fireEvent.click(addButton);

    expect(onChange).toHaveBeenCalledTimes(1);
    const next = onChange.mock.calls[0][0];
    expect(next[1]).toEqual([...windows, expected]);
    expect(backendVerdict(next).error).toBeUndefined();
  });
});
