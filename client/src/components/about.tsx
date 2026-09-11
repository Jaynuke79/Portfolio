import Reveal from "@/components/reveal";

export default function About() {
  return (
    <section id="about" className="scroll-mt-20 border-t border-border py-24">
      <Reveal className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">About</h2>
        <div className="mt-8 grid gap-10 md:grid-cols-12 md:items-start">
          <div className="max-w-[65ch] space-y-5 text-lg leading-relaxed text-muted-foreground md:col-span-7">
            <p>
              I'm a computer science student at Colorado Mesa University specializing in
              cybersecurity and applied AI. At EggNest.ai I moved from AI Services Intern to
              AI Engineer, where I build CRM connectors and agent pipelines, coordinate
              customer projects, and administer the Linux systems behind the portal.
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
            src="/about-portrait.webp"
            alt="Jayden Alonzo-Estrada seated on an escalator in a suit, black and white"
            width={1000}
            height={1250}
            loading="lazy"
            decoding="async"
            className="aspect-[4/5] w-full max-w-sm rounded-lg border border-border object-cover md:col-span-5 md:max-w-[420px] md:justify-self-end"
          />
        </div>
      </Reveal>
    </section>
  );
}
