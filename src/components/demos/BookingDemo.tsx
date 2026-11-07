"use client";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { DemoButton, DemoFrame } from "./DemoFrame";

/** Room 204's calendar: overlap checks, one transaction, a field-level history. */
type Booking = { id: string; guest: string; from: number; to: number; color: string };
type Log = { id: number; text: string; ok: boolean };

const NIGHTS = 12;
const START: Booking[] = [{ id: "BK-1041", guest: "Mrs Adeyemi", from: 2, to: 5, color: "bg-indigo" }];

export function BookingDemo() {
  const [bookings, setBookings] = useState<Booking[]>(START);
  const [log, setLog] = useState<Log[]>([]);
  const [shake, setShake] = useState(0);

  const overlaps = (from: number, to: number, ignore?: string) =>
    bookings.some((b) => b.id !== ignore && from < b.to && to > b.from);

  function push(text: string, ok: boolean) {
    setLog((l) => [{ id: Date.now() + Math.random(), text, ok }, ...l].slice(0, 4));
  }

  function book(guest: string, from: number, to: number, color: string) {
    if (overlaps(from, to)) {
      setShake((s) => s + 1);
      return push(`Rejected for ${guest}: nights ${from + 1}–${to} overlap an existing stay. Nothing written.`, false);
    }
    const id = `BK-${1042 + bookings.length}`;
    setBookings((b) => [...b, { id, guest, from, to, color }]);
    push(`Committed ${id}: booking, room status and history in one transaction.`, true);
  }

  function extend() {
    const b = bookings[0];
    if (overlaps(b.from, b.to + 1, b.id) || b.to >= NIGHTS) {
      setShake((s) => s + 1);
      return push(`Rejected. Can't extend ${b.id} because the next night is taken.`, false);
    }
    setBookings((all) => all.map((x) => (x.id === b.id ? { ...x, to: x.to + 1 } : x)));
    push(`Logged ${b.id}: check_out night ${b.to} → ${b.to + 1}, reason "guest request", by front desk.`, true);
  }

  return (
    <DemoFrame title="Room 204 · Deluxe King · ZignaStay" hint="Sample guests. Availability is checked first; the booking, room and audit entries commit together or not at all.">
      <motion.div
        key={shake}
        animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : undefined}
        transition={{ duration: 0.4 }}
        className="relative"
      >
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${NIGHTS}, minmax(0, 1fr))` }}>
          {Array.from({ length: NIGHTS }, (_, i) => (
            <span key={i} className="rounded-md bg-paper-3/70 py-1 text-center font-mono text-[0.6rem] text-muted ring-1 ring-rule">
              {i + 1}
            </span>
          ))}
        </div>
        <div className="relative mt-2 h-24">
          <AnimatePresence>
            {bookings.map((b, i) => (
              <motion.div
                key={b.id}
                layout
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 220, damping: 18 }}
                className={cn("absolute flex h-10 origin-left items-center rounded-xl px-2 text-[0.7rem] font-semibold text-on-accent", b.color)}
                style={{ left: `${(b.from / NIGHTS) * 100}%`, width: `${((b.to - b.from) / NIGHTS) * 100}%`, top: i % 2 ? 48 : 0 }}
              >
                <span className="truncate">
                  {b.guest} · {b.id}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      <div className="mt-2 flex flex-wrap gap-2">
        <DemoButton tone="danger" onClick={() => book("Mr Bello", 3, 6, "bg-ochre")}>
          Book nights 4–6
        </DemoButton>
        <DemoButton tone="primary" onClick={() => book("Ms Okafor", 7, 10, "bg-pink")}>
          Book nights 8–10
        </DemoButton>
        <DemoButton onClick={extend}>Extend BK-1041 +1</DemoButton>
        <button
          type="button"
          onClick={() => {
            setBookings(START);
            setLog([]);
          }}
          className="ml-auto font-mono text-xs text-muted hover:text-ink"
        >
          reset
        </button>
      </div>

      <ul className="mt-4 min-h-[7rem] space-y-1.5 font-mono text-[0.7rem]">
        <AnimatePresence initial={false}>
          {log.map((l) => (
            <motion.li
              key={l.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className={cn("rounded-lg px-3 py-1.5", l.ok ? "bg-live/10 text-live" : "bg-vermilion/10 text-vermilion")}
            >
              {l.text}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </DemoFrame>
  );
}
