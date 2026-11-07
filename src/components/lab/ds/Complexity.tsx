"use client";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/cn";
import { DemoButton, DemoFrame, Toggle } from "@/components/demos/DemoFrame";
import { Stamp } from "@/components/demos/LogList";

/* ---------------------------------------------------------- Big-O race */

const CURVES = [
  { name: "O(1)", f: () => 1, ex: "array[i]" },
  { name: "O(log n)", f: (n: number) => Math.max(1, Math.ceil(Math.log2(n))), ex: "binary search" },
  { name: "O(n)", f: (n: number) => n, ex: "scan a list" },
  { name: "O(n log n)", f: (n: number) => Math.ceil(n * Math.log2(n)), ex: "good sort" },
  { name: "O(n²)", f: (n: number) => n * n, ex: "every pair" },
  { name: "O(2ⁿ)", f: (n: number) => 2 ** n, ex: "every subset" },
];

function human(ops: number) {
  const s = ops / 1e6; // at a million operations per second
  if (s < 1e-3) return "instant";
  if (s < 1) return `${Math.round(s * 1000)} ms`;
  if (s < 60) return `${s.toFixed(1)} s`;
  if (s < 3600) return `${Math.round(s / 60)} min`;
  if (s < 86400) return `${Math.round(s / 3600)} hours`;
  if (s < 31_536_000) return `${Math.round(s / 86400)} days`;
  const y = s / 31_536_000;
  return y > 1e6 ? `${y.toExponential(1)} years` : `${Math.round(y).toLocaleString("en-NG")} years`;
}

export function BigODemo() {
  const [n, setN] = useState(16);
  const [race, setRace] = useState(0);
  const maxLog = Math.log10(2 ** 50);

  return (
    <DemoFrame title="how work grows with n" hint="Bars are on a log scale. Every notch is ten times more work. Times assume a million operations per second.">
      <label className="flex items-center gap-3 text-sm font-semibold text-ink-2">
        n =
        <span className="tabular w-8 font-display text-2xl font-extrabold text-ochre">{n}</span>
        <input type="range" min={2} max={50} value={n} onChange={(e) => setN(Number(e.target.value))} className="flex-1 accent-[var(--ochre)]" />
      </label>
      <div className="mt-4 space-y-2.5">
        {CURVES.map((c, i) => {
          const ops = c.f(n);
          const w = Math.max(2, (Math.log10(ops + 1) / maxLog) * 100);
          const bad = ops > 1e9;
          return (
            <div key={c.name} className="grid grid-cols-[5.5rem_1fr] items-center gap-3 sm:grid-cols-[6.5rem_1fr]">
              <div>
                <p className="font-display text-sm font-extrabold">{c.name}</p>
                <p className="text-[0.62rem] text-muted">{c.ex}</p>
              </div>
              <div className="relative h-7 overflow-hidden rounded-md bg-paper-3">
                <motion.div
                  key={race}
                  initial={race ? { width: "0%" } : false}
                  animate={{ width: `${w}%` }}
                  transition={race ? { duration: 0.4 + w / 60, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] } : { type: "spring", stiffness: 300, damping: 30 }}
                  className={cn("h-full rounded-md", bad ? "bg-vermilion" : ops > n ? "bg-ochre" : "bg-live")}
                />
                <span className="tabular absolute inset-y-0 left-2 flex items-center text-[0.68rem] font-bold">
                  <span className="rounded bg-paper/70 px-1 text-ink">
                    {ops.toLocaleString("en-NG")} ops · {human(ops)}
                  </span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-5">
        <DemoButton tone="primary" onClick={() => setRace((r) => r + 1)}>
          <Play aria-hidden className="size-4" /> Race them
        </DemoButton>
      </div>
    </DemoFrame>
  );
}

/* --------------------------------------------------------- memoization */

function trace(n: number, memo: boolean) {
  const calls: ("compute" | "hit")[] = [];
  const cache = new Map<number, number>();
  const fib = (k: number): number => {
    if (memo && cache.has(k)) {
      calls.push("hit");
      return cache.get(k)!;
    }
    calls.push("compute");
    const v = k < 2 ? k : fib(k - 1) + fib(k - 2);
    if (memo) cache.set(k, v);
    return v;
  };
  return { value: fib(n), calls };
}

const SHOW = 480;

export function MemoDemo() {
  const [memo, setMemo] = useState(true);
  const [n, setN] = useState(14);
  const [shown, setShown] = useState<ReturnType<typeof trace> | null>(null);
  const [count, setCount] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => void (timer.current && clearInterval(timer.current)), []);

  function run() {
    if (timer.current) clearInterval(timer.current);
    const t = trace(n, memo);
    setShown(t);
    setCount(0);
    const total = t.calls.length;
    const per = Math.max(1, Math.ceil(total / 60));
    let c = 0;
    timer.current = setInterval(() => {
      c = Math.min(total, c + per);
      setCount(c);
      if (c >= total && timer.current) clearInterval(timer.current);
    }, 25);
  }

  const visible = shown ? shown.calls.slice(0, Math.min(count, SHOW)) : [];
  const hits = shown ? shown.calls.slice(0, count).filter((c) => c === "hit").length : 0;

  return (
    <DemoFrame title={`fib(${n}), with and without a memo`} hint="Every dot is one function call. Green dots are answers looked up instead of recomputed.">
      <div className="relative">
        <Stamp show={!memo && !!shown && count === shown.calls.length && count > 1000}>{count.toLocaleString("en-NG")} calls</Stamp>
        <div className="flex min-h-[9.5rem] flex-wrap content-start gap-[3px] rounded-xl bg-paper/60 p-3 ring-1 ring-rule">
          {visible.map((c, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 600, damping: 20 }}
              className={cn("size-2 rounded-full", c === "hit" ? "bg-live" : "bg-ochre")}
            />
          ))}
          {shown && count > SHOW && <span className="tabular ml-1 text-[0.65rem] font-bold text-vermilion">+{(count - SHOW).toLocaleString("en-NG")} more</span>}
          {!shown && <p className="m-auto text-sm text-muted">Press compute.</p>}
        </div>
      </div>
      <p className="tabular mt-3 min-h-[1.5rem] text-sm font-semibold text-ink-2" aria-live="polite">
        {shown ? `fib(${n}) = ${shown.value.toLocaleString("en-NG")} · ${count.toLocaleString("en-NG")} calls · ${hits} cache hits` : "fib(n) = fib(n−1) + fib(n−2). Simple, and secretly exponential."}
      </p>
      <label className="mt-3 flex items-center gap-3 text-sm font-semibold text-ink-2">
        n =<span className="tabular w-6 font-display text-xl font-extrabold text-ochre">{n}</span>
        <input type="range" min={4} max={24} value={n} onChange={(e) => (setN(Number(e.target.value)), setShown(null))} className="flex-1 accent-[var(--ochre)]" />
      </label>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <DemoButton tone="primary" onClick={run}>
          <Play aria-hidden className="size-4" /> Compute
        </DemoButton>
        <Toggle on={memo} onChange={(v) => (setMemo(v), setShown(null))} label="Memo" />
      </div>
    </DemoFrame>
  );
}
