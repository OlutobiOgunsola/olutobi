import type { LabTab } from "@/content/lab/types";
import { SectionHead } from "@/components/ui/primitives";
import { LabCard } from "./LabCard";

const groupId = (tab: LabTab, title: string) => `${tab.slug}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;

/** One lab tab: its headline, a jump list of its groups, then every card. */
export function TabContent({ tab }: { tab: LabTab }) {
  return (
    <div className="pt-16 sm:pt-20">
      <SectionHead title={tab.title} accent={tab.accent} />
      <p className="mt-6 max-w-[60ch] text-lg leading-relaxed text-ink-2">{tab.intro}</p>
      <nav aria-label={`${tab.name} sections`} className="mt-7 flex flex-wrap gap-2">
        {tab.groups.map((g) => (
          <a
            key={g.title}
            href={`#${groupId(tab, g.title)}`}
            className="rounded-full bg-paper-2 px-4 py-2 text-sm font-semibold text-ink-2 ring-1 ring-rule transition-all hover:text-ochre"
          >
            {g.title} <span className="tabular text-muted">{g.entries.length}</span>
          </a>
        ))}
      </nav>
      {tab.groups.map((g) => (
        <section key={g.title} aria-labelledby={groupId(tab, g.title)} className="mt-20">
          <h2 id={groupId(tab, g.title)} className="scroll-mt-40 font-serif text-4xl italic text-ochre sm:text-5xl">
            {g.title}
          </h2>
          <div className="mt-4">
            {g.entries.map((e) => (
              <LabCard key={e.id} entry={e} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
