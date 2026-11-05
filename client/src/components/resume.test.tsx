// @vitest-environment jsdom
import { cleanup, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Resume from "./resume";

afterEach(cleanup);

function professionalExperience() {
  const { getByRole } = render(<Resume />);
  const heading = getByRole("heading", { level: 3, name: "Professional experience" });
  return heading.nextElementSibling as HTMLElement;
}

describe("Resume experience", () => {
  it("lists every role in order, including Fiore Industries", () => {
    const roles = within(professionalExperience())
      .getAllByRole("heading", { level: 4 })
      .map((heading) => heading.textContent);

    expect(roles).toEqual([
      "AI Engineer at EggNest.ai, Grand Junction, CO",
      "AI Services Intern at EggNest.ai, Grand Junction, CO",
      "Software Developer, independent contractor at Rotary Club of Grand Junction, Grand Junction, CO",
      "Field Technician at Greenflare Technologies, Denver, CO (remote, with on-site visits)",
      "Software Engineering Intern at JGMS Government Services, Grand Junction, CO",
      "Software Engineering Intern at Fiore Industries, Albuquerque, NM",
      "Student Research Head at Colorado Mesa University, Grand Junction, CO",
    ]);
  });

  it("does not cite commit, line, or session counts", () => {
    const text = professionalExperience().textContent ?? "";

    expect(text).not.toMatch(/\bcommits?\b/i);
    expect(text).not.toMatch(/\blines\b/i);
    expect(text).not.toMatch(/\bsessions?\b/i);
  });

  it("names the ICPC regional in education", () => {
    const { getByText } = render(<Resume />);

    expect(getByText(/placing 4th at the ICPC regional in the first year\./)).toBeTruthy();
  });
});
