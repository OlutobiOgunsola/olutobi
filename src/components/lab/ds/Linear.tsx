"use client";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { ArrowRight, Plus, Trash2, Undo2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { DemoButton, DemoFrame, Toggle } from "@/components/demos/DemoFrame";
import { LogList, Stamp } from "@/components/demos/LogList";
import { useLog } from "@/components/demos/hooks";

const spring = { type: "spring", stiffness: 480, damping: 30 } as const;

function Reset({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="ml-auto text-xs text-muted hover:text-ink">
      reset
    </button>
  );
}

/* --------------------------------------------------------- dynamic array */

export function DynamicArrayDemo() {
  const [double, setDouble] = useState(true);
  const [items, setItems] = useState<number[]>([]);
  const [cap, setCap] = useState(2);
  const [copies, setCopies] = useState(0);
  const [grew, setGrew] = useState(0);
  const { lines, push, clear } = useLog(3);

  function add(times = 1) {
    let list = items;
    let c = cap;
    let cp = copies;
    for (let k = 0; k < times && list.length < 32; k++) {
      if (list.length === c) {
        const next = double ? c * 2 : c + 1;
        cp += list.length;
        push(`Full at ${c}. Allocate ${next} slots, copy ${list.length} items across.`, double ? "info" : "warn");
        c = next;
        setGrew((g) => g + 1);
      }
      list = [...list, list.length + 1];
    }
    setItems(list);
    setCap(c);
    setCopies(cp);
  }

  function reset() {
    setItems([]);
    setCap(2);
    setCopies(0);
    clear();
  }

  const ratio = items.length ? copies / items.length : 0;
  return (
    <DemoFrame title="list.push(x): growable array" hint="Grey slots are allocated but empty. Watch the copy count, not the push count.">
      <div className="relative">
        <Stamp show={!double && items.length >= 20}>{copies} copies</Stamp>
        <motion.div key={grew} initial={{ scale: 0.97 }} animate={{ scale: 1 }} className="flex min-h-[7.5rem] flex-wrap content-start gap-1.5 rounded-xl bg-paper/60 p-3 ring-1 ring-rule">
          {Array.from({ length: Math.min(cap, 32) }, (_, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={spring}
              className={cn(
                "tabular grid size-8 place-items-center rounded-md text-xs font-bold ring-1",
                i < items.length ? "bg-ochre text-on-accent ring-ochre" : "bg-paper-3 text-muted ring-rule",
              )}
            >
              {i < items.length ? items[i] : ""}
            </motion.span>
          ))}
        </motion.div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <DemoButton tone="primary" onClick={() => add()} disabled={items.length >= 32}>
          <Plus aria-hidden className="size-4" /> push
        </DemoButton>
        <DemoButton onClick={() => add(8)} disabled={items.length >= 32}>
          push × 8
        </DemoButton>
        <Reset onClick={reset} />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <Toggle on={double} onChange={(v) => (setDouble(v), reset())} label="Double when full" />
        <span className={cn("tabular text-sm font-semibold", ratio > 3 ? "text-vermilion" : "text-live")}>
          {items.length} pushes · {copies} copies · {ratio.toFixed(1)} per push
        </span>
      </div>
      <LogList lines={lines} className="mt-4" />
    </DemoFrame>
  );
}

/* ----------------------------------------------------------------- stack */

const EDITS = ["Bold the title", "Add a photo", "Delete a paragraph", "Change the font", "Fix a typo", "Add a table"];

export function StackDemo() {
  const [stack, setStack] = useState<{ id: number; label: string }[]>([]);
  const seq = useRef(0);
  const { lines, push, clear } = useLog(3);
  return (
    <DemoFrame title="undo history: a stack" hint="Last in, first out. Undo always takes the thing on top.">
      <div className="flex min-h-[15rem] flex-col-reverse items-center justify-start gap-1.5 rounded-xl bg-paper/60 p-3 ring-1 ring-rule">
        <AnimatePresence initial={false}>
          {stack.map((s, i) => (
            <motion.div
              key={s.id}
              layout
              initial={{ y: -60, opacity: 0, rotate: -4 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              exit={{ x: 120, y: -30, opacity: 0, rotate: 12 }}
              transition={spring}
              className={cn(
                "flex w-full max-w-xs items-center justify-between rounded-lg px-4 py-2 text-sm font-semibold ring-1",
                i === stack.length - 1 ? "bg-ochre text-on-accent ring-ochre" : "bg-paper-3 text-ink-2 ring-rule",
              )}
            >
              {s.label}
              {i === stack.length - 1 && <span className="text-[0.65rem] font-bold uppercase">top</span>}
            </motion.div>
          ))}
        </AnimatePresence>
        {!stack.length && <p className="m-auto text-sm text-muted">Nothing to undo.</p>}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <DemoButton
          tone="primary"
          disabled={stack.length >= 6}
          onClick={() => {
            const label = EDITS[seq.current % EDITS.length];
            setStack((s) => [...s, { id: ++seq.current, label }]);
            push(`push("${label}")`);
          }}
        >
          <Plus aria-hidden className="size-4" /> Make an edit
        </DemoButton>
        <DemoButton
          disabled={!stack.length}
          onClick={() => {
            const top = stack[stack.length - 1];
            setStack((s) => s.slice(0, -1));
            push(`pop() → undid "${top.label}"`, "ok");
          }}
        >
          <Undo2 aria-hidden className="size-4" /> Undo
        </DemoButton>
        <Reset onClick={() => (setStack([]), clear())} />
      </div>
      <LogList lines={lines} className="mt-4" />
    </DemoFrame>
  );
}

/* ----------------------------------------------------------------- queue */

const NAMES = ["Ada", "Bayo", "Chika", "Dayo", "Emeka", "Funmi", "Gbenga", "Halima", "Ife", "Jide"];

export function QueueDemo() {
  const [fifo, setFifo] = useState(true);
  const [line, setLine] = useState<{ id: number; name: string; at: number }[]>([]);
  const [turn, setTurn] = useState(0);
  const seq = useRef(0);
  const { lines, push, clear } = useLog(3);

  function join() {
    const name = NAMES[seq.current % NAMES.length];
    setLine((l) => [...l, { id: ++seq.current, name, at: turn }]);
    setTurn((t) => t + 1);
  }
  function serve() {
    if (!line.length) return;
    const who = fifo ? line[0] : line[line.length - 1];
    setLine((l) => (fifo ? l.slice(1) : l.slice(0, -1)));
    setTurn((t) => t + 1);
    push(`Served ${who.name} after waiting ${turn - who.at} turns.`, fifo ? "ok" : "warn");
  }
  const oldest = line.length ? turn - line[0].at : 0;

  return (
    <DemoFrame title="banking hall: a queue" hint="Keep people joining and serving. Then switch FIFO off and watch the person at the front.">
      <div className="relative">
        <Stamp show={!fifo && oldest >= 8}>{line[0]?.name} waited {oldest}</Stamp>
        <div className="flex min-h-[6rem] items-center gap-2 overflow-hidden rounded-xl bg-paper/60 p-3 ring-1 ring-rule">
          <span className="shrink-0 rounded-md bg-live/15 px-2 py-1 text-[0.65rem] font-bold uppercase text-live">teller</span>
          <AnimatePresence initial={false}>
            {line.map((p, i) => (
              <motion.span
                key={p.id}
                layout
                initial={{ x: 80, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ y: -40, opacity: 0 }}
                transition={spring}
                className={cn(
                  "flex shrink-0 flex-col items-center rounded-lg px-2.5 py-1.5 text-xs font-semibold ring-1",
                  i === 0 && turn - p.at >= 6 ? "bg-vermilion/20 text-vermilion ring-vermilion" : "bg-paper-3 text-ink ring-rule",
                )}
              >
                {p.name}
                <span className="tabular text-[0.6rem] text-muted">{turn - p.at}t</span>
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <DemoButton tone="primary" onClick={join} disabled={line.length >= 7}>
          <Plus aria-hidden className="size-4" /> Someone joins
        </DemoButton>
        <DemoButton onClick={serve} disabled={!line.length}>
          Serve next
        </DemoButton>
        <Reset onClick={() => (setLine([]), setTurn(0), clear())} />
      </div>
      <div className="mt-4">
        <Toggle on={fifo} onChange={setFifo} label="First in, first out" />
      </div>
      <LogList lines={lines} className="mt-4" />
    </DemoFrame>
  );
}

/* ----------------------------------------------------------- ring buffer */

const SLOTS = 8;

export function RingBufferDemo() {
  const [buf, setBuf] = useState<(number | null)[]>(Array(SLOTS).fill(null));
  const [written, setWritten] = useState(0);

  function write(n = 1) {
    setBuf((b) => {
      const next = b.slice();
      for (let k = 0; k < n; k++) next[(written + k) % SLOTS] = written + k + 1;
      return next;
    });
    setWritten((w) => w + n);
  }
  const head = written % SLOTS;
  const full = written >= SLOTS;
  const oldest = full ? head : 0;

  return (
    <DemoFrame title="last 8 log lines: ring buffer" hint="Fixed memory forever. When it's full, the newest line overwrites the oldest.">
      <div className="relative mx-auto aspect-square w-full max-w-[16rem]">
        {buf.map((v, i) => {
          const a = (i / SLOTS) * Math.PI * 2 - Math.PI / 2;
          const x = Math.round((50 + Math.cos(a) * 38) * 100) / 100;
          const y = Math.round((50 + Math.sin(a) * 38) * 100) / 100;
          const isNext = i === head;
          return (
            <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%` }}>
              <motion.span
                key={v ?? "empty"}
                initial={{ scale: 1.5, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={spring}
                className={cn(
                  "tabular grid size-11 place-items-center rounded-full text-xs font-bold ring-2",
                  v === null ? "bg-paper-3 text-muted ring-rule" : i === oldest && full ? "bg-pink text-on-accent ring-pink" : "bg-indigo/40 text-ink ring-indigo",
                  isNext && "ring-ochre",
                )}
              >
                {v === null ? "·" : `#${v}`}
              </motion.span>
            </div>
          );
        })}
        <div className="absolute inset-0 m-auto grid size-24 place-items-center text-center">
          <p className="text-xs text-muted">
            written
            <br />
            <span className="tabular font-display text-2xl font-extrabold text-ink">{written}</span>
            <br />
            kept {Math.min(written, SLOTS)}
          </p>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-muted">
        <span className="text-ochre">ochre ring</span> = next write · <span className="text-pink">pink</span> = oldest, overwritten next
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <DemoButton tone="primary" onClick={() => write()}>
          Write a line
        </DemoButton>
        <DemoButton onClick={() => write(5)}>Write 5</DemoButton>
        <Reset onClick={() => (setBuf(Array(SLOTS).fill(null)), setWritten(0))} />
      </div>
    </DemoFrame>
  );
}

/* ----------------------------------------------------------- linked list */

const STOPS = ["Oshodi", "Ikeja", "Ojota", "Maryland", "Yaba", "CMS", "Obalende", "Lekki"];

export function LinkedListDemo() {
  const [nodes, setNodes] = useState(() => STOPS.slice(0, 4).map((s, i) => ({ id: i, label: s })));
  const [sel, setSel] = useState<number | null>(1);
  const seq = useRef(4);
  const { lines, push, clear } = useLog(3);

  function insertAfter(idx: number | null) {
    const label = STOPS[seq.current % STOPS.length];
    const node = { id: seq.current++, label };
    const at = idx === null ? 0 : idx + 1;
    setNodes((n) => [...n.slice(0, at), node, ...n.slice(at)]);
    const shifted = nodes.length - at;
    push(
      idx === null
        ? `new.next = head; head = new, 2 pointer writes. An array would shift ${shifted}.`
        : `new.next = ${nodes[idx].label}.next; ${nodes[idx].label}.next = new, 2 writes. An array would shift ${shifted}.`,
      "ok",
    );
  }
  function remove(idx: number) {
    const gone = nodes[idx];
    setNodes((n) => n.filter((_, i) => i !== idx));
    setSel(null);
    push(idx === 0 ? `head = ${gone.label}.next, 1 write.` : `${nodes[idx - 1].label}.next = ${gone.label}.next, 1 write.`, "ok");
  }

  return (
    <DemoFrame title="bus route: a linked list" hint="Tap a stop to select it. Inserting or removing next to a node you're holding never moves the others.">
      <div className="flex min-h-[6rem] flex-wrap items-center gap-y-3 rounded-xl bg-paper/60 p-3 ring-1 ring-rule">
        <span className="mr-1 rounded-md bg-paper-3 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase text-muted">head</span>
        <AnimatePresence initial={false} mode="popLayout">
          {nodes.map((n, i) => (
            <motion.span key={n.id} layout initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} transition={spring} className="flex items-center">
              <button
                type="button"
                onClick={() => setSel(sel === i ? null : i)}
                aria-pressed={sel === i}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-xs font-semibold ring-1 transition-colors",
                  sel === i ? "bg-ochre text-on-accent ring-ochre" : "bg-paper-3 text-ink ring-rule hover:ring-ink-2",
                )}
              >
                {n.label}
              </button>
              <ArrowRight aria-hidden className="mx-0.5 size-4 text-muted" />
            </motion.span>
          ))}
        </AnimatePresence>
        <span className="rounded-md bg-paper-3 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase text-muted">null</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <DemoButton tone="primary" onClick={() => insertAfter(null)} disabled={nodes.length >= 8}>
          <Plus aria-hidden className="size-4" /> Insert at head
        </DemoButton>
        <DemoButton onClick={() => sel !== null && insertAfter(sel)} disabled={sel === null || nodes.length >= 8}>
          Insert after selected
        </DemoButton>
        <DemoButton tone="danger" onClick={() => sel !== null && remove(sel)} disabled={sel === null}>
          <Trash2 aria-hidden className="size-4" /> Remove
        </DemoButton>
        <Reset
          onClick={() => {
            setNodes(STOPS.slice(0, 4).map((s, i) => ({ id: i, label: s })));
            seq.current = 4;
            setSel(1);
            clear();
          }}
        />
      </div>
      <LogList lines={lines} className="mt-4" />
    </DemoFrame>
  );
}
