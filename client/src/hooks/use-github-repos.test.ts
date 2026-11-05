// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchGithubRepos, type GithubRepo } from "@/lib/github";
import bakedRepos from "@/lib/github-projects.json";
import { useGithubRepos } from "./use-github-repos";

vi.mock("@/lib/github", async importOriginal => ({
  ...(await importOriginal<typeof import("@/lib/github")>()),
  fetchGithubRepos: vi.fn(),
}));

const baked = bakedRepos as GithubRepo[];
const liveRepo: GithubRepo = {
  ...baked[0],
  description: "Live description",
  stargazers_count: baked[0].stargazers_count + 7,
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(r => (resolve = r));
  return { promise, resolve };
}

beforeEach(() => {
  vi.mocked(fetchGithubRepos).mockReset();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("useGithubRepos", () => {
  it("serves the baked snapshot first, then replaces it wholesale with live data", async () => {
    const live = deferred<GithubRepo[] | null>();
    vi.mocked(fetchGithubRepos).mockReturnValue(live.promise);
    const { result } = renderHook(() => useGithubRepos());

    expect([...result.current.keys()]).toEqual(baked.map(repo => repo.name));
    expect(result.current.get(baked[0].name)).toEqual(baked[0]);

    await act(async () => live.resolve([liveRepo]));

    expect([...result.current.keys()]).toEqual([liveRepo.name]);
    expect(result.current.get(liveRepo.name)).toEqual(liveRepo);
    expect(result.current.has(baked[1].name)).toBe(false);
  });

  it("keeps the baked snapshot when live data is unavailable", async () => {
    vi.mocked(fetchGithubRepos).mockResolvedValue(null);
    const { result } = renderHook(() => useGithubRepos());
    const initial = result.current;

    await act(async () => {});

    expect(result.current).toBe(initial);
    expect(result.current.size).toBe(baked.length);
  });

  it("ignores live data that arrives after unmount", async () => {
    const live = deferred<GithubRepo[] | null>();
    vi.mocked(fetchGithubRepos).mockReturnValue(live.promise);
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const { result, unmount } = renderHook(() => useGithubRepos());
    const beforeUnmount = result.current;

    unmount();
    await act(async () => live.resolve([liveRepo]));

    expect(result.current).toBe(beforeUnmount);
    expect(errors).not.toHaveBeenCalled();
  });
});
