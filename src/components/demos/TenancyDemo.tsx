"use client";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { Building2, Dumbbell } from "lucide-react";
import { cn } from "@/lib/cn";
import { DemoButton, DemoFrame, Toggle } from "./DemoFrame";

/** You own one gym. Try to read a member from the gym across town. */
const MEMBERS = [
  { id: 101, gym: 12, gymName: "Iron Paradise, Ibadan", name: "Tunde A.", plan: "Premium" },
  { id: 102, gym: 12, gymName: "Iron Paradise, Ibadan", name: "Ngozi E.", plan: "Basic" },
  { id: 207, gym: 31, gymName: "FitHub, Lekki", name: "Chioma O.", plan: "Premium", phone: "0803 *** 4471" },
];

export function TenancyDemo() {
  const [scoped, setScoped] = useState(true);
  const [result, setResult] = useState<{ id: number; status: number; key: number } | null>(null);
  const seq = useRef(0);

  function request(id: number) {
    const m = MEMBERS.find((x) => x.id === id)!;
    const visible = !scoped || m.gym === 12;
    setResult({ id, status: visible ? 200 : 404, key: ++seq.current });
  }

  const member = result ? MEMBERS.find((m) => m.id === result.id)! : null;
  const leaked = result?.status === 200 && member?.gym !== 12;

  return (
    <DemoFrame title="GET /members/:id · x-gym-id: 12" hint="Sample data. You're signed in as the owner of Iron Paradise (gym 12); member 207 belongs to a different gym.">
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { id: 12, name: "Iron Paradise, Ibadan", you: true },
          { id: 31, name: "FitHub, Lekki", you: false },
        ].map((g) => (
          <div key={g.id} className={cn("rounded-2xl p-4 ring-1", g.you ? "bg-indigo/10 ring-indigo/40" : "bg-paper-3/60 ring-rule")}>
            <p className="flex items-center gap-2 font-display text-lg font-bold">
              {g.you ? <Dumbbell aria-hidden className="size-5 text-indigo" /> : <Building2 aria-hidden className="size-5 text-muted" />} {g.name}
            </p>
            <p className="text-xs text-muted">
              <code className="font-mono">gym_id = {g.id}</code> {g.you && "· that's you"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {MEMBERS.filter((m) => m.gym === g.id).map((m) => (
                <DemoButton key={m.id} onClick={() => request(m.id)} tone={g.you ? "default" : "danger"}>
                  GET #{m.id}
                </DemoButton>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <Toggle on={scoped} onChange={(v) => { setScoped(v); setResult(null); }} label="Tenant scope" />
      </div>

      <pre className="mt-4 overflow-x-auto rounded-2xl bg-paper p-4 font-mono text-[0.72rem] leading-relaxed ring-1 ring-rule">
        <span className="text-muted">SELECT * FROM members WHERE id = </span>
        <span className="text-ochre">{result?.id ?? ":id"}</span>
        {scoped && (
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-live">
            {" "}AND gym_id = 12
          </motion.span>
        )}
      </pre>

      <div className="relative mt-3 min-h-[7.5rem]">
        <AnimatePresence mode="wait">
          {result && member && (
            <motion.div
              key={result.key}
              initial={{ opacity: 0, y: 16, rotate: -2 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className={cn(
                "relative rounded-2xl p-4 font-mono text-[0.75rem] ring-1",
                result.status === 404 ? "bg-indigo/10 ring-indigo/40" : leaked ? "bg-vermilion/10 ring-vermilion/50" : "bg-live/10 ring-live/40",
              )}
            >
              <p className={result.status === 404 ? "text-indigo" : leaked ? "text-vermilion" : "text-live"}>
                HTTP {result.status} {result.status === 404 ? "Not Found" : "OK"}
              </p>
              <p className="mt-1 text-ink-2">
                {result.status === 404
                  ? `{ "error": "Member not found." }`
                  : `{ "name": "${member.name}", "gym": "${member.gymName}", "plan": "${member.plan}"${member.phone ? `, "phone": "${member.phone}"` : ""} }`}
              </p>
              {result.status === 404 && (
                <p className="mt-2 font-sans text-xs text-muted">404, not 403. From inside gym 12, gym 31&apos;s members don&apos;t exist.</p>
              )}
              {leaked && (
                <motion.span
                  initial={{ scale: 3, opacity: 0, rotate: -30 }}
                  animate={{ scale: 1, opacity: 1, rotate: -12 }}
                  transition={{ type: "spring", stiffness: 260, damping: 12 }}
                  className="absolute -top-3 right-4 rounded-lg border-2 border-vermilion bg-paper px-2 py-0.5 font-display text-lg font-extrabold uppercase text-vermilion"
                >
                  Data leak!
                </motion.span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DemoFrame>
  );
}
