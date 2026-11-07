import type { FlowNode, IconKey, Tone } from "./types";

/** A node on the scenario stage. x and y are percentages of the stage. */
export const node = (id: string, label: string, icon: IconKey, x: number, y: number): FlowNode => ({ id, label, icon, x, y });

/** A packet travelling from one node to another during a step. */
export const go = (from: string, to: string, label?: string, tone?: Tone) => ({ from, to, label, tone });
