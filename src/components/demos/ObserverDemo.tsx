"use client";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { BellRing, Fish, Store, Truck } from "lucide-react";
import { cn } from "@/lib/cn";
import { DemoButton, DemoFrame, Toggle } from "./DemoFrame";
import { Stamp } from "./LogList";
import { useInterval } from "./hooks";

/**
 * Sardino ships whenever it likes. Stalls that subscribe get told the moment a
 * batch lands (observer). Switch the pattern off and every stall has to keep
 * walking over to ask “any sardine?” (polling).
 */
const STALLS = ["Mama Bisi", "Iya Femi", "Baba Sule", "Chioma", "Alhaji", "Ronke"];

export function ObserverDemo() {
  const [observer, setObserver] = useState(true);
  const [subs, setSubs] = useState<Set<number>>(new Set([0, 2, 3]));
  const [stocked, setStocked] = useState<Set<number>>(new Set());
  const [batch, setBatch] = useState(0); // batches waiting at the depot (polling mode)
  const [pings, setPings] = useState<{ id: number; stall: number }[]>([]);
  const [wasted, setWasted] = useState(0);
  const [pollsLeft, setPollsLeft] = useState(0);
  const [wave, setWave] = useState(0);
  const seq = useRef(0);

  // Polling: every interested stall asks, every 1.2s, for a while.
  useInterval(() => {
    const asking = [...subs];
    setPings((p) => [...p, ...asking.map((stall) => ({ id: ++seq.current, stall }))].slice(-18));
    setTimeout(() => setPings((p) => p.slice(asking.length)), 900);
    if (batch > 0) {
      setStocked(new Set(asking));
      setBatch(0);
    } else setWasted((w) => w + asking.length);
    setPollsLeft((n) => n - 1);
  }, !observer && pollsLeft > 0 && subs.size ? 1200 : null);

  function toggleSub(i: number) {
    setSubs((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  }

  function newBatch() {
    setStocked(new Set());
    if (observer) {
      setWave((w) => w + 1);
      setTimeout(() => setStocked(new Set(subs)), 650);
    } else {
      setBatch(1);
      setPollsLeft((n) => Math.max(n, 8));
    }
  }

  return (
    <DemoFrame title="Sardino → stalls in Oyingbo market" hint="From the essay that started it all: “Design Patterns for JavaScript. Observer”. Tap a stall to subscribe it.">
      <div className="relative">
        <Stamp show={!observer && wasted >= 12}>{wasted} wasted trips</Stamp>
        <div className="mx-auto flex w-max flex-col items-center">
          <motion.div
            key={wave}
            animate={wave ? { scale: [1, 1.15, 1], rotate: [0, -6, 0] } : {}}
            className="grid size-16 place-items-center rounded-2xl bg-indigo text-indigo-ink shadow-[0_10px_24px_-10px_rgba(0,0,0,.7)]"
          >
            <Truck aria-hidden className="size-8" />
          </motion.div>
          <p className="mt-1 text-xs font-semibold text-muted">Sardino depot {batch > 0 && <span className="text-ochre">· batch waiting</span>}</p>
        </div>

        <ul className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {STALLS.map((name, i) => {
            const subbed = subs.has(i);
            const has = stocked.has(i);
            return (
              <li key={name} className="relative">
                <AnimatePresence>
                  {observer && subbed && wave > 0 && (
                    <motion.span
                      key={`${wave}-${i}`}
                      initial={{ y: -70, opacity: 0, scale: 0.5 }}
                      animate={{ y: -6, opacity: [0, 1, 0], scale: 1 }}
                      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute left-1/2 top-0 -translate-x-1/2 text-ochre"
                    >
                      <BellRing aria-hidden className="size-4" />
                    </motion.span>
                  )}
                  {pings
                    .filter((p) => p.stall === i)
                    .map((p) => (
                      <motion.span
                        key={p.id}
                        initial={{ y: 0, opacity: 1 }}
                        animate={{ y: -46, opacity: 0 }}
                        transition={{ duration: 0.9 }}
                        className="absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap rounded bg-paper-3 px-1 text-[0.6rem] text-ink-2"
                      >
                        any sardine?
                      </motion.span>
                    ))}
                </AnimatePresence>
                <motion.button
                  type="button"
                  onClick={() => toggleSub(i)}
                  aria-pressed={subbed}
                  whileTap={{ scale: 0.9 }}
                  animate={has ? { y: [0, -8, 0] } : {}}
                  className={cn(
                    "flex w-full flex-col items-center gap-1 rounded-xl px-1 py-3 text-center ring-1 transition-colors",
                    has ? "bg-live/15 ring-live/50" : subbed ? "bg-ochre/10 ring-ochre/50" : "bg-paper-3/50 ring-rule",
                  )}
                >
                  {has ? <Fish aria-hidden className="size-5 text-live" /> : <Store aria-hidden className={cn("size-5", subbed ? "text-ochre" : "text-muted")} />}
                  <span className="text-[0.7rem] font-semibold leading-tight">{name}</span>
                  <span className="text-[0.6rem] text-muted">{subbed ? "subscribed" : "not listening"}</span>
                </motion.button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <DemoButton tone="primary" onClick={newBatch}>
          <Truck aria-hidden className="size-4" /> New batch lands
        </DemoButton>
        <Toggle
          on={observer}
          onChange={(v) => {
            setObserver(v);
            setWasted(0);
            setPollsLeft(v ? 0 : 8);
          }}
          label="Observer"
        />
        <span className="tabular ml-auto text-sm text-muted">
          wasted trips <strong className={wasted ? "text-vermilion" : "text-live"}>{wasted}</strong>
        </span>
      </div>
    </DemoFrame>
  );
}
