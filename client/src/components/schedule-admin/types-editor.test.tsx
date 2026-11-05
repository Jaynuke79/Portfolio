// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { MeetingType } from "@/lib/schedule-api";
import TypesEditor from "./types-editor";

const TYPES: MeetingType[] = [
  { id: "15min", name: "15 Minute Chat", durationMinutes: 15 },
  { id: "30min", name: "30 Minute Chat", durationMinutes: 30 },
];

const WIDENING = /new keys will allow all types/i;

function renderEditor(defaultTypeIds: string[] | null = null) {
  const onChange = vi.fn();
  render(<TypesEditor types={TYPES} defaultTypeIds={defaultTypeIds} onChange={onChange} />);
  return onChange;
}

function askToRemove(name = "15 Minute Chat") {
  fireEvent.click(screen.getByRole("button", { name: `Remove ${name}` }));
}

afterEach(cleanup);

describe("TypesEditor add", () => {
  it("gives a new type a fresh id when its name matches a deleted type", () => {
    const onChange = vi.fn();
    render(<TypesEditor types={TYPES} reservedTypeIds={["resume-review"]} defaultTypeIds={null} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("New meeting type"), { target: { value: "Resume review" } });
    fireEvent.click(screen.getByRole("button", { name: "Add type" }));

    expect(onChange).toHaveBeenCalledWith([...TYPES, { id: "resume-review-2", name: "Resume review", durationMinutes: 30 }]);
  });
});

describe("TypesEditor removal", () => {
  it("asks for confirmation before removing a type", () => {
    const onChange = renderEditor();
    askToRemove();

    expect(onChange).not.toHaveBeenCalled();
    const confirm = screen.getByRole("button", { name: "Remove type" });
    expect(document.activeElement).toBe(confirm);
    expect(confirm.getAttribute("aria-describedby")).toBeTruthy();
    const warning = document.getElementById(confirm.getAttribute("aria-describedby")!)!;
    expect(warning.textContent).toMatch(/Access keys limited to this type won't be able to book it/);
  });

  it("keeps the type and returns focus when cancelled", () => {
    const onChange = renderEditor();
    askToRemove();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Remove type" })).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Remove 15 Minute Chat" }));
  });

  it("cancels with Escape", () => {
    const onChange = renderEditor();
    askToRemove();
    fireEvent.keyDown(screen.getByRole("button", { name: "Remove type" }), { key: "Escape" });

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Remove type" })).toBeNull();
  });

  it("removes the type once confirmed", () => {
    const onChange = renderEditor();
    askToRemove();
    fireEvent.click(screen.getByRole("button", { name: "Remove type" }));

    expect(onChange).toHaveBeenCalledWith([TYPES[1]]);
  });

  it("still refuses to remove the last type", () => {
    const onChange = vi.fn();
    render(<TypesEditor types={[TYPES[0]]} defaultTypeIds={null} onChange={onChange} />);
    askToRemove();

    expect(screen.queryByRole("button", { name: "Remove type" })).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("warns that new keys widen to all types when this is the only default type", () => {
    renderEditor(["15min"]);
    askToRemove();
    expect(screen.getByText(WIDENING)).toBeTruthy();
  });

  it.each([
    ["all types are defaults", null],
    ["another type stays in the defaults", ["15min", "30min"]],
    ["the defaults are a different type", ["30min"]],
  ])("does not mention widening when %s", (_label, defaults) => {
    renderEditor(defaults);
    askToRemove();
    expect(screen.queryByText(WIDENING)).toBeNull();
  });
});
