"use client";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { LogLine } from "./hooks";

const TONES = { ok: "bg-live/10 text-live", bad: "bg-vermilion/10 text-vermilion", info: "bg-paper-3/60 text-ink-2", warn: "bg-ochre/10 text-ochre" };

export function LogList({ lines, className }: { lines: LogLine[]; className?: string }) {
  return (
    <ul className={cn("min-h-[6.5rem] space-y-1.5 text-[0.8rem]", className)} aria-live="polite">
      <AnimatePresence initial={false}>
        {lines.map((l) => (
          <motion.li
            key={l.id}
            layout
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className={cn("rounded-lg px-3 py-1.5", TONES[l.tone])}
          >
            {l.text}
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}

/** A rubber-stamp verdict that slams onto a demo when the pattern is switched off and things break. */
export function Stamp({ show, children, good, className }: { show: boolean; children: ReactNode; good?: boolean; className?: string }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.span
          initial={{ scale: 2.6, opacity: 0, rotate: -24 }}
          animate={{ scale: 1, opacity: 1, rotate: good ? -4 : -10 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className={cn(
            "pointer-events-none absolute right-4 top-4 z-10 rounded-lg border-2 bg-paper px-2.5 py-1 font-display text-base font-extrabold uppercase",
            good ? "border-live text-live" : "border-vermilion text-vermilion",
            className,
          )}
        >
          {children}
        </motion.span>
      )}
    </AnimatePresence>
  );
}
