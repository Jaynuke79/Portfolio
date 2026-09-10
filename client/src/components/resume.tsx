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
        title: "AI Engineer",
        org: "EggNest.ai",
        location: "Grand Junction, CO",
        period: "Sep 2026 to present",
        bullets: [
          "Promoted from intern after a year of connector delivery. Own customer communications, project coordination in Productive and HubSpot, and VM provisioning for customer deployments.",
          "Built the team's multi-agent engineering environment: agent roles, hooks, an SSH rulebook, and an issue-burndown skill packaged as one verified plugin.",
          "Hold the company seat on the OpenAI Partner Portal.",
        ],
      },
      {
        title: "AI Services Intern",
        org: "EggNest.ai",
        location: "Grand Junction, CO",
        period: "Oct 2025 to Sep 2026",
        bullets: [
          "Grew the HubSpot connector into a deep CRM integration across 11 object types with write actions and UAT agents, and took a customer Zoho Desk connector from foundation to production.",
          "Ran audit-to-burndown pipelines with agent teams: verified every CodeQL finding, filed 12 issues and 2 epics, merged 10 PRs closing all 9 targets, and shipped a connector with 225 passing tests. 158 commits and 25,900+ lines across 562 files in 21 working days.",
          "Standardized connector development with shared ConnectorLib skills, administered the Linux servers, Lambdas, and databases behind the EggNest Portal, and drafted the company's HIPAA and PII compliance roadmap.",
        ],
      },
      {
        title: "Software Developer, independent contractor",
        org: "Rotary Club of Grand Junction",
        location: "Grand Junction, CO",
        period: "Nov 2024 to present",
        bullets: [
          "Rebuilt the club's sweepstakes platform from scratch in three weeks on Next.js, TypeScript, Vercel, and Neon Postgres, replacing a 2020 build on unpatched Node.js 10 and migrating 38 charities, 5 sponsors, and historical ticket records intact.",
          "Scrubbed live credentials from git history, retired 689 password-less buyer accounts in favor of throttled admin auth, and made tickets issue only from signature-verified payment webhooks across Stripe, Authorize.net, and Square.",
          "Gated deployment on 96+ automated tests and Playwright checks, fixed nine pre-launch security-audit findings, and shipped training mode, member roles, and Excel export under a maintenance contract.",
        ],
      },
      {
        title: "Field Technician",
        org: "Greenflare Technologies",
        location: "Denver, CO",
        period: "Oct 2024 to Sep 2026",
        bullets: [
          "Repaired and maintained high-throughput Linux compute systems in production, restoring failed nodes and improving hardware uptime.",
          "Diagnosed Ethernet bottlenecks with packet captures and targeted load tests, boosting network throughput by about 20% in high-traffic areas.",
        ],
      },
      {
        title: "Software Engineering Intern",
        org: "JGMS Government Services",
        location: "Grand Junction, CO",
        period: "Jun 2025 to Aug 2025",
        bullets: [
          "Shipped and operated an internal RAG service on Linux with FastAPI, LangChain, Supabase PostgreSQL, and React, cutting document lookup by about 3 hours a week.",
          "Added retrieval evaluation and logging for top-k accuracy and latency across 2-week sprints in an 8-week delivery window.",
        ],
      },
      {
        title: "Software Engineering Intern",
        org: "Fiore Industries",
        location: "Albuquerque, NM",
        period: "Jun 2024 to Aug 2024",
        bullets: [
          "Delivered an RF-to-optical testing protocol and pipeline in two weeks with MPLAB and low-level C, automating signal sweeps and data capture for mission-critical equipment validation.",
        ],
      },
      {
        title: "Student Research Head",
        org: "Colorado Mesa University",
        location: "Grand Junction, CO",
        period: "Dec 2023 to present",
        bullets: [
          "Lead a 6-person team building ML pipelines for IoMT intrusion detection and small cybersecurity language models.",
          "Manage repos, sprints, code review, and experiment tracking for reproducibility.",
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
          "Benchmarked six ML models across packet-level (DPKT) and flow-level (CICFlowMeter) features on the CICIoMT2024 dataset, quantifying accuracy-versus-compute tradeoffs for real-time detection.",
        ],
      },
      {
        title: "Exploring Agentic Misalignment in Commercial Level Applications",
        period: "Sep 2025 to present",
        bullets: [
          "Ongoing research developing best practices for using AI in business settings, written for non-technical stakeholders.",
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
        title: "Treasurer",
        org: "Society of Hispanic Professional Engineers, CMU Chapter",
        period: "Aug 2025 to present",
        bullets: [
          "Manage the chapter's finances and budget in support of its professional development and outreach programming.",
        ],
      },
      {
        title: "President and Cluster Administrator",
        org: "CMU Computer Science Club",
        period: "Aug 2023 to present",
        bullets: [
          "Built and operate a student Linux HPC cluster, provisioning nodes and managing user access for coursework, experiments, and competition practice.",
          "Coached competitive coding teams to national events with average top-10 placements.",
        ],
      },
      {
        title: "President",
        org: "CMU Cybersecurity Club",
        period: "Aug 2023 to present",
        bullets: [
          "Run weekly hands-on labs on packet analysis and detection engineering for about 7 members to strengthen blue-team skills.",
        ],
      },
    ],
  },
  {
    heading: "Honors and fellowships",
    entries: [
      {
        title: "Springboard Fellow",
        org: "Colorado Mesa University",
        period: "Sep 2026 to present",
        bullets: [
          "Fellowship pairing first-generation students with mentors from the Grand Junction professional community, with cohort programming in Denver and Washington, D.C.",
        ],
      },
      {
        title: "Thrive Scholar",
        org: "Thrive Scholars, Class of 2027",
        period: "Jun 2022 to present",
        bullets: [
          "Multi-year career program in quantitative analysis, communication, and career readiness.",
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
          "GPA 3.63 / 4.0. Focus on AI application.",
          "Captained coding and cybersecurity teams to national competitions, placing 4th regionally in the first year.",
          "Coursework: Probability and Statistics, OOP and Design Patterns, Databases, Algorithms, Python Machine Learning.",
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
        bullets: ["Property cleanups with elderly community members."],
      },
      {
        title: "STEM volunteer",
        org: "Mount Garfield Middle School",
        location: "Clifton, CO",
        period: "Nov 2024",
        bullets: ["Taught network visualization basics to introduce students to computing."],
      },
      {
        title: "Volunteer judge",
        org: "MATHCOUNTS Colorado",
        location: "Grand Junction, CO",
        period: "Feb 2024",
        bullets: ["Scoring and logistics at a statewide math competition."],
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
            <p className="mt-3 text-lg text-muted-foreground">Resume and CV last updated September 2026.</p>
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
