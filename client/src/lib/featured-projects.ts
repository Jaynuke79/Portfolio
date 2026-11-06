export interface FeaturedProject {
  repo?: string;
  title: string;
  description?: string;
  image?: string;
  alt?: string;
  technologies: string[];
  codeUrl?: string;
  demoUrl?: string;
  demoLabel?: string;
  linksNote?: string;
  featured?: boolean;
}

export const FEATURED_PROJECTS: FeaturedProject[] = [
  {
    title: "Machine Learning Research Lead",
    description:
      "Research lead and author of The Effect of Increased Dimensionality on Detecting Malicious IoMT Network Traffic, published by Springer and presented at MobiSec 2025 in Sapporo, Japan. Benchmarked six ML models across packet-level and flow-level feature sets on the CICIoMT2024 dataset.",
    image: "/mobisec-2025.webp",
    alt: "Jayden Alonzo-Estrada beside the MobiSec 2025 conference banner in Sapporo, Japan",
    technologies: ["Jupyter Notebook", "Sk-learn", "Pandas", "Numpy"],
    demoUrl: "https://easychair.org/smart-slide/slide/2N9Q",
    demoLabel: "Talk slides",
    linksNote: "Published by Springer (MobiSec 2025). Full text available on request.",
    featured: true,
  },
  {
    title: "Snowball Sweepstakes Rebuild",
    description:
      "Rebuilt the Rotary Club of Grand Junction's Snowball Sweepstakes platform from scratch in three weeks on Next.js and Neon Postgres. Scrubbed leaked credentials from git history, retired accounts whose login never checked passwords, and made tickets issue only from signature-verified, duplicate-proof payment webhooks. Every deploy is gated on 96+ tests and Playwright checks, and the nine findings from a pre-launch security audit were fixed.",
    technologies: ["Next.js", "TypeScript", "Vercel", "Neon Postgres", "Stripe", "Authorize.net", "Square", "Playwright"],
    demoUrl: "https://gjsnowball.vercel.app/",
    demoLabel: "Live site",
    linksNote: "Client work; code is private.",
  },
  {
    title: "Key-Gated Booking System",
    description:
      "The scheduler behind this site. A Google Apps Script backend serves open times from Google Calendar to a React frontend. Access keys are stored only as SHA-256 hashes with per-key expiry, uses, and meeting types; each booking re-checks free/busy under a lock before confirming, key guesses and bookings are rate limited, and an admin page manages it all.",
    technologies: ["Google Apps Script", "React", "TypeScript", "Google Calendar API"],
    codeUrl: "https://github.com/Jaynuke79/Portfolio/tree/main/apps-script",
    demoUrl: "https://j2a3e.com/#schedule",
    demoLabel: "Booking page (key required)",
  },
  {
    title: "Exploring Agentic Misalignment in Commercial Level Applications",
    description:
      "Ongoing research, started September 2025, developing best practices for using AI in business settings, written for non-technical stakeholders.",
    technologies: ["AI Agents", "AI Safety"],
    linksNote: "Research in progress.",
  },
  {
    repo: "file-index",
    title: "file-index",
    description:
      "Fully local filesystem indexer. Crawls directories, extracts text from documents, images, and audio with Ollama vision models and Whisper, and serves hybrid FTS5 plus vector search through an agent-friendly CLI. Nothing leaves the machine.",
    technologies: ["Python", "SQLite FTS5", "sqlite-vec", "Ollama", "Whisper", "pytest"],
  },
  {
    repo: "linkedin-mcp-server",
    title: "LinkedIn MCP Server",
    description:
      "MCP server that lets an agent post to your own LinkedIn feed through the official Posts API with OAuth. Standard library only, with no scraping or session cookies, plus guards for post length and reserved characters.",
    technologies: ["Python", "MCP", "OAuth 2.0", "LinkedIn API"],
  },
  {
    repo: "Intentionally-Vulnerable-Bad-rAG",
    title: "Intentionally Vulnerable Bad RAG",
    description:
      "Deliberately insecure retrieval-augmented generation pipeline that demonstrates PII exfiltration and prompt injection, with worked exploits, a model comparison, and security lessons. Built to show why models should get the least personal data possible.",
    technologies: ["Python", "RAG", "AI Security", "Prompt Injection"],
  },
];
