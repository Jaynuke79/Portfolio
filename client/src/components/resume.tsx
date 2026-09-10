import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import Reveal from "@/components/reveal";

const EXPERIENCE = [
  {
    title: "AI Services Intern",
    company: "EggNest.ai",
    period: "Oct 2025 to present",
    description:
      "Deep CRM connector integrations for Glean and AI agent pipelines across the full development lifecycle.",
  },
  {
    title: "Software Engineering Intern",
    company: "JGMS Government Services",
    period: "Summer 2025",
    description:
      "Internal RAG web framework with LangChain, Supabase, FastAPI, and React, cutting document lookup by about 3 hours a week.",
  },
  {
    title: "Backend Developer",
    company: "Rotary Club",
    period: "Nov 2024 to present",
    description: "PII compliance, payment processing optimization, and fund-dispersal automation.",
  },
  {
    title: "Field Technician",
    company: "Greenflare Technologies",
    period: "Oct 2024 to present",
    description:
      "Repair and maintain high-throughput compute systems and diagnose network bottlenecks from packet captures.",
  },
  {
    title: "Software Engineering Intern",
    company: "Fiore Industries",
    period: "Summer 2024",
    description:
      "RF-to-optical testing protocol and pipeline in low-level C for mission-critical equipment validation.",
  },
  {
    title: "Student Research Head",
    company: "Colorado Mesa University",
    period: "Dec 2023 to present",
    description: "Lead a 6-person team building ML pipelines for IoMT detection and small cybersecurity LMs.",
  },
];

const EDUCATION = {
  degree: "B.S. Computer Science, minor in Cybersecurity",
  school: "Colorado Mesa University",
  period: "Expected May 2027",
  detail: "GPA 3.56 / 4.0. Focus on AI application.",
};

export default function Resume() {
  return (
    <section id="resume" className="scroll-mt-20 border-t border-border py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Experience</h2>
            <p className="mt-3 text-lg text-muted-foreground">Resume and CV last updated July 2026.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 px-6 active:scale-[0.98]">
              <a href="/Jayden_Alonzo-Estrada_Resume.pdf" download="Jayden_Alonzo-Estrada_Resume.pdf">
                <Download className="h-4 w-4" />
                Download resume
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-6 active:scale-[0.98]">
              <a href="/Jayden_Alonzo-Estrada_CV.pdf" download="Jayden_Alonzo-Estrada_CV.pdf">
                <Download className="h-4 w-4" />
                Download CV
              </a>
            </Button>
          </div>
        </Reveal>

        <Reveal as="div" className="mt-12">
          <ol className="relative border-l border-border">
            {EXPERIENCE.map((job) => (
              <li key={`${job.title}-${job.company}`} className="relative grid gap-2 pb-10 pl-8 last:pb-0 md:grid-cols-[200px_1fr] md:gap-8">
                <span
                  aria-hidden="true"
                  className="absolute -left-[5px] top-2 h-[9px] w-[9px] rounded-full border-2 border-background bg-brand"
                />
                <p className="font-mono text-sm text-muted-foreground md:pt-0.5">{job.period}</p>
                <div>
                  <h3 className="font-semibold">
                    {job.title}
                    <span className="font-normal text-muted-foreground"> at {job.company}</span>
                  </h3>
                  <p className="mt-1.5 max-w-[60ch] text-sm leading-relaxed text-muted-foreground">
                    {job.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal className="mt-14 grid gap-2 border-t border-border pt-8 md:grid-cols-[200px_1fr] md:gap-8">
          <p className="font-mono text-sm text-muted-foreground">{EDUCATION.period}</p>
          <div>
            <h3 className="font-semibold">
              {EDUCATION.degree}
              <span className="font-normal text-muted-foreground"> at {EDUCATION.school}</span>
            </h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{EDUCATION.detail}</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
