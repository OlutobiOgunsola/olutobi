"use client";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/cn";
import { DemoButton, DemoFrame, Toggle } from "./DemoFrame";
import { Stamp } from "./LogList";
import { useInterval } from "./hooks";

/**
 * A producer fills a 10-slot buffer; a consumer drains 3 items a second.
 * Crank the producer. Without backpressure, overflow spills onto the floor.
 * With it, a full buffer tells the producer to slow down.
 */
const CAP = 10;
const CONSUME_MS = 333;

type Item = { id: number };

export function BackpressureDemo() {
  const [bp, setBp] = useState(true);
  const [rate, setRate] = useState(8); // items per second
  const [running, setRunning] = useState(false);
  const [buffer, setBuffer] = useState<Item[]>([]);
  const [spilled, setSpilled] = useState<Item[]>([]);
  const [dropped, setDropped] = useState(0);
  const [done, setDone] = useState(0);
  const seq = useRef(0);

  const throttled = bp && buffer.length >= CAP - 2;
  const effective = throttled ? 3 : rate;

  useInterval(() => {
    const item = { id: ++seq.current };
    if (buffer.length >= CAP) {
      if (bp) return; // producer is waiting
      setDropped((d) => d + 1);
      setSpilled((s) => [...s, item].slice(-6));
      setTimeout(() => setSpilled((s) => s.filter((x) => x.id !== item.id)), 900);
      return;
    }
    setBuffer((b) => [...b, item]);
  }, running ? 1000 / effective : null);

  useInterval(() => {
    if (!buffer.length) return;
    setBuffer((b) => b.slice(1));
    setDone((d) => d + 1);
  }, running ? CONSUME_MS : null);

  return (
    <DemoFrame title="producer → buffer (10) → consumer (3/s)" hint="Drag the producer speed up past what the consumer can handle.">
      <div className="relative">
        <Stamp show={dropped > 0}>{dropped} dropped</Stamp>
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
          <Station label="Producer" sub={`${effective}/s`} warn={throttled} warnText="slow down!" />
          <div className="relative">
            <div className="grid grid-cols-10 gap-1 rounded-xl bg-paper p-2 ring-1 ring-rule">
              {Array.from({ length: CAP }, (_, i) => (
                <div key={i} className="aspect-square rounded-md bg-paper-3">
                  <AnimatePresence>
                    {buffer[i] && (
                      <motion.span
                        key={buffer[i].id}
                        layout
                        initial={{ scale: 0, x: -20 }}
                        animate={{ scale: 1, x: 0 }}
                        exit={{ scale: 0, x: 20 }}
                        className={cn("block size-full rounded-md", buffer.length >= CAP ? "bg-vermilion" : "bg-ochre")}
                      />
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-x-0 top-full h-10">
              <AnimatePresence>
                {spilled.map((s, i) => (
                  <motion.span
                    key={s.id}
                    initial={{ y: -8, x: 40 + i * 12, rotate: 0, opacity: 1 }}
                    animate={{ y: 34, rotate: 200, opacity: 0 }}
                    transition={{ duration: 0.9, ease: "easeIn" }}
                    className="absolute block size-3 rounded-sm bg-vermilion"
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
          <Station label="Consumer" sub="3/s" />
        </div>
      </div>

      <label className="mt-10 block">
        <span className="flex justify-between text-sm font-semibold text-muted">
          Producer speed <span className="tabular text-ochre">{rate} items/s</span>
        </span>
        <input type="range" min={1} max={15} value={rate} onChange={(e) => setRate(Number(e.target.value))} className="mt-2 w-full accent-[var(--ochre)]" />
      </label>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <DemoButton tone="primary" onClick={() => setRunning((r) => !r)}>
          {running ? <Pause aria-hidden className="size-4" /> : <Play aria-hidden className="size-4" />} {running ? "Pause" : "Run"}
        </DemoButton>
        <Toggle on={bp} onChange={setBp} label="Backpressure" />
        <span className="tabular ml-auto text-sm text-muted">
          processed <strong className="text-live">{done}</strong> · dropped <strong className={dropped ? "text-vermilion" : "text-ink-2"}>{dropped}</strong>
        </span>
        <button
          type="button"
          onClick={() => {
            setBuffer([]);
            setDropped(0);
            setDone(0);
          }}
          className="text-xs text-muted hover:text-ink"
        >
          reset
        </button>
      </div>
    </DemoFrame>
  );
}

function Station({ label, sub, warn, warnText }: { label: string; sub: string; warn?: boolean; warnText?: string }) {
  return (
    <div className="relative grid w-20 place-items-center rounded-xl bg-paper-3/60 px-2 py-3 text-center ring-1 ring-rule sm:w-24">
      <p className="text-xs font-semibold">{label}</p>
      <p className="tabular text-sm font-bold text-ochre">{sub}</p>
      <AnimatePresence>
        {warn && (
          <motion.span
            initial={{ scale: 0, y: 6 }}
            animate={{ scale: 1, y: 0, rotate: -6 }}
            exit={{ scale: 0 }}
            className="absolute -top-4 rounded-md bg-indigo px-1.5 py-0.5 text-[0.65rem] font-bold text-indigo-ink"
          >
            {warnText}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
