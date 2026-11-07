import type { LabEntry } from "@/content/lab/types";
import { Kinetic } from "@/components/motion/Kinetic";
import { ArrowLink } from "@/components/ui/primitives";
import { LabDemo } from "./LabDemo";
import { LearnMore } from "./LearnMore";

export function LabCard({ entry }: { entry: LabEntry }) {
  return (
    <article id={entry.id} className="grid scroll-mt-40 grid-cols-1 items-start gap-8 border-t border-rule py-14 lg:grid-cols-12 lg:gap-12">
      <div className="min-w-0 lg:col-span-5">
        <h3 className="font-display text-4xl font-extrabold leading-[0.95] sm:text-5xl">
          <Kinetic text={entry.name} />
        </h3>
        <p className="mt-5 font-serif text-2xl italic leading-snug text-pink">{entry.story}</p>
        <p className="mt-5 text-lg leading-relaxed text-ink-2">
          <strong className="font-semibold text-ink">The rule:</strong> {entry.rule}
        </p>
        {entry.essay && (
          <ArrowLink href={entry.essay.href} external={entry.essay.external} className="mt-6">
            {entry.essay.label}
          </ArrowLink>
        )}
      </div>
      <div className="min-w-0 space-y-3 lg:col-span-7">
        <LabDemo spec={entry.demo} />
        <LearnMore learn={entry.learn} name={entry.name} />
      </div>
    </article>
  );
}
