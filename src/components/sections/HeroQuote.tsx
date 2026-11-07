import { connection } from "next/server";
import { randomQuote } from "@/content/quotes";

/** A different quote on every load. Render inside <Suspense>: it waits for the request. */
export async function HeroQuote() {
  await connection();
  const quote = randomQuote();

  return (
    <figure className="max-w-[54ch]">
      <blockquote className="font-serif text-xl italic leading-relaxed text-ink-2 sm:text-2xl">“{quote.text}”</blockquote>
      <figcaption className="mt-3 text-sm font-semibold uppercase tracking-wider text-muted">{quote.author}</figcaption>
    </figure>
  );
}
