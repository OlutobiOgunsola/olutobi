import { seeded } from "@/lib/seed";

/** A deterministic, track-shaped waveform: an intro, a build, a drop, an outro. */
export function Waveform({ seed, bars = 72, className }: { seed: string; bars?: number; className?: string }) {
  const r = seeded(seed);
  const peaks: number[] = [];
  let prev = 0.4;
  for (let i = 0; i < bars; i++) {
    const t = i / (bars - 1);
    const envelope = Math.min(1, t * 4) * Math.min(1, (1 - t) * 5) * (0.55 + 0.45 * Math.sin(t * Math.PI * 2.2 + r()));
    prev = prev * 0.45 + r() * 0.55;
    peaks.push(Math.max(0.08, envelope * (0.35 + prev * 0.65)));
  }
  const w = 3;
  const gap = 2;
  const h = 40;
  return (
    <svg viewBox={`0 0 ${bars * (w + gap)} ${h}`} className={className} aria-hidden preserveAspectRatio="none">
      {peaks.map((p, i) => (
        <rect key={i} x={i * (w + gap)} y={(h - p * h) / 2} width={w} height={p * h} rx={1.5} fill="currentColor" />
      ))}
    </svg>
  );
}
