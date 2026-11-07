"use client";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { RefreshCw, Save } from "lucide-react";
import { cn } from "@/lib/cn";
import { DemoButton, DemoFrame, Toggle } from "./DemoFrame";
import { LogList, Stamp } from "./LogList";
import { useLog } from "./hooks";

/** Two admins open the same price. Both edit. Both press save. */
type Row = { price: number; version: number; by: string };
type Draft = { price: number; version: number };

const ADMINS = [
  { id: "A", name: "Bola (store manager)", next: 3000 },
  { id: "B", name: "Chidi (weekend shift)", next: 2800 },
] as const;

export function OptimisticLockDemo() {
  const [locking, setLocking] = useState(true);
  const [row, setRow] = useState<Row>({ price: 2500, version: 3, by: "seed" });
  const [drafts, setDrafts] = useState<Record<string, Draft>>({ A: { price: 2500, version: 3 }, B: { price: 2500, version: 3 } });
  const [lostUpdate, setLostUpdate] = useState(false);
  const [conflict, setConflict] = useState<string | null>(null);
  const { lines, push, clear } = useLog();

  function edit(id: string, price: number) {
    setDrafts((d) => ({ ...d, [id]: { ...d[id], price } }));
  }

  function save(id: string) {
    const d = drafts[id];
    const who = ADMINS.find((a) => a.id === id)!.name.split(" ")[0];
    if (locking && d.version !== row.version) {
      setConflict(id);
      push(`UPDATE … WHERE version = ${d.version} → 0 rows. ${who} is told: someone changed this, reload.`, "ok");
      return;
    }
    if (!locking && row.by !== "seed" && row.by !== who && d.version !== row.version) {
      setLostUpdate(true);
      push(`${who} overwrote ₦${row.price.toLocaleString()} without ever seeing it. ${row.by}'s change is silently lost.`, "bad");
    } else push(`${who} saved ₦${d.price.toLocaleString()} → version ${row.version + 1}`, "ok");
    setRow({ price: d.price, version: row.version + 1, by: who });
    setDrafts((all) => ({ ...all, [id]: { price: d.price, version: row.version + 1 } }));
    setConflict(null);
  }

  function reload(id: string) {
    setDrafts((d) => ({ ...d, [id]: { price: row.price, version: row.version } }));
    setConflict(null);
  }

  function reset() {
    setRow({ price: 2500, version: 3, by: "seed" });
    setDrafts({ A: { price: 2500, version: 3 }, B: { price: 2500, version: 3 } });
    setLostUpdate(false);
    setConflict(null);
    clear();
  }

  return (
    <DemoFrame title="products · jollof pack · price" hint="Try it: edit and save as Bola, then save as Chidi without reloading.">
      <div className="relative">
        <Stamp show={lostUpdate}>lost update</Stamp>
        <div className="mb-4 flex items-baseline justify-between rounded-2xl bg-paper p-4 ring-1 ring-rule">
          <span className="text-sm text-muted">In the database</span>
          <motion.span key={row.version} initial={{ scale: 1.3, color: "var(--ochre)" }} animate={{ scale: 1, color: "var(--ink)" }} className="tabular font-display text-2xl font-extrabold">
            ₦{row.price.toLocaleString()} <span className="text-sm font-semibold text-muted">v{row.version}</span>
          </motion.span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {ADMINS.map((a) => {
            const d = drafts[a.id];
            const stale = d.version !== row.version;
            return (
              <motion.div
                key={a.id}
                animate={conflict === a.id ? { x: [0, -8, 8, -5, 5, 0] } : {}}
                transition={{ duration: 0.4 }}
                className={cn("rounded-2xl p-4 ring-1", conflict === a.id ? "bg-indigo/10 ring-indigo/50" : "bg-paper-3/60 ring-rule")}
              >
                <p className="text-sm font-semibold">{a.name}</p>
                <p className="tabular mt-1 text-xs text-muted">
                  opened v{d.version} {stale && <span className="text-ochre">· stale</span>}
                </p>
                <div className="mt-3 flex gap-1.5">
                  {[2500, a.next].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => edit(a.id, p)}
                      className={cn("tabular rounded-full px-3 py-1 text-sm font-semibold ring-1 transition-transform active:scale-90", d.price === p ? "bg-ochre text-on-accent ring-ochre" : "bg-paper ring-rule")}
                    >
                      ₦{p.toLocaleString()}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <DemoButton tone="primary" onClick={() => save(a.id)}>
                    <Save aria-hidden className="size-4" /> Save
                  </DemoButton>
                  <AnimatePresence>
                    {(conflict === a.id || stale) && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                        <DemoButton onClick={() => reload(a.id)}>
                          <RefreshCw aria-hidden className="size-4" /> Reload
                        </DemoButton>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <Toggle on={locking} onChange={setLocking} label="Version check" />
        <button type="button" onClick={reset} className="text-xs text-muted hover:text-ink">
          reset
        </button>
      </div>
      <LogList lines={lines} className="mt-4" />
    </DemoFrame>
  );
}
