export interface FeaturedProject {
  repo?: string;
  title: string;
  description?: string;
  image?: string;
  alt?: string;
  technologies: string[];
  titleColor: string;
  codeUrl?: string;
  demoUrl?: string;
  demoLabel?: string;
  linksNote?: string;
}

export const FEATURED_PROJECTS: FeaturedProject[] = [
  {
    repo: "Intentionally-Vulnerable-Bad-rAG",
    title: "Intentionally Vulnerable Bad RAG",
    technologies: ["Python", "AI Security"],
    titleColor: "text-red-400",
  },
  {
    repo: "Social-Media-Downloader",
    title: "Social Media Downloader",
    technologies: ["Python", "CLI"],
    titleColor: "text-cyan-400",
  },
  {
    title: "Machine Learning Research Lead",
    description:
      "Research Lead and Author of The Effect of Increased Dimensionality on Detecting Malicious IoMT Network Traffic — published by Springer and presented at MobiSec 2025 in Sapporo, Japan. Benchmarked six ML models across packet-level and flow-level feature sets on the CICIoMT2024 dataset.",
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%23111827'/%3E%3Ctext x='200' y='25' text-anchor='middle' fill='%2310b981' font-family='Arial' font-size='16' font-weight='bold'%3EML Cybersecurity Research%3C/text%3E%3Cg transform='translate(50,50)'%3E%3Ccircle cx='50' cy='30' r='8' fill='%2306b6d4'/%3E%3Ccircle cx='100' cy='20' r='6' fill='%23ef4444'/%3E%3Ccircle cx='150' cy='40' r='7' fill='%2310b981'/%3E%3Ccircle cx='200' cy='25' r='5' fill='%23fbbf24'/%3E%3Ctext x='50' y='50' text-anchor='middle' fill='%2306b6d4' font-size='8'%3ENormal%3C/text%3E%3Ctext x='100' y='40' text-anchor='middle' fill='%23ef4444' font-size='8'%3EMalicious%3C/text%3E%3C/g%3E%3Ctext x='200' y='120' text-anchor='middle' fill='%23a855f7' font-size='12'%3EIoMT WiFi Traffic Analysis%3C/text%3E%3Ctext x='200' y='140' text-anchor='middle' fill='%23fbbf24' font-size='12'%3EAccuracy: 94.7%%3C/text%3E%3Ctext x='200' y='160' text-anchor='middle' fill='%2306b6d4' font-size='10'%3EJupyter • Scikit-learn • Pandas%3C/text%3E%3C/svg%3E",
    alt: "Machine learning cybersecurity research visualization",
    technologies: ["Jupyter Notebook", "Sk-learn", "Pandas", "Numpy"],
    titleColor: "text-green-400",
    demoUrl: "https://easychair.org/smart-slide/slide/2N9Q",
    demoLabel: "Talk Slides",
    linksNote: "Published by Springer (MobiSec 2025) — full text available on request.",
  },
  {
    repo: "PokemonDetector",
    title: "Pokemon Detector Webapp",
    description: "Trained a machine learning algorithm to detect Gen1 Pokemon and made a webapp.",
    technologies: ["py-torch", "HTML / JS"],
    titleColor: "text-purple-400",
  },
  {
    repo: "AutoMenu",
    title: "AutoMenu",
    description:
      "After having to make a CLI menu multiple times for multiple classes, I decided to make a general function to do it automatically.",
    technologies: ["C++"],
    titleColor: "text-cyan-400",
  },
  {
    repo: "100PrisonerProblem",
    title: "The 100 Prisoners Problem",
    description:
      "Inspired by Veritasium and spurred on by a debate with my professor, I coded up a simulation of the 100 prisoners problem.",
    technologies: ["C++"],
    titleColor: "text-green-400",
  },
  {
    repo: "WeatherApiApp",
    title: "Weather APP",
    description: "A classic beginning coder project.",
    technologies: ["Python", "API", "HTML / JS"],
    titleColor: "text-yellow-400",
  },
];
