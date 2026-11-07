import { site } from "@/content/site";
import { Adire } from "@/components/art/Adire";
import { Container } from "@/components/ui/primitives";

export function Footer() {
  const links = [
    { label: "GitHub", href: site.contact.github },
    { label: "LinkedIn", href: site.contact.linkedin },
    { label: "Medium", href: site.contact.medium },
    { label: "Email", href: `mailto:${site.contact.email}` },
  ].filter((l) => l.href);

  return (
    <footer className="relative mt-28 overflow-hidden">
      <div className="flex w-max animate-marquee [--speed:60s]" aria-hidden>
        {[0, 1].map((k) => (
          <Adire key={k} seed="footer · cloth" cols={30} rows={1} className="block h-16 w-[120rem] sm:h-20 sm:w-[150rem]" />
        ))}
      </div>
      <Container className="flex flex-col gap-6 py-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-3xl font-extrabold">
            {site.name}
            <span className="text-ochre">.</span>
          </p>
          <p className="mt-1 text-sm text-muted">
            {site.role} · {site.location}
          </p>
        </div>
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {links.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                className="inline-block font-semibold text-ink-2 transition-transform hover:text-ochre"
                {...(l.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </Container>
      <Container className="pb-10">
        <p className="text-sm text-muted">
          Every pattern on this site is adire woven in code from a word. Move your mouse over the hero, the cloth notices.
        </p>
      </Container>
    </footer>
  );
}
