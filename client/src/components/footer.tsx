import { GithubIcon, LinkedinIcon } from "@/components/icons";

const SOCIAL_LINKS = [
  { icon: GithubIcon, label: "GitHub", href: "https://github.com/Jaynuke79" },
  { icon: LinkedinIcon, label: "LinkedIn", href: "https://www.linkedin.com/in/jayae/" },
];

export default function Footer() {
  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>
          &copy; {new Date().getFullYear()} Jayden Alonzo-Estrada. Built with AI tools and
          restless nights.
        </p>
        <ul className="flex items-center gap-5">
          {SOCIAL_LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.label}
                className="inline-flex text-muted-foreground transition-colors hover:text-foreground"
              >
                <link.icon className="h-5 w-5" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
