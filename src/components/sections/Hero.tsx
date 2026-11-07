import { site } from "@/content/site";
import { labCount, labTabs, tabCount, tabHref } from "@/content/lab";
import Link from "next/link";
import { Suspense } from "react";
import { AdireField } from "@/components/art/AdireField";
import { Kinetic } from "@/components/motion/Kinetic";
import { Reveal } from "@/components/motion/Reveal";
import { ArrowLink, Button, Container } from "@/components/ui/primitives";
import { IdempotencyDemo } from "@/components/demos/IdempotencyDemo";
import { HeroPortrait } from "./HeroPortrait";
import { HeroQuote } from "./HeroQuote";

export function Hero() {
  return (
    <>
      <section aria-labelledby="hero-title" className="relative -mt-20 overflow-hidden pb-16 pt-32 lg:min-h-[100svh] lg:pb-20 lg:pt-36">
        <AdireField className="absolute inset-0 size-full [mask-image:radial-gradient(ellipse_80%_70%_at_50%_40%,#000_30%,transparent_80%)]" />

        <Container className="relative">
          <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-12 lg:gap-6">
            <div className="lg:col-span-7">
              <h1 id="hero-title" className="font-display text-[3.5rem] font-extrabold leading-[0.88] [text-wrap:initial] sm:text-[5rem] lg:text-[5.4rem] xl:text-[6rem]">
                <Kinetic text="Hi, I’m Olutobi." entrance />
                <br />
                <Kinetic text="Welcome to my" entrance delay={0.4} className="text-ink-2" />{" "}
                <Kinetic text="playground" entrance delay={0.8} className="font-serif font-normal italic tracking-normal text-ochre" />
              </h1>
              <p className="mt-8 font-display text-3xl font-bold sm:text-4xl">
                <span className="relative inline-block">
                  Discover and Explore
                  <svg viewBox="0 0 300 30" preserveAspectRatio="none" className="absolute -bottom-3 left-0 h-4 w-full text-pink sm:h-5" aria-hidden>
                    <path
                      d="M4 18 C 50 4, 90 28, 140 14 S 230 6, 296 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="6"
                      strokeLinecap="round"
                      pathLength={1}
                      strokeDasharray="1"
                      className="[animation:draw_0.8s_1.4s_cubic-bezier(.16,1,.3,1)_both]"
                    />
                  </svg>
                </span>
              </p>
              <div className="mt-10 min-h-24">
                <Suspense>
                  <HeroQuote />
                </Suspense>
              </div>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Button href="/lab">Laboratory</Button>
                <Button href="/writing" variant="ghost">
                  Library
                </Button>
              </div>
              <p className="mt-8 inline-flex items-center gap-2.5 text-sm font-medium text-live">
                <span className="pulse-dot size-2 rounded-full bg-live" />
                {site.availability} · {site.location}
              </p>
            </div>
            <div className="lg:col-span-5">
              <HeroPortrait />
            </div>
          </div>
        </Container>
      </section>

      {/* The lab, front and centre: learn it by breaking it */}
      <section aria-labelledby="lab-title" className="relative py-12 lg:py-20">
        <Container className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 id="lab-title" className="font-display text-5xl font-extrabold leading-[0.92] sm:text-6xl">
              <span className="block font-serif text-4xl font-normal italic tracking-normal text-pink sm:text-5xl">The lab, </span>
              <Kinetic text="learn it by breaking it." />
            </h2>
            <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-ink-2">
              {labCount} engineering ideas you can play with, from idempotency to consistent hashing to A*. Most come with a
              switch: leave it on and the system holds, flip it off and watch it fail. Try this one: tap pay, retry like a
              flaky network, then switch off the unique index.
            </p>
            <ul className="mt-7 flex flex-wrap gap-2">
              {labTabs.map((t) => (
                <li key={t.slug}>
                  <Link
                    href={tabHref(t)}
                    className="inline-flex items-center gap-2 rounded-full bg-paper-2 px-4 py-2 text-sm font-semibold text-ink-2 ring-1 ring-rule transition-all hover:text-ochre hover:ring-ochre/50"
                  >
                    {t.name}
                    <span className="tabular rounded-full bg-paper-3 px-1.5 text-[0.7rem] text-muted">{tabCount(t)}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <ArrowLink href="/lab" className="mt-7 text-lg">
              Open the lab
            </ArrowLink>
          </div>
          <Reveal delay={80} className="lg:col-span-7">
            <IdempotencyDemo />
          </Reveal>
        </Container>
      </section>
    </>
  );
}
