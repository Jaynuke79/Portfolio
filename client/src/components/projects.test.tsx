// @vitest-environment jsdom
import { cleanup, fireEvent, render, within } from "@testing-library/react";
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

  it("links the research card to its slides, code, and hosted manuscript", () => {
    render(<Projects />);
    const research = within(card("Machine Learning Research Lead"));
    const manuscript = research.getByRole("link", { name: /full text \(author manuscript\)/i });

    expect(research.getByRole("link", { name: /talk slides/i }).getAttribute("href")).toBe(
      "https://easychair.org/smart-slide/slide/2N9Q"
    );
    expect(research.getByRole("link", { name: /code/i }).getAttribute("href")).toBe(
      "https://github.com/Colorado-Mesa-University-Cybersecurity/The-Effect-of-Increased-Dimensionality-on-Detecting-Malicious-IoMT-Network-Traffic"
    );
    expect(manuscript.getAttribute("href")).toBe("/Alonzo-Estrada_IoMT_Dimensionality_Manuscript.pdf");
    expect(manuscript.getAttribute("target")).toBe("_blank");
    expect(manuscript.getAttribute("rel")).toBe("noopener noreferrer");
    expect(research.getByText("Published by Springer (MobiSec 2025).")).toBeTruthy();
    expect(research.queryByText(/on request/i)).toBeNull();
  });

  it("links the client rebuild to its live site in a new tab", () => {
    render(<Projects />);
    const snowball = within(card("Snowball Sweepstakes Rebuild"));
    const links = snowball.getAllByRole("link");
    const live = snowball.getByRole("link", { name: /live site/i });

    expect(links).toHaveLength(1);
    expect(live.getAttribute("href")).toBe("https://gjsnowball.vercel.app/");
    expect(live.getAttribute("target")).toBe("_blank");
    expect(live.getAttribute("rel")).toBe("noopener noreferrer");
    expect(snowball.getByText("Client work; code is private.")).toBeTruthy();
  });

  it.each([
    ["Snowball Sweepstakes Rebuild", "/snowball-sweepstakes.webp", "Snowball Sweepstakes home page"],
    [
      "Key-Gated Booking System",
      "/booking-system.webp",
      "Booking page showing a month calendar and open times (sample data)",
    ],
    [
      "Exploring Agentic Misalignment in Commercial Level Applications",
      "/agentic-misalignment.webp",
      "Illustration of an AI agent's actual path drifting from its intended path until a checkpoint steers it back to the goal",
    ],
  ])("shows the %s card image", (title, src, alt) => {
    render(<Projects />);

    const image = within(card(title)).getByRole("img", { name: alt });
    expect(image.getAttribute("src")).toBe(src);
  });

  it.each([
    ["Intentionally Vulnerable Bad RAG", "Intentionally Vulnerable Bad RAG repository card"],
    ["Machine Learning Research Lead", null],
  ])("removes the %s card image when it fails to load", (title, expectedAlt) => {
    render(<Projects />);
    const image = card(title).querySelector("img");
    expect(image).not.toBeNull();
    const alt = image!.getAttribute("alt")!;
    if (expectedAlt) expect(alt).toBe(expectedAlt);

    fireEvent.error(image!);

    expect(card(title).querySelector("img")).toBeNull();
    expect(within(document.body).queryByAltText(alt)).toBeNull();
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
