"use client";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { ArrowUp, RotateCcw, Server, ServerCrash, Wheat, Zap } from "lucide-react";
import { cn } from "@/lib/cn";
import { DemoButton, DemoFrame } from "./DemoFrame";

/**
 * A Street Kings farm. The server stores only {amount, settled_at, rate};
 * the food count is derived from the clock. Crash the server and nothing is
 * lost, because nothing was ever being ticked.
 */
const CAP = 2000;
const SPEED = 600; // one real second = ten game minutes

type Row = { amount: number; settledAt: number; rate: number; level: number };

function stockAt(row: Row, now: number) {
  const hours = Math.max(0, (now - row.settledAt) * SPEED) / 3_600_000;
  return Math.min(CAP, row.amount + Math.floor(row.rate * hours));
}

export function TicksDemo() {
  const [row, setRow] = useState<Row>(() => ({ amount: 120, settledAt: 0, rate: 360, level: 1 }));
  const [up, setUp] = useState(true);
  const [shown, setShown] = useState(120);
  const [events, setEvents] = useState<{ id: number; text: string }[]>([]);

  // The clock starts on the client, so server and client render the same markup.
  useEffect(() => {
    const id = requestAnimationFrame(() => setRow((r) => (r.settledAt ? r : { ...r, settledAt: Date.now() })));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!up) return;
    let raf = 0;
    const loop = () => {
      if (row.settledAt) setShown(stockAt(row, Date.now()));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [row, up]);

  function note(text: string) {
    setEvents((e) => [{ id: Date.now() + Math.random(), text }, ...e].slice(0, 3));
  }

  function crash() {
    setUp(false);
    note("Server process killed. No loop to stop, no state in memory to lose.");
  }
  function restart() {
    setUp(true);
    note(`Restarted. food = ${stockAt(row, Date.now())}: derived, not caught up.`);
  }
  function upgrade() {
    const now = Date.now();
    const settled = stockAt(row, now);
    setRow({ amount: settled, settledAt: now, rate: row.rate * 2, level: row.level + 1 });
    note(`Settled first: amount=${settled}, settled_at=now. Then rate ×2 → ${row.rate * 2}/h.`);
  }

  return (
    <DemoFrame title="headquarters · Farm · nothing ticks" hint="1 real second = 10 game minutes. The number you see is computed from three stored values and the clock.">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-live/15 to-ochre/10 p-5 ring-1 ring-live/30">
          <motion.span className="absolute -right-2 -top-2 text-live/40" animate={up ? { rotate: [0, 8, -5, 0] } : { rotate: 0 }} transition={{ duration: 3, repeat: up ? Infinity : 0 }} aria-hidden>
            <Wheat className="size-16" strokeWidth={1.25} />
          </motion.span>
          <p className="text-xs font-medium text-muted">Food, derived on read</p>
          <p className={cn("font-display text-6xl font-extrabold tabular-nums transition-opacity", !up && "opacity-30")}>{shown.toLocaleString()}</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-paper-3">
            <motion.div className="h-full rounded-full bg-live" animate={{ width: `${(shown / CAP) * 100}%` }} transition={{ duration: 0.2 }} />
          </div>
          <p className="tabular mt-1 text-xs text-muted">storage cap {CAP.toLocaleString()} · farm level {row.level}</p>
        </div>

        <motion.div
          animate={up ? { rotate: 0, scale: 1 } : { rotate: [-3, 3, -3], scale: 0.96 }}
          transition={up ? { type: "spring" } : { duration: 0.5, repeat: Infinity }}
          className={cn("grid min-w-32 place-items-center rounded-2xl p-4 text-center ring-1", up ? "bg-indigo/10 ring-indigo/40" : "bg-vermilion/10 ring-vermilion/50")}
        >
          {up ? <Server aria-hidden className="size-9" strokeWidth={1.5} /> : <ServerCrash aria-hidden className="size-9" strokeWidth={1.5} />}
          <span className={cn("mt-1 font-mono text-[0.7rem] font-bold uppercase", up ? "text-indigo" : "text-vermilion")}>{up ? "server up" : "server down"}</span>
        </motion.div>
      </div>

      <pre className="mt-4 overflow-x-auto rounded-2xl bg-paper p-4 font-mono text-[0.72rem] leading-relaxed text-ink-2 ring-1 ring-rule">
        {`stocks { amount: `}
        <span className="text-ochre">{row.amount}</span>
        {`, settled_at: `}
        <span className="text-ochre">{row.settledAt ? "t₀" : "-"}</span>
        {`, rate_per_hour: `}
        <span className="text-ochre">{row.rate}</span>
        {` }`}
      </pre>

      <div className="mt-4 flex flex-wrap gap-2">
        {up ? (
          <DemoButton tone="danger" onClick={crash}>
            <Zap aria-hidden className="size-4" /> Crash the server
          </DemoButton>
        ) : (
          <DemoButton tone="primary" onClick={restart}>
            <RotateCcw aria-hidden className="size-4" /> Restart it
          </DemoButton>
        )}
        <DemoButton onClick={upgrade} disabled={!up}>
          <ArrowUp aria-hidden className="size-4" /> Upgrade farm
        </DemoButton>
      </div>

      <ul className="mt-4 min-h-[5.25rem] space-y-1.5 font-mono text-[0.7rem] text-ink-2">
        <AnimatePresence initial={false}>
          {events.map((e) => (
            <motion.li key={e.id} layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-lg bg-paper-3/60 px-3 py-1.5">
              {e.text}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </DemoFrame>
  );
}
