import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatDate, getArticles } from "@/lib/articles";
import { writing as earlier } from "@/content/studio";
import { site } from "@/content/site";
import { ArrowLink, Container } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Writing",
  description: "Essays on payments, ledgers, concurrency, multi-tenancy and building with AI, from systems I've actually built.",
};

export default function WritingIndex() {
  const articles = getArticles();
  return (
    <Container className="pb-10 pt-14 sm:pt-20">
      <header className="border-b border-rule pb-12">
        <div className="max-w-4xl">
          <h1 className="font-display text-5xl font-extrabold leading-[0.95] sm:text-7xl lg:text-[5.75rem]">
            Notes from the <em className="font-serif font-normal italic text-ochre">engine room.</em>
          </h1>
          <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-ink-2">
            Practical essays on the problems I solve for a living (money, state, concurrency and AI), each one
            grounded in a system I&apos;ve built, and told the way I&apos;d explain it to you over suya.
          </p>
        </div>
      </header>

      <ol>
        {articles.map((a) => (
          <li key={a.slug}>
            <Link
              href={`/writing/${a.slug}`}
              className="group grid gap-4 border-b border-rule py-9 transition-colors hover:bg-paper-2/60 md:grid-cols-12 md:gap-8 md:px-4"
            >
              <div className="md:col-span-9">
                <h2 className="font-display font-extrabold text-3xl leading-tight sm:text-[2.1rem]">{a.title}</h2>
                <p className="mt-3 max-w-[64ch] text-ink-2">{a.summary}</p>
              </div>
              <div className="flex items-start justify-between gap-4 md:col-span-3 md:flex-col md:items-end">
                <p className="text-sm text-muted md:text-right">
                  {a.tags.join(" · ")}
                  <br />
                  {a.readingMinutes} min read
                </p>
                <ArrowUpRight
                  aria-hidden
                  className="size-5 text-muted transition-all group-hover:translate-x-0.5 group-hover:text-ink"
                />
              </div>
            </Link>
          </li>
        ))}
      </ol>

      <section className="mt-20 grid gap-8 md:grid-cols-12">
        <h2 className="font-display text-2xl font-extrabold md:col-span-3">Earlier, on Medium</h2>
        <div className="md:col-span-9">
          <ul className="divide-y divide-rule border-y border-rule">
            {earlier.map((w) => (
              <li key={w.title} className="flex items-baseline justify-between gap-4 py-4">
                <span>{w.title}</span>
                <span className="tabular shrink-0 text-sm text-muted">
                  {w.venue} · {w.date}
                </span>
              </li>
            ))}
          </ul>
          {site.contact.medium && (
            <ArrowLink href={site.contact.medium} external className="mt-6 text-sm">
              Read them on Medium
            </ArrowLink>
          )}
          <p className="tabular mt-10 text-sm text-muted">
            Latest post: {articles[0] ? formatDate(articles[0].date) : "-"}
          </p>
        </div>
      </section>
    </Container>
  );
}
