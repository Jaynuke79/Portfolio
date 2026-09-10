import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";

export default function Hero() {
  return (
    <section
      id="home"
      className="mx-auto grid min-h-[100dvh] max-w-6xl items-center gap-10 px-4 pt-24 pb-16 sm:px-6 md:grid-cols-12 md:gap-8 lg:px-8"
    >
      <div className="hero-enter md:col-span-7">
        <h1 className="tracking-tight">
          <span className="block text-base font-medium text-muted-foreground">
            Jayden Alonzo-Estrada
          </span>
          <span className="mt-4 block text-4xl font-semibold leading-[1.05] text-foreground sm:text-5xl lg:text-6xl">
            AI, security, and the software in between.
          </span>
        </h1>
        <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-muted-foreground">
          AI Engineer at EggNest.ai, computer science student at Colorado Mesa University,
          and lead author of published IoMT threat-detection research.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="h-12 px-6 text-base active:scale-[0.98]">
            <a href="#projects">
              View projects
              <ArrowDown className="h-4 w-4" />
            </a>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base active:scale-[0.98]">
            <a href="#contact">Contact me</a>
          </Button>
        </div>
      </div>

      <div className="hero-enter hero-enter-delay md:col-span-5 md:justify-self-end">
        <img
          src="/headshot.jpg"
          alt="Jayden Alonzo-Estrada"
          width={480}
          height={600}
          fetchPriority="high"
          decoding="async"
          className="aspect-[4/5] w-full max-w-sm rounded-lg border border-border object-cover md:max-w-[420px]"
        />
      </div>
    </section>
  );
}
