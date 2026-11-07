"use client";
import { LayoutGroup, motion } from "motion/react";
import { useState } from "react";
import { Send, Skull, Swords } from "lucide-react";
import { cn } from "@/lib/cn";
import { DemoButton, DemoFrame, Toggle } from "./DemoFrame";
import { LogList, Stamp } from "./LogList";
import { useLog } from "./hooks";

/**
 * You fought a battle. The client sends the server your orders and the result.
 * A doctored client claims 999 loot. An authoritative server ignores the claim,
 * replays the orders through the same deterministic simulation, and applies its own.
 */
const ORDERS = ["flank left", "hold the bridge", "charge"] as const;

// The shared, deterministic simulation: same orders in, same loot out, on client and server.
function simulate(orders: readonly string[]) {
  return orders.reduce((loot, o, i) => loot + ((o.length * 7 + i * 13) % 50) + 10, 0);
}

const RIVALS = [
  { name: "Lagos Lions", loot: 162 },
  { name: "Ibadan Iron", loot: 141 },
  { name: "Kano Kings", loot: 118 },
];

export function ReplayDemo() {
  const [authoritative, setAuthoritative] = useState(true);
  const [you, setYou] = useState<number | null>(null);
  const [cheated, setCheated] = useState(false);
  const { lines, push, clear } = useLog();
  const honest = simulate(ORDERS);

  function submit(claim: number) {
    const doctored = claim !== honest;
    push(`Client sends orders [${ORDERS.join(", ")}] and claims ${claim} loot`, doctored ? "bad" : "info");
    if (authoritative) {
      const replayed = simulate(ORDERS);
      push(`Server replays the orders → ${replayed} loot. ${doctored ? "Claim ignored." : "Claim matches."}`, "ok");
      setYou(replayed);
      setCheated(false);
    } else {
      push(`Server trusts the client → ${claim} loot`, doctored ? "bad" : "info");
      setYou(claim);
      setCheated(doctored);
    }
  }

  const board = [...RIVALS, ...(you !== null ? [{ name: "You", loot: you }] : [])].sort((a, b) => b.loot - a.loot);

  return (
    <DemoFrame title="POST /battles/:id/finish · { orders, claimedLoot }" hint={`Your three orders really earn ${honest} loot.`}>
      <div className="relative grid gap-4 sm:grid-cols-[1fr_1fr]">
        <Stamp show={cheated}>cheater on top</Stamp>
        <div className="rounded-2xl bg-paper-3/50 p-4 ring-1 ring-rule">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-muted">
            <Swords aria-hidden className="size-3.5" /> Your orders
          </p>
          <ol className="mt-2 space-y-1">
            {ORDERS.map((o, i) => (
              <li key={o} className="text-sm">
                <span className="tabular mr-2 text-ochre">{i + 1}.</span>
                {o}
              </li>
            ))}
          </ol>
        </div>
        <LayoutGroup>
          <ol className="space-y-1.5">
            {board.map((r, i) => (
              <motion.li
                key={r.name}
                layout
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-2 text-sm ring-1",
                  r.name === "You" ? (cheated ? "bg-vermilion/15 ring-vermilion/50" : "bg-live/10 ring-live/40") : "bg-paper ring-rule",
                )}
              >
                <span className="font-semibold">
                  <span className="tabular mr-2 text-muted">{i + 1}</span>
                  {r.name}
                </span>
                <span className="tabular font-display font-extrabold">{r.loot}</span>
              </motion.li>
            ))}
          </ol>
        </LayoutGroup>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <DemoButton tone="primary" onClick={() => submit(honest)}>
          <Send aria-hidden className="size-4" /> Submit honestly
        </DemoButton>
        <DemoButton tone="danger" onClick={() => submit(999)}>
          <Skull aria-hidden className="size-4" /> Submit doctored (999 loot)
        </DemoButton>
        <button
          type="button"
          onClick={() => {
            setYou(null);
            setCheated(false);
            clear();
          }}
          className="ml-auto text-xs text-muted hover:text-ink"
        >
          reset
        </button>
      </div>
      <div className="mt-4">
        <Toggle on={authoritative} onChange={setAuthoritative} label="Server replays orders" />
      </div>
      <LogList lines={lines} className="mt-4" />
    </DemoFrame>
  );
}
