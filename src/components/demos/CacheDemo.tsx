"use client";
import { motion } from "motion/react";
import { useState } from "react";
import { Eye, Tag } from "lucide-react";
import { cn } from "@/lib/cn";
import { DemoButton, DemoFrame, Toggle } from "./DemoFrame";
import { LogList, Stamp } from "./LogList";
import { useInterval, useLog } from "./hooks";

/** Cache-aside with a 10-second TTL. Change the price and see who gets which number. */
const TTL = 10;

export function CacheDemo() {
  const [invalidate, setInvalidate] = useState(true);
  const [db, setDb] = useState(2500);
  const [cache, setCache] = useState<{ value: number; ttl: number } | null>(null);
  const [staleServed, setStaleServed] = useState(false);
  const [flash, setFlash] = useState<"hit" | "miss" | null>(null);
  const { lines, push, clear } = useLog();

  useInterval(() => setCache((c) => (c && c.ttl > 1 ? { ...c, ttl: c.ttl - 1 } : null)), cache ? 1000 : null);

  function read() {
    if (cache) {
      setFlash("hit");
      const stale = cache.value !== db;
      if (stale) setStaleServed(true);
      push(`Cache HIT → ₦${cache.value.toLocaleString()}${stale ? ` (database says ₦${db.toLocaleString()}!)` : ""}`, stale ? "bad" : "ok");
    } else {
      setFlash("miss");
      setCache({ value: db, ttl: TTL });
      push(`Cache MISS → read database ₦${db.toLocaleString()} → cache for ${TTL}s`, "info");
    }
    setTimeout(() => setFlash(null), 500);
  }

  function write() {
    const next = db === 2500 ? 3000 : 2500;
    setDb(next);
    if (invalidate) {
      setCache(null);
      push(`Price → ₦${next.toLocaleString()} · DEL cache:price:jollof`, "ok");
    } else push(`Price → ₦${next.toLocaleString()} · cache left alone`, "bad");
  }

  return (
    <DemoFrame title="GET price · cache-aside · TTL 10s" hint="Read once to warm the cache, change the price, then read again.">
      <div className="relative grid grid-cols-2 gap-3">
        <Stamp show={staleServed}>stale price served</Stamp>
        <motion.div
          animate={flash === "hit" ? { scale: [1, 1.05, 1] } : {}}
          className={cn("rounded-2xl p-4 ring-1", cache ? "bg-indigo/10 ring-indigo/40" : "bg-paper-3/50 ring-rule")}
        >
          <p className="text-xs font-semibold text-indigo">Cache</p>
          <p className="tabular mt-1 font-display text-3xl font-extrabold">{cache ? `₦${cache.value.toLocaleString()}` : "-"}</p>
          {cache && (
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper-3">
              <motion.div className="h-full bg-indigo" animate={{ width: `${(cache.ttl / TTL) * 100}%` }} transition={{ duration: 0.3 }} />
            </div>
          )}
          <p className="tabular mt-1 text-xs text-muted">{cache ? `expires in ${cache.ttl}s` : "empty"}</p>
        </motion.div>
        <motion.div animate={flash === "miss" ? { scale: [1, 1.05, 1] } : {}} className="rounded-2xl bg-paper-3/50 p-4 ring-1 ring-rule">
          <p className="text-xs font-semibold text-ochre">Database</p>
          <motion.p key={db} initial={{ y: -8, opacity: 0.3 }} animate={{ y: 0, opacity: 1 }} className="tabular mt-1 font-display text-3xl font-extrabold">
            ₦{db.toLocaleString()}
          </motion.p>
          <p className="mt-1 text-xs text-muted">source of truth</p>
        </motion.div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <DemoButton tone="primary" onClick={read}>
          <Eye aria-hidden className="size-4" /> Customer reads price
        </DemoButton>
        <DemoButton onClick={write}>
          <Tag aria-hidden className="size-4" /> Admin changes price
        </DemoButton>
        <button
          type="button"
          onClick={() => {
            setCache(null);
            setDb(2500);
            setStaleServed(false);
            clear();
          }}
          className="ml-auto text-xs text-muted hover:text-ink"
        >
          reset
        </button>
      </div>
      <div className="mt-4">
        <Toggle on={invalidate} onChange={(v) => { setInvalidate(v); setStaleServed(false); }} label="Invalidate on write" />
      </div>
      <LogList lines={lines} className="mt-4" />
    </DemoFrame>
  );
}
