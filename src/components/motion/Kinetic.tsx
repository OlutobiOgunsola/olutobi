import { cn } from "@/lib/cn";

/**
 * Display text. With `entrance`, it fades and rises gently into place on load
 * plain CSS, so the headline never waits on JavaScript.
 */
export function Kinetic({
  text,
  className,
  delay = 0,
  entrance = false,
}: {
  text: string;
  className?: string;
  delay?: number;
  entrance?: boolean;
}) {
  return (
    <span
      className={cn(entrance ? "kinetic-in inline-block" : "inline", className)}
      style={entrance && delay ? { animationDelay: `${delay}s` } : undefined}
    >
      {text}
    </span>
  );
}
