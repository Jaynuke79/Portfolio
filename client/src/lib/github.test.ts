// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchGithubRepos, type GithubRepo } from "./github";

const CACHE_KEY = "github-repos-v1";
const NOW = new Date("2026-10-05T16:00:00Z").getTime();
const MINUTE_MS = 60 * 1000;

const cachedRepo: GithubRepo = {
  name: "cached",
  description: "From the cache",
  html_url: "https://github.com/Jaynuke79/cached",
  homepage: null,
  language: "TypeScript",
  stargazers_count: 2,
  pushed_at: "2026-09-01T00:00:00Z",
  topics: [],
};

const liveCardFields: GithubRepo = {
  name: "live",
  description: null,
  html_url: "https://github.com/Jaynuke79/live",
  homepage: "https://example.com",
  language: null,
  stargazers_count: 5,
  pushed_at: "2026-10-01T00:00:00Z",
  topics: ["security"],
};

const liveApiRepo = { ...liveCardFields, owner: { login: "Jaynuke79" }, forks_count: 9 };

function seedCache(ageMs: number, repos: GithubRepo[] = [cachedRepo]) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ fetchedAt: NOW - ageMs, repos }));
}

function stubFetch(response: { ok: boolean; status?: number; json: () => Promise<unknown> }) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("fetchGithubRepos", () => {
  it("serves a cache younger than 30 minutes without fetching", async () => {
    seedCache(29 * MINUTE_MS);
    const fetchMock = stubFetch({ ok: true, json: async () => [liveApiRepo] });

    expect(await fetchGithubRepos()).toEqual([cachedRepo]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refetches once the cache is older than 30 minutes, keeping only the card fields, and re-caches", async () => {
    seedCache(31 * MINUTE_MS);
    const fetchMock = stubFetch({ ok: true, json: async () => [liveApiRepo] });

    expect(await fetchGithubRepos()).toEqual([liveCardFields]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(localStorage.getItem(CACHE_KEY)!)).toEqual({ fetchedAt: NOW, repos: [liveCardFields] });
  });

  it("falls back to fetching when the cached JSON is corrupt", async () => {
    localStorage.setItem(CACHE_KEY, "{not json");
    const fetchMock = stubFetch({ ok: true, json: async () => [liveApiRepo] });

    expect(await fetchGithubRepos()).toEqual([liveCardFields]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns null on a non-OK response and leaves the stored cache untouched", async () => {
    seedCache(31 * MINUTE_MS);
    const before = localStorage.getItem(CACHE_KEY);
    stubFetch({ ok: false, status: 403, json: async () => ({ message: "rate limited" }) });

    expect(await fetchGithubRepos()).toBeNull();
    expect(localStorage.getItem(CACHE_KEY)).toBe(before);
  });

  it("returns null when the network request throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    expect(await fetchGithubRepos()).toBeNull();
    expect(localStorage.getItem(CACHE_KEY)).toBeNull();
  });
});
