"use client";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { ShieldCheck, ShieldOff, Smartphone } from "lucide-react";
import { cn } from "@/lib/cn";
import { DemoButton, DemoFrame, Toggle } from "./DemoFrame";

/**
 * Try to double-charge a customer. With the unique index on, every retry of
 * the same reference collides and resolves to the original charge.
 */
type Packet = { id: number; ref: string };
type Flash = { id: number; ok: boolean; ref: string };

const PRICE = 2000;

export function IdempotencyDemo() {
  const [unique, setUnique] = useState(true);
  const [packets, setPackets] = useState<Packet[]>([]);
  const [ledger, setLedger] = useState<string[]>([]);
  const [flashes, setFlashes] = useState<Flash[]>([]);
  const [stats, setStats] = useState({ requests: 0, blocked: 0 });
  const [purchases, setPurchases] = useState(0);
  const seq = useRef(0);
  const refs = useRef(0);
  const lastRef = useRef<string | null>(null);
  const ledgerRef = useRef<string[]>([]);

  function send(ref: string) {
    const id = ++seq.current;
    setPackets((p) => [...p, { id, ref }]);
    setStats((s) => ({ ...s, requests: s.requests + 1 }));
  }

  const arrived = useRef(new Set<number>());

  function arrive(p: Packet) {
    // onAnimationComplete also fires when the exit animation ends, handle each packet once.
    if (arrived.current.has(p.id)) return;
    arrived.current.add(p.id);
    setPackets((all) => all.filter((x) => x.id !== p.id));
    const duplicate = ledgerRef.current.includes(p.ref);
    const ok = !(unique && duplicate);
    if (ok) {
      ledgerRef.current = [...ledgerRef.current, p.ref];
      setLedger(ledgerRef.current);
    } else {
      setStats((s) => ({ ...s, blocked: s.blocked + 1 }));
    }
    const f = { id: p.id, ok, ref: p.ref };
    setFlashes((fs) => [...fs.slice(-3), f]);
    setTimeout(() => setFlashes((fs) => fs.filter((x) => x.id !== f.id)), 1400);
  }

  function pay() {
    const ref = `ref_${String(++refs.current).padStart(3, "0")}`;
    lastRef.current = ref;
    setPurchases(refs.current);
    send(ref);
  }
  function retry(times = 1) {
    if (!lastRef.current) return pay();
    for (let i = 0; i < times; i++) setTimeout(() => send(lastRef.current!), i * 140);
  }
  function reset() {
    ledgerRef.current = [];
    lastRef.current = null;
    refs.current = 0;
    setLedger([]);
    setPackets([]);
    setPurchases(0);
    setStats({ requests: 0, blocked: 0 });
  }

  const charged = ledger.length * PRICE;
  const overcharged = ledger.length > purchases;

  return (
    <DemoFrame
      title="POST /purchase · unique(partner_id, reference)"
      hint="Each tap of Pay creates a new reference. Retries resend the same one, like a real app after a timeout."
    >
      {/* Track */}
      <div className="relative grid grid-cols-[auto_1fr_auto] items-center gap-3">
        <div className="grid size-16 place-items-center rounded-2xl bg-paper-3 text-center text-[0.65rem] leading-tight text-ink-2 ring-1 ring-rule sm:size-20">
          <Smartphone aria-hidden className="size-6" />
          phone
        </div>
        <div className="relative h-16 rounded-full bg-paper-3/60 ring-1 ring-rule">
          <div className="absolute inset-x-4 top-1/2 h-px -translate-y-1/2 border-t border-dashed border-muted/50" />
          <AnimatePresence>
            {packets.map((p) => (
              <motion.span
                key={p.id}
                className="absolute top-1/2 -mt-3.5 rounded-full bg-ochre px-2 py-1 font-mono text-[0.6rem] font-bold text-on-accent shadow-[0_4px_10px_rgba(0,0,0,.45)]"
                initial={{ left: "2%", scale: 0.4, rotate: -20 }}
                animate={{ left: "78%", scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 1.6 }}
                transition={{ duration: 0.9, ease: [0.3, 0.7, 0.4, 1] }}
                onAnimationComplete={() => arrive(p)}
              >
                {p.ref}
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
        <motion.div
          key={ledger.length + stats.blocked}
          animate={{ scale: [1, 1.12, 1], rotate: [0, -4, 0] }}
          transition={{ duration: 0.35 }}
          className={cn(
            "grid size-16 place-items-center rounded-2xl text-center text-[0.65rem] leading-tight ring-1 sm:size-20",
            unique ? "bg-indigo/15 text-indigo ring-indigo/50" : "bg-vermilion/10 text-vermilion ring-vermilion/40",
          )}
        >
          {unique ? <ShieldCheck aria-hidden className="size-6" /> : <ShieldOff aria-hidden className="size-6" />}
          ledger
        </motion.div>

        {/* Outcome pops */}
        <div className="pointer-events-none absolute -top-3 right-0 flex flex-col items-end gap-1">
          <AnimatePresence>
            {flashes.map((f) => (
              <motion.span
                key={f.id}
                initial={{ opacity: 0, y: 10, scale: 0.5, rotate: f.ok ? -8 : 8 }}
                animate={{ opacity: 1, y: -18, scale: 1, rotate: f.ok ? -3 : 4 }}
                exit={{ opacity: 0, y: -40 }}
                transition={{ type: "spring", stiffness: 400, damping: 14 }}
                className={cn(
                  "rounded-full px-2.5 py-1 font-mono text-[0.65rem] font-bold shadow-lg",
                  f.ok ? "bg-live text-on-accent" : "bg-vermilion text-on-accent",
                )}
              >
                {f.ok ? `charged ${f.ref}` : `duplicate ${f.ref}: blocked`}
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <DemoButton tone="primary" onClick={pay}>
          Pay ₦2,000
        </DemoButton>
        <DemoButton onClick={() => retry(1)}>Timeout → retry</DemoButton>
        <DemoButton tone="danger" onClick={() => retry(5)}>
          Rage-tap ×5
        </DemoButton>
        <button type="button" onClick={reset} className="ml-auto font-mono text-xs text-muted hover:text-ink">
          reset
        </button>
      </div>
      <div className="mt-4">
        <Toggle on={unique} onChange={setUnique} label="Unique index" />
      </div>

      {/* Readout */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          ["purchases", purchases],
          ["requests", stats.requests],
          ["dupes blocked", stats.blocked],
        ].map(([label, v]) => (
          <div key={label} className="rounded-2xl bg-paper-3/70 p-3 ring-1 ring-rule">
            <motion.p key={String(v)} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="tabular font-display text-2xl font-extrabold">
              {v}
            </motion.p>
            <p className="text-xs font-medium text-muted">{label}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-paper-3/70 p-4 ring-1 ring-rule">
        <div>
          <p className="text-xs font-medium text-muted">Customer charged</p>
          <motion.p
            key={charged}
            initial={{ scale: 1.4 }}
            animate={{ scale: 1 }}
            className={cn("tabular font-display text-4xl font-extrabold", overcharged ? "text-vermilion" : "text-live")}
          >
            ₦{charged.toLocaleString("en-NG")}
          </motion.p>
        </div>
        <AnimatePresence mode="wait">
          {purchases > 0 && (
            <motion.span
              key={overcharged ? "bad" : "good"}
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: overcharged ? 6 : -6 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 12 }}
              className={cn(
                "rounded-xl px-3 py-2 text-center font-display text-sm font-extrabold uppercase leading-tight",
                overcharged ? "animate-wiggle bg-vermilion text-on-accent" : "bg-live text-on-accent",
              )}
            >
              {overcharged ? "double charged!" : "retries are boring"}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </DemoFrame>
  );
}
