import { readdirSync } from "node:fs";
import { join } from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { caseStudies } from "@/content/work";
import { projects } from "@/content/projects";
import { labTabs } from "@/content/lab";

/*
 * With Cache Components, an unknown slug streams the not-found UI after a 200
 * has already been sent. Rewriting unknown slugs to a path that doesn't exist
 * gives crawlers a real 404 while still rendering the site's own not-found page.
 */
const known = {
  work: new Set(caseStudies.map((c) => c.slug)),
  projects: new Set(projects.map((p) => p.slug)),
  writing: articleSlugs(),
  lab: new Set(labTabs.filter((t) => t.slug !== "patterns").map((t) => t.slug)),
};

function articleSlugs(): Set<string> | null {
  try {
    const dir = join(process.cwd(), "src/content/articles");
    return new Set(readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => f.slice(0, -3)));
  } catch {
    return null; // files not available at runtime, let the page render its own not-found
  }
}

export function proxy(request: NextRequest) {
  // The patterns tab is the lab's landing page.
  if (request.nextUrl.pathname.replace(/\/$/, "") === "/lab/patterns") {
    return NextResponse.redirect(new URL("/lab", request.url), 308);
  }
  const match = request.nextUrl.pathname.match(/^\/(work|projects|writing|lab)\/([^/]+)\/?$/);
  const slugs = match ? known[match[1] as keyof typeof known] : null;
  if (match && slugs && !slugs.has(match[2])) {
    return NextResponse.rewrite(new URL("/404", request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/work/:path*", "/projects/:path*", "/writing/:path*", "/lab/:path*"] };
