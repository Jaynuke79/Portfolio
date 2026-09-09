import { Badge } from "@/components/ui/badge";
import { ExternalLink, Star } from "lucide-react";
import { GithubIcon } from "@/components/icons";
import Reveal from "@/components/reveal";
import { FEATURED_PROJECTS } from "@/lib/featured-projects";
import { githubOgImageUrl } from "@/lib/github";
import { useGithubRepos } from "@/hooks/use-github-repos";
import { cn } from "@/lib/utils";

function formatPushedAt(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
}

const linkClass =
  "inline-flex items-center gap-1.5 text-sm font-medium text-brand underline-offset-4 hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring rounded-sm";

export default function Projects() {
  const repos = useGithubRepos();

  const projects = FEATURED_PROJECTS.map((featured) => {
    const repo = featured.repo ? repos.get(featured.repo) : undefined;
    return {
      ...featured,
      image: featured.image ?? (featured.repo ? githubOgImageUrl(featured.repo) : undefined),
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
    <section id="projects" className="scroll-mt-20 border-t border-border py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Projects and research</h2>
          <p className="mt-3 max-w-[60ch] text-lg text-muted-foreground">
            Repository cards pull live from GitHub. The research entry links to the talk.
          </p>
        </Reveal>

        <ul className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Reveal
              as="li"
              key={project.title}
              className={cn(
                "group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-foreground/30",
                project.featured && "bg-brand-soft md:col-span-2"
              )}
            >
              {project.image && (
                <img
                  src={project.image}
                  alt={project.alt}
                  width={1200}
                  height={600}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[2/1] w-full border-b border-border object-cover"
                />
              )}
              <div className={cn("flex flex-1 flex-col p-6", project.featured && "md:p-8")}>
                <h3 className={cn("font-semibold tracking-tight", project.featured ? "text-2xl" : "text-lg")}>
                  {project.title}
                </h3>
                <p
                  className={cn(
                    "mt-3 flex-1 leading-relaxed text-muted-foreground",
                    project.featured ? "max-w-[60ch] text-base" : "text-sm"
                  )}
                >
                  {project.description}
                </p>

                {project.pushedAt && (
                  <dl className="mt-4 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <dt className="sr-only">Stars</dt>
                      <Star className="h-3 w-3" aria-hidden="true" />
                      <dd>{project.stars}</dd>
                    </div>
                    {project.language && (
                      <div>
                        <dt className="sr-only">Language</dt>
                        <dd>{project.language}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="sr-only">Last updated</dt>
                      <dd>Updated {formatPushedAt(project.pushedAt)}</dd>
                    </div>
                  </dl>
                )}

                <ul className="mt-4 flex flex-wrap gap-2">
                  {project.technologies.map((tech) => (
                    <li key={tech}>
                      <Badge variant="secondary" className="border-border bg-background font-normal text-muted-foreground">
                        {tech}
                      </Badge>
                    </li>
                  ))}
                </ul>

                <div className="mt-5 flex flex-wrap items-center gap-5">
                  {project.codeUrl && (
                    <a href={project.codeUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                      <GithubIcon className="h-4 w-4" />
                      Code
                    </a>
                  )}
                  {project.demoUrl && (
                    <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                      <ExternalLink className="h-4 w-4" />
                      {project.demoLabel ?? "Demo"}
                    </a>
                  )}
                  {project.linksNote && (
                    <p className="text-xs text-muted-foreground">{project.linksNote}</p>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
