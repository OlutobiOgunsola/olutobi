import type { LabTab } from "./types";
import { patterns } from "./patterns";
import { systemDesign } from "./system-design";
import { databases } from "./databases";
import { dsa } from "./dsa";
import { security } from "./security";
import { web } from "./web";

export type { LabEntry, LabTab } from "./types";

/** Tab order on /lab. Patterns is the landing tab and lives at /lab itself. */
export const labTabs: LabTab[] = [patterns, systemDesign, databases, dsa, security, web];

export const tabCount = (t: LabTab) => t.groups.reduce((n, g) => n + g.entries.length, 0);
export const labCount = labTabs.reduce((n, t) => n + tabCount(t), 0);
export const tabHref = (t: LabTab) => (t.slug === "patterns" ? "/lab" : `/lab/${t.slug}`);
export const getTab = (slug: string) => labTabs.find((t) => t.slug === slug);
