import Link from "next/link";
import { Menu } from "lucide-react";
import { nav, site } from "@/content/site";
import { Adire } from "@/components/art/Adire";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto mt-3 flex h-14 max-w-[1320px] items-center justify-between gap-6 rounded-full border border-rule bg-paper-2 px-3 sm:mx-6 lg:mx-auto lg:px-4">
        <Link href="/" className="group flex items-center gap-3 pl-1" aria-label={`${site.name}: home`}>
          <span className="animate-spin-slow block size-8 overflow-hidden rounded-full [--dur:18s]">
            <Adire seed={site.name} cols={1} rows={1} className="size-full" />
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight">
            olutobi<span className="text-ochre">.</span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3.5 py-1.5 text-sm font-medium text-ink-2 transition-colors duration-200 hover:bg-paper-3 hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/#contact"
            className="hidden h-10 items-center gap-2 rounded-full bg-ochre px-4 text-sm font-bold text-on-accent transition-colors hover:bg-ochre/85 sm:inline-flex"
          >
            <span className="pulse-dot size-1.5 rounded-full bg-on-accent" />
            Say hello
          </Link>
          <details className="group relative md:hidden">
            <summary
              className="grid size-10 cursor-pointer list-none place-items-center rounded-full bg-paper-3 text-ink [&::-webkit-details-marker]:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-4 transition-transform group-open:rotate-90" aria-hidden />
            </summary>
            <nav aria-label="Mobile" className="absolute right-0 top-12 w-56 rounded-2xl border border-rule bg-paper-2 p-2 shadow-2xl">
              {[...nav, { label: "Contact", href: "/#contact" }].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-xl px-3 py-2.5 font-display text-lg font-bold text-ink-2 hover:bg-paper-3 hover:text-ink"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
