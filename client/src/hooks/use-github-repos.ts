import { useEffect, useState } from "react";
import { fetchGithubRepos, type GithubRepo } from "@/lib/github";
import bakedRepos from "@/lib/github-projects.json";

function toMap(repos: GithubRepo[]): Map<string, GithubRepo> {
  return new Map(repos.map((repo) => [repo.name, repo]));
}

export function useGithubRepos(): Map<string, GithubRepo> {
  const [repos, setRepos] = useState(() => toMap(bakedRepos as GithubRepo[]));

  useEffect(() => {
    let cancelled = false;
    fetchGithubRepos().then((live) => {
      if (live && !cancelled) setRepos(toMap(live));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return repos;
}
