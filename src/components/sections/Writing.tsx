import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getArticles } from "@/lib/articles";
import { Adire } from "@/components/art/Adire";
import { ArrowLink, Container } from "@/components/ui/primitives";
import { FEATURED } from "./FeaturedArticle";

/** More articles, carrying on straight from the featured one above it. */
export function Writing() {
  const articles = getArticles().filter((a) => a.slug !== FEATURED);
  if (!articles.length) return null;
  const [lead, ...rest] = articles;

  return (
    <section aria-label="More articles" className="pb-24 pt-16 lg:pb-32 lg:pt-20">
      <Container>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <Link
            href={`/writing/${lead.slug}`}
            className="group relative flex min-h-[24rem] flex-col overflow-hidden rounded-2xl bg-ochre p-8 text-on-accent transition-transform duration-300 [transition-timing-function:cubic-bezier(.16,1,.3,1)] lg:col-span-5"
          >
            <span aria-hidden className="absolute -bottom-10 -right-10 block size-48 rotate-12 overflow-hidden rounded-2xl opacity-90 transition-transform duration-700">
              <Adire seed={lead.slug} cols={2} rows={2} className="size-full" />
            </span>
            <p className="relative text-sm font-bold">Start here · {lead.readingMinutes} min read</p>
            <h3 className="relative mt-6 max-w-[14ch] font-display text-4xl font-extrabold leading-[0.95] sm:text-5xl">{lead.title}</h3>
            <p className="relative mt-5 max-w-[40ch] font-medium leading-relaxed text-on-accent/80">{lead.summary}</p>
            <span className="relative mt-auto inline-flex items-center gap-2 pt-10 font-display text-lg font-extrabold">
              Read it <ArrowRight aria-hidden className="size-5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>

          <ul className="border-b border-rule lg:col-span-7">
            {rest.slice(0, 6).map((a) => (
              <li key={a.slug}>
                <Link href={`/writing/${a.slug}`} className="group flex items-baseline justify-between gap-6 border-t border-rule py-5">
                  <span className="font-display text-xl font-bold leading-snug transition-colors duration-200 group-hover:text-ochre sm:text-2xl">
                    {a.title}
                  </span>
                  <span className="tabular shrink-0 text-sm text-muted">{a.readingMinutes} min</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <ArrowLink href="/writing" className="mt-10 text-lg">
          All {articles.length + 1} articles
        </ArrowLink>
      </Container>
    </section>
  );
}
