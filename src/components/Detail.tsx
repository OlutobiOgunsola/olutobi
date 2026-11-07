import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/primitives";
import type { Decision } from "@/content/types";

/** Shared building blocks for case-study and project pages. */

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2 text-sm text-ink-2 hover:text-ink">
      <ArrowLeft aria-hidden className="size-4 transition-transform group-hover:-translate-x-0.5" />
      {label}
    </Link>
  );
}

export function Block({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="grid gap-4 border-t border-rule py-10 md:grid-cols-12 md:gap-10">
      <h2 className="font-display text-2xl font-extrabold leading-tight text-ink md:col-span-3">{label}</h2>
      <div className="md:col-span-9">{children}</div>
    </section>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return <p className="max-w-[64ch] text-lg leading-relaxed text-ink-2">{children}</p>;
}

export function NumberedList({ items }: { items: readonly string[] }) {
  return (
    <ol className="max-w-[68ch] space-y-5">
      {items.map((item, i) => (
        <li key={item} className="grid grid-cols-[2.25rem_1fr] text-[1.05rem] leading-relaxed text-ink-2">
          <span className="tabular pt-0.5 font-display text-sm font-extrabold text-ochre">{i + 1}</span>
          {item}
        </li>
      ))}
    </ol>
  );
}

export function Decisions({ items }: { items: readonly Decision[] }) {
  return (
    <ol className="max-w-[70ch] divide-y divide-rule">
      {items.map((d, i) => (
        <li key={d.title} className="group py-6 first:pt-0">
          <h3 className="font-display text-2xl font-extrabold leading-tight transition-colors group-hover:text-ochre">
            <span className="tabular mr-3 text-ochre">{i + 1}.</span>
            {d.title}
          </h3>
          <p className="mt-3 text-[1.05rem] leading-relaxed text-ink-2">{d.body}</p>
        </li>
      ))}
    </ol>
  );
}

export function NextUp({ href, label, title }: { href: string; label: string; title: string }) {
  return (
    <Container className="mt-10">
      <Link
        href={href}
        className="group flex items-center justify-between gap-6 rounded-2xl border border-rule p-7 transition-colors hover:border-ochre hover:bg-paper-2/60 sm:p-10"
      >
        <div>
          <p className="font-display text-3xl font-extrabold leading-tight transition-colors group-hover:text-ochre sm:text-4xl">{title}</p>
          <p className="mt-3 text-sm font-semibold text-muted">{label} →</p>
        </div>
        <ArrowRight aria-hidden className="size-7 shrink-0 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </Container>
  );
}
