import { seeded } from "@/lib/seed";

/**
 * Generative adire. Each tile is one of the resist motifs found on Yoruba
 * indigo cloth (rings, dots, stitched lines, scallops) chosen by a PRNG
 * seeded from `seed`, so the same word always weaves the same cloth.
 */
type Props = {
  seed: string;
  cols?: number;
  rows?: number;
  className?: string;
  title?: string;
};

const T = 100;
/* Trig can differ in the last bit between server and browser; round so hydration matches. */
const round = (n: number) => Math.round(n * 100) / 100;

function Motif({ kind, alt }: { kind: number; alt: boolean }) {
  const stroke = { stroke: "currentColor", fill: "none", strokeWidth: 3.2, strokeLinecap: "round" as const };
  switch (kind) {
    case 0: // concentric rings
      return (
        <g {...stroke}>
          <circle cx={50} cy={50} r={36} />
          <circle cx={50} cy={50} r={24} />
          <circle cx={50} cy={50} r={11} fill="currentColor" />
        </g>
      );
    case 1: {
      // dot grid
      const n = alt ? 4 : 3;
      const gap = 100 / (n + 1);
      const dots = [];
      for (let i = 1; i <= n; i++)
        for (let j = 1; j <= n; j++)
          dots.push(<circle key={`${i}-${j}`} cx={i * gap} cy={j * gap} r={n === 4 ? 4.2 : 6} fill="currentColor" />);
      return <g>{dots}</g>;
    }
    case 2: {
      // stitched diagonals (tritik)
      const flip = alt;
      return (
        <g {...stroke} strokeDasharray="7 7" transform={flip ? "rotate(90 50 50)" : undefined}>
          {[10, 30, 50, 70, 90].map((o) => (
            <line key={o} x1={o - 40} y1={100} x2={o + 40} y2={0} />
          ))}
        </g>
      );
    }
    case 3: // scallops
      return (
        <g {...stroke}>
          {[0, 1, 2].map((row) => (
            <path
              key={row}
              d={`M 4 ${30 + row * 25} q 15.3 -20 30.6 0 q 15.3 -20 30.6 0 q 15.3 -20 30.6 0`}
            />
          ))}
        </g>
      );
    case 4: // quartered cross with seeds
      return (
        <g>
          <g {...stroke}>
            <line x1={50} y1={12} x2={50} y2={88} />
            <line x1={12} y1={50} x2={88} y2={50} />
          </g>
          {[
            [28, 28],
            [72, 28],
            [28, 72],
            [72, 72],
          ].map(([x, y]) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r={7} fill="currentColor" />
          ))}
        </g>
      );
    case 5: // waves
      return (
        <g {...stroke}>
          {[22, 42, 62, 82].map((y) => (
            <path key={y} d={`M 6 ${y} q 11 -10 22 0 t 22 0 t 22 0 t 22 0`} />
          ))}
        </g>
      );
    case 6: // sun
      return (
        <g {...stroke}>
          <circle cx={50} cy={50} r={14} fill="currentColor" />
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return (
              <line
                key={i}
                x1={round(50 + Math.cos(a) * 24)}
                y1={round(50 + Math.sin(a) * 24)}
                x2={round(50 + Math.cos(a) * 38)}
                y2={round(50 + Math.sin(a) * 38)}
              />
            );
          })}
        </g>
      );
    case 7: // nested squares
      return (
        <g {...stroke}>
          <rect x={14} y={14} width={72} height={72} />
          <rect x={30} y={30} width={40} height={40} transform="rotate(45 50 50)" />
          <circle cx={50} cy={50} r={5} fill="currentColor" />
        </g>
      );
    default: // leaf / eye
      return (
        <g {...stroke}>
          <path d="M 12 50 Q 50 8 88 50 Q 50 92 12 50 Z" />
          <circle cx={50} cy={50} r={9} fill="currentColor" />
        </g>
      );
  }
}

export function Adire({ seed, cols = 4, rows = 4, className, title }: Props) {
  const r = seeded(seed);
  const tiles = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const kind = Math.floor(r() * 9);
      const rot = Math.floor(r() * 4) * 90;
      const opacity = 0.72 + r() * 0.28;
      const alt = r() > 0.5;
      tiles.push(
        <g
          key={`${x}-${y}`}
          transform={`translate(${x * T} ${y * T}) rotate(${rot} 50 50)`}
          opacity={round(opacity)}
        >
          <Motif kind={kind} alt={alt} />
        </g>,
      );
    }
  }

  return (
    <svg
      viewBox={`0 0 ${cols * T} ${rows * T}`}
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <rect width={cols * T} height={rows * T} fill="var(--cloth)" />
      {/* faint tile seams, like folds in the cloth */}
      <g stroke="var(--cloth-ink)" strokeOpacity={0.12} strokeWidth={1}>
        {Array.from({ length: cols - 1 }, (_, i) => (
          <line key={`v${i}`} x1={(i + 1) * T} y1={0} x2={(i + 1) * T} y2={rows * T} />
        ))}
        {Array.from({ length: rows - 1 }, (_, i) => (
          <line key={`h${i}`} x1={0} y1={(i + 1) * T} x2={cols * T} y2={(i + 1) * T} />
        ))}
      </g>
      <g style={{ color: "var(--cloth-ink)" }}>{tiles}</g>
    </svg>
  );
}
