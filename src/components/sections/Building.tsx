import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { projects, type Project } from "@/content/projects";
import { Adire } from "@/components/art/Adire";
import { Reveal } from "@/components/motion/Reveal";
import { Container, SectionHead, StatusPill } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

const HOVER = ["group-hover:text-ochre", "group-hover:text-pink", "group-hover:text-indigo", "group-hover:text-live"];

function ProjectCard({ p, i, wide }: { p: Project; i: number; wide?: boolean }) {
  return (
    <Reveal delay={(i % 2) * 90} className={cn("h-full", wide && "md:col-span-2")}>
      <Link
        href={`/projects/${p.slug}`}
        className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-paper-2 p-7 ring-1 ring-rule transition-all duration-300 [transition-timing-function:cubic-bezier(.16,1,.3,1)] hover:ring-ink-2/40 sm:p-8"
      >
        <span
          aria-hidden
          className="absolute -right-8 -top-8 block size-28 rotate-12 overflow-hidden rounded-2xl opacity-60 transition-transform duration-700 [transition-timing-function:cubic-bezier(.16,1,.3,1)]"
        >
          <Adire seed={p.slug} cols={1} rows={1} className="size-full" />
        </span>
        <StatusPill status={p.status} />
        <h3 className={cn("relative mt-6 font-display text-4xl font-extrabold leading-[0.95] transition-colors duration-300 sm:text-5xl", HOVER[i % HOVER.length])}>
          {p.name}
        </h3>
        <p className="mt-2 text-sm font-semibold text-muted">{p.kind}</p>
        <p className={cn("mt-5 max-w-[46ch] text-lg leading-relaxed text-ink-2", wide && "sm:text-xl")}>{p.oneLiner}</p>
        <span className="mt-auto inline-flex items-center gap-1.5 pt-8 font-semibold text-ink">
          How it&apos;s built
          <ArrowUpRight aria-hidden className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        </span>
      </Link>
    </Reveal>
  );
}

export function Building() {
  const zigna = projects.filter((p) => p.family === "Zigna");
  const independent = projects.filter((p) => !p.family);

  return (
    <section aria-label="Some projects I am working on" className="py-20 lg:py-28">
      <Container>
        <SectionHead id="building" title="Some projects" accent="I am working on" />

        <div className="mt-14 grid grid-cols-1 gap-x-12 gap-y-4 lg:grid-cols-12">
          <h3 className="font-display text-3xl font-extrabold lg:col-span-4">Zigna</h3>
          <p className="max-w-[60ch] text-lg leading-relaxed text-ink-2 lg:col-span-8">
            A software company I&apos;m building one vertical at a time: gyms, hotels, and an AI operator that works
            across both. One API contract, one tenant model, one permission model everywhere.
          </p>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
          {zigna.map((p, i) => (
            <ProjectCard key={p.slug} p={p} i={i} wide={i === 0} />
          ))}
        </div>

        <div className="mt-20 grid grid-cols-1 gap-x-12 gap-y-4 lg:grid-cols-12">
          <h3 className="font-display text-3xl font-extrabold lg:col-span-4">Independent</h3>
          <p className="max-w-[60ch] text-lg leading-relaxed text-ink-2 lg:col-span-8">
            A trust layer for Nigerian commerce, a strategy game with a server you can&apos;t cheat, an estate platform
            with a WhatsApp front door, and a Go lab where I take the abstractions apart.
          </p>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
          {independent.map((p, i) => (
            <ProjectCard key={p.slug} p={p} i={i + zigna.length} />
          ))}
        </div>
      </Container>
    </section>
  );
}
