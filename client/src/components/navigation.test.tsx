// @vitest-environment jsdom
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Navigation from "./navigation";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Navigation mobile menu", () => {
  it("opens as a dialog named Navigation", () => {
    const { getByRole } = render(<Navigation />);

    fireEvent.click(getByRole("button", { name: /open menu/i }));

    expect(getByRole("dialog", { name: "Navigation" })).toBeTruthy();
  });

  it("logs no Radix title or description warning when opened", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { getByRole } = render(<Navigation />);

    fireEvent.click(getByRole("button", { name: /open menu/i }));

    const logged = [...error.mock.calls, ...warn.mock.calls].flat().join(" ");
    expect(logged).not.toMatch(/DialogTitle|Description/);
  });
});
