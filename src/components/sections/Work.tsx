import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { caseStudies } from "@/content/work";
import { Adire } from "@/components/art/Adire";
import { Container, SectionHead } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

const ROW_TONES = ["group-hover:text-pink", "group-hover:text-ochre", "group-hover:text-indigo", "group-hover:text-live"];

/** Four case studies, told by domain, each given the same weight. */
export function Work() {
  return (
    <section aria-label="Selected work" className="py-24 lg:py-32">
      <Container>
        <SectionHead id="work" title="Systems where a mistake costs" accent="someone money." />
        <p className="mt-6 max-w-[56ch] text-lg leading-relaxed text-ink-2 sm:text-xl">
          Healthcare, finance, insurance and payments. What was broken, what I built, and what changed.
        </p>

        <ol className="mt-16 border-b border-rule">
          {caseStudies.map((c, i) => (
            <li key={c.slug}>
              <Link
                href={`/work/${c.slug}`}
                className="group grid grid-cols-1 gap-6 border-t border-rule py-10 transition-colors duration-300 hover:bg-paper-2/70 md:grid-cols-12 md:gap-8 md:px-6 lg:py-14"
              >
                <div className="flex items-start gap-5 md:col-span-7">
                  <span className="mt-1 block size-12 shrink-0 overflow-hidden rounded-xl transition-transform duration-500 [transition-timing-function:cubic-bezier(.16,1,.3,1)] sm:size-14">
                    <Adire seed={c.slug} cols={1} rows={1} className="size-full" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-muted">{c.domain}</p>
                    <h3 className={cn("mt-3 font-display text-3xl font-extrabold leading-[1] transition-colors duration-300 sm:text-[2.75rem]", ROW_TONES[i % ROW_TONES.length])}>
                      {c.title}
                    </h3>
                  </div>
                </div>
                <div className="flex items-start justify-between gap-6 md:col-span-5">
                  <p className="max-w-[46ch] leading-relaxed text-ink-2">
                    {c.metrics[0] && (
                      <>
                        <strong className="font-semibold text-ink">
                          {c.metrics[0].value} {c.metrics[0].label}.
                        </strong>{" "}
                      </>
                    )}
                    {c.summary}
                  </p>
                  <ArrowUpRight
                    aria-hidden
                    className="mt-1 size-7 shrink-0 text-muted transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-ink"
                  />
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
