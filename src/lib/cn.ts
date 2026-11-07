import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge and de-duplicate Tailwind class names.
 * Mirrors the convention used across the engineer's other apps (Sentinel, etc.)
 *: `clsx` for parsing, `tailwind-merge` to collapse conflicting utilities.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
