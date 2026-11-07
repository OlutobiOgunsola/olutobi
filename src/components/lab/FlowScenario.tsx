"use client";
import { motion, MotionConfig } from "motion/react";
import { useState } from "react";
import {
  AppWindow,
  Bell,
  BookOpen,
  Box,
  Clock,
  Cloud,
  Cog,
  Crown,
  Database,
  DatabaseBackup,
  DoorOpen,
  FileText,
  Flag,
  Globe,
  HardDrive,
  KeyRound,
  Landmark,
  Layers,
  ListOrdered,
  Lock,
  Mail,
  Pause,
  Play,
  RotateCcw,
  Router,
  Search,
  Server,
  Shield,
  Skull,
  Smartphone,
  Split,
  StepForward,
  User,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { FlowScene, FlowStep, IconKey, NodeStatus, Tone } from "@/content/lab/types";
import { DemoButton, DemoFrame, Toggle } from "@/components/demos/DemoFrame";
import { LogList, Stamp } from "@/components/demos/LogList";
import { useInterval } from "@/components/demos/hooks";

const ICONS: Record<IconKey, LucideIcon> = {
  user: User,
  phone: Smartphone,
  browser: AppWindow,
  server: Server,
  db: Database,
  replica: DatabaseBackup,
  cache: Zap,
  lb: Split,
  queue: ListOrdered,
  cdn: Globe,
  gateway: DoorOpen,
  worker: Cog,
  lock: Lock,
  shield: Shield,
  key: KeyRound,
  mail: Mail,
  bell: Bell,
  cloud: Cloud,
  flag: Flag,
  box: Box,
  clock: Clock,
  attacker: Skull,
  wallet: Wallet,
  file: FileText,
  search: Search,
  router: Router,
  disk: HardDrive,
  layers: Layers,
  crown: Crown,
  dns: BookOpen,
  bank: Landmark,
};

const RING: Record<NodeStatus, string> = {
  ok: "ring-live text-live",
  bad: "ring-vermilion text-vermilion",
  busy: "ring-ochre text-ochre",
  idle: "ring-rule text-ink-2",
  down: "ring-vermilion/50 text-muted opacity-50",
};

const PACKET: Record<Tone, string> = {
  ok: "bg-live text-on-accent",
  bad: "bg-vermilion text-on-accent",
  info: "bg-indigo text-indigo-ink",
  warn: "bg-ochre text-on-accent",
};

const STEP_MS = 1600;

/** Fold every step up to `upto` into the persistent node state. */
function fold(steps: FlowStep[], upto: number) {
  const status: Record<string, NodeStatus> = {};
  const badges: Record<string, string> = {};
  for (let i = 0; i <= upto; i++) {
    Object.assign(status, steps[i].status);
    Object.assign(badges, steps[i].badges);
  }
  return { status, badges };
}

/**
 * Plays a scripted scenario: nodes on a stage, packets travelling between them,
 * and, when the scene has a switch, the same story with the pattern removed.
 */
export function FlowScenario({ scene }: { scene: FlowScene }) {
  const [on, setOn] = useState(true);
  const [step, setStep] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [run, setRun] = useState(0);

  const steps = on || !scene.off ? scene.on : scene.off;
  const last = steps.length - 1;
  const done = step === last;
  const { status, badges } = fold(steps, step);
  const current = step >= 0 ? steps[step] : null;
  const byId = new Map(scene.nodes.map((n) => [n.id, n]));
  const live = new Set((current?.packets ?? []).flatMap((p) => [`${p.from}>${p.to}`, `${p.to}>${p.from}`]));

  useInterval(
    () => {
      if (step >= last) setPlaying(false);
      else setStep(step + 1);
    },
    playing ? STEP_MS : null,
  );

  function reset() {
    setPlaying(false);
    setStep(-1);
    setRun((r) => r + 1);
  }

  function play() {
    if (playing) return setPlaying(false);
    if (done) {
      setRun((r) => r + 1);
      setStep(0);
    } else if (step < 0) setStep(0);
    setPlaying(true);
  }

  const lines = steps
    .slice(0, step + 1)
    .map((s, i) => ({ id: run * 1000 + i, text: s.note, tone: s.tone ?? "info" }))
    .reverse()
    .slice(0, 3);

  return (
    <MotionConfig reducedMotion="user">
      <DemoFrame title={scene.title} hint={scene.hint}>
        <div className="relative h-72 rounded-xl bg-paper/60 ring-1 ring-rule sm:h-80">
          <div className="absolute inset-x-8 bottom-10 top-11 sm:inset-x-12">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden>
              {scene.edges.map(([a, b]) => {
                const na = byId.get(a);
                const nb = byId.get(b);
                if (!na || !nb) return null;
                const hot = live.has(`${a}>${b}`);
                return (
                  <line
                    key={`${a}-${b}`}
                    x1={na.x}
                    y1={na.y}
                    x2={nb.x}
                    y2={nb.y}
                    vectorEffect="non-scaling-stroke"
                    strokeWidth={hot ? 2 : 1.5}
                    strokeDasharray={hot ? undefined : "4 5"}
                    className={cn("transition-colors duration-300", hot ? "stroke-ochre" : "stroke-rule")}
                  />
                );
              })}
            </svg>

            {scene.nodes.map((n) => {
              const Icon = ICONS[n.icon];
              const s = status[n.id] ?? "idle";
              const badge = badges[n.id];
              return (
                <div
                  key={n.id}
                  className="absolute flex w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                  style={{ left: `${n.x}%`, top: `${n.y}%` }}
                >
                  {badge ? (
                    <motion.span
                      key={badge}
                      initial={{ y: 6, opacity: 0, scale: 0.8 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 420, damping: 18 }}
                      className="tabular absolute -top-5 whitespace-nowrap rounded-full bg-paper-3 px-2 py-0.5 text-[0.62rem] font-semibold text-ink ring-1 ring-rule"
                    >
                      {badge}
                    </motion.span>
                  ) : null}
                  <motion.span
                    animate={
                      s === "bad"
                        ? { rotate: [0, -10, 10, -6, 0] }
                        : s === "busy"
                          ? { scale: [1, 1.08, 1] }
                          : { rotate: 0, scale: 1 }
                    }
                    transition={s === "busy" ? { duration: 0.9, repeat: Infinity } : { duration: 0.45 }}
                    className={cn(
                      "grid size-10 place-items-center rounded-xl bg-paper-3 ring-2 transition-[box-shadow,color,opacity] duration-300 sm:size-12",
                      RING[s],
                    )}
                  >
                    <Icon aria-hidden className="size-5 sm:size-[1.35rem]" strokeWidth={2} />
                  </motion.span>
                  <span className="mt-1.5 text-center text-[0.64rem] font-semibold leading-tight text-ink-2 sm:text-[0.7rem]">{n.label}</span>
                </div>
              );
            })}

            {(current?.packets ?? []).map((p, i) => {
              const a = byId.get(p.from);
              const b = byId.get(p.to);
              if (!a || !b) return null;
              return (
                <motion.span
                  key={`${run}-${step}-${i}`}
                  initial={{ left: `${a.x}%`, top: `${a.y}%`, opacity: 0, scale: 0.6 }}
                  animate={{ left: `${b.x}%`, top: `${b.y}%`, opacity: [0, 1, 1, 0.9], scale: 1 }}
                  transition={{ duration: 1, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                  className={cn(
                    "pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[0.62rem] font-bold shadow-[0_4px_10px_rgba(0,0,0,.45)]",
                    PACKET[p.tone ?? "info"],
                    !p.label && "size-3 p-0",
                  )}
                >
                  {p.label}
                </motion.span>
              );
            })}
          </div>
          <span className="tabular absolute bottom-2.5 right-3 text-[0.65rem] font-semibold text-muted">
            {step < 0 ? "ready" : `step ${step + 1}/${steps.length}`}
          </span>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <DemoButton tone="primary" onClick={play}>
            {playing ? <Pause aria-hidden className="size-4" /> : <Play aria-hidden className="size-4" />}
            {playing ? "Pause" : done ? "Replay" : "Play"}
          </DemoButton>
          <DemoButton
            onClick={() => {
              setPlaying(false);
              setStep((s) => Math.min(s + 1, last));
            }}
            disabled={done}
          >
            <StepForward aria-hidden className="size-4" /> Step
          </DemoButton>
          {scene.verdict && (
            <Stamp show={done} good={on} className="relative right-auto top-auto ml-1 text-sm">
              {on ? scene.verdict.on : scene.verdict.off}
            </Stamp>
          )}
          <button type="button" onClick={reset} className="ml-auto inline-flex items-center gap-1 text-xs text-muted hover:text-ink">
            <RotateCcw aria-hidden className="size-3.5" /> reset
          </button>
        </div>
        {scene.toggle && scene.off && (
          <div className="mt-4">
            <Toggle
              on={on}
              onChange={(v) => {
                setOn(v);
                reset();
              }}
              label={scene.toggle}
            />
          </div>
        )}
        <LogList
          lines={lines.length ? lines : [{ id: -1, text: scene.toggle ? "Press play, then flip the switch and play it again." : "Press play, or step through it.", tone: "info" }]}
          className="mt-4"
        />
      </DemoFrame>
    </MotionConfig>
  );
}
