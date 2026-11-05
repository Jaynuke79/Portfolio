// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Skills from "./skills";

afterEach(cleanup);

describe("Skills", () => {
  it("lists compliance work without claiming Zero Trust", () => {
    const { container } = render(<Skills />);

    expect(container.textContent).toContain("PCI and HIPAA compliance work");
    expect(container.textContent).not.toContain("Zero Trust");
  });
});
