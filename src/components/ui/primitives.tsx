import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ProjectStatus } from "@/content/projects";
import { Kinetic } from "@/components/motion/Kinetic";

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("relative mx-auto w-full max-w-[1320px] px-4 sm:px-6 lg:px-10", className)}>{children}</div>;
}

/** A chapter opener: just the headline, set huge, with letters that hop when hovered. */
export function SectionHead({ title, accent, id }: { title: string; accent?: string; id?: string }) {
  return (
    <h2 id={id} className="max-w-[16ch] scroll-mt-28 font-display text-[2.75rem] font-extrabold leading-[0.95] sm:text-7xl lg:text-[5.75rem]">
      <Kinetic text={title} />
      {accent && (
        <>
          {" "}
          <Kinetic text={accent} className="font-serif font-normal italic tracking-normal text-ochre" />
        </>
      )}
    </h2>
  );
}

export function StatusPill({ status }: { status: ProjectStatus }) {
  const dot = { live: "bg-live pulse-dot", building: "bg-ochre", lab: "bg-indigo" }[status.tone];
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-paper-3/80 px-3 py-1 text-xs font-medium text-ink-2 ring-1 ring-rule">
      <span className={cn("size-1.5 shrink-0 rounded-full", dot)} />
      {status.label}
    </span>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-paper-3/70 px-3 py-1 text-xs font-medium text-ink-2 ring-1 ring-rule">
      {children}
    </span>
  );
}

export function Sticker({ children, className, rotate = -6 }: { children: ReactNode; className?: string; rotate?: number }) {
  return (
    <span
      className={cn(
        "inline-block rounded-xl px-3 py-1.5 font-display text-sm font-extrabold uppercase leading-none shadow-[0_8px_20px_-8px_rgba(0,0,0,.6)]",
        className,
      )}
      style={{ rotate: `${rotate}deg` }}
    >
      {children}
    </span>
  );
}

export function ArrowLink({
  href,
  children,
  external,
  className,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
  className?: string;
}) {
  const cls = cn("group inline-flex items-center gap-1.5 font-semibold text-ink", className);
  const inner = (
    <>
      <span className="link-underline">{children}</span>
      <ArrowUpRight
        aria-hidden
        className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
      />
    </>
  );
  if (external)
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cls}>
        {inner}
      </a>
    );
  return (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  );
}

export function Button({
  href,
  children,
  variant = "solid",
  external,
}: {
  href: string;
  children: ReactNode;
  variant?: "solid" | "ghost";
  external?: boolean;
}) {
  const cls = cn(
    "inline-flex h-12 items-center gap-2 rounded-[4px] px-6 text-[0.95rem] font-bold transition-colors duration-200",
    variant === "solid"
      ? "bg-ochre text-on-accent hover:bg-ochre/85"
      : "bg-paper-3/70 text-ink ring-1 ring-rule hover:ring-ink-2",
  );
  return external ? (
    <a href={href} className={cls} target="_blank" rel="noreferrer">
      {children}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

/** Proof as one bold line of facts, not a dashboard of stat tiles. */
export function Metrics({ items, className }: { items: readonly { value: string; label: string }[]; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap items-baseline gap-x-8 gap-y-4 border-y border-rule py-6", className)}>
      {items.map((m, i) => (
        <li key={m.label} className="flex items-baseline gap-2.5">
          <span className={cn("tabular font-display text-3xl font-extrabold sm:text-4xl", ["text-ink", "text-ochre", "text-pink", "text-indigo"][i % 4])}>
            {m.value}
          </span>
          <span className="text-sm text-ink-2">{m.label}</span>
        </li>
      ))}
    </ul>
  );
}
