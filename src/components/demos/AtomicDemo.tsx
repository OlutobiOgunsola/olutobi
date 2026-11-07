"use client";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { ArrowRight, PlugZap, Send } from "lucide-react";
import { cn } from "@/lib/cn";
import { DemoButton, DemoFrame, Toggle } from "./DemoFrame";
import { LogList, Stamp } from "./LogList";
import { useLog } from "./hooks";

/** Send ₦5,000 from Tunde to Ada, then pull the plug between the debit and the credit. */
const START = { tunde: 20_000, ada: 5_000 };
const AMOUNT = 5_000;
const naira = (k: number) => `₦${k.toLocaleString("en-NG")}`;

export function AtomicDemo() {
  const [atomic, setAtomic] = useState(true);
  const [wallets, setWallets] = useState(START);
  const [phase, setPhase] = useState<"idle" | "debit" | "credit" | "crashed" | "rollback">("idle");
  const { lines, push, clear } = useLog();
  const busy = useRef(false);

  function run(crash: boolean) {
    if (busy.current) return;
    busy.current = true;
    const before = wallets;
    setPhase("debit");
    setWallets((w) => ({ ...w, tunde: w.tunde - AMOUNT }));
    push(`BEGIN · debit Tunde ${naira(AMOUNT)}`);
    setTimeout(() => {
      if (!crash) {
        setPhase("credit");
        setWallets((w) => ({ ...w, ada: w.ada + AMOUNT }));
        push(`credit Ada ${naira(AMOUNT)} · COMMIT`, "ok");
        setTimeout(() => {
          setPhase("idle");
          busy.current = false;
        }, 600);
        return;
      }
      setPhase("crashed");
      push("Power cut before the credit was written.", "bad");
      setTimeout(() => {
        if (atomic) {
          setPhase("rollback");
          setWallets(before);
          push("Transaction never committed → ROLLBACK. Tunde's money is back.", "ok");
        } else {
          setPhase("idle");
          push(`No transaction: the debit stuck. ${naira(AMOUNT)} is just… gone.`, "bad");
        }
        setTimeout(() => {
          setPhase("idle");
          busy.current = false;
        }, 700);
      }, 900);
    }, 900);
  }

  const total = wallets.tunde + wallets.ada;
  const lost = START.tunde + START.ada - total;

  return (
    <DemoFrame title="UPDATE wallets … (two writes, one transfer)" hint="Total money in the system should never change, whatever goes wrong.">
      <div className="relative">
        <Stamp show={lost > 0}>{naira(lost)} vanished</Stamp>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <Wallet name="Tunde" amount={wallets.tunde} pulse={phase === "debit"} wobble={phase === "rollback"} />
          <Pipe phase={phase} />
          <Wallet name="Ada" amount={wallets.ada} pulse={phase === "credit"} wobble={false} />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <DemoButton tone="primary" onClick={() => run(false)}>
          <Send aria-hidden className="size-4" /> Send ₦5,000
        </DemoButton>
        <DemoButton tone="danger" onClick={() => run(true)}>
          <PlugZap aria-hidden className="size-4" /> Send &amp; pull the plug
        </DemoButton>
        <button
          type="button"
          onClick={() => {
            setWallets(START);
            clear();
          }}
          className="ml-auto text-xs text-muted hover:text-ink"
        >
          reset
        </button>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <Toggle on={atomic} onChange={setAtomic} label="Transaction" />
        <span className={cn("tabular text-sm font-semibold", lost > 0 ? "text-vermilion" : "text-live")}>Money in the system: {naira(total)}</span>
      </div>
      <LogList lines={lines} className="mt-4" />
    </DemoFrame>
  );
}

function Wallet({ name, amount, pulse, wobble }: { name: string; amount: number; pulse: boolean; wobble: boolean }) {
  return (
    <motion.div
      animate={pulse ? { scale: [1, 1.06, 1] } : wobble ? { rotate: [0, -3, 3, 0] } : {}}
      transition={{ duration: 0.45 }}
      className="rounded-2xl bg-paper-3/60 p-4 ring-1 ring-rule"
    >
      <p className="text-sm font-semibold text-muted">{name}</p>
      <motion.p key={amount} initial={{ y: -8, opacity: 0.4 }} animate={{ y: 0, opacity: 1 }} className="tabular font-display text-2xl font-extrabold sm:text-3xl">
        {naira(amount)}
      </motion.p>
    </motion.div>
  );
}

function Pipe({ phase }: { phase: string }) {
  return (
    <div className="relative grid w-14 place-items-center sm:w-20">
      <ArrowRight aria-hidden className={cn("size-6 transition-colors", phase === "crashed" ? "text-vermilion" : "text-muted")} />
      {phase === "debit" && (
        <motion.span
          className="absolute left-0 size-3 rounded-full bg-ochre shadow-[0_3px_6px_rgba(0,0,0,.5)]"
          initial={{ x: 0 }}
          animate={{ x: 48 }}
          transition={{ duration: 0.8 }}
        />
      )}
      {phase === "crashed" && (
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1, rotate: [0, 15, -15, 0] }} className="absolute -top-6 text-xs font-extrabold text-vermilion">
          ZAP
        </motion.span>
      )}
    </div>
  );
}
