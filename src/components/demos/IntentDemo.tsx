"use client";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/cn";
import { DemoFrame, Toggle } from "./DemoFrame";

/**
 * Type how you'd actually search. The "model" extracts intent (and, like real
 * models sometimes do, invents a database ID). Validation drops the invention;
 * only our own taxonomy turns words into IDs.
 */
const CATEGORIES: Record<string, { id: number; label: string }> = {
  tailor: { id: 12, label: "Fashion & Tailoring" },
  tailoring: { id: 12, label: "Fashion & Tailoring" },
  aso: { id: 12, label: "Fashion & Tailoring" },
  iphone: { id: 31, label: "Phones & Gadgets" },
  phone: { id: 31, label: "Phones & Gadgets" },
  laptop: { id: 33, label: "Computers" },
  cake: { id: 47, label: "Cakes & Pastries" },
  cakes: { id: 47, label: "Cakes & Pastries" },
  hair: { id: 58, label: "Hair & Beauty" },
  barber: { id: 58, label: "Hair & Beauty" },
  makeup: { id: 58, label: "Hair & Beauty" },
  jollof: { id: 64, label: "Catering" },
  catering: { id: 64, label: "Catering" },
  food: { id: 64, label: "Catering" },
  shoe: { id: 71, label: "Footwear" },
  shoes: { id: 71, label: "Footwear" },
  sneakers: { id: 71, label: "Footwear" },
  plumber: { id: 80, label: "Home Services" },
  electrician: { id: 80, label: "Home Services" },
};
const AREAS = ["yaba", "ikeja", "lekki", "surulere", "ajah", "victoria island", "ikoyi", "ibadan", "abuja", "gbagada"];
const FILLER = new Set("who dey sell for abeg i need in a an the original good where fit see my me get buy cheap best near around please".split(" "));
const SAMPLES = ["who dey sell original iPhone for Ikeja", "tailor in Yaba", "cake for my daughter's birthday Lekki", "abeg barber near Surulere"];

function extract(q: string) {
  const lower = q.toLowerCase();
  const area = AREAS.find((a) => lower.includes(a)) ?? null;
  const terms = lower
    .replace(area ?? "", " ")
    .replace(/[^a-z\s']/g, " ")
    .split(/\s+/)
    .map((w) => w.replace(/'s$/, ""))
    .filter((w) => w.length > 2 && !FILLER.has(w));
  return { terms: [...new Set(terms)].slice(0, 6), area };
}

export function IntentDemo() {
  const [q, setQ] = useState(SAMPLES[0]);
  const [aiUp, setAiUp] = useState(true);
  const { terms, area } = extract(q);
  const resolved = terms.map((t) => ({ term: t, cat: CATEGORIES[t] }));
  const ids = [...new Map(resolved.filter((r) => r.cat).map((r) => [r.cat!.id, r.cat!])).values()];
  const modelJson = { terms, location: { area: area ? area[0].toUpperCase() + area.slice(1) : null }, category_id: 4127 };

  return (
    <DemoFrame title="POST /api/ai/search-intent" hint="Model down? Flip the switch: a deterministic extractor takes over and search keeps working.">
      <label className="block">
        <span className="sr-only">Search query</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full rounded-2xl bg-paper px-4 py-3 font-display text-lg font-semibold text-ink ring-1 ring-rule outline-none placeholder:text-muted focus:ring-ochre"
          placeholder="who dey sell…"
        />
      </label>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {SAMPLES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setQ(s)}
            className="rounded-full bg-paper-3/70 px-2.5 py-1 text-[0.7rem] text-ink-2 ring-1 ring-rule transition-transform hover:-rotate-2 hover:scale-105 hover:text-ink"
          >
            {s}
          </button>
        ))}
      </div>
      <div className="mt-3">
        <Toggle on={aiUp} onChange={setAiUp} label="AI provider" />
      </div>

      <ol className="mt-4 space-y-2.5">
        <Step n={1} title={aiUp ? "Model interprets" : "Fallback extractor"} tone={aiUp ? "ochre" : "indigo"}>
          <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[0.7rem] leading-relaxed text-ink-2">
            {`{ "terms": ${JSON.stringify(terms)}, "location": ${JSON.stringify(modelJson.location)}`}
            {aiUp && <span className="text-vermilion">{`, "category_id": 4127`}</span>}
            {" }"}
          </pre>
        </Step>
        <Step n={2} title="Schema check" tone="vermilion">
          <AnimatePresence mode="wait">
            {aiUp ? (
              <motion.p key="drop" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="font-mono text-[0.7rem] text-ink-2">
                <span className="text-vermilion line-through decoration-2">category_id: 4127</span> → rejected: unknown field. Models
                don&apos;t pick IDs.
              </motion.p>
            ) : (
              <motion.p key="clean" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-mono text-[0.7rem] text-ink-2">
                shape valid · <span className="text-indigo">source: fallback</span>
              </motion.p>
            )}
          </AnimatePresence>
        </Step>
        <Step n={3} title="Our taxonomy decides" tone="live">
          <div className="flex flex-wrap gap-1.5">
            <AnimatePresence mode="popLayout">
              {ids.map((c) => (
                <motion.span
                  key={c.id}
                  layout
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0 }}
                  className="rounded-full bg-live/15 px-2.5 py-1 font-mono text-[0.68rem] text-live ring-1 ring-live/40"
                >
                  #{c.id} {c.label}
                </motion.span>
              ))}
              {area && (
                <motion.span key={area} layout initial={{ scale: 0 }} animate={{ scale: 1 }} className="rounded-full bg-pink/15 px-2.5 py-1 font-mono text-[0.68rem] text-pink ring-1 ring-pink/40">
                  <MapPin aria-hidden className="mr-1 inline size-3 align-[-1px]" />
                  {area}
                </motion.span>
              )}
              {resolved
                .filter((r) => !r.cat)
                .slice(0, 3)
                .map((r) => (
                  <motion.span key={`x-${r.term}`} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-full px-2 py-1 font-mono text-[0.65rem] text-muted line-through">
                    {r.term}
                  </motion.span>
                ))}
              {ids.length === 0 && !area && <span className="font-mono text-[0.7rem] text-muted">nothing matched, search falls back to keywords</span>}
            </AnimatePresence>
          </div>
        </Step>
      </ol>
    </DemoFrame>
  );
}

function Step({ n, title, tone, children }: { n: number; title: string; tone: "ochre" | "indigo" | "vermilion" | "live"; children: React.ReactNode }) {
  const dot = { ochre: "bg-ochre", indigo: "bg-indigo", vermilion: "bg-vermilion", live: "bg-live" }[tone];
  return (
    <li className="grid grid-cols-[1.75rem_1fr] gap-3 rounded-2xl bg-paper-3/50 p-3 ring-1 ring-rule">
      <span className={cn("grid size-7 place-items-center rounded-full font-display text-xs font-extrabold text-on-accent", dot)}>{n}</span>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <div className="mt-1">{children}</div>
      </div>
    </li>
  );
}
