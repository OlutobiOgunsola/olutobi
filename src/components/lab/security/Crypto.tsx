"use client";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Gauge, ShieldCheck, Skull, Snail } from "lucide-react";
import { cn } from "@/lib/cn";
import { DemoButton, DemoFrame, Toggle } from "@/components/demos/DemoFrame";
import { LogList, Stamp } from "@/components/demos/LogList";
import { useLog } from "@/components/demos/hooks";

const enc = new TextEncoder();
const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");

async function sha256(s: string) {
  return hex(await crypto.subtle.digest("SHA-256", enc.encode(s)));
}

async function pbkdf2(password: string, salt: string, iterations: number) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  return hex(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: enc.encode(salt), iterations }, key, 256));
}

const SPACE = 26 ** 8; // every 8-letter lowercase password

function duration(s: number) {
  if (s < 60) return `${s.toFixed(1)} seconds`;
  if (s < 3600) return `${Math.round(s / 60)} minutes`;
  if (s < 86400 * 2) return `${Math.round(s / 3600)} hours`;
  if (s < 31_536_000 * 2) return `${Math.round(s / 86400)} days`;
  return `${Math.round(s / 31_536_000).toLocaleString("en-NG")} years`;
}

/* ------------------------------------------------------- password hashing */

const ITER = 210_000;

export function PasswordHashDemo() {
  const [pw, setPw] = useState("jollof2024");
  const [rows, setRows] = useState<{ kind: "fast" | "slow"; hash: string; ms: number; perSec: number }[]>([]);
  const [busy, setBusy] = useState(false);

  async function measure(kind: "fast" | "slow") {
    if (busy) return;
    setBusy(true);
    const t0 = performance.now();
    let hash = "";
    let tries = 0;
    if (kind === "fast") {
      // Hash many times so the timing isn't just noise.
      while (performance.now() - t0 < 300) {
        hash = await sha256(pw);
        tries++;
      }
    } else {
      hash = await pbkdf2(pw, "per-user-salt", ITER);
      tries = 1;
    }
    const ms = (performance.now() - t0) / tries;
    setRows((r) => [{ kind, hash, ms, perSec: 1000 / ms }, ...r.filter((x) => x.kind !== kind)]);
    setBusy(false);
  }

  return (
    <DemoFrame title="storing a password" hint="Measured live in your browser. A real attacker's GPU is far faster than this. The ratio between the two rows is what matters.">
      <label className="text-sm font-semibold text-ink-2" htmlFor="pw">
        Password
      </label>
      <input
        id="pw"
        value={pw}
        onChange={(e) => (setPw(e.target.value.slice(0, 24)), setRows([]))}
        className="mt-1.5 w-full rounded-xl bg-paper-3 px-4 py-2.5 font-mono text-base text-ink ring-1 ring-rule outline-none focus:ring-ochre"
      />
      <div className="mt-4 flex flex-wrap gap-2">
        <DemoButton tone="danger" onClick={() => measure("fast")} disabled={busy}>
          <Gauge aria-hidden className="size-4" /> SHA-256 (fast)
        </DemoButton>
        <DemoButton tone="primary" onClick={() => measure("slow")} disabled={busy}>
          <Snail aria-hidden className="size-4" /> PBKDF2 × {ITER.toLocaleString("en-NG")}
        </DemoButton>
      </div>
      <div className="mt-4 space-y-2">
        <AnimatePresence initial={false}>
          {rows.map((r) => (
            <motion.div
              key={r.kind}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("rounded-xl p-3 ring-1", r.kind === "fast" ? "bg-vermilion/10 ring-vermilion/40" : "bg-live/10 ring-live/40")}
            >
              <p className="truncate font-mono text-[0.7rem] text-ink-2">{r.hash}</p>
              <p className={cn("tabular mt-1 text-sm font-semibold", r.kind === "fast" ? "text-vermilion" : "text-live")}>
                {r.ms < 1 ? `${(r.ms * 1000).toFixed(0)} µs` : `${r.ms.toFixed(0)} ms`} per guess · {Math.round(r.perSec).toLocaleString("en-NG")} guesses/s here · every 8-letter password in{" "}
                {duration(SPACE / r.perSec)}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
        {busy && <p className="text-sm text-muted">Hashing…</p>}
      </div>
    </DemoFrame>
  );
}

/* ---------------------------------------------------------------- salting */

const COMMON = ["123456", "password", "password123", "qwerty", "iloveyou", "naija123"];
const SALTS = { Ada: "9f3ac1d2", Bayo: "7e20bd54" }; // sample salts; real ones are random per user

export function SaltDemo() {
  const [salted, setSalted] = useState(false);
  const [rows, setRows] = useState<{ user: string; hash: string }[]>([]);
  const [rainbow, setRainbow] = useState<Map<string, string>>(new Map());
  const [cracked, setCracked] = useState<string[] | null>(null);

  useEffect(() => {
    let live = true;
    Promise.all(COMMON.map(async (p) => [await sha256(p), p] as const)).then((pairs) => live && setRainbow(new Map(pairs)));
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    let live = true;
    Promise.all(
      (Object.keys(SALTS) as (keyof typeof SALTS)[]).map(async (user) => ({
        user,
        hash: await sha256(salted ? SALTS[user] + "password123" : "password123"),
      })),
    ).then((r) => {
      if (!live) return;
      setRows(r);
      setCracked(null);
    });
    return () => {
      live = false;
    };
  }, [salted]);

  const same = rows.length === 2 && rows[0].hash === rows[1].hash;

  return (
    <DemoFrame title="users table: password column" hint="Ada and Bayo picked the same password. The attacker has a stolen copy of the table and a list of pre-hashed common passwords.">
      <div className="relative">
        <Stamp show={!!cracked && cracked.length > 0}>{cracked?.length} cracked</Stamp>
        <div className="space-y-2">
          {rows.map((r) => (
            <motion.div key={`${r.user}-${r.hash}`} initial={{ rotateX: 90, opacity: 0 }} animate={{ rotateX: 0, opacity: 1 }} className="rounded-xl bg-paper-3/70 p-3 ring-1 ring-rule">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold">{r.user}</span>
                {salted && <span className="font-mono text-[0.65rem] text-indigo">salt {SALTS[r.user as keyof typeof SALTS]}</span>}
              </div>
              <p className={cn("mt-1 truncate font-mono text-[0.7rem]", same ? "text-vermilion" : "text-ink-2")}>{r.hash}</p>
              {cracked?.includes(r.user) && <p className="mt-1 text-xs font-bold text-vermilion">→ found in the table: &ldquo;password123&rdquo;</p>}
            </motion.div>
          ))}
        </div>
      </div>
      {same && <p className="mt-3 text-sm font-semibold text-vermilion">Identical hashes. Crack one, and you&apos;ve cracked both, and everyone else with that password.</p>}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <DemoButton
          tone="danger"
          disabled={!rainbow.size}
          onClick={() => setCracked(rows.filter((r) => rainbow.has(r.hash)).map((r) => r.user))}
        >
          <Skull aria-hidden className="size-4" /> Look up in the rainbow table
        </DemoButton>
        <Toggle on={salted} onChange={setSalted} label="Salt" />
      </div>
      {cracked && cracked.length === 0 && <p className="mt-3 text-sm font-semibold text-live">No matches. The table was built without these salts, so it&apos;s useless.</p>}
    </DemoFrame>
  );
}

/* ------------------------------------------------------------ JWT tamper */

const SECRET = "server-side-secret";
const b64url = (s: string) => btoa(s).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
const b64urlBytes = (b: ArrayBuffer) => b64url(String.fromCharCode(...new Uint8Array(b)));

async function hmac(data: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64urlBytes(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

const HEADER = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));

export function JwtDemo() {
  const [verify, setVerify] = useState(true);
  const [role, setRole] = useState<"customer" | "admin">("customer");
  const [sig, setSig] = useState("");
  const [result, setResult] = useState<null | { ok: boolean; text: string }>(null);
  const { lines, push, clear } = useLog(3);
  const payload = b64url(JSON.stringify({ sub: "tobi", role }));

  useEffect(() => {
    let live = true;
    hmac(`${HEADER}.${b64url(JSON.stringify({ sub: "tobi", role: "customer" }))}`).then((s) => live && setSig(s));
    return () => {
      live = false;
    };
  }, []);

  async function send() {
    const expected = await hmac(`${HEADER}.${payload}`);
    const valid = expected === sig;
    if (verify && !valid) {
      setResult({ ok: true, text: "401: signature doesn't match the payload. Rejected." });
      push("Server re-signed header.payload with its secret: signatures differ.", "ok");
    } else if (role === "admin") {
      setResult({ ok: false, text: "200: welcome to the admin panel." });
      push("Server decoded the payload and believed it. Nobody checked the signature.", "bad");
    } else {
      setResult({ ok: true, text: "200: customer dashboard." });
      push(verify ? "Signature verified. Payload untouched." : "Accepted, but only because nothing was changed.", verify ? "ok" : "warn");
    }
  }

  return (
    <DemoFrame title="Authorization: Bearer <jwt>" hint="The token was signed by the server for a customer. You can edit the payload. You just don't have the secret to re-sign it.">
      <div className="relative">
        <Stamp show={!!result && !result.ok}>became admin</Stamp>
        <p className="break-all rounded-xl bg-paper/60 p-3 font-mono text-[0.7rem] leading-relaxed ring-1 ring-rule">
          <span className="text-pink">{HEADER}</span>.<motion.span key={payload} initial={{ backgroundColor: "rgba(255,179,92,.35)" }} animate={{ backgroundColor: "rgba(255,179,92,0)" }} className="text-ochre">{payload}</motion.span>.<span className="text-indigo">{sig || "…"}</span>
        </p>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-[0.65rem] font-semibold">
        <span className="text-pink">header</span>
        <span className="text-ochre">payload · {`{ sub: "tobi", role: "${role}" }`}</span>
        <span className="text-indigo">signature</span>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <DemoButton tone={role === "admin" ? "danger" : "default"} onClick={() => (setRole((r) => (r === "admin" ? "customer" : "admin")), setResult(null))}>
          <Skull aria-hidden className="size-4" /> {role === "admin" ? "Undo edit" : 'Edit role to "admin"'}
        </DemoButton>
        <DemoButton tone="primary" onClick={send} disabled={!sig}>
          <ShieldCheck aria-hidden className="size-4" /> Send request
        </DemoButton>
        <button type="button" onClick={() => (setRole("customer"), setResult(null), clear())} className="ml-auto text-xs text-muted hover:text-ink">
          reset
        </button>
      </div>
      <AnimatePresence mode="wait">
        {result && (
          <motion.p key={result.text} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={cn("mt-4 rounded-lg px-3 py-2 text-sm font-bold", result.ok ? "bg-live/10 text-live" : "bg-vermilion/10 text-vermilion")}>
            {result.text}
          </motion.p>
        )}
      </AnimatePresence>
      <div className="mt-4">
        <Toggle on={verify} onChange={(v) => (setVerify(v), setResult(null))} label="Verify signature" />
      </div>
      <LogList lines={lines} className="mt-4" />
    </DemoFrame>
  );
}
