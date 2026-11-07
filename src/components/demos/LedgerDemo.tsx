"use client";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { CreditCard, Receipt, Repeat, Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { DemoButton, DemoFrame } from "./DemoFrame";

/** Issue a levy, pay it, replay the webhook. The trial balance never moves off zero. */
type Entry = { id: number; tx: string; account: string; amount: number };
const LEVY = 25_000;
const ACCOUNTS = ["cash", "dues_receivable", "levy_income"] as const;

export function LedgerDemo() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [status, setStatus] = useState<"none" | "issued" | "processing" | "paid">("none");
  const [toast, setToast] = useState<{ id: number; text: string; ok: boolean } | null>(null);

  function post(tx: string, lines: [string, number][]) {
    const base = Date.now();
    setEntries((e) => [...lines.map(([account, amount], i) => ({ id: base + i, tx, account, amount })), ...e].slice(0, 8));
  }
  function say(text: string, ok = true) {
    setToast({ id: Date.now(), text, ok });
  }

  function issue() {
    post("levy · Flat 4B · Nov security dues", [
      ["dues_receivable", LEVY],
      ["levy_income", -LEVY],
    ]);
    setStatus("issued");
    say("Levy issued: receivable +₦25,000, income −₦25,000 → Σ 0");
  }
  function pay() {
    setStatus("processing");
    setTimeout(() => {
      post("payment · Paystack ref PSK-88213", [
        ["cash", LEVY],
        ["dues_receivable", -LEVY],
      ]);
      setStatus("paid");
      say("Webhook signature verified (HMAC). processing → paid. Ledger posted once.");
    }, 450);
  }
  function replay() {
    say("Webhook replay → status already 'paid' → UPDATE matched 0 rows → nothing posted.", false);
  }

  const balances = Object.fromEntries(ACCOUNTS.map((a) => [a, entries.filter((e) => e.account === a).reduce((s, e) => s + e.amount, 0)]));
  const trial = entries.reduce((s, e) => s + e.amount, 0);
  const naira = (k: number) => `${k < 0 ? "−" : ""}₦${Math.abs(k).toLocaleString("en-NG")}`;

  return (
    <DemoFrame title="sentinel · estate ledger · Flat 4B" hint="Balances are never stored. They're sums of entries. A replayed webhook can't post twice.">
      <div className="flex flex-wrap gap-2">
        <DemoButton tone="primary" onClick={issue} disabled={status !== "none" && status !== "paid"}>
          <Receipt aria-hidden className="size-4" /> Issue ₦25k levy
        </DemoButton>
        <DemoButton onClick={pay} disabled={status !== "issued"}>
          <CreditCard aria-hidden className="size-4" /> Resident pays
        </DemoButton>
        <DemoButton tone="danger" onClick={replay} disabled={status !== "paid"}>
          <Repeat aria-hidden className="size-4" /> Replay webhook
        </DemoButton>
        <button
          type="button"
          onClick={() => {
            setEntries([]);
            setStatus("none");
            setToast(null);
          }}
          className="ml-auto font-mono text-xs text-muted hover:text-ink"
        >
          reset
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {ACCOUNTS.map((a) => {
          const v = balances[a];
          return (
            <div key={a} className="rounded-2xl bg-paper-3/60 p-3 ring-1 ring-rule">
              <p className="font-mono text-xs text-muted">{a}</p>
              <motion.p key={v} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={cn("tabular font-display text-xl font-extrabold", v > 0 ? "text-live" : v < 0 ? "text-ochre" : "text-ink-2")}>
                {naira(v)}
              </motion.p>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between rounded-2xl bg-paper p-3 ring-1 ring-rule">
        <span className="text-sm text-muted">Trial balance (sum of all entries)</span>
        <motion.span
          key={entries.length}
          animate={{ scale: [1, 1.3, 1], rotate: [0, -8, 0] }}
          className="rounded-full bg-live px-3 py-1 font-display text-sm font-extrabold text-on-accent"
        >
          <span className="tabular">{naira(trial)}</span> <Check aria-hidden className="inline size-3.5 align-[-2px]" />
        </motion.span>
      </div>

      <ul className="mt-3 min-h-[8rem] space-y-1 font-mono text-[0.68rem]">
        <AnimatePresence initial={false}>
          {entries.map((e) => (
            <motion.li
              key={e.id}
              layout
              initial={{ opacity: 0, x: e.amount > 0 ? -24 : 24 }}
              animate={{ opacity: 1, x: 0 }}
              className="grid grid-cols-[1fr_auto_auto] gap-3 rounded-lg bg-paper-3/40 px-3 py-1.5"
            >
              <span className="truncate text-muted">{e.tx}</span>
              <span className="text-ink-2">{e.account}</span>
              <span className={e.amount > 0 ? "text-live" : "text-ochre"}>{naira(e.amount)}</span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      <AnimatePresence mode="wait">
        {toast && (
          <motion.p
            key={toast.id}
            initial={{ opacity: 0, y: 10, rotate: -1 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0 }}
            className={cn("mt-3 rounded-xl px-3 py-2 text-[0.75rem]", toast.ok ? "bg-indigo/15 text-indigo" : "bg-vermilion/15 text-vermilion")}
          >
            {toast.text}
          </motion.p>
        )}
      </AnimatePresence>
    </DemoFrame>
  );
}
