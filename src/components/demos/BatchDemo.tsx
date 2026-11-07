"use client";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Rocket, Turtle } from "lucide-react";
import { cn } from "@/lib/cn";
import { DemoButton, DemoFrame } from "./DemoFrame";

/**
 * 1,000 partner orders, processed the old way (one at a time) or the new way
 * (fanned out to concurrent workers with retries and a reject set).
 * Time is simulated: the old path ~2 hours, the new one inside 25 minutes.
 */
const N = 1000;
// 0 queued · 1 working · 2 done · 3 retrying · 4 rejected
const COLORS = ["bg-paper-3", "bg-ochre", "bg-live", "bg-pink", "bg-vermilion"];

export function BatchDemo() {
  const cells = useRef(new Uint8Array(N));
  const [grid, setGrid] = useState(() => new Uint8Array(N));
  const [mode, setMode] = useState<"before" | "after" | null>(null);
  const [minutes, setMinutes] = useState(0);
  const [done, setDone] = useState<{ before?: number; after?: number }>({});
  const raf = useRef(0);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  function run(which: "before" | "after") {
    cancelAnimationFrame(raf.current);
    cells.current.fill(0);
    setGrid(new Uint8Array(N));
    setMode(which);
    setMinutes(0);
    const lanes = which === "before" ? 1 : 10;
    // Simulated minutes per processed item, per lane.
    const perItem = which === "before" ? 0.125 : 0.23;
    const itemsPerFrame = which === "before" ? 9 : 3;
    let cursor = 0;
    let sim = 0;
    const retryQueue: number[] = [];

    const tick = () => {
      const c = cells.current;
      for (let k = 0; k < itemsPerFrame; k++) {
        // finish anything in flight
        for (let i = 0; i < N; i++) if (c[i] === 1) c[i] = 2;
        if (cursor < N) {
          for (let l = 0; l < lanes && cursor < N; l++, cursor++) {
            if (which === "after" && Math.random() < 0.025) {
              c[cursor] = 3;
              retryQueue.push(cursor);
            } else c[cursor] = 1;
          }
          sim += perItem;
        } else if (retryQueue.length) {
          const i = retryQueue.shift()!;
          c[i] = Math.random() < 0.7 ? 2 : 4;
          sim += 0.05;
        }
      }
      setMinutes(sim);
      setGrid(Uint8Array.from(c));
      if (cursor < N || retryQueue.length || c.includes(1)) raf.current = requestAnimationFrame(tick);
      else {
        setDone((d) => ({ ...d, [which]: sim }));
        setMode(null);
      }
    };
    raf.current = requestAnimationFrame(tick);
  }

  const c = grid;
  let ok = 0;
  let rejected = 0;
  let retrying = 0;
  for (let i = 0; i < N; i++) {
    if (c[i] === 2) ok++;
    else if (c[i] === 4) rejected++;
    else if (c[i] === 3) retrying++;
  }
  const speedup = done.before && done.after ? Math.round((1 - done.after / done.before) * 100) : null;

  return (
    <DemoFrame title="orders.csv · 1,000 orders" hint="Each square is one order. The clock is simulated.">
      <div className="grid grid-cols-[repeat(40,minmax(0,1fr))] gap-[2px]" aria-label={`${ok} of ${N} processed`}>
        {Array.from({ length: N }, (_, i) => (
          <span key={i} className={cn("aspect-square rounded-[2px] transition-colors duration-300", COLORS[c[i]])} />
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <DemoButton onClick={() => run("before")} disabled={mode !== null}>
          <Turtle aria-hidden className="size-4" /> Old way: one at a time
        </DemoButton>
        <DemoButton tone="primary" onClick={() => run("after")} disabled={mode !== null}>
          <Rocket aria-hidden className="size-4" /> New way: 10 workers
        </DemoButton>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="sim clock" value={`${Math.round(minutes)} min`} hot={minutes > 25 && mode === "before"} />
        <Stat label="processed" value={ok} />
        <Stat label="retrying" value={retrying} />
        <Stat label="reject set" value={rejected} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl bg-paper-3/70 p-4 ring-1 ring-rule">
        <span className="tabular text-sm text-muted">
          old: {done.before ? `${Math.round(done.before)} min` : "-"} · new: {done.after ? `${Math.round(done.after)} min` : "-"}
        </span>
        {speedup !== null && (
          <motion.span
            initial={{ scale: 0, rotate: -25 }}
            animate={{ scale: 1, rotate: -4 }}
            transition={{ type: "spring", stiffness: 300, damping: 10 }}
            className="ml-auto rounded-xl bg-live px-3 py-1.5 font-display text-lg font-extrabold text-on-accent"
          >
            {speedup}% faster
          </motion.span>
        )}
      </div>
    </DemoFrame>
  );
}

function Stat({ label, value, hot }: { label: string; value: string | number; hot?: boolean }) {
  return (
    <div className="rounded-2xl bg-paper-3/70 p-3 ring-1 ring-rule">
      <p className={cn("tabular font-display text-2xl font-extrabold", hot && "text-vermilion")}>{value}</p>
      <p className="text-xs font-medium text-muted">{label}</p>
    </div>
  );
}
