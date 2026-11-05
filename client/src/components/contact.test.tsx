// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import emailjs from "@emailjs/browser";
import { toast } from "@/hooks/use-toast";
import Contact from "./contact";

vi.mock("@emailjs/browser", () => ({
  default: { sendForm: vi.fn().mockResolvedValue({ status: 200 }) },
}));

vi.mock("@/hooks/use-toast", () => {
  const toast = vi.fn();
  return { toast, useToast: () => ({ toast }) };
});

function fillRealFields(container: HTMLElement) {
  fireEvent.change(container.querySelector("#name")!, { target: { value: "Ada" } });
  fireEvent.change(container.querySelector("#email")!, { target: { value: "ada@example.com" } });
  fireEvent.change(container.querySelector("#subject")!, { target: { value: "Hello" } });
  fireEvent.change(container.querySelector("#message")!, { target: { value: "Hi there" } });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(emailjs.sendForm).mockClear();
  vi.mocked(toast).mockClear();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
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

describe("Contact form send failure", () => {
  it("shows an error toast, keeps what was typed and lets the visitor retry", async () => {
    vi.mocked(emailjs.sendForm).mockRejectedValueOnce(new Error("EmailJS down"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { container } = render(<Contact />);
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    fillRealFields(container);

    await act(async () => {
      fireEvent.submit(container.querySelector("form")!);
    });

    expect(emailjs.sendForm).toHaveBeenCalledTimes(1);
    expect(toast).toHaveBeenCalledTimes(1);
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "Error", variant: "destructive" }));
    const valueOf = (selector: string) => container.querySelector<HTMLInputElement>(selector)!.value;
    expect([valueOf("#name"), valueOf("#email"), valueOf("#subject"), valueOf("#message")]).toEqual([
      "Ada",
      "ada@example.com",
      "Hello",
      "Hi there",
    ]);
    const submit = container.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    expect(submit.disabled).toBe(false);
    expect(submit.textContent).toBe("Send message");

    await act(async () => {
      fireEvent.submit(container.querySelector("form")!);
    });
    expect(emailjs.sendForm).toHaveBeenCalledTimes(2);
    expect(toast).toHaveBeenLastCalledWith(expect.objectContaining({ title: "Message Sent!" }));
  });
});
