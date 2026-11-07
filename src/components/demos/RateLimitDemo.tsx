"use client";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { MousePointerClick } from "lucide-react";
import { cn } from "@/lib/cn";
import { DemoButton, DemoFrame, Toggle } from "./DemoFrame";
import { Stamp } from "./LogList";
import { useInterval } from "./hooks";

/** A token bucket: 5 tokens, one drips back every second. Spam the button. */
const SIZE = 5;
const REFILL_MS = 1000;

type Hit = { id: number; ok: boolean };

export function RateLimitDemo() {
  const [limited, setLimited] = useState(true);
  const [tokens, setTokens] = useState(SIZE);
  const [hits, setHits] = useState<Hit[]>([]);
  const [load, setLoad] = useState(0);
  const seq = useRef(0);

  useInterval(() => setTokens((t) => Math.min(SIZE, t + 1)), tokens < SIZE ? REFILL_MS : null);
  useInterval(() => setLoad((l) => Math.max(0, l - 6)), load > 0 ? 200 : null);

  function request() {
    const ok = !limited || tokens > 0;
    if (limited && tokens > 0) setTokens((t) => t - 1);
    if (ok) setLoad((l) => Math.min(100, l + (limited ? 8 : 14)));
    const hit = { id: ++seq.current, ok };
    setHits((h) => [hit, ...h].slice(0, 14));
  }

  const melted = !limited && load >= 100;

  return (
    <DemoFrame title="POST /otp/send · 5 per bucket · +1 per second" hint="A real API would get this from a bot, not a thumb. Same maths.">
      <div className="relative grid gap-4 sm:grid-cols-[auto_1fr]">
        <Stamp show={melted}>server melted</Stamp>
        <div className={cn("relative mx-auto h-40 w-28 rounded-b-[2.5rem] border-4 border-t-0 border-ink-2/60 transition-opacity", !limited && "opacity-30")}>
          <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-muted">bucket</span>
          <div className="absolute inset-x-2 bottom-2 flex flex-col-reverse items-center gap-1.5">
            <AnimatePresence>
              {Array.from({ length: tokens }, (_, i) => (
                <motion.span
                  key={i}
                  initial={{ y: -90, opacity: 0, rotate: -40 }}
                  animate={{ y: 0, opacity: 1, rotate: 0 }}
                  exit={{ scale: 0, opacity: 0, y: 20 }}
                  transition={{ type: "spring", stiffness: 380, damping: 18 }}
                  className="block h-4 w-16 rounded-full bg-ochre shadow-[0_3px_6px_rgba(0,0,0,.45)]"
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-muted">Responses</p>
          <ul className="mt-2 flex min-h-[4.5rem] flex-wrap content-start gap-1.5">
            <AnimatePresence initial={false}>
              {hits.map((h) => (
                <motion.li
                  key={h.id}
                  layout
                  initial={{ scale: 0, rotate: h.ok ? -15 : 15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className={cn("tabular rounded-md px-2 py-0.5 font-mono text-xs font-bold", h.ok ? "bg-live/15 text-live" : "bg-vermilion/15 text-vermilion")}
                >
                  {h.ok ? 200 : 429}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
          <p className="mt-3 text-sm font-semibold text-muted">Server load</p>
          <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-paper-3">
            <motion.div className={cn("h-full rounded-full", load > 75 ? "bg-vermilion" : load > 45 ? "bg-ochre" : "bg-live")} animate={{ width: `${load}%` }} transition={{ duration: 0.2 }} />
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <motion.div whileTap={{ scale: 0.85, rotate: -3 }}>
          <DemoButton tone="primary" onClick={request}>
            <MousePointerClick aria-hidden className="size-4" /> Send OTP (spam me)
          </DemoButton>
        </motion.div>
        <Toggle on={limited} onChange={setLimited} label="Rate limit" />
        <span className="tabular ml-auto text-sm font-semibold text-ochre">{limited ? `${tokens}/${SIZE} tokens` : "no limit"}</span>
      </div>
    </DemoFrame>
  );
}
