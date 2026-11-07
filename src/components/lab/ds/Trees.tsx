"use client";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { Crown, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { DemoButton, DemoFrame, Toggle } from "@/components/demos/DemoFrame";
import { LogList, Stamp } from "@/components/demos/LogList";
import { useLog } from "@/components/demos/hooks";

const spring = { type: "spring", stiffness: 420, damping: 30 } as const;

function Reset({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="ml-auto text-xs text-muted hover:text-ink">
      reset
    </button>
  );
}

type Pos = { x: number; y: number };

function Edges({ lines }: { lines: [Pos, Pos, boolean?][] }) {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden>
      {lines.map(([a, b, hot], i) => (
        <motion.line
          key={i}
          initial={false}
          animate={{ x1: a.x, y1: a.y, x2: b.x, y2: b.y }}
          transition={spring}
          vectorEffect="non-scaling-stroke"
          strokeWidth={hot ? 2.5 : 1.5}
          className={hot ? "stroke-ochre" : "stroke-rule"}
        />
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------- BST */

type BNode = { v: number; l: BNode | null; r: BNode | null };
const GOOD_ORDER = [50, 30, 70, 20, 40, 60, 80, 35, 65, 15, 45, 75];
const SORTED_ORDER = [15, 20, 30, 35, 40, 45, 50, 60, 65, 70, 75, 80];

function insert(t: BNode | null, v: number): BNode {
  if (!t) return { v, l: null, r: null };
  return v < t.v ? { ...t, l: insert(t.l, v) } : { ...t, r: insert(t.r, v) };
}

export function BstDemo() {
  const [balanced, setBalanced] = useState(true);
  const [n, setN] = useState(5);
  const [path, setPath] = useState<number[]>([]);
  const order = balanced ? GOOD_ORDER : SORTED_ORDER;
  let root: BNode | null = null;
  for (const v of order.slice(0, n)) root = insert(root, v);

  const pos = new Map<number, Pos>();
  const edges: [Pos, Pos, boolean?][] = [];
  let idx = 0;
  let height = 0;
  const walk = (t: BNode | null, d: number) => {
    if (!t) return;
    walk(t.l, d + 1);
    pos.set(t.v, { x: 0, y: d });
    idx++;
    walk(t.r, d + 1);
  };
  walk(root, 0);
  const sorted = [...pos.keys()].sort((a, b) => a - b);
  for (const [v, p] of pos) {
    height = Math.max(height, p.y + 1);
    p.x = ((sorted.indexOf(v) + 0.5) / Math.max(idx, 1)) * 100;
  }
  for (const p of pos.values()) p.y = height > 1 ? (p.y / (height - 1)) * 100 : 0;
  const link = (t: BNode | null) => {
    if (!t) return;
    for (const c of [t.l, t.r]) if (c) edges.push([pos.get(t.v)!, pos.get(c.v)!, path.includes(t.v) && path.includes(c.v)]);
    link(t.l);
    link(t.r);
  };
  link(root);

  function search(v: number) {
    const p: number[] = [];
    let t = root;
    while (t) {
      p.push(t.v);
      if (t.v === v) break;
      t = v < t.v ? t.l : t.r;
    }
    setPath(p);
  }

  return (
    <DemoFrame title="binary search tree" hint="Tap a node to search for it. Then switch the input to sorted and insert again.">
      <div className="relative">
        <Stamp show={!balanced && n >= 8}>height {height}, it&apos;s a list</Stamp>
        <div className="relative h-56 rounded-xl bg-paper/60 ring-1 ring-rule sm:h-64">
          <div className="absolute inset-x-5 inset-y-6">
            <Edges lines={edges} />
            {[...pos].map(([v, p]) => (
              <motion.button
                key={v}
                type="button"
                onClick={() => search(v)}
                initial={{ scale: 0, left: `${p.x}%`, top: `${p.y}%` }}
                animate={{ scale: 1, left: `${p.x}%`, top: `${p.y}%` }}
                transition={spring}
                className={cn(
                  "tabular absolute grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-xs font-bold ring-2",
                  path[path.length - 1] === v ? "bg-live text-on-accent ring-live" : path.includes(v) ? "bg-ochre text-on-accent ring-ochre" : "bg-paper-3 text-ink ring-rule",
                )}
              >
                {v}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
      <p className="tabular mt-3 min-h-[1.5rem] text-sm font-semibold text-ink-2" aria-live="polite">
        {path.length ? `Found ${path[path.length - 1]} in ${path.length} steps: ${path.join(" → ")}. ${n} nodes, height ${height}.` : `${n} nodes, height ${height}.`}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <DemoButton tone="primary" onClick={() => (setN((k) => Math.min(k + 1, order.length)), setPath([]))} disabled={n >= order.length}>
          <Plus aria-hidden className="size-4" /> Insert {order[n] ?? "-"}
        </DemoButton>
        <Reset onClick={() => (setN(balanced ? 5 : 1), setPath([]))} />
      </div>
      <div className="mt-4">
        <Toggle on={balanced} onChange={(v) => (setBalanced(v), setN(v ? 5 : 1), setPath([]))} label="Shuffled input" />
      </div>
    </DemoFrame>
  );
}

/* ------------------------------------------------------------------ heap */

type Task = { id: number; p: number; name: string };
const INCOMING: [number, string][] = [
  [5, "send receipt"],
  [1, "refund ₦12k"],
  [8, "weekly report"],
  [3, "verify KYC"],
  [2, "retry payout"],
  [9, "cleanup"],
  [4, "SMS OTP"],
  [6, "resize image"],
];

const heapPos = (i: number): Pos => {
  const d = Math.floor(Math.log2(i + 1));
  const p = i - (2 ** d - 1);
  return { x: ((p + 0.5) / 2 ** d) * 100, y: d * 33 };
};

export function HeapDemo() {
  const [heap, setHeap] = useState<Task[]>([]);
  const [hot, setHot] = useState<number[]>([]);
  const seq = useRef(0);
  const busy = useRef(false);
  const { lines, push, clear } = useLog(3);

  function animate(frames: { h: Task[]; hot: number[] }[], done: () => void) {
    busy.current = true;
    frames.forEach((f, k) =>
      setTimeout(() => {
        setHeap(f.h);
        setHot(f.hot);
        if (k === frames.length - 1) {
          setTimeout(() => setHot([]), 500);
          busy.current = false;
          done();
        }
      }, k * 420),
    );
  }

  function add() {
    if (busy.current || heap.length >= 7) return;
    const [p, name] = INCOMING[seq.current % INCOMING.length];
    const h = [...heap, { id: seq.current++, p, name }];
    const frames = [{ h: h.slice(), hot: [h.length - 1] }];
    let i = h.length - 1;
    let swaps = 0;
    while (i > 0 && h[(i - 1) >> 1].p > h[i].p) {
      const parent = (i - 1) >> 1;
      [h[i], h[parent]] = [h[parent], h[i]];
      i = parent;
      swaps++;
      frames.push({ h: h.slice(), hot: [i] });
    }
    animate(frames, () => push(`insert "${name}" (priority ${p}), sifted up ${swaps} ${swaps === 1 ? "level" : "levels"}.`));
  }

  function pop() {
    if (busy.current || !heap.length) return;
    const top = heap[0];
    const h = heap.slice();
    const last = h.pop()!;
    const frames: { h: Task[]; hot: number[] }[] = [];
    if (h.length) {
      h[0] = last;
      frames.push({ h: h.slice(), hot: [0] });
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < h.length && h[l].p < h[m].p) m = l;
        if (r < h.length && h[r].p < h[m].p) m = r;
        if (m === i) break;
        [h[i], h[m]] = [h[m], h[i]];
        i = m;
        frames.push({ h: h.slice(), hot: [i] });
      }
    } else frames.push({ h: [], hot: [] });
    animate(frames, () => push(`pop() → "${top.name}" (priority ${top.p}), always the most urgent.`, "ok"));
  }

  const edges: [Pos, Pos][] = heap.slice(1).map((_, k) => [heapPos(k >> 1), heapPos(k + 1)]);

  return (
    <DemoFrame title="job scheduler: a min-heap" hint="Lower number = more urgent. Insert floats a job up; pop takes the root and sinks a replacement down.">
      <div className="relative h-48 rounded-xl bg-paper/60 ring-1 ring-rule">
        <div className="absolute inset-x-10 bottom-8 top-7">
          <Edges lines={edges} />
          {heap.map((t, i) => {
            const p = heapPos(i);
            return (
              <motion.div
                key={t.id}
                initial={{ scale: 0, left: `${p.x}%`, top: `${p.y}%` }}
                animate={{ scale: hot.includes(i) ? 1.18 : 1, left: `${p.x}%`, top: `${p.y}%` }}
                transition={spring}
                className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              >
                <span
                  className={cn(
                    "tabular grid size-9 place-items-center rounded-full font-display text-sm font-extrabold ring-2",
                    i === 0 ? "bg-ochre text-on-accent ring-ochre" : hot.includes(i) ? "bg-pink text-on-accent ring-pink" : "bg-paper-3 text-ink ring-rule",
                  )}
                >
                  {t.p}
                </span>
                <span className="mt-0.5 hidden whitespace-nowrap text-[0.6rem] text-muted sm:block">{t.name}</span>
              </motion.div>
            );
          })}
          {!heap.length && <p className="absolute inset-0 grid place-items-center text-sm text-muted">No jobs waiting.</p>}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        {heap.map((t, i) => (
          <motion.span key={t.id} layout transition={spring} className={cn("tabular rounded px-2 py-0.5 text-xs font-bold ring-1", i === 0 ? "bg-ochre text-on-accent ring-ochre" : "bg-paper-3 text-ink-2 ring-rule")}>
            {t.p}
          </motion.span>
        ))}
        {heap.length > 0 && <span className="self-center text-[0.65rem] text-muted">← the same heap, stored as a plain array</span>}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <DemoButton tone="primary" onClick={add} disabled={heap.length >= 7}>
          <Plus aria-hidden className="size-4" /> Queue &ldquo;{INCOMING[seq.current % INCOMING.length][1]}&rdquo;
        </DemoButton>
        <DemoButton onClick={pop} disabled={!heap.length}>
          Run most urgent
        </DemoButton>
        <Reset onClick={() => !busy.current && (setHeap([]), (seq.current = 0), clear())} />
      </div>
      <LogList lines={lines} className="mt-4" />
    </DemoFrame>
  );
}

/* ------------------------------------------------------------ union-find */

const PEOPLE = ["Ada", "Bayo", "Chika", "Dayo", "Efe", "Funmi", "Gozie", "Hauwa"];
const HUES = ["bg-ochre", "bg-pink", "bg-indigo", "bg-live", "bg-vermilion", "bg-ink-2", "bg-[#c9a7ff]", "bg-[#7fd3ff]"];

export function UnionFindDemo() {
  const [parent, setParent] = useState(() => PEOPLE.map((_, i) => i));
  const [pick, setPick] = useState<number | null>(null);
  const { lines, push, clear } = useLog(3);

  function find(p: number[], x: number, hops = { n: 0 }): number {
    while (p[x] !== x) {
      p[x] = p[p[x]]; // path halving: every find flattens the tree a little
      x = p[x];
      hops.n++;
    }
    return x;
  }

  function choose(i: number) {
    if (pick === null) return setPick(i);
    if (pick === i) return setPick(null);
    const p = parent.slice();
    const ha = { n: 0 };
    const hb = { n: 0 };
    const a = find(p, pick, ha);
    const b = find(p, i, hb);
    if (a === b) push(`${PEOPLE[pick]} and ${PEOPLE[i]} are already in ${PEOPLE[a]}'s group. find() took ${ha.n + hb.n} hops.`, "ok");
    else {
      p[b] = a;
      push(`union(${PEOPLE[pick]}, ${PEOPLE[i]}), ${PEOPLE[b]}'s group now points at ${PEOPLE[a]}.`);
    }
    setParent(p);
    setPick(null);
  }

  const roots = parent.map((_, i) => {
    let x = i;
    while (parent[x] !== x) x = parent[x];
    return x;
  });
  const groups = [...new Set(roots)].map((r) => ({ r, members: PEOPLE.map((_, i) => i).filter((i) => roots[i] === r) }));

  return (
    <DemoFrame title="who knows whom: union-find" hint="Tap two people to introduce them. Friends of friends end up in the same group, with one leader each.">
      <div className="flex min-h-[9rem] flex-wrap content-start gap-2 rounded-xl bg-paper/60 p-3 ring-1 ring-rule">
        {groups.map((g) => (
          <motion.div key={g.r} layout transition={spring} className="flex flex-wrap items-center gap-1 rounded-xl bg-paper-3/70 p-1.5 ring-1 ring-rule">
            {g.members.map((i) => (
              <motion.button
                key={i}
                layout
                layoutId={`uf-${i}`}
                type="button"
                onClick={() => choose(i)}
                transition={spring}
                className={cn(
                  "flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-on-accent ring-2",
                  HUES[g.r],
                  pick === i ? "ring-ink" : "ring-transparent",
                )}
              >
                {i === g.r && <Crown aria-hidden className="size-3" />}
                {PEOPLE[i]}
              </motion.button>
            ))}
          </motion.div>
        ))}
      </div>
      <p className="mt-3 text-sm text-ink-2">{pick === null ? "Tap someone…" : `…now tap who ${PEOPLE[pick]} should meet.`}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Reset onClick={() => (setParent(PEOPLE.map((_, i) => i)), setPick(null), clear())} />
      </div>
      <LogList lines={lines} className="mt-4" />
    </DemoFrame>
  );
}

/* ----------------------------------------------------- graph adjacency */

const CITIES = [
  { id: "LOS", x: 20, y: 80 },
  { id: "IBD", x: 22, y: 45 },
  { id: "ABJ", x: 60, y: 30 },
  { id: "PHC", x: 62, y: 88 },
  { id: "KAN", x: 70, y: 5 },
  { id: "ENU", x: 85, y: 62 },
];
const SPARSE: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 4],
  [2, 5],
  [3, 5],
  [0, 3],
];
const DENSE: [number, number][] = [...SPARSE, [0, 2], [1, 3], [1, 5], [2, 3], [4, 5], [0, 5], [1, 4]];

export function GraphDemo() {
  const [sel, setSel] = useState(2);
  const [dense, setDense] = useState(false);
  const roads = dense ? DENSE : SPARSE;
  const nbr = (i: number) => roads.flatMap(([a, b]) => (a === i ? [b] : b === i ? [a] : [])).sort();
  const V = CITIES.length;

  return (
    <DemoFrame title="road network: adjacency list vs matrix" hint="Tap a city. The same graph, stored two ways: a list per city, or a full grid of yes/no.">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="relative h-48 rounded-xl bg-paper/60 ring-1 ring-rule">
          <div className="absolute inset-6">
            <Edges lines={roads.map(([a, b]) => [CITIES[a], CITIES[b], a === sel || b === sel])} />
            {CITIES.map((c, i) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSel(i)}
                aria-pressed={sel === i}
                className={cn(
                  "absolute grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-[0.6rem] font-extrabold ring-2 transition-colors",
                  i === sel ? "bg-ochre text-on-accent ring-ochre" : nbr(sel).includes(i) ? "bg-pink text-on-accent ring-pink" : "bg-paper-3 text-ink ring-rule",
                )}
                style={{ left: `${c.x}%`, top: `${c.y}%` }}
              >
                {c.id}
              </button>
            ))}
          </div>
        </div>
        <div className="min-w-0 space-y-3 text-xs">
          <div>
            <p className="font-bold text-ochre">List · {roads.length * 2} entries</p>
            <ul className="mt-1 space-y-0.5">
              {CITIES.map((c, i) => (
                <li key={c.id} className={cn("tabular rounded px-1.5", i === sel && "bg-ochre/15 text-ink")}>
                  <span className="font-bold">{c.id}</span> → {nbr(i).map((n) => CITIES[n].id).join(", ")}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-bold text-indigo">Matrix · {V * V} cells</p>
            <div className="mt-1 grid w-fit gap-px" style={{ gridTemplateColumns: `repeat(${V}, 1fr)` }}>
              {CITIES.flatMap((_, r) =>
                CITIES.map((_, c) => {
                  const on = nbr(r).includes(c);
                  return (
                    <motion.span
                      key={`${r}-${c}`}
                      animate={{ scale: r === sel && on ? 1.15 : 1 }}
                      className={cn("tabular grid size-5 place-items-center rounded-sm text-[0.55rem] font-bold", on ? "bg-indigo text-indigo-ink" : "bg-paper-3 text-muted", r === sel && "ring-1 ring-ochre")}
                    >
                      {on ? 1 : 0}
                    </motion.span>
                  );
                }),
              )}
            </div>
          </div>
        </div>
      </div>
      <p className="mt-4 text-sm font-semibold text-ink-2">
        Neighbours of {CITIES[sel].id}: list reads {nbr(sel).length} entries; the matrix row always reads {V}.
      </p>
      <div className="mt-4">
        <Toggle on={dense} onChange={setDense} label="Dense network" />
      </div>
    </DemoFrame>
  );
}
