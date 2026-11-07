"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";

export type TabLink = { slug: string; name: string; href: string; count: number };

/** The lab's tab bar. The active pill slides between tabs because the bar lives in the lab layout. */
export function LabTabs({ tabs }: { tabs: TabLink[] }) {
  const pathname = usePathname();
  const active = tabs.find((t) => t.href === pathname)?.slug ?? null;
  return <TabList tabs={tabs} active={active} />;
}

export function TabList({ tabs, active }: { tabs: TabLink[]; active: string | null }) {
  return (
    <nav aria-label="Lab topics" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
      <ul className="flex w-max gap-1 rounded-full bg-paper-2 p-1.5 ring-1 ring-rule">
        {tabs.map((t) => {
          const on = t.slug === active;
          return (
            <li key={t.slug} className="relative">
              {on && (
                <motion.span
                  layoutId="lab-tab-pill"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  className="absolute inset-0 rounded-full bg-ochre"
                />
              )}
              <Link
                href={t.href}
                aria-current={on ? "page" : undefined}
                scroll={false}
                className={cn(
                  "relative flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition-colors",
                  on ? "text-on-accent" : "text-ink-2 hover:text-ink",
                )}
              >
                {t.name}
                <span className={cn("tabular rounded-full px-1.5 text-[0.68rem]", on ? "bg-on-accent/20 text-on-accent" : "bg-paper-3 text-muted")}>{t.count}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
