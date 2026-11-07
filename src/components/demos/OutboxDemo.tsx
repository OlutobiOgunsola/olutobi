"use client";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState, type ReactNode } from "react";
import { Database, Mail, Power, Radio, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/cn";
import { DemoButton, DemoFrame, Toggle } from "./DemoFrame";
import { LogList, Stamp } from "./LogList";
import { useLog } from "./hooks";

/**
 * Place an order, then crash between "save the order" and "send the email".
 * Without an outbox the email is gone forever. With one, the event was saved in
 * the same transaction, and a relay delivers it after the restart.
 */
type Order = { id: number; emailed: boolean };

export function OutboxDemo() {
  const [outbox, setOutbox] = useState(true);
  const [crash, setCrash] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [pending, setPending] = useState<number[]>([]);
  const [inbox, setInbox] = useState<number[]>([]);
  const [down, setDown] = useState(false);
  const [flying, setFlying] = useState<number | null>(null);
  const { lines, push, clear } = useLog();
  const seq = useRef(1040);

  function send(id: number) {
    setFlying(id);
    setTimeout(() => {
      setFlying(null);
      setInbox((i) => [id, ...i].slice(0, 4));
      setOrders((o) => o.map((x) => (x.id === id ? { ...x, emailed: true } : x)));
    }, 700);
  }

  function place() {
    if (down) return;
    const id = ++seq.current;
    setOrders((o) => [{ id, emailed: false }, ...o].slice(0, 4));
    if (outbox) {
      setPending((p) => [...p, id]);
      push(`BEGIN · INSERT order #${id} · INSERT outbox(order.created) · COMMIT`, "ok");
    } else push(`INSERT order #${id} · COMMIT`, "ok");

    if (crash) {
      setDown(true);
      push("Server crashed before the email was sent.", "bad");
      return;
    }
    if (outbox) {
      setTimeout(() => {
        setPending((p) => p.filter((x) => x !== id));
        send(id);
        push(`Relay published order.created for #${id}`, "ok");
      }, 400);
    } else {
      send(id);
      push(`Sent confirmation for #${id}`, "ok");
    }
  }

  function restart() {
    setDown(false);
    if (outbox && pending.length) {
      push(`Restarted. Relay found ${pending.length} unsent event(s) in the outbox.`, "ok");
      pending.forEach((id, i) => setTimeout(() => send(id), 300 + i * 350));
      setPending([]);
    } else push("Restarted. Nothing remembers that an email was owed.", outbox ? "info" : "bad");
  }

  const lost = orders.filter((o) => !o.emailed).length > 0 && !down && !outbox;

  return (
    <DemoFrame title="POST /orders → save → email the customer" hint="With crash mode on, the server dies right after the database write.">
      <div className="relative grid grid-cols-3 gap-2 text-center sm:gap-3">
        <Stamp show={lost}>customer never told</Stamp>
        <Box icon={Database} title="Database" tone={down ? "bad" : "default"}>
          {orders.map((o) => (
            <p key={o.id} className="tabular font-mono text-[0.7rem]">
              order #{o.id}
            </p>
          ))}
          {outbox && pending.length > 0 && (
            <p className="mt-1 rounded bg-ochre/20 px-1 font-mono text-[0.65rem] text-ochre">outbox: {pending.length} event(s)</p>
          )}
        </Box>
        <Box icon={Radio} title={outbox ? "Outbox relay" : "Direct send"} tone={outbox ? "accent" : "default"}>
          <AnimatePresence>
            {flying !== null && (
              <motion.span
                key={flying}
                initial={{ x: -40, opacity: 0 }}
                animate={{ x: 40, opacity: [0, 1, 1, 0] }}
                transition={{ duration: 0.7 }}
                className="inline-flex text-ochre"
              >
                <Mail aria-hidden className="size-5" />
              </motion.span>
            )}
          </AnimatePresence>
        </Box>
        <Box icon={Mail} title="Customer inbox" tone={inbox.length ? "ok" : "default"}>
          {inbox.map((id) => (
            <motion.p key={id} initial={{ scale: 0 }} animate={{ scale: 1 }} className="tabular text-[0.7rem] text-live">
              Order #{id} confirmed
            </motion.p>
          ))}
        </Box>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {down ? (
          <DemoButton tone="primary" onClick={restart}>
            <Power aria-hidden className="size-4" /> Restart server
          </DemoButton>
        ) : (
          <DemoButton tone="primary" onClick={place}>
            <ShoppingBag aria-hidden className="size-4" /> Place an order
          </DemoButton>
        )}
        <label className="inline-flex items-center gap-2 text-sm text-ink-2">
          <input type="checkbox" checked={crash} onChange={(e) => setCrash(e.target.checked)} className="size-4 accent-[var(--vermilion)]" />
          Crash after the DB write
        </label>
        <button
          type="button"
          onClick={() => {
            setOrders([]);
            setPending([]);
            setInbox([]);
            setDown(false);
            clear();
          }}
          className="ml-auto text-xs text-muted hover:text-ink"
        >
          reset
        </button>
      </div>
      <div className="mt-4">
        <Toggle on={outbox} onChange={setOutbox} label="Outbox" />
      </div>
      <LogList lines={lines} className="mt-4" />
    </DemoFrame>
  );
}

function Box({
  icon: Icon,
  title,
  tone,
  children,
}: {
  icon: typeof Database;
  title: string;
  tone: "default" | "bad" | "ok" | "accent";
  children: ReactNode;
}) {
  return (
    <motion.div
      animate={tone === "bad" ? { rotate: [-1.5, 1.5, -1.5] } : { rotate: 0 }}
      transition={tone === "bad" ? { duration: 0.4, repeat: Infinity } : {}}
      className={cn(
        "min-h-[8.5rem] rounded-xl p-2.5 ring-1 sm:p-3",
        tone === "bad" ? "bg-vermilion/10 ring-vermilion/50" : tone === "ok" ? "bg-live/10 ring-live/40" : tone === "accent" ? "bg-indigo/10 ring-indigo/40" : "bg-paper-3/60 ring-rule",
      )}
    >
      <Icon aria-hidden className="mx-auto size-5 text-ink-2" />
      <p className="mt-1 text-xs font-semibold">{title}</p>
      <div className="mt-2 space-y-0.5">{children}</div>
    </motion.div>
  );
}
