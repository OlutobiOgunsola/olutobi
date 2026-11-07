"use client";
import { motion } from "motion/react";
import { useState } from "react";
import { HeartPulse, Pause, Play, Snail } from "lucide-react";
import { cn } from "@/lib/cn";
import { DemoButton, DemoFrame, Toggle } from "./DemoFrame";
import { Stamp } from "./LogList";
import { useInterval } from "./hooks";

/**
 * Traffic flows to a provider through a pool of 8 worker threads. Make the
 * provider slow: without a breaker, every thread waits on timeouts until the
 * app can't serve anyone. With one, it trips, fails fast, and probes for recovery.
 */
const POOL = 8;
const TICK = 100; // ms of simulated time per step
const SLOW_MS = 5000; // a slow provider with no timeout holds a thread this long
const TIMEOUT_MS = 1000; // breakers ship with a short call timeout
const FAST_MS = 300;
const COOLDOWN = 2500;
const TRIP_AFTER = 2;

type Breaker = "closed" | "open" | "half-open";
type Sim = {
  t: number;
  inflight: { id: number; end: number; fail: boolean; trial: boolean }[];
  breaker: Breaker;
  failures: number;
  openedAt: number;
  stats: { ok: number; failed: number; fastFailed: number; rejected: number };
  seq: number;
};

const fresh = (): Sim => ({ t: 0, inflight: [], breaker: "closed", failures: 0, openedAt: 0, stats: { ok: 0, failed: 0, fastFailed: 0, rejected: 0 }, seq: 0 });

function step(s: Sim, slow: boolean, useBreaker: boolean): Sim {
  const t = s.t + TICK;
  let { breaker, failures, openedAt, seq } = s;
  const stats = { ...s.stats };
  const still: Sim["inflight"] = [];

  for (const r of s.inflight) {
    if (r.end > t) {
      still.push(r);
      continue;
    }
    if (r.fail) {
      stats.failed++;
      failures++;
      if (useBreaker && (r.trial || failures >= TRIP_AFTER)) {
        breaker = "open";
        openedAt = t;
      }
    } else {
      stats.ok++;
      failures = 0;
      if (r.trial) breaker = "closed";
    }
  }

  if (useBreaker && breaker === "open" && t - openedAt >= COOLDOWN) breaker = "half-open";

  // a new request every 500ms
  if (t % 500 === 0) {
    const trialBusy = still.some((r) => r.trial);
    if (useBreaker && (breaker === "open" || (breaker === "half-open" && trialBusy))) stats.fastFailed++;
    else if (still.length >= POOL) stats.rejected++;
    else still.push({ id: ++seq, end: t + (slow ? (useBreaker ? TIMEOUT_MS : SLOW_MS) : FAST_MS), fail: slow, trial: useBreaker && breaker === "half-open" });
  }

  return { t, inflight: still, breaker: useBreaker ? breaker : "closed", failures, openedAt, stats, seq };
}

const LEVER: Record<Breaker, { rotate: number; label: string; tone: string }> = {
  closed: { rotate: -35, label: "Closed: traffic flows", tone: "text-live" },
  open: { rotate: 35, label: "Open: failing fast", tone: "text-vermilion" },
  "half-open": { rotate: 0, label: "Half-open: sending one probe", tone: "text-ochre" },
};

export function CircuitBreakerDemo() {
  const [useBreaker, setUseBreaker] = useState(true);
  const [slow, setSlow] = useState(false);
  const [running, setRunning] = useState(false);
  const [sim, setSim] = useState<Sim>(fresh);

  useInterval(() => {
    const n = step(sim, slow, useBreaker);
    setSim(n);
    if (n.t >= 40_000) setRunning(false); // stop after 40 simulated seconds
  }, running ? TICK / 2 : null); // runs at 2× speed

  const busy = sim.inflight.length;
  const lever = LEVER[sim.breaker];
  const meltdown = !useBreaker && sim.stats.rejected > 2;

  return (
    <DemoFrame title="GET /electricity-token → provider API" hint="Start the traffic, then make the provider slow. Watch the thread pool. Simulated at 2× speed.">
      <div className="relative grid gap-4 sm:grid-cols-[1fr_auto]">
        <Stamp show={meltdown}>app frozen</Stamp>
        <div>
          <p className="text-sm font-semibold text-muted">Worker threads in use</p>
          <div className="mt-2 grid grid-cols-8 gap-1.5">
            {Array.from({ length: POOL }, (_, i) => (
              <motion.span
                key={i}
                animate={{ scale: i < busy ? 1 : 0.85 }}
                className={cn("h-10 rounded-lg ring-1 transition-colors", i < busy ? (slow ? "bg-vermilion/70 ring-vermilion" : "bg-live/70 ring-live") : "bg-paper-3 ring-rule")}
              />
            ))}
          </div>
          <div className="tabular mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <Stat label="served" value={sim.stats.ok} tone="text-live" />
            <Stat label="timed out" value={sim.stats.failed} tone="text-vermilion" />
            <Stat label="failed fast" value={sim.stats.fastFailed} tone="text-ochre" />
            <Stat label="turned away" value={sim.stats.rejected} tone="text-vermilion" />
          </div>
        </div>

        <div className={cn("grid place-items-center rounded-2xl bg-paper p-4 ring-1 ring-rule", !useBreaker && "opacity-40")}>
          <svg viewBox="0 0 100 100" className="size-24" aria-hidden>
            <rect x="20" y="62" width="60" height="22" rx="6" fill="var(--paper-3)" stroke="var(--rule)" />
            <motion.g style={{ originX: 0.5, originY: 1 }} animate={{ rotate: useBreaker ? lever.rotate : -35 }} transition={{ type: "spring", stiffness: 260, damping: 14 }}>
              <rect x="46" y="20" width="8" height="50" rx="4" fill="var(--ink-2)" />
              <circle cx="50" cy="20" r="10" fill={sim.breaker === "open" ? "var(--vermilion)" : sim.breaker === "half-open" ? "var(--ochre)" : "var(--live)"} />
            </motion.g>
          </svg>
          <p className={cn("mt-1 max-w-[10rem] text-center text-xs font-semibold", useBreaker ? lever.tone : "text-muted")}>
            {useBreaker ? lever.label : "No breaker"}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <DemoButton tone="primary" onClick={() => setRunning((r) => !r)}>
          {running ? <Pause aria-hidden className="size-4" /> : <Play aria-hidden className="size-4" />} {running ? "Pause traffic" : "Start traffic"}
        </DemoButton>
        <DemoButton tone={slow ? "default" : "danger"} onClick={() => setSlow((v) => !v)}>
          {slow ? <HeartPulse aria-hidden className="size-4" /> : <Snail aria-hidden className="size-4" />} {slow ? "Heal the provider" : "Make provider slow"}
        </DemoButton>
        <button type="button" onClick={() => setSim(fresh())} className="ml-auto text-xs text-muted hover:text-ink">
          reset
        </button>
      </div>
      <div className="mt-4">
        <Toggle on={useBreaker} onChange={(v) => { setUseBreaker(v); setSim(fresh()); }} label="Circuit breaker" />
      </div>
    </DemoFrame>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-xl bg-paper-3/60 px-3 py-2 ring-1 ring-rule">
      <p className={cn("font-display text-xl font-extrabold", value ? tone : "text-ink-2")}>{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
