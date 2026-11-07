import { education } from "@/content/experience";
import { Reveal } from "@/components/motion/Reveal";
import { Container, SectionHead } from "@/components/ui/primitives";
import { PolaroidPhoto } from "./PolaroidPhoto";

/** Who's behind the work, in plain words. */
export function About() {
  return (
    <section aria-label="About me" className="py-20 lg:py-28">
      <Container>
        <SectionHead id="about" title="About" accent="me" />

        <div className="mt-16 grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-12">
          <aside className="lg:col-span-4">
            <div className="space-y-10 lg:sticky lg:top-28">
              <PolaroidPhoto />
              <Reveal className="surface-dark rounded-2xl bg-indigo-deep p-7">
                <p className="font-display text-2xl font-extrabold leading-tight">{education.degree}</p>
                <p className="mt-1 text-sm text-ink/80">{education.school}</p>
              </Reveal>
            </div>
          </aside>

          <div className="lg:col-span-8">
            <Reveal className="max-w-[62ch] space-y-6 text-lg leading-relaxed text-ink-2 sm:text-xl">
              <p>
                <span className="font-display text-2xl font-extrabold text-ink sm:text-3xl">I&apos;m Olutobi,</span> a
                software engineer based in Lagos. I studied Mechanical Engineering at the University of Ibadan.
              </p>
              <p>
                Most of my work is on the backend: payment systems, ledgers, multi-tenant platforms, queues and
                integrations. Outside work, I consult for businesses and build enterprise software.
              </p>
              <p>
                I&apos;m also a composer, and I make faith-based music. I do my own sound design, sound
                engineering and video editing. I&apos;m a girl dad, I love basketball, and I&apos;m always learning something.
              </p>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
