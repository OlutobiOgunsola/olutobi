import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { caseStudies, caseStudyBySlug } from "@/content/work";
import { Flow } from "@/components/Flow";
import { BackLink, Block, Decisions, NextUp, NumberedList, Prose } from "@/components/Detail";
import { Container, Metrics, Tag } from "@/components/ui/primitives";

export function generateStaticParams() {
  return caseStudies.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/work/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const c = caseStudyBySlug(slug);
  if (!c) return { title: "Not found" };
  return { title: c.title, description: c.summary };
}

/* Params are read inside Suspense so navigations render the shell instantly. Every slug is
   prerendered, so the fallback only ever flashes in development. */
export default function Page({ params }: PageProps<"/work/[slug]">) {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <CaseStudyPage params={params} />
    </Suspense>
  );
}

async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = caseStudyBySlug(slug);
  if (!c) notFound();

  const i = caseStudies.indexOf(c);
  const next = caseStudies[(i + 1) % caseStudies.length];

  return (
    <article className="pb-10 pt-10 sm:pt-14">
      <Container>
        <BackLink href="/#work" label="All work" />
        <header className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-9">
            <h1 className="font-display text-5xl font-extrabold leading-[0.95] sm:text-6xl lg:text-[5.5rem]">{c.title}</h1>
            <p className="mt-7 max-w-[60ch] text-xl leading-relaxed text-ink-2">{c.summary}</p>
          </div>
          <dl className="grid content-start gap-5 text-sm lg:col-span-3 lg:border-l lg:border-rule lg:pl-8">
            {[
              ["Domain", c.domain],
              ["Role", c.role],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs font-semibold text-muted">{k}</dt>
                <dd className="mt-1 text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </header>

        {c.metrics.length > 0 && <Metrics items={c.metrics} className="mt-16" />}
        <Flow flow={c.flow} className="mt-14" />

        <div className="mt-14">
          <Block label="Context">
            <Prose>{c.context}</Prose>
          </Block>
          <Block label="The problem">
            <Prose>{c.problem}</Prose>
          </Block>
          <Block label="What I built">
            <NumberedList items={c.approach} />
          </Block>
          <Block label="Decisions & trade-offs">
            <Decisions items={c.decisions} />
          </Block>
          <Block label="Outcome">
            <p className="max-w-[40ch] font-display font-extrabold text-3xl leading-snug sm:text-4xl">{c.outcome}</p>
          </Block>
          <Block label="Stack">
            <div className="flex flex-wrap gap-2">
              {c.stack.map((s) => (
                <Tag key={s}>{s}</Tag>
              ))}
            </div>
          </Block>
        </div>
      </Container>
      <NextUp href={`/work/${next.slug}`} label="Next case study" title={next.title} />
    </article>
  );
}
