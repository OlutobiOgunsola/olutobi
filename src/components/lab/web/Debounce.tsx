"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { DemoFrame } from "@/components/demos/DemoFrame";

type Lane = "raw" | "debounce" | "throttle";
type Ev = { id: number; t: number; lane: Lane };

const WINDOW = 6000;
const WAIT = 400;

const LANES: { key: Lane; label: string; tone: string; note: string }[] = [
  { key: "raw", label: "every keystroke", tone: "bg-vermilion", note: "one search request per key" },
  { key: "debounce", label: `debounce ${WAIT}ms`, tone: "bg-live", note: "fires once you pause" },
  { key: "throttle", label: `throttle ${WAIT}ms`, tone: "bg-indigo", note: "at most once per window" },
];

export function DebounceDemo() {
  const [events, setEvents] = useState<Ev[]>([]);
  const [now, setNow] = useState(0);
  const [counts, setCounts] = useState({ raw: 0, debounce: 0, throttle: 0 });
  const [text, setText] = useState("");
  const seq = useRef(0);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastThrottle = useRef(-Infinity);
  const trailing = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastEvent = useRef(-Infinity);

  useEffect(() => {
    // Only tick while there's something on the timeline to move.
    const id = setInterval(() => {
      const t = performance.now();
      if (t - lastEvent.current < WINDOW + 100) setNow(t);
    }, 50);
    return () => {
      clearInterval(id);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (trailing.current) clearTimeout(trailing.current);
    };
  }, []);

  function fire(lane: Lane) {
    const t = performance.now();
    lastEvent.current = t;
    setEvents((e) => [...e.filter((x) => t - x.t < WINDOW), { id: ++seq.current, t, lane }]);
    setCounts((c) => ({ ...c, [lane]: c[lane] + 1 }));
  }

  function onKey() {
    fire("raw");
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => fire("debounce"), WAIT);
    const t = performance.now();
    if (t - lastThrottle.current >= WAIT) {
      lastThrottle.current = t;
      fire("throttle");
    } else if (!trailing.current) {
      trailing.current = setTimeout(() => {
        trailing.current = null;
        lastThrottle.current = performance.now();
        fire("throttle");
      }, WAIT - (t - lastThrottle.current));
    }
  }

  return (
    <DemoFrame title="search-as-you-type" hint="Type quickly, pause, type again. Each dot is one request to the search API.">
      <label className="sr-only" htmlFor="debounce-input">
        Search
      </label>
      <input
        id="debounce-input"
        value={text}
        onChange={(e) => {
          setText(e.target.value.slice(0, 40));
          onKey();
        }}
        placeholder="search for “suya near yaba”…"
        className="w-full rounded-xl bg-paper-3 px-4 py-3 text-lg font-semibold text-ink ring-1 ring-rule outline-none focus:ring-ochre"
      />
      <div className="mt-5 space-y-3">
        {LANES.map((l) => (
          <div key={l.key}>
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className="font-bold text-ink">{l.label}</span>
              <span className="tabular text-muted">
                {l.note} · <strong className="text-ink">{counts[l.key]}</strong> requests
              </span>
            </div>
            <div className="relative mt-1 h-7 overflow-hidden rounded-md bg-paper/60 ring-1 ring-rule">
              {events
                .filter((e) => e.lane === l.key && now - e.t < WINDOW)
                .map((e) => (
                  <span
                    key={e.id}
                    className={cn("absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full", l.tone, now - e.t < 250 && "scale-150")}
                    style={{ left: `${Math.max(0, 100 - ((now - e.t) / WINDOW) * 100)}%`, transition: "scale .25s cubic-bezier(.16,1,.3,1)" }}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-muted">
        <span>← 6 seconds ago</span>
        <button
          type="button"
          onClick={() => {
            setEvents([]);
            setCounts({ raw: 0, debounce: 0, throttle: 0 });
            setText("");
          }}
          className="hover:text-ink"
        >
          reset
        </button>
        <span>now →</span>
      </div>
    </DemoFrame>
  );
}
