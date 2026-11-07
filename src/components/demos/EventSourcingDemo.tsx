"use client";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { DemoButton, DemoFrame, Toggle } from "./DemoFrame";
import { Stamp } from "./LogList";

/**
 * A wallet as a list of facts. Drag through time and the balance rebuilds
 * itself by replaying events. Switch to "balance column only" and the history
 *, and any way to explain the number, is gone.
 */
type Event = { id: number; kind: "Opened" | "Deposit" | "Withdrawal" | "Fee" | "Refund"; amount: number; note: string };

const SEED: Event[] = [
  { id: 1, kind: "Opened", amount: 0, note: "Wallet created" },
  { id: 2, kind: "Deposit", amount: 10_000, note: "Bank transfer" },
  { id: 3, kind: "Withdrawal", amount: -2_500, note: "Airtime" },
  { id: 4, kind: "Fee", amount: -50, note: "SMS alert fee" },
  { id: 5, kind: "Deposit", amount: 4_000, note: "Gift from Mum" },
  { id: 6, kind: "Withdrawal", amount: -6_000, note: "Electricity token" },
];
const EXTRA: Omit<Event, "id">[] = [
  { kind: "Refund", amount: 1_200, note: "Failed vend refunded" },
  { kind: "Withdrawal", amount: -3_000, note: "Data bundle" },
  { kind: "Deposit", amount: 7_500, note: "Salary (part)" },
  { kind: "Fee", amount: -25, note: "Stamp duty" },
];

const naira = (k: number) => `${k < 0 ? "−" : ""}₦${Math.abs(k).toLocaleString("en-NG")}`;

export function EventSourcingDemo() {
  const [sourced, setSourced] = useState(true);
  const [events, setEvents] = useState<Event[]>(SEED);
  const [cursor, setCursor] = useState(SEED.length);

  const upto = events.slice(0, cursor);
  const balance = upto.reduce((s, e) => s + e.amount, 0);
  const finalBalance = events.reduce((s, e) => s + e.amount, 0);

  function add() {
    const next = EXTRA[(events.length - SEED.length) % EXTRA.length];
    const id = events.length + 1;
    setEvents((e) => [...e, { ...next, id }]);
    setCursor(events.length + 1);
  }

  return (
    <DemoFrame title="wallet_events · append-only" hint="Every balance, past or present, is a fold over the events up to that point.">
      <div className="relative">
        <Stamp show={!sourced}>no way to explain this</Stamp>
        <div className="flex items-end justify-between gap-4 rounded-2xl bg-paper p-4 ring-1 ring-rule">
          <div>
            <p className="text-xs font-medium text-muted">{sourced ? `Balance after event ${cursor} of ${events.length}` : "balance (stored column)"}</p>
            <motion.p key={sourced ? balance : finalBalance} initial={{ y: -10, opacity: 0.3 }} animate={{ y: 0, opacity: 1 }} className="tabular font-display text-4xl font-extrabold">
              {naira(sourced ? balance : finalBalance)}
            </motion.p>
          </div>
          <DemoButton onClick={add}>
            <Plus aria-hidden className="size-4" /> New event
          </DemoButton>
        </div>

        <label className={cn("mt-4 block", !sourced && "pointer-events-none opacity-30")}>
          <span className="text-sm font-semibold text-muted">Drag through time</span>
          <input
            type="range"
            min={1}
            max={events.length}
            value={cursor}
            onChange={(e) => setCursor(Number(e.target.value))}
            className="mt-2 w-full accent-[var(--ochre)]"
            aria-label="Replay events up to"
          />
        </label>

        <ol className={cn("mt-3 space-y-1.5 transition-opacity", !sourced && "opacity-10 blur-[2px]")}>
          <AnimatePresence initial={false}>
            {events.map((e, i) => (
              <motion.li
                key={e.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: i < cursor ? 1 : 0.3, x: 0 }}
                className="grid grid-cols-[1.5rem_6.5rem_1fr_auto] items-center gap-2 rounded-lg bg-paper-3/50 px-3 py-1.5 text-sm"
              >
                <span className="tabular text-xs text-muted">{e.id}</span>
                <span className="font-semibold">{e.kind}</span>
                <span className="truncate text-ink-2">{e.note}</span>
                <span className={cn("tabular font-semibold", e.amount > 0 ? "text-live" : e.amount < 0 ? "text-ochre" : "text-muted")}>{e.amount ? naira(e.amount) : "-"}</span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      </div>
      <div className="mt-4">
        <Toggle on={sourced} onChange={setSourced} label="Event sourcing" />
      </div>
    </DemoFrame>
  );
}
