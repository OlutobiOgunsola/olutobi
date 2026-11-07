import { Suspense, type ReactNode } from "react";
import { labCount, labTabs, tabCount, tabHref } from "@/content/lab";
import { Kinetic } from "@/components/motion/Kinetic";
import { Container } from "@/components/ui/primitives";
import { LabTabs, TabList, type TabLink } from "@/components/lab/LabTabs";

const tabs: TabLink[] = labTabs.map((t) => ({ slug: t.slug, name: t.name, href: tabHref(t), count: tabCount(t) }));

export default function LabLayout({ children }: { children: ReactNode }) {
  return (
    <Container className="pb-10 pt-14 sm:pt-20">
      <header className="max-w-5xl">
        <h1 className="font-display text-[3.2rem] font-extrabold leading-[0.9] sm:text-7xl lg:text-[6rem]">
          <Kinetic text={`${labCount} ways to break a system.`} entrance />{" "}
          <Kinetic text="Go on, try." entrance delay={0.6} className="font-serif font-normal italic tracking-normal text-ochre" />
        </h1>
        <p className="mt-8 max-w-[60ch] text-lg leading-relaxed text-ink-2 sm:text-xl">
          Patterns, system design, databases, algorithms, security and the network. Each one as something you can play
          with. Most have a switch: leave it on and the system holds, flip it off and watch it break. Every card has a{" "}
          <strong className="font-semibold text-ink">Learn more</strong> for the longer story.
        </p>
      </header>
      <div className="sticky top-[4.75rem] z-40 mt-10">
        <Suspense fallback={<TabList tabs={tabs} active={null} />}>
          <LabTabs tabs={tabs} />
        </Suspense>
      </div>
      {children}
    </Container>
  );
}
