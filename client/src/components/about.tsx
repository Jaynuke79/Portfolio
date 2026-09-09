import Reveal from "@/components/reveal";

export default function About() {
  return (
    <section id="about" className="scroll-mt-20 border-t border-border py-24">
      <Reveal className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">About</h2>
        <div className="mt-8 max-w-[65ch] space-y-5 text-lg leading-relaxed text-muted-foreground">
          <p>
            I'm a computer science student at Colorado Mesa University specializing in
            cybersecurity and applied AI, currently building deep CRM integrations and AI
            agent pipelines as an AI Services Intern at EggNest.ai.
          </p>
          <p>
            I lead a 6-person research team whose work on detecting malicious IoMT network
            traffic was published by Springer and presented at MobiSec 2025 in Sapporo,
            Japan. Outside the lab I preside over CMU's student House of Representatives
            and run the CS and Cybersecurity clubs.
          </p>
          <p>
            Whether it's analyzing network packets or orchestrating AI agent pipelines, I
            operate with precision, purpose, and an eye on the future.
          </p>
        </div>
        <img
          src="/hero-workspace.jpg"
          alt="Modern cybersecurity workspace with multiple monitors"
          width={1600}
          height={686}
          loading="lazy"
          decoding="async"
          className="mt-14 aspect-[21/9] w-full rounded-lg border border-border object-cover"
        />
      </Reveal>
    </section>
  );
}
