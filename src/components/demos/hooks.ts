"use client";
import { useEffect, useRef, useState } from "react";

/** setInterval that always calls the latest callback; pass `null` to pause. */
export function useInterval(callback: () => void, ms: number | null) {
  const saved = useRef(callback);
  useEffect(() => {
    saved.current = callback;
  }, [callback]);
  useEffect(() => {
    if (ms === null) return;
    const id = setInterval(() => saved.current(), ms);
    return () => clearInterval(id);
  }, [ms]);
}

export type LogLine = { id: number; text: string; tone: "ok" | "bad" | "info" | "warn" };

/** A short rolling log for demo narration. */
export function useLog(max = 4) {
  const [lines, setLines] = useState<LogLine[]>([]);
  const seq = useRef(0);
  const push = (text: string, tone: LogLine["tone"] = "info") =>
    setLines((l) => [{ id: ++seq.current, text, tone }, ...l].slice(0, max));
  const clear = () => setLines([]);
  return { lines, push, clear };
}
