// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import emailjs from "@emailjs/browser";
import Contact from "./contact";

vi.mock("@emailjs/browser", () => ({
  default: { sendForm: vi.fn().mockResolvedValue({ status: 200 }) },
}));

function fillRealFields(container: HTMLElement) {
  fireEvent.change(container.querySelector("#name")!, { target: { value: "Ada" } });
  fireEvent.change(container.querySelector("#email")!, { target: { value: "ada@example.com" } });
  fireEvent.change(container.querySelector("#subject")!, { target: { value: "Hello" } });
  fireEvent.change(container.querySelector("#message")!, { target: { value: "Hi there" } });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(emailjs.sendForm).mockClear();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("Contact form abuse protection", () => {
  it("drops submissions that fill the honeypot field", async () => {
    const { container } = render(<Contact />);
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    fillRealFields(container);
    fireEvent.change(container.querySelector("#website")!, { target: { value: "spam.example" } });

    await act(async () => {
      fireEvent.submit(container.querySelector("form")!);
    });

    expect(emailjs.sendForm).not.toHaveBeenCalled();
  });

  it("drops submissions faster than a human could type", async () => {
    const { container } = render(<Contact />);
    fillRealFields(container);

    await act(async () => {
      fireEvent.submit(container.querySelector("form")!);
    });

    expect(emailjs.sendForm).not.toHaveBeenCalled();
  });

  it("sends a normal human submission", async () => {
    const { container } = render(<Contact />);
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    fillRealFields(container);

    await act(async () => {
      fireEvent.submit(container.querySelector("form")!);
    });

    expect(emailjs.sendForm).toHaveBeenCalledTimes(1);
  });
});
