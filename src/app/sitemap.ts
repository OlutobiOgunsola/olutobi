import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { caseStudies } from "@/content/work";
import { projects } from "@/content/projects";
import { getArticles } from "@/lib/articles";
import { labTabs, tabHref } from "@/content/lab";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: site.url, priority: 1 },
    ...caseStudies.map((c) => ({ url: `${site.url}/work/${c.slug}`, priority: 0.8 })),
    ...projects.map((p) => ({ url: `${site.url}/projects/${p.slug}`, priority: 0.7 })),
    ...labTabs.map((t) => ({ url: `${site.url}${tabHref(t)}`, priority: t.slug === "patterns" ? 0.8 : 0.7 })),
    { url: `${site.url}/writing`, priority: 0.8 },
    ...getArticles().map((a) => ({ url: `${site.url}/writing/${a.slug}`, lastModified: a.date, priority: 0.6 })),
  ];
}
