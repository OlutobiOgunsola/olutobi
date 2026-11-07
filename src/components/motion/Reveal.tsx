"use client";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

const tags = { div: motion.div, li: motion.li, section: motion.section, article: motion.article };

/**
 * Settles content into place as it scrolls in. The content is visible from
 * the first paint, only its position moves, so a failed script hides nothing.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
  y = 16,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: keyof typeof tags;
  y?: number;
}) {
  const reduce = useReducedMotion();
  const Tag = tags[as];
  return (
    <Tag
      className={className}
      initial={reduce ? false : { y }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: delay / 1000 }}
    >
      {children}
    </Tag>
  );
}
