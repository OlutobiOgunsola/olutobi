"use client";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { MessageCircle, Plus } from "lucide-react";
import { DemoButton, DemoFrame } from "./DemoFrame";

/** gosh-chat: every client gets a goroutine; one hub owns the client list. */
type Client = { id: number; name: string; port: number };
type Msg = { id: number; from: number; text: string };

const NAMES = ["ada", "tunde", "bisi", "emeka", "zainab", "kola", "ifeoma", "seyi"];
const LINES = ["hello", "who dey?", "goroutines ftw", "e don land", "ping", "how far?"];

export function GoroutineDemo() {
  const [clients, setClients] = useState<Client[]>([]);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [log, setLog] = useState<string[]>(["$ go run . ", "listening on :9001"]);
  const seq = useRef(0);

  function write(line: string) {
    setLog((l) => [...l, line].slice(-6));
  }

  function connect() {
    if (clients.length >= 8) return;
    const id = ++seq.current;
    const c = { id, name: NAMES[(id - 1) % NAMES.length], port: 50000 + Math.floor(Math.random() * 9000) };
    setClients((cs) => [...cs, c]);
    write(`accept 127.0.0.1:${c.port} → go h.serve(conn) · goroutines: ${clients.length + 2}`);
  }
  function send() {
    if (!clients.length) return connect();
    const from = clients[Math.floor(Math.random() * clients.length)];
    const text = LINES[seq.current++ % LINES.length];
    const m = { id: Date.now(), from: from.id, text };
    setMsgs((ms) => [...ms, m]);
    write(`${from.name}: "${text}" → hub ← broadcast → ${clients.length} conns`);
    setTimeout(() => setMsgs((ms) => ms.filter((x) => x.id !== m.id)), 1500);
  }
  function drop() {
    const last = clients[clients.length - 1];
    if (!last) return;
    setClients((cs) => cs.slice(0, -1));
    write(`${last.name} disconnected (io.EOF) → h.leave ← conn`);
  }

  const R = 112;
  const pos = (i: number, n: number) => {
    const a = (i / Math.max(n, 1)) * Math.PI * 2 - Math.PI / 2;
    return { x: Math.cos(a) * R, y: Math.sin(a) * R };
  };

  return (
    <DemoFrame title="gosh-chat · tcp :9001" hint="Only the hub goroutine touches the client map. Everyone else talks to it over channels, no mutex.">
      <div className="relative mx-auto aspect-square w-full max-w-[19rem]">
        <motion.div
          className="absolute left-1/2 top-1/2 grid size-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-indigo text-center font-mono text-[0.65rem] font-bold leading-tight text-indigo-ink shadow-[0_16px_32px_-12px_rgba(0,0,0,.7)]"
          animate={{ scale: msgs.length ? [1, 1.15, 1] : 1 }}
          transition={{ duration: 0.4 }}
        >
          hub
          <br />
          select {"{}"}
        </motion.div>
        <div className="absolute inset-[12%] rounded-full border border-dashed border-rule" />
        <AnimatePresence>
          {clients.map((c, i) => {
            const p = pos(i, clients.length);
            return (
              <motion.div
                key={c.id}
                className="absolute left-1/2 top-1/2 -ml-7 -mt-7 grid size-14 place-items-center rounded-full bg-paper-3 text-center ring-1 ring-ochre/60"
                initial={{ scale: 0, x: 0, y: 0 }}
                animate={{ scale: 1, x: p.x, y: p.y }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 14 }}
              >
                <span className="font-mono text-[0.6rem] leading-tight text-ochre">
                  go
                  <br />
                  {c.name}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <AnimatePresence>
          {msgs.flatMap((m) => {
            const fromIdx = clients.findIndex((c) => c.id === m.from);
            if (fromIdx < 0) return [];
            const start = pos(fromIdx, clients.length);
            return clients.map((c, i) => {
              const end = pos(i, clients.length);
              return (
                <motion.span
                  key={`${m.id}-${c.id}`}
                  className="absolute left-1/2 top-1/2 -ml-1.5 -mt-1.5 size-3 rounded-full bg-ochre shadow-[0_3px_6px_rgba(0,0,0,.5)]"
                  initial={{ x: start.x, y: start.y, scale: 0.6 }}
                  animate={{ x: [start.x, 0, end.x], y: [start.y, 0, end.y], scale: [0.6, 1.2, 0.8] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.1, ease: "easeInOut" }}
                />
              );
            });
          })}
        </AnimatePresence>
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <DemoButton tone="primary" onClick={connect} disabled={clients.length >= 8}>
          <Plus aria-hidden className="size-4" /> nc localhost 9001
        </DemoButton>
        <DemoButton onClick={send}>
          <MessageCircle aria-hidden className="size-4" /> send message
        </DemoButton>
        <DemoButton tone="danger" onClick={drop} disabled={!clients.length}>
          disconnect
        </DemoButton>
      </div>

      <pre className="mt-4 h-36 overflow-hidden rounded-2xl bg-paper p-3 font-mono text-[0.68rem] leading-relaxed text-live ring-1 ring-rule">
        {log.join("\n")}
        <span className="caret" />
      </pre>
    </DemoFrame>
  );
}
