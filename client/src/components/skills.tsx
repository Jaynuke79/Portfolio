import { Award, BookOpen, Trophy, Users } from "lucide-react";
import Reveal from "@/components/reveal";

const SKILL_GROUPS = [
  {
    title: "Languages",
    skills: ["Python", "TypeScript and React", "C and C++", "System architecture"],
  },
  {
    title: "Cybersecurity",
    skills: ["Network security", "Zero Trust principles", "SecOps", "Risk and compliance mechanisms", "AuthN and AuthZ systems"],
  },
  {
    title: "AI and backend",
    skills: [
      "AI agent orchestration",
      "AI and ML modeling",
      "Backend services and REST APIs",
      "Testing and evaluation automation",
      "Project management",
    ],
  },
];

const RECOGNITION = [
  {
    icon: BookOpen,
    title: "Published researcher",
    detail: "Springer, MobiSec 2025, Sapporo, Japan",
  },
  {
    icon: Award,
    title: "CompTIA Security+",
    detail: "In progress",
  },
  {
    icon: Trophy,
    title: "CTF competitor",
    detail: "Top 15 at RazorHack 2024. Top 10 at the SHPE Cybersecurity Challenge 2024.",
  },
  {
    icon: Users,
    title: "Student leadership",
    detail: "ASG House Speaker. President of the CS and Cybersecurity clubs.",
  },
];

export default function Skills() {
  return (
    <section id="skills" className="scroll-mt-20 border-t border-border py-24">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 md:grid-cols-12 lg:px-8">
        <Reveal className="md:col-span-4">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Skills</h2>
          <p className="mt-3 text-lg text-muted-foreground">
            What I reach for when the problem is security, data, or the service behind both.
          </p>
        </Reveal>

        <Reveal className="md:col-span-8">
          <dl className="divide-y divide-border border-y border-border">
            {SKILL_GROUPS.map((group) => (
              <div key={group.title} className="grid gap-2 py-6 sm:grid-cols-[180px_1fr] sm:gap-6">
                <dt className="font-medium">{group.title}</dt>
                <dd className="text-muted-foreground">{group.skills.join(", ")}</dd>
              </div>
            ))}
          </dl>

          <h3 className="mt-14 text-xl font-semibold tracking-tight">Recognition</h3>
          <ul className="mt-6 grid gap-x-8 gap-y-8 sm:grid-cols-2">
            {RECOGNITION.map((item) => (
              <li key={item.title} className="flex gap-4">
                <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-soft text-brand">
                  <item.icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
