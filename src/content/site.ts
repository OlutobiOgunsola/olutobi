/**
 * Site-wide identity and contact details.
 *
 * Every link here is one the owner has published themselves (CV, git remotes).
 * Leave a field empty to hide it. Nothing renders a link that isn't set.
 */
export const site = {
  name: "Olutobi Ogunsola",
  shortName: "Olutobi",
  role: "Senior Software Engineer",
  location: "Lagos, Nigeria",
  availability: "Open to senior & staff roles · Remote",
  /* Set NEXT_PUBLIC_SITE_URL in production so share cards and the sitemap use the real domain. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  headline: "I build software that has to be right.",
  intro:
    "I'm a senior software engineer in Lagos. I build the systems underneath products, the parts that move money and keep the records, and I like explaining how they work: with live demos you can break, and stories from the streets I grew up on.",
  description:
    "Olutobi Ogunsola is a senior software engineer in Lagos who designs and builds reliable backend systems, multi-tenant SaaS and AI tooling, and explains how they work with Lagos stories.",
  contact: {
    email: "olutobiogunsola@outlook.com",
    github: "https://github.com/OlutobiOgunsola",
    linkedin: "https://linkedin.com/in/olutobiogunsola",
    medium: "https://medium.com/@olutobiogunsola",
    /* Drop a PDF in /public and set e.g. "/olutobi-ogunsola-cv.pdf" to show the button. */
    cv: "",
  },
} as const;

export const nav = [
  { label: "Lab", href: "/lab" },
  { label: "Writing", href: "/writing" },
  { label: "Projects", href: "/#building" },
  { label: "About", href: "/#about" },
] as const;
