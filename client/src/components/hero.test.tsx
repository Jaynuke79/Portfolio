// @vitest-environment jsdom
import { StrictMode } from "react";
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Hero from "./hero";

const FULL_NAME = "Jayden Alonzo-Estrada";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("Hero typewriter", () => {
  it("types the full name, including under StrictMode double effects", () => {
    const { getByRole } = render(
      <StrictMode>
        <Hero />
      </StrictMode>
    );

    act(() => {
      vi.advanceTimersByTime(500 + FULL_NAME.length * 100);
    });

    expect(getByRole("heading", { level: 1 }).textContent).toContain(FULL_NAME);
  });

  it("clears its pending timer when unmounted mid-animation", () => {
    const { unmount } = render(<Hero />);

    act(() => {
      vi.advanceTimersByTime(700);
    });

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
