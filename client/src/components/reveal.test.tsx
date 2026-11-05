// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Reveal from "./reveal";

type Callback = (entries: Partial<IntersectionObserverEntry>[]) => void;

let observers: { callback: Callback; options?: IntersectionObserverInit; disconnect: () => void }[];

beforeEach(() => {
  observers = [];
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      disconnect = vi.fn();
      constructor(callback: Callback, options?: IntersectionObserverInit) {
        observers.push({ callback, options, disconnect: this.disconnect });
      }
      observe() {}
      unobserve() {}
      takeRecords() {
        return [];
      }
    }
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Reveal", () => {
  it("reveals as soon as any part of the block is on screen, however tall it is", () => {
    const { getByText } = render(<Reveal>content</Reveal>);
    const block = getByText("content");
    expect(block.dataset.reveal).toBe("pending");

    const threshold = observers[0].options?.threshold ?? 0;
    expect(Array.isArray(threshold) ? Math.min(...threshold) : threshold).toBe(0);

    act(() => observers[0].callback([{ isIntersecting: true, intersectionRatio: 0.01 }]));
    expect(block.dataset.reveal).toBe("visible");
    expect(observers[0].disconnect).toHaveBeenCalled();
  });

  it("stays pending while the block is off screen", () => {
    const { getByText } = render(<Reveal>content</Reveal>);

    act(() => observers[0].callback([{ isIntersecting: false, intersectionRatio: 0 }]));
    expect(getByText("content").dataset.reveal).toBe("pending");
  });

  it("shows the block immediately when IntersectionObserver is unavailable", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const { getByText } = render(<Reveal>content</Reveal>);

    expect(getByText("content").dataset.reveal).toBe("visible");
  });
});
