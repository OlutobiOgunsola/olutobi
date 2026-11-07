import { seeded } from "./seed";
import type { ArrayAlgoKey, GridAlgoKey } from "@/content/lab/types";

/* ------------------------------------------------------------------ arrays */

export type Mark = "cmp" | "swap" | "done" | "pivot" | "win" | "found" | "dim" | "best";
export type Item = { id: number; v: number };
export type Frame = {
  items: Item[];
  marks: Record<number, Mark>;
  note: string;
  ptr?: Record<string, number>;
  aux?: { label: string; values: (number | string)[]; hi?: number };
  compares: number;
  writes: number;
};

type Rec = (note: string, marks?: Record<number, Mark>, extra?: Partial<Pick<Frame, "ptr" | "aux">>) => void;

function recorder(start: Item[]) {
  const frames: Frame[] = [];
  const a = start.slice();
  const stats = { compares: 0, writes: 0 };
  const rec: Rec = (note, marks = {}, extra = {}) =>
    frames.push({ items: a.slice(), marks, note, compares: stats.compares, writes: stats.writes, ...extra });
  return { frames, a, stats, rec };
}

const range = (from: number, to: number, m: Mark) => {
  const out: Record<number, Mark> = {};
  for (let i = from; i < to; i++) out[i] = m;
  return out;
};

function input(seed: string, n: number, lo: number, hi: number, unique = true) {
  const rnd = seeded(seed);
  const vals: number[] = [];
  while (vals.length < n) {
    const v = lo + Math.floor(rnd() * (hi - lo + 1));
    if (!unique || !vals.includes(v)) vals.push(v);
  }
  return vals.map((v, id) => ({ id, v }));
}

function swap(a: Item[], i: number, j: number) {
  [a[i], a[j]] = [a[j], a[i]];
}

function move(a: Item[], from: number, to: number) {
  const [it] = a.splice(from, 1);
  a.splice(to, 0, it);
}

function bubble(seed: string) {
  const { frames, a, stats, rec } = recorder(input(seed, 9, 2, 20));
  const n = a.length;
  rec("Unsorted. Walk the line, swapping any neighbours that are out of order.");
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - 1 - i; j++) {
      stats.compares++;
      rec(`Is ${a[j].v} > ${a[j + 1].v}?`, { ...range(n - i, n, "done"), [j]: "cmp", [j + 1]: "cmp" });
      if (a[j].v > a[j + 1].v) {
        swap(a, j, j + 1);
        stats.writes++;
        swapped = true;
        rec("Yes: swap them.", { ...range(n - i, n, "done"), [j]: "swap", [j + 1]: "swap" });
      }
    }
    if (!swapped) {
      rec("A full pass with no swaps. Done early.", range(0, n, "done"));
      return frames;
    }
  }
  rec("Sorted. The biggest value bubbled to the end on every pass.", range(0, n, "done"));
  return frames;
}

function insertion(seed: string) {
  const { frames, a, stats, rec } = recorder(input(seed, 9, 2, 20));
  const n = a.length;
  rec("The first card is a sorted hand of one. Pick up the next and slide it into place.", { 0: "done" });
  for (let i = 1; i < n; i++) {
    let j = i;
    rec(`Pick up ${a[i].v}.`, { ...range(0, i, "done"), [i]: "pivot" });
    while (j > 0) {
      stats.compares++;
      rec(`${a[j].v} < ${a[j - 1].v}?`, { ...range(0, i + 1, "done"), [j]: "pivot", [j - 1]: "cmp" });
      if (a[j].v >= a[j - 1].v) break;
      swap(a, j, j - 1);
      stats.writes++;
      j--;
    }
  }
  rec("Sorted. Fast on nearly-sorted data. Each card barely moves.", range(0, n, "done"));
  return frames;
}

function selection(seed: string) {
  const { frames, a, stats, rec } = recorder(input(seed, 9, 2, 20));
  const n = a.length;
  rec("Find the smallest, put it first. Repeat for the rest.");
  for (let i = 0; i < n - 1; i++) {
    let min = i;
    for (let j = i + 1; j < n; j++) {
      stats.compares++;
      rec(`Smallest so far is ${a[min].v}. Check ${a[j].v}.`, { ...range(0, i, "done"), [min]: "pivot", [j]: "cmp" });
      if (a[j].v < a[min].v) min = j;
    }
    if (min !== i) {
      swap(a, i, min);
      stats.writes++;
    }
    rec(`${a[i].v} goes to position ${i + 1}.`, { ...range(0, i, "done"), [i]: "swap" });
  }
  rec("Sorted. Always n² comparisons, but only n swaps.", range(0, n, "done"));
  return frames;
}

function merge(seed: string) {
  const { frames, a, stats, rec } = recorder(input(seed, 10, 2, 20));
  const n = a.length;
  rec("Split until every piece has one item, then merge pieces back in order.");
  for (let width = 1; width < n; width *= 2) {
    for (let lo = 0; lo < n - width; lo += 2 * width) {
      const mid = lo + width;
      const hi = Math.min(lo + 2 * width, n);
      let i = lo;
      let j = mid;
      rec(`Merge [${lo + 1}–${mid}] with [${mid + 1}–${hi}].`, { ...range(lo, mid, "win"), ...range(mid, hi, "best") });
      while (i < j && j < hi) {
        stats.compares++;
        rec(`${a[i].v} vs ${a[j].v}`, { ...range(lo, hi, "win"), [i]: "cmp", [j]: "cmp" });
        if (a[i].v <= a[j].v) i++;
        else {
          move(a, j, i);
          stats.writes++;
          i++;
          j++;
          rec(`${a[i - 1].v} is smaller. It goes first.`, { ...range(lo, hi, "win"), [i - 1]: "swap" });
        }
      }
      rec("Merged.", range(lo, hi, "done"));
    }
  }
  rec("Sorted. n log n, every time, no bad inputs.", range(0, n, "done"));
  return frames;
}

function quick(seed: string) {
  const { frames, a, stats, rec } = recorder(input(seed, 10, 2, 20));
  const n = a.length;
  const sorted = new Set<number>();
  const done = () => Object.fromEntries([...sorted].map((k) => [k, "done" as Mark]));
  rec("Pick a pivot. Everything smaller goes left, everything bigger goes right. Recurse.");
  const qs = (lo: number, hi: number) => {
    if (lo > hi) return;
    if (lo === hi) {
      sorted.add(lo);
      return;
    }
    const p = a[hi].v;
    let i = lo;
    rec(`Pivot ${p}.`, { ...done(), ...range(lo, hi, "win"), [hi]: "pivot" });
    for (let j = lo; j < hi; j++) {
      stats.compares++;
      rec(`${a[j].v} < ${p}?`, { ...done(), ...range(lo, hi, "win"), [i]: "best", [hi]: "pivot", [j]: "cmp" });
      if (a[j].v < p) {
        if (i !== j) {
          swap(a, i, j);
          stats.writes++;
          rec(`Yes: move ${a[i].v} to the left side.`, { ...done(), [hi]: "pivot", [i]: "swap", [j]: "swap" });
        }
        i++;
      }
    }
    swap(a, i, hi);
    stats.writes++;
    sorted.add(i);
    rec(`Pivot ${p} lands in its final spot.`, { ...done(), [i]: "found" });
    qs(lo, i - 1);
    qs(i + 1, hi);
  };
  qs(0, n - 1);
  rec("Sorted. Usually the fastest, unless the pivots are unlucky.", range(0, n, "done"));
  return frames;
}

function counting(seed: string) {
  const { frames, a, stats, rec } = recorder(input(seed, 12, 0, 6, false).map((it) => ({ ...it, v: it.v + 1 })));
  const n = a.length;
  const counts = Array(7).fill(0);
  const aux = (hi?: number) => ({ label: "count of each value 1–7", values: counts.slice(), hi });
  rec("No comparisons at all. Count how many of each value there are.", {}, { aux: aux() });
  for (let i = 0; i < n; i++) {
    counts[a[i].v - 1]++;
    stats.writes++;
    rec(`Saw a ${a[i].v}.`, { [i]: "cmp" }, { aux: aux(a[i].v - 1) });
  }
  let k = 0;
  for (let v = 1; v <= 7; v++) {
    for (let c = 0; c < counts[v - 1]; c++) {
      const from = a.findIndex((it, idx) => idx >= k && it.v === v);
      move(a, from, k);
      stats.writes++;
      k++;
      rec(`Write out ${v} (${c + 1} of ${counts[v - 1]}).`, { ...range(0, k, "done") }, { aux: aux(v - 1) });
    }
  }
  rec("Sorted in linear time, because the values come from a small, known range.", range(0, n, "done"), { aux: aux() });
  return frames;
}

function sortedInput(seed: string, n: number) {
  return input(seed, n, 1, 40)
    .map((it) => it.v)
    .sort((x, y) => x - y)
    .map((v, id) => ({ id, v }));
}

function binarySearch(seed: string) {
  const items = sortedInput(seed, 15);
  const { frames, a, stats, rec } = recorder(items);
  const target = a[Math.floor(seeded(`${seed}t`)() * a.length)].v;
  let lo = 0;
  let hi = a.length - 1;
  rec(`Find ${target}. The list is sorted, so every check can throw away half of it.`, {}, { ptr: { lo, hi } });
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    stats.compares++;
    const dim = { ...range(0, lo, "dim"), ...range(hi + 1, a.length, "dim") };
    rec(`Middle is ${a[mid].v}.`, { ...dim, [mid]: "cmp" }, { ptr: { lo, mid, hi } });
    if (a[mid].v === target) {
      rec(`Found ${target} in ${stats.compares} checks. A linear scan would have needed ${mid + 1}.`, { ...dim, [mid]: "found" }, { ptr: { mid } });
      return frames;
    }
    if (a[mid].v < target) {
      lo = mid + 1;
      rec(`${a[mid].v} < ${target}, drop the left half.`, { ...range(0, lo, "dim"), ...range(hi + 1, a.length, "dim") }, { ptr: { lo, hi } });
    } else {
      hi = mid - 1;
      rec(`${a[mid].v} > ${target}, drop the right half.`, { ...range(0, lo, "dim"), ...range(hi + 1, a.length, "dim") }, { ptr: { lo, hi } });
    }
  }
  return frames;
}

function twoPointers(seed: string) {
  const items = sortedInput(seed, 12);
  const { frames, a, stats, rec } = recorder(items);
  const rnd = seeded(`${seed}p`);
  const x = Math.floor(rnd() * 5);
  const y = 6 + Math.floor(rnd() * 6);
  const target = a[x].v + a[y].v;
  let l = 0;
  let r = a.length - 1;
  rec(`Find two numbers that add up to ${target}. Start at both ends.`, {}, { ptr: { L: l, R: r } });
  while (l < r) {
    const sum = a[l].v + a[r].v;
    stats.compares++;
    rec(`${a[l].v} + ${a[r].v} = ${sum}`, { [l]: "cmp", [r]: "cmp", ...range(0, l, "dim"), ...range(r + 1, a.length, "dim") }, { ptr: { L: l, R: r } });
    if (sum === target) {
      rec(`Found it in ${stats.compares} steps. Checking every pair would take up to ${(a.length * (a.length - 1)) / 2}.`, { [l]: "found", [r]: "found" }, { ptr: { L: l, R: r } });
      return frames;
    }
    if (sum < target) l++;
    else r--;
    rec(sum < target ? "Too small: move the left pointer right." : "Too big: move the right pointer left.", { ...range(0, l, "dim"), ...range(r + 1, a.length, "dim") }, { ptr: { L: l, R: r } });
  }
  return frames;
}

function slidingWindow(seed: string) {
  const { frames, a, stats, rec } = recorder(input(seed, 12, 1, 15, false));
  const k = 3;
  let sum = 0;
  for (let i = 0; i < k; i++) sum += a[i].v;
  let best = sum;
  let bestAt = 0;
  const aux = () => ({ label: "window sum · best", values: [sum, best] });
  rec(`Best sum of ${k} in a row. Add the first ${k}: ${sum}.`, range(0, k, "win"), { aux: aux() });
  for (let i = k; i < a.length; i++) {
    sum += a[i].v - a[i - k].v;
    stats.compares++;
    stats.writes += 2;
    if (sum > best) {
      best = sum;
      bestAt = i - k + 1;
    }
    rec(`Slide: +${a[i].v}, −${a[i - k].v} → ${sum}${sum === best && bestAt === i - k + 1 ? ", new best" : ""}.`, { ...range(i - k + 1, i + 1, "win"), [i]: "cmp", [i - k]: "dim" }, { aux: aux() });
  }
  rec(`Best is ${best}. One pass, never re-adding the whole window.`, range(bestAt, bestAt + k, "found"), { aux: aux() });
  return frames;
}

function kadane(seed: string) {
  const { frames, a, stats, rec } = recorder(input(seed, 11, -9, 9).map((it) => ({ ...it, v: it.v === 0 ? 3 : it.v })));
  let cur = 0;
  let best = -Infinity;
  let start = 0;
  let bs = 0;
  let be = 0;
  const aux = () => ({ label: "running · best", values: [cur, best === -Infinity ? "–" : best] });
  rec("Biggest sum of consecutive numbers. Keep a running total, and drop it the moment it goes negative.", {}, { aux: aux() });
  for (let i = 0; i < a.length; i++) {
    stats.compares++;
    if (cur <= 0) {
      cur = a[i].v;
      start = i;
    } else cur += a[i].v;
    if (cur > best) {
      best = cur;
      bs = start;
      be = i;
    }
    rec(cur === a[i].v && start === i ? `Start fresh at ${a[i].v}.` : `Add ${a[i].v} → ${cur}.`, { ...range(start, i + 1, "win"), ...range(bs, be + 1, "best"), [i]: "cmp" }, { aux: aux() });
  }
  rec(`Best run sums to ${best}. One pass.`, range(bs, be + 1, "found"), { aux: aux() });
  return frames;
}

export const arrayAlgos: Record<ArrayAlgoKey, (seed: string) => Frame[]> = {
  bubble,
  insertion,
  selection,
  merge,
  quick,
  counting,
  "binary-search": binarySearch,
  "two-pointers": twoPointers,
  "sliding-window": slidingWindow,
  kadane,
};

/* -------------------------------------------------------------------- grid */

export const GRID_W = 14;
export const GRID_H = 8;
export type Grid = { walls: boolean[]; mud: boolean[]; start: number; goal: number };
export type GridRun = { visitedAt: number[]; seenAt: number[]; path: number[]; steps: number; cost: number | null };

const cell = (x: number, y: number) => y * GRID_W + x;
const xy = (c: number) => [c % GRID_W, Math.floor(c / GRID_W)] as const;
const cost = (g: Grid, c: number) => (g.mud[c] ? 5 : 1);

function neighbours(g: Grid, c: number) {
  const [x, y] = xy(c);
  const out: number[] = [];
  for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= GRID_W || ny >= GRID_H) continue;
    const n = cell(nx, ny);
    if (!g.walls[n]) out.push(n);
  }
  return out;
}

export function makeGrid(seed: string): Grid {
  for (let attempt = 0; ; attempt++) {
    const rnd = seeded(`${seed}:${attempt}`);
    const size = GRID_W * GRID_H;
    const start = cell(1, 3);
    const goal = cell(GRID_W - 2, 4);
    const walls = Array.from({ length: size }, () => rnd() < 0.26);
    const mud = Array.from({ length: size }, () => rnd() < 0.16);
    walls[start] = walls[goal] = false;
    mud[start] = mud[goal] = false;
    const g = { walls, mud, start, goal };
    if (runGrid("bfs", g).path.length) return g;
  }
}

export function runGrid(algo: GridAlgoKey, g: Grid): GridRun {
  const size = GRID_W * GRID_H;
  const visitedAt = Array(size).fill(-1);
  const seenAt = Array(size).fill(-1);
  const prev = Array(size).fill(-1);
  let t = 0;
  const h = (c: number) => {
    const [x, y] = xy(c);
    const [gx, gy] = xy(g.goal);
    return Math.abs(x - gx) + Math.abs(y - gy);
  };

  if (algo === "bfs" || algo === "dfs") {
    const frontier = [g.start];
    seenAt[g.start] = 0;
    while (frontier.length) {
      const c = algo === "bfs" ? frontier.shift()! : frontier.pop()!;
      if (visitedAt[c] >= 0) continue;
      visitedAt[c] = t++;
      if (c === g.goal) break;
      for (const n of neighbours(g, c)) {
        if (visitedAt[n] >= 0 || (algo === "bfs" && seenAt[n] >= 0)) continue;
        seenAt[n] = t;
        prev[n] = c;
        frontier.push(n);
      }
    }
  } else {
    const dist = Array(size).fill(Infinity);
    dist[g.start] = 0;
    seenAt[g.start] = 0;
    const open = new Set([g.start]);
    while (open.size) {
      let c = -1;
      let bestScore = Infinity;
      for (const o of open) {
        const score = dist[o] + (algo === "astar" ? h(o) : 0);
        if (score < bestScore) {
          bestScore = score;
          c = o;
        }
      }
      open.delete(c);
      visitedAt[c] = t++;
      if (c === g.goal) break;
      for (const n of neighbours(g, c)) {
        if (visitedAt[n] >= 0) continue;
        const d = dist[c] + cost(g, n);
        if (d < dist[n]) {
          dist[n] = d;
          prev[n] = c;
          if (seenAt[n] < 0) seenAt[n] = t;
          open.add(n);
        }
      }
    }
  }

  const path: number[] = [];
  if (visitedAt[g.goal] >= 0) {
    for (let c = g.goal; c !== -1; c = prev[c]) path.unshift(c);
  }
  const total = path.length ? path.slice(1).reduce((s, c) => s + cost(g, c), 0) : null;
  return { visitedAt, seenAt, path, steps: t, cost: total };
}
