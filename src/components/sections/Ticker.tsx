import { cn } from "@/lib/cn";

/** Who I am, away from the keyboard too. */
const TOP = [
  "Software engineer",
  "Composer",
  "Writer",
  "Game maker",
  "Girl dad",
  "Basketball",
  "Always learning",
  "Animations",
  "Sound Design",
  "Video Editing",
  "Sound Engineering",
];

/** What I build with. */
const BOTTOM = [
  "JavaScript",
  "TypeScript",
  "Golang",
  "PHP",
  "SQL",
  "Node.js",
  "React",
  "Next.js",
  "Vue",
  "React Native",
  "Laravel",
  "Three.js",
  "PostgreSQL",
  "MySQL",
  "Redis",
  "BullMQ",
  "AWS SQS",
  "Docker",
  "Linux",
  "GitHub Actions",
  "Grafana",
  "Sentry",
  "Figma",
  "CapCut",
  "FL Studio",
  "Logic Pro",
  "Ableton Live",
];

const COLORS = ["text-ochre", "text-ink", "text-pink"];

function Row({ items, reverse, secondsPerItem, className }: { items: string[]; reverse?: boolean; secondsPerItem: number; className: string }) {
  // Two copies: the marquee slides by half its width, so the loop is seamless.
  const loop = [...items, ...items];
  return (
    <div className="flex overflow-hidden" aria-hidden>
      <div
        className={cn("flex w-max shrink-0 animate-marquee items-center", reverse && "[animation-direction:reverse]")}
        style={{ ["--speed" as string]: `${items.length * secondsPerItem}s` }}
      >
        {loop.map((t, i) => (
          <span key={i} className="flex items-center">
            <span className={cn("whitespace-nowrap px-6 font-display font-extrabold tracking-tight", className, COLORS[i % 3])}>{t}</span>
            <span className={cn("text-3xl", i % 2 ? "text-indigo" : "text-vermilion")}>✳</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Two counter-scrolling bands, slightly tilted like tape across the page: who I am on top, my tools below. */
export function Ticker() {
  return (
    <section aria-label="About me in brief" className="relative my-10 select-none overflow-hidden py-12">
      <p className="sr-only">
        {TOP.join(", ")}. Tools I use: {BOTTOM.join(", ")}.
      </p>
      <div className="relative z-10 -rotate-2 border-y border-rule bg-paper-2 py-4">
        <Row items={TOP} secondsPerItem={6} className="text-5xl uppercase sm:text-7xl" />
      </div>
      <div className="surface-dark mt-14 rotate-1 border-y border-rule bg-indigo-deep py-3">
        <Row items={BOTTOM} reverse secondsPerItem={3.5} className="text-3xl sm:text-5xl" />
      </div>
    </section>
  );
}
