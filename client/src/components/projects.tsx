import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Github, Star } from "lucide-react";
import { FEATURED_PROJECTS } from "@/lib/featured-projects";
import { githubOgImageUrl } from "@/lib/github";
import { useGithubRepos } from "@/hooks/use-github-repos";

const TECH_COLORS: Record<string, string> = {
  "C++": "bg-blue-600/20 text-blue-400",
  "Python": "bg-blue-600/20 text-blue-400",
  "Jupyter Notebook": "bg-orange-600/20 text-orange-400",
  "Sk-learn": "bg-green-600/20 text-green-400",
  "Pandas": "bg-blue-600/20 text-blue-400",
  "Numpy": "bg-yellow-600/20 text-yellow-400",
  "py-torch": "bg-orange-600/20 text-orange-400",
  "API": "bg-green-600/20 text-green-400",
  "HTML / JS": "bg-yellow-600/20 text-yellow-400",
  "AI Security": "bg-purple-600/20 text-purple-400",
  "CLI": "bg-cyan-600/20 text-cyan-400",
};

const DEFAULT_TECH_COLOR = "bg-gray-600/20 text-gray-300";

function formatPushedAt(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Projects() {
  const repos = useGithubRepos();

  const projects = FEATURED_PROJECTS.map((featured) => {
    const repo = featured.repo ? repos.get(featured.repo) : undefined;
    return {
      ...featured,
      image: featured.image ?? (featured.repo ? githubOgImageUrl(featured.repo) : ""),
      alt: featured.alt ?? `${featured.title} repository card`,
      description: featured.description ?? repo?.description ?? "",
      codeUrl: featured.codeUrl ?? repo?.html_url,
      demoUrl: featured.demoUrl ?? (repo?.homepage || undefined),
      stars: repo?.stargazers_count,
      language: repo?.language,
      pushedAt: repo?.pushed_at,
    };
  });

  return (
    <section id="projects" className="py-20 bg-black">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-16 gradient-text">Featured Projects and Events</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <Card
              key={project.title}
              className="glass-morphism border-gray-800 hover:scale-105 transition-all duration-300 group hover:glow-blue"
            >
              <CardContent className="p-6">
                <img
                  src={project.image}
                  alt={project.alt}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                  loading="lazy"
                />
                <h3 className={`text-xl font-semibold mb-3 ${project.titleColor}`}>
                  {project.title}
                </h3>
                <p className="text-gray-300 mb-4 text-sm leading-relaxed">
                  {project.description}
                </p>
                {project.pushedAt && (
                  <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                    <span className="flex items-center">
                      <Star className="mr-1 h-3 w-3" />
                      {project.stars}
                    </span>
                    {project.language && <span>{project.language}</span>}
                    <span>Updated {formatPushedAt(project.pushedAt)}</span>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.technologies.map((tech) => (
                    <Badge
                      key={tech}
                      className={`${TECH_COLORS[tech] ?? DEFAULT_TECH_COLOR} border-none text-xs`}
                    >
                      {tech}
                    </Badge>
                  ))}
                </div>
                <div className="flex space-x-4">
                  {project.codeUrl && (
                    <Button
                      asChild
                      variant="link"
                      className="text-cyan-400 hover:text-cyan-300 p-0 h-auto font-medium"
                    >
                      <a href={project.codeUrl} target="_blank" rel="noopener noreferrer">
                        <Github className="mr-1 h-4 w-4" />
                        Code
                      </a>
                    </Button>
                  )}
                  {project.demoUrl && (
                    <Button
                      asChild
                      variant="link"
                      className="text-green-400 hover:text-green-300 p-0 h-auto font-medium"
                    >
                      <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-1 h-4 w-4" />
                        Demo
                      </a>
                    </Button>
                  )}
                  {!project.codeUrl && !project.demoUrl && project.linksNote && (
                    <p className="text-gray-500 text-xs italic">{project.linksNote}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
