export const GITHUB_USERNAME = "Jaynuke79";

export interface GithubRepo {
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  pushed_at: string;
  topics: string[];
}

const CACHE_KEY = "github-repos-v1";
const CACHE_TTL_MS = 30 * 60 * 1000;

interface CacheEntry {
  fetchedAt: number;
  repos: GithubRepo[];
}

function readCache(): GithubRepo[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) return null;
    return entry.repos;
  } catch {
    return null;
  }
}

function writeCache(repos: GithubRepo[]) {
  try {
    const entry: CacheEntry = { fetchedAt: Date.now(), repos };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // localStorage unavailable (private mode, quota) — live data still applies this session
  }
}

function pickRepoFields(raw: Record<string, unknown>): GithubRepo {
  return {
    name: raw.name as string,
    description: (raw.description as string | null) ?? null,
    html_url: raw.html_url as string,
    homepage: (raw.homepage as string | null) ?? null,
    language: (raw.language as string | null) ?? null,
    stargazers_count: (raw.stargazers_count as number) ?? 0,
    pushed_at: raw.pushed_at as string,
    topics: (raw.topics as string[]) ?? [],
  };
}

export async function fetchGithubRepos(): Promise<GithubRepo[] | null> {
  const cached = readCache();
  if (cached) return cached;
  try {
    const res = await fetch(
      `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=pushed&per_page=100`
    );
    if (!res.ok) return null;
    const data: Record<string, unknown>[] = await res.json();
    const repos = data.map(pickRepoFields);
    writeCache(repos);
    return repos;
  } catch {
    return null;
  }
}
