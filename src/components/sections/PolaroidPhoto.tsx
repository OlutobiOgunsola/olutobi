"use client";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { site } from "@/content/site";

/** A taped polaroid that settles in as it scrolls into view. */
export function PolaroidPhoto() {
  const reduce = useReducedMotion();
  return (
    <motion.figure
      initial={reduce ? false : { y: 16, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative mx-auto w-full max-w-sm -rotate-2 rounded-md bg-[#fffdf8] p-3 pb-14 shadow-[0_40px_80px_-30px_rgba(0,0,0,.8)]"
    >
      <span aria-hidden className="absolute -top-4 left-1/2 h-8 w-28 -translate-x-1/2 rotate-[-4deg] rounded-sm bg-pink/70 backdrop-blur" />
      <div className="relative aspect-[9/10] overflow-hidden rounded-sm">
        <Image src="/olutobi.jpg" alt={`Portrait of ${site.name}`} fill sizes="24rem" className="object-cover object-top" />
      </div>
      <figcaption className="absolute bottom-3 left-0 right-0 text-center font-serif text-2xl italic text-[#17150f]">
        Olutobi, Lagos
      </figcaption>
    </motion.figure>
  );
}
