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
    technologies: ["Jupyter Notebook", "Sk-learn", "Pandas", "Numpy"],
    demoUrl: "https://easychair.org/smart-slide/slide/2N9Q",
    demoLabel: "Talk slides",
    linksNote: "Published by Springer (MobiSec 2025). Full text available on request.",
    featured: true,
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
    repo: "PokemonDetector",
    title: "Pokemon Detector",
    description:
      "ConvNeXt image classifier trained to identify all 151 Gen 1 Pokemon, packaged as a CLI, a Flask web app, and a Docker image with a live demo on Vercel.",
    technologies: ["PyTorch", "ConvNeXt", "Flask", "Docker"],
  },
  {
    repo: "Intentionally-Vulnerable-Bad-rAG",
    title: "Intentionally Vulnerable Bad RAG",
    description:
      "Deliberately insecure retrieval-augmented generation pipeline that demonstrates PII exfiltration and prompt injection, with worked exploits, a model comparison, and security lessons. Built to show why models should get the least personal data possible.",
    technologies: ["Python", "RAG", "AI Security", "Prompt Injection"],
  },
];
