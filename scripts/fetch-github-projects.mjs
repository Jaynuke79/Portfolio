import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const USERNAME = 'Jaynuke79';
const OUT_FILE = resolve(__dirname, '..', 'client/src/lib/github-projects.json');

const headers = { Accept: 'application/vnd.github+json' };
if (process.env.GH_TOKEN) {
  headers.Authorization = `Bearer ${process.env.GH_TOKEN}`;
}

const res = await fetch(
  `https://api.github.com/users/${USERNAME}/repos?sort=pushed&per_page=100`,
  { headers }
);
if (!res.ok) {
  console.error(`GitHub API returned ${res.status} — keeping committed snapshot`);
  process.exit(1);
}

const data = await res.json();
const repos = data.map((r) => ({
  name: r.name,
  description: r.description ?? null,
  html_url: r.html_url,
  homepage: r.homepage ?? null,
  language: r.language ?? null,
  stargazers_count: r.stargazers_count ?? 0,
  pushed_at: r.pushed_at,
  topics: r.topics ?? [],
}));

writeFileSync(OUT_FILE, JSON.stringify(repos, null, 2) + '\n');
console.log(`Wrote ${repos.length} repos to client/src/lib/github-projects.json`);
