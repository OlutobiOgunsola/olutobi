/** A left-to-right system flow, rendered by <Flow />. */
export type Flow = {
  caption: string;
  nodes: { label: string; sub?: string; accent?: boolean }[];
  /* Optional side path hanging off a node (e.g. a dead-letter queue). */
  branch?: { from: number; label: string; sub?: string };
};

export type Decision = { title: string; body: string };

export type Metric = { value: string; label: string };
