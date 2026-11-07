import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** The window chrome every live demo sits in. */
export function DemoFrame({
  title,
  hint,
  children,
  className,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative min-w-0 overflow-hidden rounded-2xl border border-rule bg-paper-2",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-rule px-5 py-3">
        <span className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-vermilion" />
          <span className="size-2.5 rounded-full bg-ochre" />
          <span className="size-2.5 rounded-full bg-live" />
        </span>
        <span className="truncate font-mono text-[0.72rem] text-ink-2">{title}</span>
        <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full bg-live/10 px-2.5 py-0.5 text-xs font-semibold text-live">
          <span className="pulse-dot size-1.5 rounded-full bg-live" /> live
        </span>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
      {hint && (
        <p className="border-t border-rule px-5 py-3 text-xs leading-relaxed text-muted">{hint}</p>
      )}
    </div>
  );
}

export function DemoButton({
  children,
  onClick,
  tone = "default",
  disabled,
  pressed,
}: {
  children: ReactNode;
  onClick: () => void;
  tone?: "default" | "primary" | "danger";
  disabled?: boolean;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40",
        tone === "primary" && "bg-ochre text-on-accent",
        tone === "danger" && "bg-vermilion/15 text-vermilion ring-1 ring-vermilion/40 hover:bg-vermilion/25",
        tone === "default" && "bg-paper-3 text-ink ring-1 ring-rule hover:ring-ink-2",
        pressed && "bg-indigo text-indigo-ink ring-indigo",
      )}
    >
      {children}
    </button>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="inline-flex items-center gap-2.5 text-sm text-ink-2"
    >
      <span className={cn("relative h-6 w-11 rounded-full transition-colors", on ? "bg-live" : "bg-vermilion/70")}>
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-paper shadow transition-all duration-300 [transition-timing-function:cubic-bezier(.5,1.8,.5,.8)]",
            on ? "left-[1.4rem]" : "left-0.5",
          )}
        />
      </span>
      {label}: <strong className={on ? "text-live" : "text-vermilion"}>{on ? "ON" : "OFF"}</strong>
    </button>
  );
}
