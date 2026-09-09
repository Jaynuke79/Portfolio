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
    repo: "Intentionally-Vulnerable-Bad-rAG",
    title: "Intentionally Vulnerable Bad RAG",
    technologies: ["Python", "AI Security"],
  },
  {
    repo: "Social-Media-Downloader",
    title: "Social Media Downloader",
    technologies: ["Python", "CLI"],
  },
  {
    repo: "PokemonDetector",
    title: "Pokemon Detector Webapp",
    description: "Trained a machine learning algorithm to detect Gen1 Pokemon and made a webapp.",
    technologies: ["py-torch", "HTML / JS"],
  },
  {
    repo: "AutoMenu",
    title: "AutoMenu",
    description:
      "After having to make a CLI menu multiple times for multiple classes, I decided to make a general function to do it automatically.",
    technologies: ["C++"],
  },
  {
    repo: "100PrisonerProblem",
    title: "The 100 Prisoners Problem",
    description:
      "Inspired by Veritasium and spurred on by a debate with my professor, I coded up a simulation of the 100 prisoners problem.",
    technologies: ["C++"],
  },
  {
    repo: "WeatherApiApp",
    title: "Weather APP",
    description: "A classic beginning coder project.",
    technologies: ["Python", "API", "HTML / JS"],
  },
];
