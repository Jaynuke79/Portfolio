// @vitest-environment jsdom
import { StrictMode } from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Hero from "./hero";

afterEach(cleanup);

describe("Hero", () => {
  it("names the author in the page heading", () => {
    const { getByRole } = render(
      <StrictMode>
        <Hero />
      </StrictMode>
    );

    expect(getByRole("heading", { level: 1 }).textContent).toContain("Jayden Alonzo-Estrada");
  });

  it("links both calls to action to sections on the page", () => {
    const { getByRole } = render(<Hero />);

    expect(getByRole("link", { name: /view projects/i })).toHaveProperty("hash", "#projects");
    expect(getByRole("link", { name: /contact me/i })).toHaveProperty("hash", "#contact");
  });

  it("loads the headshot eagerly as the largest above-the-fold image", () => {
    const { getByRole } = render(<Hero />);

    const img = getByRole("img") as HTMLImageElement;
    expect(img.getAttribute("loading")).not.toBe("lazy");
    expect(img.getAttribute("fetchpriority")).toBe("high");
  });
});
