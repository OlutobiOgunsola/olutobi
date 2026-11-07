import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { projectBySlug, projects, type Screenshot } from "@/content/projects";
import { getArticle } from "@/lib/articles";
import Image from "next/image";
import Link from "next/link";
import { Adire } from "@/components/art/Adire";
import { Flow } from "@/components/Flow";
import { BackLink, Block, Decisions, NextUp, NumberedList, Prose } from "@/components/Detail";
import { ArrowLink, Container, Metrics, StatusPill } from "@/components/ui/primitives";
import { projectDemos } from "@/components/demos/projectDemos";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = projectBySlug(slug);
  if (!p) return { title: "Not found" };
  return { title: p.name, description: p.oneLiner };
}

/* Params are read inside Suspense so navigations render the shell instantly. Every slug is
   prerendered, so the fallback only ever flashes in development. */
export default function Page({ params }: PageProps<"/projects/[slug]">) {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <ProjectPage params={params} />
    </Suspense>
  );
}

async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = projectBySlug(slug);
  if (!p) notFound();

  const i = projects.indexOf(p);
  const next = projects[(i + 1) % projects.length];

  return (
    <article className="pb-10 pt-10 sm:pt-14">
      <Container>
        <BackLink href="/#building" label="All projects" />

        <header className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <h1 className="font-display text-6xl font-extrabold leading-[0.9] sm:text-7xl lg:text-[6rem]">{p.name}</h1>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <StatusPill status={p.status} />
              <span className="text-sm font-medium text-muted">
                {p.family ? `${p.family} · ` : ""}
                {p.kind}
              </span>
            </div>
            <p className="mt-8 max-w-[52ch] font-display font-extrabold text-3xl leading-snug text-ink">{p.oneLiner}</p>
            <p className="mt-6 max-w-[62ch] text-lg leading-relaxed text-ink-2">{p.pitch}</p>
            {p.repo && (
              <ArrowLink href={p.repo} external className="mt-8">
                Source on GitHub
              </ArrowLink>
            )}
          </div>
          <div className="lg:col-span-4">
            <div className="mx-auto max-w-xs overflow-hidden rounded-2xl lg:ml-auto lg:mr-0">
              <Adire seed={p.slug} cols={3} rows={4} className="block h-auto w-full" />
            </div>
            <dl className="mx-auto mt-6 max-w-xs text-sm lg:ml-auto lg:mr-0">
              <dt className="font-display text-lg font-extrabold">Surfaces</dt>
              {p.surfaces.map((s) => (
                <dd key={s} className="border-b border-rule py-2 text-ink-2">
                  {s}
                </dd>
              ))}
            </dl>
          </div>
        </header>

        {p.screenshots && <Screenshots shots={p.screenshots} />}
        {p.scale.length > 0 && <Metrics items={p.scale} className="mt-16" />}
        <Flow flow={p.flow} className="mt-14" />
        {projectDemos[p.slug] && <ProjectDemo slug={p.slug} />}

        <div className="mt-14">
          <Block label="Why it exists">
            <Prose>{p.problem}</Prose>
          </Block>
          <Block label="What's built">
            <NumberedList items={p.built} />
          </Block>
          <Block label="Engineering decisions">
            <Decisions items={p.decisions} />
          </Block>
          {p.next && (
            <Block label="What's next">
              <NumberedList items={p.next} />
            </Block>
          )}
          {p.essays && p.essays.length > 0 && (
            <Block label="Related articles">
              <ul className="divide-y divide-rule border-y border-rule">
                {p.essays.map((slug) => getArticle(slug)).filter((a) => a !== undefined).map((a) => (
                  <li key={a.slug}>
                    <Link href={`/writing/${a.slug}`} className="group flex items-baseline justify-between gap-6 py-4">
                      <span className="font-display font-extrabold text-xl leading-snug group-hover:text-indigo">{a.title}</span>
                      <span className="tabular shrink-0 text-sm text-muted">{a.readingMinutes} min</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Block>
          )}
          <Block label="Stack">
            <dl className="grid gap-6 sm:grid-cols-3">
              {p.stack.map((g) => (
                <div key={g.label}>
                  <dt className="text-sm font-medium">{g.label}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-muted">{g.items.join(" · ")}</dd>
                </div>
              ))}
            </dl>
          </Block>
        </div>
      </Container>
      <NextUp
        href={`/projects/${next.slug}`}
        label="Next project"
        title={next.name}
      />
    </article>
  );
}

function ProjectDemo({ slug }: { slug: string }) {
  const Demo = projectDemos[slug];
  return (
    <section aria-label="Interactive demo" className="mt-14 grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <h2 className="font-display text-3xl font-extrabold leading-tight sm:text-4xl">Interactive demo</h2>
        <p className="mt-4 max-w-[40ch] text-ink-2">
          A small working version of the main idea behind this project. Try it, then turn the safeguard off to see
          what goes wrong without it.
        </p>
      </div>
      <div className="min-w-0 lg:col-span-8">
        <Demo />
      </div>
    </section>
  );
}

/** Real screenshots: desktop views full width, phone views side by side. */
function Screenshots({ shots }: { shots: Screenshot[] }) {
  const desktop = shots.filter((s) => s.device === "desktop");
  const phone = shots.filter((s) => s.device === "phone");
  return (
    <section aria-label="Screenshots" className="mt-16 space-y-6">
      {desktop.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {desktop.map((s) => (
            <Image
              key={s.src}
              src={s.src}
              alt={s.alt}
              width={s.width}
              height={s.height}
              sizes="(min-width: 1024px) 40rem, 100vw"
              className="h-auto w-full rounded-xl ring-1 ring-rule"
            />
          ))}
        </div>
      )}
      {phone.length > 0 && (
        <div className="flex flex-wrap items-start gap-6">
          {phone.map((s) => (
            <Image
              key={s.src}
              src={s.src}
              alt={s.alt}
              width={s.width}
              height={s.height}
              sizes="16rem"
              className="h-auto w-full max-w-64 rounded-2xl ring-1 ring-rule"
            />
          ))}
        </div>
      )}
    </section>
  );
}
