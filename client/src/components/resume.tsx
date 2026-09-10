import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import Reveal from "@/components/reveal";

interface Entry {
  title: string;
  org?: string;
  location?: string;
  period: string;
  bullets: string[];
}

interface Group {
  heading: string;
  entries: Entry[];
}

const GROUPS: Group[] = [
  {
    heading: "Professional experience",
    entries: [
      {
        title: "AI Services Intern",
        org: "EggNest.ai",
        location: "Grand Junction, CO",
        period: "Oct 2025 to present",
        bullets: [
          "Grew the HubSpot connector into a deep CRM integration across 11 object types, with write actions and UAT agents so Glean can inspect and act on records.",
          "Took a customer Zoho Desk connector to production: sync model, support-ticket indexing, custom-field auto-discovery, and URL resolution fixes.",
          "Orchestrate AI agent pipelines from codebase audits to PR merges, shipping 168 commits and 26,000+ lines across 408 files in one month.",
        ],
      },
      {
        title: "Software Engineering Intern",
        org: "JGMS Government Services",
        location: "Grand Junction, CO",
        period: "Jun 2025 to Aug 2025",
        bullets: [
          "Shipped an internal RAG service with LangChain, Supabase, FastAPI, and React, cutting document lookup by about 3 hours a week.",
          "Added retrieval evaluation and logging for top-k accuracy and latency across 2-week sprints in an 8-week delivery window.",
        ],
      },
      {
        title: "Ice Cream Scooper",
        org: "3rd Bowl Homemade Ice Cream",
        location: "Grand Junction, CO",
        period: "Aug 2025 to present",
        bullets: [
          "Serve 50+ customers per shift while balancing cash handling, cleaning, and inventory in a busy local parlor.",
        ],
      },
      {
        title: "Backend Developer",
        org: "Rotary Club",
        location: "Grand Junction, CO",
        period: "Nov 2024 to present",
        bullets: [
          "Enforce PII and card-data compliance on web applications, reducing organizational liability.",
          "Optimized database retrieval and payment processing, cutting wait times by up to 20%.",
          "Automated fund-dispersal calculations with Python, improving response time by up to 2 days.",
        ],
      },
      {
        title: "Field Technician",
        org: "Greenflare Technologies",
        location: "Denver, CO",
        period: "Oct 2024 to present",
        bullets: [
          "Repair and maintain high-throughput compute systems, restoring nodes and improving hardware uptime.",
          "Diagnose bottlenecks with packet captures, boosting network throughput by about 20% in high-traffic areas.",
        ],
      },
      {
        title: "Software Engineering Intern",
        org: "Fiore Industries",
        location: "Albuquerque, NM",
        period: "Jun 2024 to Aug 2024",
        bullets: [
          "Delivered an RF-to-optical testing protocol and pipeline in two weeks with MPLAB and low-level C for mission-critical equipment validation.",
          "Authored repeatable evaluation procedures and scripts, shortening debug cycles for hardware teams.",
        ],
      },
      {
        title: "Student Research Head",
        org: "Colorado Mesa University",
        location: "Grand Junction, CO",
        period: "Dec 2023 to present",
        bullets: [
          "Lead a 6-person team building ML pipelines for IoMT detection and small cybersecurity language models.",
          "Standardize code review, experiment tracking, and documentation for reproducible work across contributors.",
        ],
      },
    ],
  },
  {
    heading: "Research",
    entries: [
      {
        title: "The Effect of Increased Dimensionality on Detecting Malicious IoMT Network Traffic",
        org: "Springer, MobiSec 2025",
        location: "Sapporo, Japan",
        period: "Dec 2023 to Mar 2025",
        bullets: [
          "Research lead and author with A. Mora, A. Avila, and R. Basnet.",
          "Benchmarked six ML models across packet-level (DPKT) and flow-level (CICFlowMeter) features on the CICIoMT2024 dataset.",
        ],
      },
      {
        title: "Exploring Agentic Misalignment in Commercial Level Applications",
        period: "Sep 2025 to present",
        bullets: [
          "Developing best practices for using AI in business settings, written for non-technical stakeholders.",
        ],
      },
    ],
  },
  {
    heading: "Leadership",
    entries: [
      {
        title: "House Speaker",
        org: "Associated Student Government, Colorado Mesa University",
        period: "May 2026 to present",
        bullets: [
          "Preside over the student House of Representatives, steering legislation from introduction through passage while keeping communication open with the student body.",
        ],
      },
      {
        title: "President",
        org: "CMU Computer Science Club",
        period: "Aug 2023 to present",
        bullets: [
          "Run weekly coding sessions and tech talks for about 15 members.",
          "Built and operate a student distributed-computing cluster for coursework and competition practice.",
          "Coached competitive coding teams to national events with average top-10 placements.",
        ],
      },
      {
        title: "President",
        org: "CMU Cybersecurity Club",
        period: "Aug 2023 to present",
        bullets: [
          "Run weekly hands-on labs on packet analysis and detection engineering for about 7 members.",
          "Partner with a local cybersecurity firm for workshops and guest speakers.",
          "Led teams to national competitions with average top-15 results.",
        ],
      },
    ],
  },
  {
    heading: "Education",
    entries: [
      {
        title: "B.S. Computer Science, minor in Cybersecurity",
        org: "Colorado Mesa University",
        location: "Grand Junction, CO",
        period: "Aug 2023 to May 2027 (expected)",
        bullets: [
          "GPA 3.56 / 4.0. Focus on AI application.",
          "Captained coding and cybersecurity teams to national competitions, placing 4th regionally in the first year.",
          "Coursework: Probability and Statistics, OOP and Design Patterns, Databases, Algorithms, Python Machine Learning.",
        ],
      },
      {
        title: "Thrive Scholar",
        org: "Thrive Scholars, Class of 2027",
        period: "Jun 2022 to present",
        bullets: [
          "Multi-year career program with training in quantitative analysis, communication, and career readiness.",
        ],
      },
    ],
  },
  {
    heading: "Volunteering",
    entries: [
      {
        title: "Community support",
        org: "Mesa Catholic",
        location: "Grand Junction, CO",
        period: "Jun 2025 to Aug 2025",
        bullets: ["Property cleanups for elderly community members during summer sessions."],
      },
      {
        title: "STEM volunteer",
        org: "Mount Garfield Middle School",
        location: "Clifton, CO",
        period: "Nov 2024",
        bullets: ["Taught basic network visualization concepts to introduce students to computing."],
      },
      {
        title: "Volunteer judge",
        org: "MATHCOUNTS Colorado",
        location: "Grand Junction, CO",
        period: "Feb 2024",
        bullets: ["Assisted with scoring and logistics at a statewide math competition."],
      },
    ],
  },
];

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

        {GROUPS.map((group) => (
          <Reveal key={group.heading} className="mt-14">
            <h3 className="text-xl font-semibold tracking-tight">{group.heading}</h3>
            <ol className="relative mt-6 border-l border-border">
              {group.entries.map((entry) => (
                <li
                  key={entry.title}
                  className="relative grid gap-2 pb-10 pl-8 last:pb-0 md:grid-cols-[200px_1fr] md:gap-8"
                >
                  <span
                    aria-hidden="true"
                    className="absolute -left-[5px] top-2 h-[9px] w-[9px] rounded-full border-2 border-background bg-brand"
                  />
                  <p className="font-mono text-sm text-muted-foreground md:pt-0.5">{entry.period}</p>
                  <div>
                    <h4 className="font-semibold">
                      {entry.title}
                      {entry.org && (
                        <span className="font-normal text-muted-foreground">
                          {" "}at {entry.org}
                          {entry.location && `, ${entry.location}`}
                        </span>
                      )}
                    </h4>
                    <ul className="mt-2 max-w-[65ch] space-y-1.5 text-sm leading-relaxed text-muted-foreground">
                      {entry.bullets.map((bullet) => (
                        <li key={bullet} className="flex gap-2">
                          <span aria-hidden="true" className="select-none">-</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
