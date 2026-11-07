"use client";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Bot, Compass, ConciergeBell, Crown, Dumbbell, Ban } from "lucide-react";
import { cn } from "@/lib/cn";
import { DemoButton, DemoFrame } from "./DemoFrame";

/** Pick who's asking. The model only ever sees the tools that person may use. */
const TOOLS = [
  { name: "members.list", roles: ["owner", "manager", "frontdesk", "instructor"] },
  { name: "members.analytics", roles: ["owner", "manager"] },
  { name: "retention.churn", roles: ["owner", "manager"] },
  { name: "payroll.summary", roles: ["owner"] },
  { name: "expenses.list", roles: ["owner", "manager"] },
  { name: "bookings.create", roles: ["owner", "manager", "frontdesk"] },
  { name: "rooms.availability", roles: ["owner", "manager", "frontdesk"] },
  { name: "classes.list", roles: ["owner", "manager", "frontdesk", "instructor"] },
  { name: "instructors.assigned", roles: ["owner", "manager", "instructor"] },
  { name: "inventory.list", roles: ["owner", "manager"] },
  { name: "equipment.maintenance", roles: ["owner", "manager"] },
  { name: "payments.list", roles: ["owner", "manager"] },
];
const ROLES = [
  { id: "owner", label: "Owner", Icon: Crown },
  { id: "manager", label: "Manager", Icon: Compass },
  { id: "frontdesk", label: "Front desk", Icon: ConciergeBell },
  { id: "instructor", label: "Instructor", Icon: Dumbbell },
];
const QUESTIONS = [
  { q: "What did we spend on salaries this month?", tool: "payroll.summary", answer: "Payroll for October was ₦1,840,000 across 9 staff, 6% under September." },
  { q: "How many members churned last month, and why?", tool: "retention.churn", answer: "14 members left. Top reasons: cost (6), relocation (4), schedule (3)." },
  { q: "Book room 204 for Friday night.", tool: "bookings.create", answer: "Done: BK-1047, room 204, Friday 1 night. Confirmation SMS queued." },
];

export function VigilDemo() {
  const [role, setRole] = useState("owner");
  const [qi, setQi] = useState<number | null>(null);
  const [typed, setTyped] = useState("");

  const visible = TOOLS.filter((t) => t.roles.includes(role));
  const question = qi !== null ? QUESTIONS[qi] : null;
  const allowed = question ? visible.some((t) => t.name === question.tool) : false;
  const reply = question
    ? allowed
      ? question.answer
      : "That isn't something I can help with for your role. (The tool isn't in my world. I couldn't call it if I tried.)"
    : "";

  useEffect(() => {
    if (!reply) return;
    let i = 0;
    const t = setInterval(() => {
      i += 2;
      setTyped(reply.slice(0, i));
      if (i >= reply.length) clearInterval(t);
    }, 18);
    return () => clearInterval(t);
  }, [reply]);

  return (
    <DemoFrame title="vigil · tools filtered by role before prompting" hint="Sample answers. Every tool also calls the product API with the user's own token, so the product enforces permissions a second time.">
      <div className="flex flex-wrap gap-2">
        {ROLES.map((r) => (
          <DemoButton key={r.id} pressed={role === r.id} onClick={() => { setRole(r.id); setTyped(""); }}>
            <r.Icon aria-hidden className="size-4" /> {r.label}
          </DemoButton>
        ))}
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <p className="text-xs font-medium text-muted">Tools in the model&apos;s context</p>
        <motion.p key={visible.length} initial={{ scale: 1.6, color: "var(--ochre)" }} animate={{ scale: 1, color: "var(--ink)" }} className="tabular font-display text-2xl font-extrabold">
          {visible.length}/{TOOLS.length}
        </motion.p>
      </div>
      <motion.ul layout className="mt-2 flex min-h-[5.5rem] flex-wrap content-start gap-1.5">
        <AnimatePresence mode="popLayout">
          {visible.map((t) => (
            <motion.li
              key={t.name}
              layout
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 25, opacity: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 18 }}
              className="rounded-full bg-indigo/15 px-2.5 py-1 font-mono text-[0.68rem] text-indigo ring-1 ring-indigo/40"
            >
              {t.name}
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>

      <div className="mt-4 space-y-2">
        {QUESTIONS.map((x, i) => (
          <button
            key={x.q}
            type="button"
            onClick={() => { setQi(i); setTyped(""); }}
            className={cn(
              "block w-full rounded-2xl px-4 py-2.5 text-left text-sm transition-all hover:translate-x-1",
              qi === i ? "bg-ochre text-on-accent" : "bg-paper-3/70 text-ink-2 ring-1 ring-rule hover:text-ink",
            )}
          >
            “{x.q}”
          </button>
        ))}
      </div>

      <div className="mt-3 min-h-[4.5rem] rounded-2xl bg-paper p-4 ring-1 ring-rule">
        {question ? (
          <p className={cn("text-sm leading-relaxed", allowed ? "text-ink" : "text-vermilion")}>
            {allowed ? <Bot aria-hidden className="mr-2 inline size-4 align-[-2px]" /> : <Ban aria-hidden className="mr-2 inline size-4 align-[-2px]" />}
            <span className="caret">{typed}</span>
          </p>
        ) : (
          <p className="text-sm text-muted">Pick a role, then ask Vigil something.</p>
        )}
      </div>
    </DemoFrame>
  );
}
