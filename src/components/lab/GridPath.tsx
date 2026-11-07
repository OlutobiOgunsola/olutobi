"use client";
import { motion, MotionConfig } from "motion/react";
import { useMemo, useState } from "react";
import { Flag, Pause, Play, RotateCcw, Shuffle } from "lucide-react";
import { cn } from "@/lib/cn";
import { GRID_H, GRID_W, makeGrid, runGrid, type Grid } from "@/lib/algos";
import type { GridAlgoKey } from "@/content/lab/types";
import { DemoButton, DemoFrame } from "@/components/demos/DemoFrame";
import { useInterval } from "@/components/demos/hooks";

const TITLES: Record<GridAlgoKey, string> = {
  bfs: "bfs(grid, start, goal)",
  dfs: "dfs(grid, start, goal)",
  dijkstra: "dijkstra(grid, start, goal)",
  astar: "aStar(grid, start, goal, manhattan)",
};

const NOTES: Record<GridAlgoKey, string> = {
  bfs: "Ripples out one step at a time. Fewest steps, but it doesn't care that mud is slow.",
  dfs: "Dives down one corridor until it hits a wall, then backs up. Finds a path, rarely a good one.",
  dijkstra: "Always expands the cheapest cell so far. Walks around mud when that's cheaper.",
  astar: "Dijkstra plus a hunch about where the goal is. Same best path, far fewer cells explored.",
};

type Brush = "wall" | "mud";

export function GridPath({ algo }: { algo: GridAlgoKey }) {
  const [layout, setLayout] = useState(0);
  const [edits, setEdits] = useState<Grid | null>(null);
  const [t, setT] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [brush, setBrush] = useState<Brush>("wall");
  const base = useMemo(() => makeGrid(`${algo}-${layout}`), [algo, layout]);
  const grid = edits ?? base;
  const result = useMemo(() => runGrid(algo, grid), [algo, grid]);
  const finished = t >= result.steps;

  useInterval(
    () => {
      if (t >= result.steps + result.path.length) setPlaying(false);
      else setT(t + 1);
    },
    playing ? 45 : null,
  );

  function paint(c: number) {
    if (c === grid.start || c === grid.goal) return;
    setPlaying(false);
    setT(-1);
    const next = { ...grid, walls: grid.walls.slice(), mud: grid.mud.slice() };
    if (brush === "wall") {
      next.walls[c] = !next.walls[c];
      next.mud[c] = false;
    } else {
      next.mud[c] = !next.mud[c];
      next.walls[c] = false;
    }
    setEdits(next);
  }

  const onPath = new Map(result.path.map((c, k) => [c, k]));
  const pathShown = finished ? t - result.steps : -1;

  return (
    <MotionConfig reducedMotion="user">
      <DemoFrame title={TITLES[algo]} hint="Tap cells to paint walls or mud, then run it again. Mud costs 5 to cross; everything else costs 1.">
        <div
          className="grid gap-[3px] rounded-xl bg-paper/60 p-2 ring-1 ring-rule sm:gap-1 sm:p-3"
          style={{ gridTemplateColumns: `repeat(${GRID_W}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: GRID_W * GRID_H }, (_, c) => {
            const visited = t >= 0 && result.visitedAt[c] >= 0 && result.visitedAt[c] <= t;
            const frontier = !visited && t >= 0 && result.seenAt[c] >= 0 && result.seenAt[c] <= t;
            const k = onPath.get(c);
            const lit = k !== undefined && pathShown >= k;
            const isStart = c === grid.start;
            const isGoal = c === grid.goal;
            return (
              <button
                key={c}
                type="button"
                aria-label={isStart ? "start" : isGoal ? "goal" : `cell ${c % GRID_W + 1},${Math.floor(c / GRID_W) + 1}`}
                onClick={() => paint(c)}
                className={cn(
                  "relative aspect-square rounded-[4px] transition-colors duration-200",
                  grid.walls[c] ? "bg-ink-2/80" : grid.mud[c] ? "bg-[#5a3b1f]" : "bg-paper-3",
                  visited && !grid.walls[c] && (grid.mud[c] ? "bg-[#7d5a2a]" : "bg-indigo/45"),
                  frontier && "bg-pink/50",
                  lit && "bg-ochre",
                  (isStart || isGoal) && "bg-live",
                )}
              >
                {visited && !lit && !isStart && !isGoal && (
                  <motion.span initial={{ scale: 0.2, opacity: 1 }} animate={{ scale: 1.6, opacity: 0 }} transition={{ duration: 0.5 }} className="absolute inset-0 rounded-[4px] ring-2 ring-indigo" />
                )}
                {lit && !isStart && !isGoal && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 600, damping: 14 }} className="absolute inset-[25%] rounded-full bg-paper/60" />
                )}
                {isGoal && <Flag aria-hidden className="absolute inset-0 m-auto size-3/5 text-on-accent" />}
                {isStart && <span className="absolute inset-[22%] rounded-full bg-paper" />}
              </button>
            );
          })}
        </div>

        <p className="mt-4 min-h-[3rem] text-base font-semibold leading-snug" aria-live="polite">
          {t < 0 ? NOTES[algo] : finished ? (result.path.length ? `Reached the goal after exploring ${result.steps} cells. Path: ${result.path.length - 1} steps, cost ${result.cost}.` : `No way through: explored ${result.steps} cells.`) : `Exploring… ${t + 1} cells so far.`}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <DemoButton
            tone="primary"
            onClick={() => {
              if (playing) return setPlaying(false);
              if (t >= result.steps + result.path.length) setT(-1);
              setPlaying(true);
            }}
          >
            {playing ? <Pause aria-hidden className="size-4" /> : <Play aria-hidden className="size-4" />}
            {playing ? "Pause" : t >= 0 ? "Run again" : "Find the path"}
          </DemoButton>
          <DemoButton
            onClick={() => {
              setPlaying(false);
              setT(-1);
              setEdits(null);
              setLayout((n) => n + 1);
            }}
          >
            <Shuffle aria-hidden className="size-4" /> New maze
          </DemoButton>
          <div className="flex items-center gap-1 rounded-full bg-paper-3 p-1 ring-1 ring-rule" role="group" aria-label="Brush">
            {(["wall", "mud"] as const).map((b) => (
              <button
                key={b}
                type="button"
                aria-pressed={brush === b}
                onClick={() => setBrush(b)}
                className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", brush === b ? "bg-ink text-paper" : "text-muted hover:text-ink")}
              >
                paint {b}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setPlaying(false);
              setT(-1);
              setEdits(null);
            }}
            className="ml-auto inline-flex items-center gap-1 text-xs text-muted hover:text-ink"
          >
            <RotateCcw aria-hidden className="size-3.5" /> reset
          </button>
        </div>
      </DemoFrame>
    </MotionConfig>
  );
}
