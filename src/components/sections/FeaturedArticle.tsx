import { formatDate, getArticle } from "@/lib/articles";
import { Button, Container, SectionHead } from "@/components/ui/primitives";

/** The article the homepage leads with. Swap the slug to feature another. */
export const FEATURED = "a-goroutine-per-connection";

export function FeaturedArticle() {
  const article = getArticle(FEATURED);
  if (!article) return null;

  return (
    <section aria-labelledby="featured" className="pt-24 lg:pt-32">
      <Container>
        <SectionHead id="featured" title="Featured" accent="article." />

        <article className="mt-16 max-w-[46rem]">
          <p className="tabular text-sm font-medium text-muted">
            {formatDate(article.date)} · {article.readingMinutes} min read · {article.tags.join(", ")}
          </p>
          <h3 className="mt-4 font-display text-3xl font-extrabold leading-[1.05] sm:text-5xl">{article.title}</h3>

          {/* About ten lines of the opening, fading out into the buttons. */}
          <div
            className="prose mt-10 max-h-[17.8em] overflow-hidden [mask-image:linear-gradient(to_bottom,#000_60%,transparent)]"
            dangerouslySetInnerHTML={{ __html: article.excerptHtml }}
          />

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button href={`/writing/${article.slug}`}>Read more</Button>
            <Button href="/writing" variant="ghost">
              Articles
            </Button>
          </div>
        </article>
      </Container>
    </section>
  );
}
