"use client";
import { motion, MotionConfig } from "motion/react";
import { useMemo, useState } from "react";
import { Pause, Play, RotateCcw, Shuffle, StepForward } from "lucide-react";
import { cn } from "@/lib/cn";
import { arrayAlgos, type Mark } from "@/lib/algos";
import type { ArrayAlgoKey } from "@/content/lab/types";
import { DemoButton, DemoFrame } from "@/components/demos/DemoFrame";
import { useInterval } from "@/components/demos/hooks";

const BAR: Record<Mark | "none", string> = {
  none: "bg-paper-3 ring-rule text-ink-2",
  cmp: "bg-ochre ring-ochre text-on-accent",
  swap: "bg-vermilion ring-vermilion text-on-accent",
  done: "bg-live/80 ring-live text-on-accent",
  pivot: "bg-pink ring-pink text-on-accent",
  win: "bg-indigo/40 ring-indigo text-ink",
  best: "bg-indigo ring-indigo text-indigo-ink",
  found: "bg-live ring-live text-on-accent",
  dim: "bg-paper-3/40 ring-rule/40 text-muted/60",
};

const TITLES: Record<ArrayAlgoKey, string> = {
  bubble: "bubbleSort(nums)",
  insertion: "insertionSort(nums)",
  selection: "selectionSort(nums)",
  merge: "mergeSort(nums)",
  quick: "quickSort(nums)",
  counting: "countingSort(nums, 1..7)",
  "binary-search": "binarySearch(sorted, target)",
  "two-pointers": "pairWithSum(sorted, target)",
  "sliding-window": "maxWindowSum(nums, k = 3)",
  kadane: "maxSubarray(nums)",
};

const SPEEDS = [
  { label: "slow", ms: 900 },
  { label: "normal", ms: 450 },
  { label: "fast", ms: 160 },
];

export function ArrayAlgo({ algo }: { algo: ArrayAlgoKey }) {
  const [shuffles, setShuffles] = useState(0);
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const frames = useMemo(() => arrayAlgos[algo](`${algo}-${shuffles}`), [algo, shuffles]);
  const f = frames[Math.min(i, frames.length - 1)];
  const last = frames.length - 1;
  const max = Math.max(...frames[0].items.map((it) => Math.abs(it.v)));
  const signed = frames[0].items.some((it) => it.v < 0);
  const ptrAt = new Map<number, string[]>();
  for (const [name, idx] of Object.entries(f.ptr ?? {})) ptrAt.set(idx, [...(ptrAt.get(idx) ?? []), name]);

  useInterval(
    () => {
      if (i >= last) setPlaying(false);
      else setI(i + 1);
    },
    playing ? SPEEDS[speed].ms : null,
  );

  return (
    <MotionConfig reducedMotion="user">
      <DemoFrame title={TITLES[algo]} hint="Ochre is being compared, red just moved, green is settled. Shuffle for a fresh input.">
        <div className="relative rounded-xl bg-paper/60 px-3 pb-8 pt-4 ring-1 ring-rule sm:px-5">
          <div className="relative flex h-44 gap-1 sm:h-52 sm:gap-1.5">
            {signed && <span aria-hidden className="absolute inset-x-0 top-1/2 h-px bg-ink-2/40" />}
            {f.items.map((it, idx) => {
              const mark = (f.marks[idx] as Mark | undefined) ?? "none";
              const neg = it.v < 0;
              const bar = (
                <motion.div
                  initial={false}
                  animate={{ height: `${Math.max(10, (Math.abs(it.v) / max) * 100)}%`, y: mark === "swap" ? (neg ? 6 : -6) : 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 26 }}
                  className={cn(
                    "flex w-full justify-center rounded-md ring-1 transition-colors duration-200",
                    neg ? "items-end pb-1" : "items-start pt-1",
                    BAR[mark],
                    neg && mark === "none" && "bg-vermilion/25",
                  )}
                >
                  <span className="tabular text-[0.6rem] font-bold sm:text-[0.7rem]">{it.v}</span>
                </motion.div>
              );
              return (
                <motion.div key={it.id} layout transition={{ type: "spring", stiffness: 520, damping: 34 }} className="relative flex min-w-0 flex-1 flex-col">
                  {signed ? (
                    <>
                      <div className="flex h-1/2 items-end">{!neg && bar}</div>
                      <div className="flex h-1/2 items-start">{neg && bar}</div>
                    </>
                  ) : (
                    <div className="flex h-full items-end">{bar}</div>
                  )}
                  <div className="absolute -bottom-7 left-1/2 flex -translate-x-1/2 gap-0.5">
                    {(ptrAt.get(idx) ?? []).map((name) => (
                      <motion.span
                        key={name}
                        layoutId={`${algo}-ptr-${name}`}
                        transition={{ type: "spring", stiffness: 500, damping: 32 }}
                        className="whitespace-nowrap rounded bg-indigo px-1 text-[0.58rem] font-bold text-indigo-ink"
                      >
                        {name}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {f.aux && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="mr-1 text-muted">{f.aux.label}</span>
            {f.aux.values.map((v, k) => (
              <motion.span
                key={`${k}-${v}`}
                initial={{ scale: 1.4 }}
                animate={{ scale: 1 }}
                className={cn("tabular min-w-7 rounded-md px-1.5 py-0.5 text-center font-bold ring-1", k === f.aux!.hi ? "bg-ochre text-on-accent ring-ochre" : "bg-paper-3 text-ink ring-rule")}
              >
                {v}
              </motion.span>
            ))}
          </div>
        )}

        <p className="mt-4 min-h-[3rem] text-base font-semibold leading-snug" aria-live="polite">
          {f.note}
        </p>
        <p className="tabular mt-1 text-xs text-muted">
          step {i + 1}/{frames.length} · {f.compares} comparisons · {f.writes} writes
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <DemoButton
            tone="primary"
            onClick={() => {
              if (playing) return setPlaying(false);
              if (i >= last) setI(0);
              setPlaying(true);
            }}
          >
            {playing ? <Pause aria-hidden className="size-4" /> : <Play aria-hidden className="size-4" />}
            {playing ? "Pause" : i >= last ? "Replay" : "Play"}
          </DemoButton>
          <DemoButton
            onClick={() => {
              setPlaying(false);
              setI((n) => Math.min(n + 1, last));
            }}
            disabled={i >= last}
          >
            <StepForward aria-hidden className="size-4" /> Step
          </DemoButton>
          <DemoButton
            onClick={() => {
              setPlaying(false);
              setI(0);
              setShuffles((s) => s + 1);
            }}
          >
            <Shuffle aria-hidden className="size-4" /> Shuffle
          </DemoButton>
          <div className="ml-auto flex items-center gap-1 rounded-full bg-paper-3 p-1 ring-1 ring-rule" role="group" aria-label="Speed">
            {SPEEDS.map((s, k) => (
              <button
                key={s.label}
                type="button"
                aria-pressed={speed === k}
                onClick={() => setSpeed(k)}
                className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", speed === k ? "bg-ink text-paper" : "text-muted hover:text-ink")}
              >
                {s.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setPlaying(false);
              setI(0);
            }}
            className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink"
          >
            <RotateCcw aria-hidden className="size-3.5" /> reset
          </button>
        </div>
      </DemoFrame>
    </MotionConfig>
  );
}
