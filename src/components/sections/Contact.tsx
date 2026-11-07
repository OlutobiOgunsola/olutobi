import { site } from "@/content/site";
import { AdireField } from "@/components/art/AdireField";
import { Kinetic } from "@/components/motion/Kinetic";
import { ArrowLink, Button, Container } from "@/components/ui/primitives";
import { CopyEmail } from "@/components/ui/CopyEmail";

export function Contact() {
  const links = [
    { label: "GitHub", href: site.contact.github },
    { label: "LinkedIn", href: site.contact.linkedin },
    { label: "Medium", href: site.contact.medium },
  ].filter((l) => l.href);

  return (
    <section id="contact" aria-labelledby="contact-title" className="pt-16 lg:pt-24">
      <Container>
        <div className="surface-dark relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-deep via-[#3a1f6e] to-vermilion/80 p-7 sm:p-12 lg:p-20">
          <AdireField tile={96} seed="contact" className="absolute inset-0 size-full opacity-80 [mask-image:linear-gradient(to_left,#000,transparent_75%)]" />
          <h2 id="contact-title" className="relative max-w-[14ch] font-display text-[3.2rem] font-extrabold leading-[0.9] sm:text-7xl lg:text-[6rem]">
            <Kinetic text="Let’s work" />{" "}
            <Kinetic text="together" className="font-serif font-normal italic tracking-normal text-ochre" />
          </h2>
          <p className="relative mt-8 max-w-[52ch] text-lg text-ink/90 sm:text-xl">
            I&apos;m open to senior and staff engineering roles, remote. I also consult for businesses that need software
            built. If either sounds like you, send me an email.
          </p>
          <div className="relative mt-10 flex flex-wrap items-center gap-4">
            <CopyEmail email={site.contact.email} />
            {site.contact.cv && (
              <Button href={site.contact.cv} variant="ghost" external>
                Download CV
              </Button>
            )}
          </div>
          <ul className="relative mt-10 flex flex-wrap gap-x-8 gap-y-3 text-lg">
            {links.map((l) => (
              <li key={l.label}>
                <ArrowLink href={l.href} external>
                  {l.label}
                </ArrowLink>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
