import "server-only";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { marked } from "marked";

/**
 * Articles are Markdown files in src/content/articles with a small frontmatter
 * block. Add `draft: true` to hide one without deleting it.
 */
export type Article = {
  slug: string;
  title: string;
  summary: string;
  date: string;
  tags: string[];
  order: number;
  readingMinutes: number;
  html: string;
  /** The opening few blocks, for teasers. */
  excerptHtml: string;
};

const DIR = join(process.cwd(), "src/content/articles");

function parse(slug: string, raw: string): Article & { draft: boolean } {
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw);
  if (!match) throw new Error(`Article ${slug} is missing frontmatter`);
  const [, front, body] = match;

  const meta: Record<string, string> = {};
  for (const line of front.split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }

  const words = body.split(/\s+/).filter(Boolean).length;
  const tokens = marked.lexer(body, { gfm: true });
  const opening = Object.assign(tokens.slice(0, 8), { links: tokens.links });
  return {
    slug,
    title: meta.title,
    summary: meta.summary,
    date: meta.date,
    order: Number(meta.order ?? 99),
    tags: (meta.tags ?? "").split(",").map((t) => t.trim()).filter(Boolean),
    readingMinutes: Math.max(1, Math.round(words / 230)),
    html: marked.parse(body, { async: false, gfm: true }),
    excerptHtml: marked.parser(opening, { gfm: true }),
    draft: meta.draft === "true",
  };
}

let cache: Article[] | null = null;

export function getArticles(): Article[] {
  // Re-read in development so edits to the Markdown show up without a restart.
  if (cache && process.env.NODE_ENV === "production") return cache;
  cache = readdirSync(DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => parse(f.replace(/\.md$/, ""), readFileSync(join(DIR, f), "utf8")))
    .filter((a) => !a.draft)
    .sort((a, b) => b.date.localeCompare(a.date) || a.order - b.order);
  return cache;
}

export function getArticle(slug: string) {
  return getArticles().find((a) => a.slug === slug);
}

export function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
