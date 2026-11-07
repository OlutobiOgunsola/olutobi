/**
 * Pattern Lab content model. Most demos are data: a FlowScene is played by the
 * flow engine, array/grid algorithms by their players, and a handful of
 * hand-built widgets are referenced by key.
 */
export type IconKey =
  | "user"
  | "phone"
  | "browser"
  | "server"
  | "db"
  | "replica"
  | "cache"
  | "lb"
  | "queue"
  | "cdn"
  | "gateway"
  | "worker"
  | "lock"
  | "shield"
  | "key"
  | "mail"
  | "bell"
  | "cloud"
  | "flag"
  | "box"
  | "clock"
  | "attacker"
  | "wallet"
  | "file"
  | "search"
  | "router"
  | "disk"
  | "layers"
  | "crown"
  | "dns"
  | "bank";

export type Tone = "ok" | "bad" | "info" | "warn";
export type NodeStatus = "ok" | "bad" | "busy" | "idle" | "down";

export type FlowNode = { id: string; label: string; icon: IconKey; x: number; y: number };

export type FlowStep = {
  note: string;
  tone?: Tone;
  /** Packets that travel this step. */
  packets?: { from: string; to: string; label?: string; tone?: Tone }[];
  /** Node status changes; they persist until changed again. */
  status?: Record<string, NodeStatus>;
  /** Small persistent labels on nodes; "" clears one. */
  badges?: Record<string, string>;
};

export type FlowScene = {
  title: string;
  hint?: string;
  nodes: FlowNode[];
  edges: [string, string][];
  on: FlowStep[];
  off?: FlowStep[];
  /** Label for the pattern switch. When absent, the scene has no switch. */
  toggle?: string;
  verdict?: { on: string; off: string };
};

export type ArrayAlgoKey =
  | "bubble"
  | "insertion"
  | "selection"
  | "merge"
  | "quick"
  | "counting"
  | "binary-search"
  | "two-pointers"
  | "sliding-window"
  | "kadane";

export type GridAlgoKey = "bfs" | "dfs" | "dijkstra" | "astar";

export type DemoSpec =
  | { kind: "custom"; key: string }
  | { kind: "flow"; scene: FlowScene }
  | { kind: "array"; algo: ArrayAlgoKey }
  | { kind: "grid"; algo: GridAlgoKey };

export type LearnMore = {
  what: string;
  when: string;
  tradeoffs: string;
  /** Where it shows up in Olutobi's own work, when it does. */
  inMyWork?: string;
};

export type LabEntry = {
  id: string;
  name: string;
  story: string;
  rule: string;
  demo: DemoSpec;
  learn: LearnMore;
  essay?: { href: string; label: string; external?: boolean };
};

export type LabGroup = { title: string; entries: LabEntry[] };

export type LabTab = {
  slug: string;
  name: string;
  title: string;
  accent: string;
  intro: string;
  groups: LabGroup[];
};
