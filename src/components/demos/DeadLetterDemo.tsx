"use client";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useRef, useState } from "react";
import { Bug, Inbox, PackagePlus } from "lucide-react";
import { cn } from "@/lib/cn";
import { DemoButton, DemoFrame, Toggle } from "./DemoFrame";
import { Stamp } from "./LogList";
import { useInterval } from "./hooks";

/** One malformed message lands in a queue. Without a dead-letter queue, it jams everything behind it. */
type Msg = { id: number; label: string; poison: boolean; attempts: number };
const MAX_ATTEMPTS = 3;

export function DeadLetterDemo() {
  const [dlqOn, setDlqOn] = useState(true);
  const [queue, setQueue] = useState<Msg[]>([]);
  const [dead, setDead] = useState<Msg[]>([]);
  const [done, setDone] = useState(0);
  const [stuckTicks, setStuckTicks] = useState(0);
  const [shake, setShake] = useState(0);
  const seq = useRef(0);

  useInterval(() => {
    const head = queue[0];
    if (!head) return;
    if (!head.poison) {
      setQueue((q) => q.slice(1));
      setDone((d) => d + 1);
      return;
    }
    setShake((n) => n + 1);
    const attempts = head.attempts + 1;
    if (dlqOn && attempts >= MAX_ATTEMPTS) {
      setQueue((q) => q.slice(1));
      setDead((d) => [{ ...head, attempts }, ...d].slice(0, 4));
      return;
    }
    setQueue((q) => [{ ...head, attempts }, ...q.slice(1)]);
    if (!dlqOn) setStuckTicks((n) => n + 1);
  }, queue.length ? 650 : null);

  function add(poison: boolean) {
    const items = poison
      ? [{ id: ++seq.current, label: '{"amount": ₦5,0', poison: true, attempts: 0 }]
      : Array.from({ length: 5 }, () => ({ id: ++seq.current, label: `order #${1000 + seq.current}`, poison: false, attempts: 0 }));
    setQueue((q) => [...q, ...items]);
  }

  const jammed = !dlqOn && stuckTicks > 3;

  return (
    <DemoFrame title="queue: order.created → worker" hint="The worker retries each message up to 3 times. Drop in some orders, then a poison pill, then more orders.">
      <LayoutGroup>
        <div className="relative grid gap-3 sm:grid-cols-[1fr_auto]">
          <Stamp show={jammed}>queue jammed</Stamp>
          <div className="min-h-[9rem] rounded-xl bg-paper p-3 ring-1 ring-rule">
            <p className="text-xs font-semibold text-muted">Queue ({queue.length}) → worker</p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              <AnimatePresence mode="popLayout">
                {queue.slice(0, 14).map((m, i) => (
                  <motion.li
                    key={m.id}
                    layout
                    layoutId={`m-${m.id}`}
                    initial={{ scale: 0, y: -10 }}
                    animate={i === 0 && m.poison ? { scale: 1, y: 0, rotate: shake % 2 ? 4 : -4 } : { scale: 1, y: 0, rotate: 0 }}
                    exit={{ scale: 0, opacity: 0, x: 20 }}
                    transition={{ type: "spring", stiffness: 420, damping: 22 }}
                    className={cn(
                      "rounded-lg px-2 py-1 font-mono text-[0.7rem] ring-1",
                      m.poison ? "bg-vermilion/15 text-vermilion ring-vermilion/50" : i === 0 ? "bg-ochre text-on-accent ring-ochre" : "bg-paper-3 text-ink-2 ring-rule",
                    )}
                  >
                    {m.label}
                    {m.attempts > 0 && <span className="ml-1 font-sans font-bold">×{m.attempts}</span>}
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </div>
          <div className={cn("min-h-[9rem] rounded-xl p-3 ring-1 sm:w-44", dlqOn ? "bg-indigo/10 ring-indigo/40" : "bg-paper-3/30 ring-rule opacity-50")}>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-indigo">
              <Inbox aria-hidden className="size-3.5" /> Dead-letter tray
            </p>
            <ul className="mt-2 space-y-1.5">
              {dead.map((m) => (
                <motion.li key={m.id} layoutId={`m-${m.id}`} className="rounded-lg bg-vermilion/15 px-2 py-1 font-mono text-[0.7rem] text-vermilion ring-1 ring-vermilion/50">
                  {m.label} ×{m.attempts}
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </LayoutGroup>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <DemoButton tone="primary" onClick={() => add(false)}>
          <PackagePlus aria-hidden className="size-4" /> Add 5 orders
        </DemoButton>
        <DemoButton tone="danger" onClick={() => add(true)}>
          <Bug aria-hidden className="size-4" /> Drop in a poison message
        </DemoButton>
        <button
          type="button"
          onClick={() => {
            setQueue([]);
            setDead([]);
            setDone(0);
            setStuckTicks(0);
          }}
          className="ml-auto text-xs text-muted hover:text-ink"
        >
          reset
        </button>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <Toggle on={dlqOn} onChange={(v) => { setDlqOn(v); setStuckTicks(0); }} label="Dead-letter queue" />
        <span className="tabular text-sm font-semibold text-live">{done} orders processed</span>
      </div>
    </DemoFrame>
  );
}
