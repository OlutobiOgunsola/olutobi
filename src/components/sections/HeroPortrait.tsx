"use client";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Adire } from "@/components/art/Adire";
import { site } from "@/content/site";

const STICKERS = [
  { text: "Builds systems", className: "bg-ochre text-on-accent", style: { top: "8%", left: "-4%" }, rotate: -10 },
  { text: "Explains them", className: "bg-pink text-on-accent", style: { top: "30%", right: "-6%" }, rotate: 8 },
  { text: "Also makes music", className: "bg-live text-on-accent", style: { bottom: "22%", left: "-8%" }, rotate: 6 },
  { text: "Lagos · remote", className: "bg-indigo text-indigo-ink", style: { bottom: "6%", right: "0%" }, rotate: -7 },
];

/** An orbit of adire and stickers you can drag around. */
export function HeroPortrait() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const ringRotate = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 140]);

  return (
    <div ref={ref} className="relative mx-auto aspect-[4/5] w-full max-w-[30rem]">
      {/* glow + rotating cloth ring */}
      <div className="absolute inset-[6%] rounded-full bg-[radial-gradient(circle_at_50%_40%,var(--indigo-deep),transparent_70%)] blur-2xl" />
      <motion.div style={{ rotate: ringRotate }} className="absolute left-1/2 top-[6%] aspect-square w-[94%] -translate-x-1/2">
        <div className="animate-spin-slow size-full overflow-hidden rounded-full [--dur:60s] [mask:radial-gradient(circle,transparent_54%,#000_55%,#000_70%,transparent_71%)]">
          <Adire seed={site.name} cols={6} rows={6} className="size-full" />
        </div>
      </motion.div>

      {/* draggable stickers */}
      {STICKERS.map((s, i) => (
        <motion.button
          key={s.text}
          type="button"
          drag
          dragConstraints={ref}
          dragElastic={0.35}
          whileDrag={{ cursor: "grabbing" }}
          initial={reduce ? false : { opacity: 0, rotate: s.rotate }}
          animate={{ opacity: 1, rotate: s.rotate }}
          transition={{ duration: 0.5, delay: 0.6 + i * 0.08 }}
          className={`absolute z-10 cursor-grab rounded-2xl px-3.5 py-2 font-display text-sm font-extrabold uppercase shadow-[0_10px_24px_-8px_rgba(0,0,0,.7)] sm:text-base ${s.className}`}
          style={s.style}
          aria-label={`${s.text} (sticker: drag me)`}
        >
          {s.text}
        </motion.button>
      ))}
      <p className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap font-serif text-base italic text-ink-2">
        psst: the stickers come off
      </p>
    </div>
  );
}
