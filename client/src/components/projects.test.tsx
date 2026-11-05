// @vitest-environment jsdom
import { cleanup, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { GithubRepo } from "@/lib/github";
import Projects from "./projects";

function repo(name: string, stargazers_count: number): GithubRepo {
  return {
    name,
    description: null,
    html_url: `https://github.com/Jaynuke79/${name}`,
    homepage: null,
    language: "Python",
    stargazers_count,
    pushed_at: "2026-10-01T00:00:00Z",
    topics: [],
  };
}

vi.mock("@/hooks/use-github-repos", () => ({
  useGithubRepos: () =>
    new Map([
      ["file-index", repo("file-index", 0)],
      ["linkedin-mcp-server", repo("linkedin-mcp-server", 7)],
    ]),
}));

afterEach(cleanup);

function card(title: string): HTMLElement {
  const { getByRole } = within(document.body);
  return getByRole("heading", { level: 3, name: title }).closest("li") as HTMLElement;
}

describe("Projects", () => {
  it("no longer lists Pokemon Detector", () => {
    const { queryByText } = render(<Projects />);

    expect(queryByText(/pokemon detector/i)).toBeNull();
  });

  it("lists the client rebuild, the booking system, and the second research entry", () => {
    const { getByRole } = render(<Projects />);

    for (const title of [
      "Snowball Sweepstakes Rebuild",
      "Key-Gated Booking System",
      "Exploring Agentic Misalignment in Commercial Level Applications",
    ]) {
      expect(getByRole("heading", { level: 3, name: title })).toBeTruthy();
    }
  });

  it("links the booking card to its code and to the key-gated page", () => {
    render(<Projects />);
    const booking = within(card("Key-Gated Booking System"));

    expect(booking.getByRole("link", { name: /code/i }).getAttribute("href")).toBe(
      "https://github.com/Jaynuke79/Portfolio/tree/main/apps-script"
    );
    expect(booking.getByRole("link", { name: /booking page \(key required\)/i }).getAttribute("href")).toBe(
      "https://j2a3e.com/#schedule"
    );
  });

  it("gives the client rebuild no links", () => {
    render(<Projects />);

    expect(within(card("Snowball Sweepstakes Rebuild")).queryAllByRole("link")).toHaveLength(0);
  });

  it("hides the star count on a repo with no stars", () => {
    render(<Projects />);

    expect(within(card("file-index")).queryByText("Stars")).toBeNull();
  });

  it("shows the star count on a starred repo", () => {
    render(<Projects />);
    const linkedin = within(card("LinkedIn MCP Server"));

    expect(linkedin.getByText("Stars")).toBeTruthy();
    expect(linkedin.getByText("7")).toBeTruthy();
  });
});
