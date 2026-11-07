"use client";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Check, Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { DemoButton, DemoFrame, Toggle } from "@/components/demos/DemoFrame";
import { LogList, Stamp } from "@/components/demos/LogList";
import { useLog } from "@/components/demos/hooks";

const spring = { type: "spring", stiffness: 480, damping: 30 } as const;

function fnv(s: string, salt = 0) {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function Reset({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="ml-auto text-xs text-muted hover:text-ink">
      reset
    </button>
  );
}

/* ------------------------------------------------------------ hash table */

const KEYS = ["Ade", "Bola", "Ayo", "Chidi", "Amaka", "Bisi", "Abu", "Dapo", "Ada", "Bayo", "Aisha", "Efe"];
const BUCKETS = 8;

export function HashTableDemo() {
  const [good, setGood] = useState(true);
  const [count, setCount] = useState(0);
  const [hit, setHit] = useState<string | null>(null);
  const { lines, push, clear } = useLog(3);
  const hash = (k: string) => (good ? fnv(k) : k.charCodeAt(0));
  const keys = KEYS.slice(0, count);
  const table: string[][] = Array.from({ length: BUCKETS }, () => []);
  for (const k of keys) table[hash(k) % BUCKETS].push(k);
  const longest = Math.max(...table.map((b) => b.length));

  function add() {
    const k = KEYS[count];
    const h = hash(k);
    setCount((c) => c + 1);
    push(`hash("${k}") = ${h} → bucket ${h % BUCKETS}${table[h % BUCKETS].length ? ` (collides with ${table[h % BUCKETS].length})` : ""}`, table[h % BUCKETS].length ? "warn" : "info");
  }
  function find(k: string) {
    const b = table[hash(k) % BUCKETS];
    const probes = b.indexOf(k) + 1;
    setHit(k);
    push(`get("${k}"): jumped straight to bucket ${hash(k) % BUCKETS}, checked ${probes} ${probes === 1 ? "entry" : "entries"}.`, probes > 2 ? "bad" : "ok");
  }

  return (
    <DemoFrame title="map[name]: hash table" hint="Tap a name to look it up. A good hash spreads keys out; a bad one piles them into a few buckets.">
      <div className="relative">
        <Stamp show={!good && longest >= 5}>chain of {longest}</Stamp>
        <div className="grid grid-cols-1 gap-1 rounded-xl bg-paper/60 p-3 ring-1 ring-rule">
          {table.map((b, i) => (
            <div key={i} className="flex min-h-8 items-center gap-1.5">
              <span className="tabular w-6 shrink-0 text-right text-[0.65rem] font-bold text-muted">{i}</span>
              <span className={cn("h-px w-3 shrink-0", b.length ? "bg-ink-2" : "bg-rule")} />
              <AnimatePresence initial={false}>
                {b.map((k) => (
                  <motion.button
                    key={k}
                    type="button"
                    layout
                    initial={{ scale: 0, x: -20 }}
                    animate={{ scale: 1, x: 0 }}
                    transition={spring}
                    onClick={() => find(k)}
                    className={cn(
                      "rounded-md px-2 py-0.5 text-xs font-semibold ring-1",
                      hit === k ? "bg-live text-on-accent ring-live" : b.length > 2 ? "bg-vermilion/20 text-vermilion ring-vermilion/50" : "bg-paper-3 text-ink ring-rule",
                    )}
                  >
                    {k}
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <DemoButton tone="primary" onClick={add} disabled={count >= KEYS.length}>
          <Plus aria-hidden className="size-4" /> Add {KEYS[count] ?? "-"}
        </DemoButton>
        <DemoButton onClick={() => (setCount(KEYS.length), push(`Added all ${KEYS.length}.`))} disabled={count >= KEYS.length}>
          Add all
        </DemoButton>
        <Reset onClick={() => (setCount(0), setHit(null), clear())} />
      </div>
      <div className="mt-4">
        <Toggle on={good} onChange={(v) => (setGood(v), setHit(null))} label="Good hash (FNV-1a, not first letter)" />
      </div>
      <LogList lines={lines} className="mt-4" />
    </DemoFrame>
  );
}

/* ------------------------------------------------------------- LRU cache */

const PAGES = ["home", "cart", "profile", "search", "orders", "help"];
const CAP = 4;

export function LruDemo() {
  const [cache, setCache] = useState<string[]>([]);
  const [stats, setStats] = useState({ hit: 0, miss: 0 });
  const [flash, setFlash] = useState<{ key: string; hit: boolean } | null>(null);
  const { lines, push, clear } = useLog(3);

  function get(k: string) {
    if (cache.includes(k)) {
      setCache((c) => [k, ...c.filter((x) => x !== k)]);
      setStats((s) => ({ ...s, hit: s.hit + 1 }));
      setFlash({ key: k, hit: true });
      push(`HIT  /${k}: served from memory, moved to the front.`, "ok");
    } else {
      const evicted = cache.length >= CAP ? cache[cache.length - 1] : null;
      setCache((c) => [k, ...c].slice(0, CAP));
      setStats((s) => ({ ...s, miss: s.miss + 1 }));
      setFlash({ key: k, hit: false });
      push(`MISS /${k}: 80ms trip to the database.${evicted ? ` Evicted /${evicted}, least recently used.` : ""}`, "warn");
    }
  }
  const total = stats.hit + stats.miss;

  return (
    <DemoFrame title="LRU cache: capacity 4" hint="Request pages. The front is most recently used; the back is first to go when space runs out.">
      <div className="flex min-h-[4.5rem] items-center gap-2 rounded-xl bg-paper/60 p-3 ring-1 ring-rule">
        <span className="shrink-0 text-[0.6rem] font-bold uppercase text-live">fresh</span>
        <AnimatePresence initial={false} mode="popLayout">
          {cache.map((k, i) => (
            <motion.span
              key={k}
              layout
              initial={{ y: -30, opacity: 0, scale: 0.6 }}
              animate={{ y: 0, opacity: 1, scale: flash?.key === k ? [1.2, 1] : 1 }}
              exit={{ y: 30, opacity: 0, rotate: 15 }}
              transition={spring}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-xs font-bold ring-1",
                i === CAP - 1 ? "bg-pink/20 text-pink ring-pink/50" : "bg-paper-3 text-ink ring-rule",
                flash?.key === k && (flash.hit ? "ring-live" : "ring-ochre"),
              )}
            >
              /{k}
            </motion.span>
          ))}
        </AnimatePresence>
        <span className="ml-auto shrink-0 text-[0.6rem] font-bold uppercase text-pink">evict next</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {PAGES.map((p) => (
          <DemoButton key={p} onClick={() => get(p)}>
            /{p}
          </DemoButton>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <span className="tabular text-sm font-semibold text-ink-2">
          {stats.hit} hits · {stats.miss} misses · hit rate {total ? Math.round((stats.hit / total) * 100) : 0}%
        </span>
        <Reset onClick={() => (setCache([]), setStats({ hit: 0, miss: 0 }), setFlash(null), clear())} />
      </div>
      <LogList lines={lines} className="mt-4" />
    </DemoFrame>
  );
}

/* ---------------------------------------------------------- bloom filter */

const BITS = 20;
const bloomBits = (w: string) => [...new Set([fnv(w, 1) % BITS, fnv(w, 7) % BITS, fnv(w, 13) % BITS])];

export function BloomDemo() {
  const [bits, setBits] = useState<boolean[]>(Array(BITS).fill(false));
  const [added, setAdded] = useState<string[]>([]);
  const [word, setWord] = useState("tobi");
  const [verdict, setVerdict] = useState<null | { word: string; text: string; tone: "ok" | "bad" | "warn" }>(null);
  const w = word.trim().toLowerCase();
  const mine = w ? bloomBits(w) : [];

  function add() {
    if (!w) return;
    setBits((b) => b.map((v, i) => v || mine.includes(i)));
    setAdded((a) => (a.includes(w) ? a : [...a, w]));
    setVerdict({ word: w, text: `"${w}" added: set bits ${mine.join(", ")}.`, tone: "ok" });
  }
  function check() {
    if (!w) return;
    const all = mine.every((i) => bits[i]);
    if (!all) setVerdict({ word: w, text: `"${w}" is definitely not taken, bit ${mine.find((i) => !bits[i])} is off. No database call needed.`, tone: "ok" });
    else if (added.includes(w)) setVerdict({ word: w, text: `"${w}" is probably taken. Go confirm with the database.`, tone: "warn" });
    else setVerdict({ word: w, text: `"${w}" looks taken, but it never was. A false positive: the database will say no.`, tone: "bad" });
  }

  return (
    <DemoFrame title="is this username taken?bloom filter" hint="20 bits, 3 hashes per word. It can say 'maybe yes', but its 'no' is always right.">
      <div className="grid grid-cols-10 gap-1 rounded-xl bg-paper/60 p-3 ring-1 ring-rule">
        {bits.map((b, i) => (
          <motion.span
            key={i}
            animate={{ scale: mine.includes(i) ? 1.12 : 1 }}
            transition={spring}
            className={cn(
              "tabular grid aspect-square place-items-center rounded-md text-[0.65rem] font-bold ring-1 transition-colors",
              b ? "bg-indigo text-indigo-ink ring-indigo" : "bg-paper-3 text-muted ring-rule",
              mine.includes(i) && "ring-2 ring-ochre",
            )}
          >
            {b ? 1 : 0}
          </motion.span>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="bloom-word">
          Username
        </label>
        <input
          id="bloom-word"
          value={word}
          onChange={(e) => (setWord(e.target.value.slice(0, 16)), setVerdict(null))}
          className="w-36 rounded-full bg-paper-3 px-4 py-2 text-sm font-semibold text-ink ring-1 ring-rule outline-none focus:ring-ochre"
        />
        <DemoButton tone="primary" onClick={add}>
          <Plus aria-hidden className="size-4" /> Add
        </DemoButton>
        <DemoButton onClick={check}>
          <Search aria-hidden className="size-4" /> Check
        </DemoButton>
        <Reset onClick={() => (setBits(Array(BITS).fill(false)), setAdded([]), setVerdict(null))} />
      </div>
      <p className="mt-3 text-xs text-muted">
        {w ? `"${w}" hashes to bits ${mine.join(", ")}` : "Type a name"} · added: {added.length ? added.join(", ") : "none yet"}
      </p>
      <AnimatePresence mode="wait">
        {verdict && (
          <motion.p
            key={verdict.text}
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "mt-3 rounded-lg px-3 py-2 text-sm font-semibold",
              verdict.tone === "ok" ? "bg-live/10 text-live" : verdict.tone === "warn" ? "bg-ochre/10 text-ochre" : "bg-vermilion/10 text-vermilion",
            )}
          >
            {verdict.text}
          </motion.p>
        )}
      </AnimatePresence>
    </DemoFrame>
  );
}

/* ---------------------------------------------------------------- bitset */

const PERMS = ["read", "write", "delete", "invite", "billing", "export", "audit", "admin"];
const ACTIONS = [
  { label: "Edit an invoice", need: ["read", "write"] },
  { label: "Delete a member", need: ["delete", "invite"] },
  { label: "Download payroll", need: ["billing", "export"] },
];

export function BitsetDemo() {
  const [mask, setMask] = useState(0b00000011);
  const [last, setLast] = useState<{ label: string; ok: boolean; need: number } | null>(null);
  const bit = (p: string) => 1 << PERMS.indexOf(p);

  return (
    <DemoFrame title="permissions & mask: a bitset" hint="Eight yes/no flags packed into one number. Checking a permission is a single AND.">
      <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-8">
        {[...PERMS].reverse().map((p) => {
          const on = (mask & bit(p)) !== 0;
          const needed = last ? (last.need & bit(p)) !== 0 : false;
          return (
            <button
              key={p}
              type="button"
              aria-pressed={on}
              onClick={() => (setMask((m) => m ^ bit(p)), setLast(null))}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg py-2 text-[0.65rem] font-semibold ring-1 transition-colors",
                on ? "bg-indigo text-indigo-ink ring-indigo" : "bg-paper-3 text-muted ring-rule",
                needed && "ring-2 ring-ochre",
              )}
            >
              <motion.span key={String(on)} initial={{ rotateX: 90 }} animate={{ rotateX: 0 }} className="tabular font-display text-xl font-extrabold">
                {on ? 1 : 0}
              </motion.span>
              {p}
            </button>
          );
        })}
      </div>
      <p className="tabular mt-3 text-sm text-ink-2">
        stored as <strong className="text-ink">{mask}</strong> · 0b{mask.toString(2).padStart(8, "0")} · one byte
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {ACTIONS.map((a) => {
          const need = a.need.reduce((m, p) => m | bit(p), 0);
          return (
            <DemoButton key={a.label} onClick={() => setLast({ label: a.label, need, ok: (mask & need) === need })}>
              {a.label}
            </DemoButton>
          );
        })}
      </div>
      <AnimatePresence mode="wait">
        {last && (
          <motion.p
            key={`${last.label}-${mask}`}
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className={cn("tabular mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold", last.ok ? "bg-live/10 text-live" : "bg-vermilion/10 text-vermilion")}
          >
            {last.ok ? <Check aria-hidden className="size-4" /> : <X aria-hidden className="size-4" />}
            {mask} & {last.need} = {mask & last.need} {last.ok ? "==" : "≠"} {last.need} → {last.ok ? "allowed" : "denied"}
          </motion.p>
        )}
      </AnimatePresence>
    </DemoFrame>
  );
}

/* ------------------------------------------------------------------ trie */

const PLACES = ["lagos", "lagoon", "lekki", "lokoja", "ikeja", "ikoyi", "ikorodu", "ibadan", "ilorin", "ilesa", "yaba", "yola"];

export function TrieDemo() {
  const [q, setQ] = useState("ik");
  const prefix = q.toLowerCase().replace(/[^a-z]/g, "");
  const matches = PLACES.filter((p) => p.startsWith(prefix));
  const next = [...new Set(matches.map((m) => m[prefix.length]).filter(Boolean))].sort();
  const dead = prefix.length > 0 && matches.length === 0;

  return (
    <DemoFrame title="autocomplete: a trie" hint="Each letter is a step down the tree. The cost depends on what you typed, not on how many words exist.">
      <label className="sr-only" htmlFor="trie-q">
        Search places
      </label>
      <input
        id="trie-q"
        value={q}
        onChange={(e) => setQ(e.target.value.slice(0, 10))}
        placeholder="type a Nigerian city…"
        className="w-full rounded-xl bg-paper-3 px-4 py-3 text-lg font-semibold text-ink ring-1 ring-rule outline-none focus:ring-ochre"
      />
      <div className="mt-4 flex min-h-[3.5rem] flex-wrap items-center gap-1 rounded-xl bg-paper/60 p-3 ring-1 ring-rule">
        <span className="rounded-md bg-paper-3 px-2 py-1 text-[0.65rem] font-bold uppercase text-muted">root</span>
        {prefix.split("").map((ch, i) => (
          <motion.span key={`${i}-${ch}`} initial={{ scale: 0, y: -10 }} animate={{ scale: 1, y: 0 }} transition={spring} className="flex items-center gap-1">
            <span className="text-muted">→</span>
            <span className={cn("grid size-8 place-items-center rounded-full font-display text-base font-extrabold", dead && i === prefix.length - 1 ? "bg-vermilion text-on-accent" : "bg-ochre text-on-accent")}>
              {ch}
            </span>
          </motion.span>
        ))}
        {next.length > 0 && (
          <span className="ml-2 flex flex-wrap items-center gap-1">
            <span className="text-xs text-muted">children:</span>
            {next.map((c) => (
              <motion.button
                key={c}
                type="button"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={() => setQ(prefix + c)}
                className="grid size-7 place-items-center rounded-full bg-paper-3 text-sm font-bold text-ink-2 ring-1 ring-rule hover:ring-ochre"
              >
                {c}
              </motion.button>
            ))}
          </span>
        )}
      </div>
      <ul className="mt-3 flex min-h-[2rem] flex-wrap gap-1.5">
        <AnimatePresence initial={false} mode="popLayout">
          {matches.map((m) => (
            <motion.li key={m} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="rounded-full bg-live/10 px-3 py-1 text-sm font-semibold text-live">
              <strong>{m.slice(0, prefix.length)}</strong>
              <span className="text-live/60">{m.slice(prefix.length)}</span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      <p className="tabular mt-3 text-xs text-muted">
        {dead ? "No branch for that letter, stopped early." : `${prefix.length} steps down the tree, ${matches.length} completions.`} Scanning the list would compare against all {PLACES.length}.
      </p>
    </DemoFrame>
  );
}
