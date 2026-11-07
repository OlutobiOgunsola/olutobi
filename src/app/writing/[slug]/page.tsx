import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatDate, getArticle, getArticles } from "@/lib/articles";
import { site } from "@/content/site";
import { BackLink, NextUp } from "@/components/Detail";
import { Container, Tag } from "@/components/ui/primitives";
import { CopyEmail } from "@/components/ui/CopyEmail";

export function generateStaticParams() {
  return getArticles().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps<"/writing/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const a = getArticle(slug);
  if (!a) return { title: "Not found" };
  return {
    title: a.title,
    description: a.summary,
    openGraph: { type: "article", title: a.title, description: a.summary, publishedTime: a.date },
  };
}

/* Params are read inside Suspense so navigations render the shell instantly. Every slug is
   prerendered, so the fallback only ever flashes in development. */
export default function Page({ params }: PageProps<"/writing/[slug]">) {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <ArticlePage params={params} />
    </Suspense>
  );
}

async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = getArticle(slug);
  if (!a) notFound();

  const all = getArticles();
  const next = all[(all.indexOf(a) + 1) % all.length];

  return (
    <article className="pb-10 pt-10 sm:pt-14">
      <Container>
        <BackLink href="/writing" label="All writing" />
        <header className="mx-auto mt-12 max-w-[46rem]">
          <h1 className="font-display text-5xl font-extrabold leading-[0.98] sm:text-6xl">{a.title}</h1>
          <p className="mt-6 text-xl leading-relaxed text-ink-2">{a.summary}</p>
          <p className="tabular mt-6 text-sm font-medium text-muted">
            {site.name} · {formatDate(a.date)} · {a.readingMinutes} min read
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {a.tags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        </header>

        <div className="prose mx-auto mt-14 max-w-[46rem]" dangerouslySetInnerHTML={{ __html: a.html }} />

        <aside className="mx-auto mt-16 max-w-[46rem] rounded-2xl border border-rule bg-paper-2 p-7 sm:p-9">
          <p className="font-display font-extrabold text-2xl leading-snug">
            Building something where this kind of thing matters? I&apos;d like to hear about it.
          </p>
          <p className="mt-2 text-sm text-muted">
{site.name}, {site.role}
          </p>
          <CopyEmail email={site.contact.email} className="mt-6" />
        </aside>
      </Container>
      <NextUp href={`/writing/${next.slug}`} label="Read next" title={next.title} />
    </article>
  );
}
