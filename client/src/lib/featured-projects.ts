export interface FeaturedProject {
  repo?: string;
  title: string;
  description?: string;
  image: string;
  alt: string;
  technologies: string[];
  titleColor: string;
  codeUrl?: string;
  demoUrl?: string;
  linksNote?: string;
}

export const FEATURED_PROJECTS: FeaturedProject[] = [
  {
    repo: "Intentionally-Vulnerable-Bad-rAG",
    title: "Intentionally Vulnerable Bad RAG",
    image: "https://opengraph.githubassets.com/portfolio/Jaynuke79/Intentionally-Vulnerable-Bad-rAG",
    alt: "Intentionally Vulnerable Bad RAG repository card",
    technologies: ["Python", "AI Security"],
    titleColor: "text-red-400",
  },
  {
    repo: "Social-Media-Downloader",
    title: "Social Media Downloader",
    image: "https://opengraph.githubassets.com/portfolio/Jaynuke79/Social-Media-Downloader",
    alt: "Social Media Downloader repository card",
    technologies: ["Python", "CLI"],
    titleColor: "text-cyan-400",
  },
  {
    title: "Machine Learning Research Lead",
    description:
      "Author of the paper: The Effect of Increased Dimensionality on Detecting Malicious Packets using Machine Learning on IoMT WiFi network traffic.",
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%23111827'/%3E%3Ctext x='200' y='25' text-anchor='middle' fill='%2310b981' font-family='Arial' font-size='16' font-weight='bold'%3EML Cybersecurity Research%3C/text%3E%3Cg transform='translate(50,50)'%3E%3Ccircle cx='50' cy='30' r='8' fill='%2306b6d4'/%3E%3Ccircle cx='100' cy='20' r='6' fill='%23ef4444'/%3E%3Ccircle cx='150' cy='40' r='7' fill='%2310b981'/%3E%3Ccircle cx='200' cy='25' r='5' fill='%23fbbf24'/%3E%3Ctext x='50' y='50' text-anchor='middle' fill='%2306b6d4' font-size='8'%3ENormal%3C/text%3E%3Ctext x='100' y='40' text-anchor='middle' fill='%23ef4444' font-size='8'%3EMalicious%3C/text%3E%3C/g%3E%3Ctext x='200' y='120' text-anchor='middle' fill='%23a855f7' font-size='12'%3EIoMT WiFi Traffic Analysis%3C/text%3E%3Ctext x='200' y='140' text-anchor='middle' fill='%23fbbf24' font-size='12'%3EAccuracy: 94.7%%3C/text%3E%3Ctext x='200' y='160' text-anchor='middle' fill='%2306b6d4' font-size='10'%3EJupyter • Scikit-learn • Pandas%3C/text%3E%3C/svg%3E",
    alt: "Machine learning cybersecurity research visualization",
    technologies: ["Jupyter Notebook", "Sk-learn", "Pandas", "Numpy"],
    titleColor: "text-green-400",
    linksNote: "Paper not publicly published — available on request.",
  },
  {
    repo: "PokemonDetector",
    title: "Pokemon Detector Webapp",
    description: "Trained a machine learning algorithm to detect Gen1 Pokemon and made a webapp.",
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%23111827'/%3E%3Ctext x='200' y='25' text-anchor='middle' fill='%23a855f7' font-family='Arial' font-size='16' font-weight='bold'%3EPokemon AI Detector%3C/text%3E%3Ccircle cx='120' cy='80' r='25' fill='none' stroke='%23ef4444' stroke-width='3'/%3E%3Ccircle cx='120' cy='80' r='15' fill='%23ef4444'/%3E%3Ccircle cx='120' cy='75' r='8' fill='white'/%3E%3Crect x='115' y='105' width='10' height='5' fill='%236b7280'/%3E%3Ctext x='280' y='70' fill='%2310b981' font-size='14' font-weight='bold'%3EPikachu%3C/text%3E%3Ctext x='280' y='90' fill='%23fbbf24' font-size='12'%3EConfidence: 96.8%%3C/text%3E%3Ctext x='280' y='110' fill='%2306b6d4' font-size='10'%3EGen 1 Electric Type%3C/text%3E%3Crect x='50' y='130' width='300' height='40' fill='%231f2937' stroke='%234b5563'/%3E%3Ctext x='200' y='145' text-anchor='middle' fill='%239ca3af' font-size='10'%3EDrop image or click to upload%3C/text%3E%3Ctext x='200' y='160' text-anchor='middle' fill='%236b7280' font-size='8'%3EPyTorch • Web Interface%3C/text%3E%3C/svg%3E",
    alt: "Pokemon detection web application interface",
    technologies: ["py-torch", "HTML / JS"],
    titleColor: "text-purple-400",
  },
  {
    repo: "AutoMenu",
    title: "AutoMenu",
    description:
      "After having to make a CLI menu multiple times for multiple classes, I decided to make a general function to do it automatically.",
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%23111827'/%3E%3Ctext x='200' y='50' text-anchor='middle' fill='%2306b6d4' font-family='monospace' font-size='16' font-weight='bold'%3EC++ CLI Menu%3C/text%3E%3Ctext x='50' y='90' fill='%2310b981' font-family='monospace' font-size='12'%3E1. Option One%3C/text%3E%3Ctext x='50' y='110' fill='%2310b981' font-family='monospace' font-size='12'%3E2. Option Two%3C/text%3E%3Ctext x='50' y='130' fill='%2310b981' font-family='monospace' font-size='12'%3E3. Option Three%3C/text%3E%3Ctext x='50' y='150' fill='%23fbbf24' font-family='monospace' font-size='12'%3EEnter choice: __%3C/text%3E%3C/svg%3E",
    alt: "C++ CLI menu interface",
    technologies: ["C++"],
    titleColor: "text-cyan-400",
  },
  {
    repo: "100PrisonerProblem",
    title: "The 100 Prisoners Problem",
    description:
      "Inspired by Veritasium and spurred on by a debate with my professor, I coded up a simulation of the 100 prisoners problem.",
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%23111827'/%3E%3Ctext x='200' y='30' text-anchor='middle' fill='%2310b981' font-family='Arial' font-size='18' font-weight='bold'%3E100 Prisoners Problem%3C/text%3E%3Cg transform='translate(50,60)'%3E%3Crect x='0' y='0' width='30' height='20' fill='%236b7280' stroke='%23d1d5db'/%3E%3Ctext x='15' y='15' text-anchor='middle' fill='white' font-size='10'%3E1%3C/text%3E%3Crect x='35' y='0' width='30' height='20' fill='%236b7280' stroke='%23d1d5db'/%3E%3Ctext x='50' y='15' text-anchor='middle' fill='white' font-size='10'%3E2%3C/text%3E%3Ctext x='80' y='15' fill='%23fbbf24' font-size='12'%3E...100%3C/text%3E%3C/g%3E%3Ctext x='200' y='120' text-anchor='middle' fill='%2306b6d4' font-size='14'%3ESuccess Rate: 31.18%%3C/text%3E%3Ctext x='200' y='140' text-anchor='middle' fill='%23ef4444' font-size='12'%3ESimulations: 10,000%3C/text%3E%3Ctext x='200' y='160' text-anchor='middle' fill='%23a855f7' font-size='12'%3EStrategy: Optimal Loop%3C/text%3E%3C/svg%3E",
    alt: "100 prisoners problem simulation visualization",
    technologies: ["C++"],
    titleColor: "text-green-400",
  },
  {
    repo: "WeatherApiApp",
    title: "Weather APP",
    description: "A classic beginning coder project.",
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%23111827'/%3E%3Ctext x='200' y='25' text-anchor='middle' fill='%23fbbf24' font-family='Arial' font-size='18' font-weight='bold'%3EWeather App%3C/text%3E%3Ccircle cx='120' cy='80' r='20' fill='%23fbbf24'/%3E%3Cpath d='M 100 80 Q 100 70 110 70 Q 120 60 130 70 Q 140 70 140 80' fill='%236b7280'/%3E%3Ctext x='200' y='70' fill='%23fbbf24' font-size='24' font-weight='bold'%3E72°F%3C/text%3E%3Ctext x='200' y='90' fill='%2306b6d4' font-size='14'%3ESunny%3C/text%3E%3Ctext x='200' y='110' fill='%2310b981' font-size='12'%3EGrand Junction, CO%3C/text%3E%3Ctext x='200' y='130' fill='%239ca3af' font-size='10'%3EHumidity: 45%% | Wind: 8 mph%3C/text%3E%3Ctext x='200' y='150' fill='%23a855f7' font-size='10'%3EPowered by Weather API%3C/text%3E%3C/svg%3E",
    alt: "Weather application interface showing temperature and conditions",
    technologies: ["Python", "API", "HTML / JS"],
    titleColor: "text-yellow-400",
  },
];
