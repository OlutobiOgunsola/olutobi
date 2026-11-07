"use client";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { Bus, CarFront, Lock, Play } from "lucide-react";
import { cn } from "@/lib/cn";
import { DemoButton, DemoFrame, Toggle } from "./DemoFrame";
import { LogList, Stamp } from "./LogList";
import { useLog } from "./hooks";

/**
 * Tunde pays Ada while Ada pays Tunde. Each transaction locks both wallet rows.
 * Locked in opposite orders, they meet in the middle of the bridge and neither
 * can move. Locked in the same order, one simply waits its turn.
 */
type Pos = number; // percent along the bridge
type Who = "bus" | "car";
const AT = { left: 2, row7: 30, row12: 62, right: 90 };

export function LockOrderingDemo() {
  const [ordered, setOrdered] = useState(false);
  const [pos, setPos] = useState<Record<Who, Pos>>({ bus: AT.left, car: AT.right });
  const [holder, setHolder] = useState<Record<"7" | "12", Who | null>>({ "7": null, "12": null });
  const [stuck, setStuck] = useState(false);
  const [verdict, setVerdict] = useState<"deadlock" | "clear" | null>(null);
  const { lines, push, clear } = useLog(5);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const busy = useRef(false);

  function at(ms: number, fn: () => void) {
    timers.current.push(setTimeout(fn, ms));
  }

  function reset() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    busy.current = false;
    setPos({ bus: AT.left, car: AT.right });
    setHolder({ "7": null, "12": null });
    setStuck(false);
    setVerdict(null);
    clear();
  }

  function run() {
    if (busy.current) return;
    reset();
    busy.current = true;

    if (!ordered) {
      at(200, () => {
        setPos({ bus: AT.row7, car: AT.row12 });
        setHolder({ "7": "bus", "12": "car" });
        push("Tx1 (danfo, Tunde → Ada) locks row #7. Tx2 (Camry, Ada → Tunde) locks row #12.");
      });
      at(1300, () => {
        setStuck(true);
        push("Tx1 waits for #12. Tx2 waits for #7. Horns. Nobody moves.", "bad");
      });
      at(3000, () => {
        setStuck(false);
        setPos((p) => ({ ...p, car: AT.right }));
        setHolder({ "7": "bus", "12": null });
        push("ERROR 40P01 deadlock detected. Postgres aborts Tx2. Ada gets an error.", "bad");
        setVerdict("deadlock");
      });
      at(3700, () => {
        setPos((p) => ({ ...p, bus: AT.row12 }));
        setHolder({ "7": "bus", "12": "bus" });
      });
      at(4500, () => {
        setPos((p) => ({ ...p, bus: AT.right }));
        setHolder({ "7": null, "12": null });
        push("Tx1 commits. Tx2 has to be retried by someone.", "info");
        busy.current = false;
      });
      return;
    }

    // Same order for everyone: lowest id first. The Camry drives round to the same side.
    at(200, () => {
      setPos({ bus: AT.row7, car: AT.left });
      setHolder({ "7": "bus", "12": null });
      push("Both lock the lowest id first. Tx1 gets #7; Tx2 queues behind it for #7.");
    });
    at(1200, () => {
      setPos({ bus: AT.row12, car: AT.left });
      setHolder({ "7": "bus", "12": "bus" });
      push("Tx1 locks #12 · moves the money · COMMIT.", "ok");
    });
    at(2100, () => {
      setPos({ bus: AT.right, car: AT.row7 });
      setHolder({ "7": "car", "12": null });
      push("Locks released. Tx2 gets #7.", "info");
    });
    at(3000, () => {
      setPos({ bus: AT.right, car: AT.row12 });
      setHolder({ "7": "car", "12": "car" });
    });
    at(3800, () => {
      setPos({ bus: AT.right, car: AT.right });
      setHolder({ "7": null, "12": null });
      push("Tx2 commits. A few milliseconds of waiting, zero errors.", "ok");
      setVerdict("clear");
      busy.current = false;
    });
  }

  return (
    <DemoFrame title="two transfers · two row locks · one bridge" hint="From the essay “Two Locks, One Deadlock”. Each lock is a stretch of single-lane bridge.">
      <div className="relative h-36 rounded-xl bg-paper ring-1 ring-rule">
        <Stamp show={verdict === "deadlock"}>deadlock</Stamp>
        <Stamp show={verdict === "clear"} good>
          both crossed
        </Stamp>
        <div className="absolute inset-x-4 top-[62%] h-2 rounded-full bg-paper-3" />
        {(["7", "12"] as const).map((row) => (
          <div
            key={row}
            className={cn(
              "absolute top-[66%] flex -translate-x-1/2 flex-col items-center gap-0.5 text-[0.7rem] font-semibold transition-colors",
              holder[row] === "bus" ? "text-ochre" : holder[row] === "car" ? "text-pink" : "text-muted",
            )}
            style={{ left: `${row === "7" ? AT.row7 + 4 : AT.row12 + 4}%` }}
          >
            <Lock aria-hidden className="size-4" />
            row #{row} · {row === "7" ? "Tunde" : "Ada"}
          </div>
        ))}
        <Vehicle who="bus" left={pos.bus} stuck={stuck} />
        <Vehicle who="car" left={pos.car} stuck={stuck} />
        <AnimatePresence>
          {stuck && (
            <motion.span
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: [1, 1.2, 1], rotate: [-6, 6, -6] }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="absolute left-1/2 top-3 -translate-x-1/2 font-display text-lg font-extrabold text-vermilion"
            >
              PAAAP! PAAAP!
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <DemoButton tone="primary" onClick={run}>
          <Play aria-hidden className="size-4" /> Run both transfers at once
        </DemoButton>
        <Toggle on={ordered} onChange={(v) => { setOrdered(v); reset(); }} label="Lock ordering" />
      </div>
      <LogList lines={lines} className="mt-4" />
    </DemoFrame>
  );
}

function Vehicle({ who, left, stuck }: { who: Who; left: number; stuck: boolean }) {
  const Icon = who === "bus" ? Bus : CarFront;
  return (
    <motion.div
      className={cn("absolute top-[28%] grid size-11 place-items-center rounded-xl text-on-accent shadow-[0_6px_14px_-4px_rgba(0,0,0,.7)]", who === "bus" ? "bg-ochre" : "bg-pink")}
      animate={{ left: `${left}%`, rotate: stuck ? [-5, 5, -5] : 0 }}
      transition={{ left: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }, rotate: stuck ? { duration: 0.25, repeat: Infinity } : { duration: 0.2 } }}
    >
      <Icon aria-hidden className="size-6" />
    </motion.div>
  );
}
