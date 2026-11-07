"use client";
import { motion } from "motion/react";
import { useState } from "react";
import { Zap } from "lucide-react";
import { cn } from "@/lib/cn";
import { DemoButton, DemoFrame, Toggle } from "./DemoFrame";
import { Stamp } from "./LogList";
import { useInterval } from "./hooks";

/**
 * 40 clients lose a provider at the same instant and retry with exponential
 * backoff. Without jitter they retry in lockstep, overload the provider the
 * moment it comes back, and knock it over again. With jitter, they spread out.
 */
const CLIENTS = 40;
const TICKS = 64;
const CAPACITY = 12;
const OUTAGE = 10;

type Tick = { count: number; state: "down" | "overload" | "ok" | "idle"; done: number };

function simulate(jitter: boolean): Tick[] {
  const next = Array<number>(CLIENTS).fill(0);
  const attempt = Array<number>(CLIENTS).fill(0);
  const done = Array<boolean>(CLIENTS).fill(false);
  let downUntil = OUTAGE;
  let succeeded = 0;
  const out: Tick[] = [];

  for (let t = 0; t < TICKS; t++) {
    const arriving = [];
    for (let c = 0; c < CLIENTS; c++) if (!done[c] && next[c] === t) arriving.push(c);
    let state: Tick["state"] = arriving.length ? "ok" : "idle";

    if (arriving.length && (t < downUntil || arriving.length > CAPACITY)) {
      if (t >= downUntil) downUntil = t + 6; // a fresh stampede knocks it over again
      state = t < OUTAGE || arriving.length <= CAPACITY ? "down" : "overload";
      for (const c of arriving) {
        attempt[c]++;
        const delay = Math.min(2 * 2 ** (attempt[c] - 1), 16);
        next[c] = t + (jitter ? 1 + Math.floor(Math.random() * delay) : delay);
      }
    } else {
      for (const c of arriving) done[c] = true;
      succeeded += arriving.length;
    }
    out.push({ count: arriving.length, state, done: succeeded });
  }
  return out;
}

export function RetryJitterDemo() {
  const [jitter, setJitter] = useState(false);
  const [timeline, setTimeline] = useState<Tick[] | null>(null);
  const [shown, setShown] = useState(0);
  const running = timeline !== null && shown < TICKS;

  useInterval(() => setShown((s) => s + 1), running ? 55 : null);

  function run() {
    setTimeline(simulate(jitter));
    setShown(0);
  }

  const visible = timeline?.slice(0, shown) ?? [];
  const recovered = visible.at(-1)?.done ?? 0;
  const finished = timeline !== null && shown >= TICKS;

  return (
    <DemoFrame title={`${CLIENTS} clients · exponential backoff · capacity ${CAPACITY}/tick`} hint="Each bar is a moment in time; its height is how many retries arrived together. The dashed line is what the provider can take.">
      <div className="relative">
        <Stamp show={finished && recovered < CLIENTS}>thundering herd</Stamp>
        <Stamp show={finished && recovered === CLIENTS} good>
          everyone recovered
        </Stamp>
        <div className="relative flex h-40 items-end gap-[2px] rounded-xl bg-paper p-2 pt-6 ring-1 ring-rule">
          <div className="pointer-events-none absolute inset-x-2 border-t border-dashed border-ochre/70" style={{ bottom: `calc(0.5rem + ${(CAPACITY / CLIENTS) * 100}% * 0.85)` }} />
          {Array.from({ length: TICKS }, (_, t) => {
            const tick = visible[t];
            const h = tick ? (tick.count / CLIENTS) * 100 : 0;
            return (
              <div key={t} className="flex h-full flex-1 items-end">
                <motion.div
                  className={cn(
                    "w-full rounded-t-sm",
                    !tick || tick.state === "idle" ? "bg-paper-3" : tick.state === "ok" ? "bg-live" : tick.state === "overload" ? "bg-vermilion" : "bg-muted/60",
                  )}
                  initial={false}
                  animate={{ height: `${Math.max(tick?.count ? h * 0.85 : 2, 2)}%` }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}
                />
              </div>
            );
          })}
        </div>
        <div className="mt-1 flex justify-between text-[0.7rem] text-muted">
          <span>outage</span>
          <span>time →</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <DemoButton tone="danger" onClick={run} disabled={running}>
          <Zap aria-hidden className="size-4" /> Knock the provider over
        </DemoButton>
        <Toggle on={jitter} onChange={setJitter} label="Jitter" />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <Readout label="clients recovered" value={`${recovered}/${CLIENTS}`} hot={finished && recovered < CLIENTS} />
        <Readout label="biggest stampede" value={String(Math.max(0, ...visible.map((t) => t.count)))} hot={visible.some((t) => t.state === "overload")} />
        <Readout label="re-crashes" value={String(visible.filter((t) => t.state === "overload").length)} hot={visible.some((t) => t.state === "overload")} />
      </div>
    </DemoFrame>
  );
}

function Readout({ label, value, hot }: { label: string; value: string; hot?: boolean }) {
  return (
    <div className="rounded-xl bg-paper-3/60 p-3 ring-1 ring-rule">
      <p className={cn("tabular font-display text-2xl font-extrabold", hot ? "text-vermilion" : "text-ink")}>{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
