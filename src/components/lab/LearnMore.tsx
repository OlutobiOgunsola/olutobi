"use client";
import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import type { LearnMore as LearnMoreContent } from "@/content/lab/types";

const SECTIONS: { key: keyof LearnMoreContent; title: string }[] = [
  { key: "what", title: "What it is" },
  { key: "when", title: "When to reach for it" },
  { key: "tradeoffs", title: "What it costs you" },
  { key: "inMyWork", title: "Where I've used it" },
];

export function LearnMore({ learn, name }: { learn: LearnMoreContent; name: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const sections = SECTIONS.filter((s) => learn[s.key]);

  return (
    <div className="rounded-2xl bg-paper-2/70 ring-1 ring-rule">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="group flex w-full items-center gap-3 px-5 py-4 text-left"
      >
        <span className="font-display text-lg font-extrabold">
          Learn more <span className="sr-only">about {name}</span>
        </span>
        <span className="text-sm text-muted transition-colors group-hover:text-ink-2">
          {open ? "close" : `${sections.length} short notes`}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
          className="ml-auto grid size-8 place-items-center rounded-full bg-paper-3 text-ochre ring-1 ring-rule group-hover:ring-ochre"
        >
          <ChevronDown aria-hidden className="size-4" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={id}
            role="region"
            aria-label={`More about ${name}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <dl className="grid grid-cols-1 gap-x-8 gap-y-6 border-t border-rule px-5 pb-6 pt-5 sm:grid-cols-2">
              {sections.map((s, i) => (
                <motion.div
                  key={s.key}
                  initial={{ y: 14, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.08 + i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className={cn(s.key === "inMyWork" && "sm:col-span-2")}
                >
                  <dt className={cn("text-sm font-bold", s.key === "inMyWork" ? "text-live" : "text-ochre")}>{s.title}</dt>
                  <dd className="mt-1.5 leading-relaxed text-ink-2">{learn[s.key]}</dd>
                </motion.div>
              ))}
            </dl>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
