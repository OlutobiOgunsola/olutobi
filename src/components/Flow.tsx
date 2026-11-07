import { Fragment } from "react";
import { cn } from "@/lib/cn";
import type { Flow as FlowData } from "@/content/types";

/**
 * A system flow drawn as a blueprint: left-to-right on wide screens,
 * top-to-bottom on phones. An optional branch hangs beneath one node.
 */
export function Flow({ flow, className }: { flow: FlowData; className?: string }) {
  return (
    <figure
      className={cn(
        "relative overflow-hidden rounded-2xl border border-rule bg-paper-2 p-5 sm:p-7",
        "[background-image:radial-gradient(var(--rule)_1px,transparent_1px)] [background-size:18px_18px]",
        className,
      )}
    >
      <ol className="relative flex flex-col items-stretch gap-0 lg:flex-row lg:items-start">
        {flow.nodes.map((node, i) => {
          const hasBranch = flow.branch?.from === i;
          return (
            <Fragment key={node.label}>
              <li className="flex flex-col lg:min-w-0 lg:flex-1">
                <div
                  className={cn(
                    "rounded-lg border px-3.5 py-3 transition-colors",
                    node.accent
                      ? "border-indigo bg-indigo text-indigo-ink shadow-[0_8px_24px_-12px_var(--indigo)]"
                      : "border-rule bg-paper",
                  )}
                >
                  <p className="text-sm font-medium leading-tight">{node.label}</p>
                  {node.sub && (
                    <p
                      className={cn(
                        "mt-1 font-mono text-[0.68rem] leading-snug",
                        node.accent ? "text-indigo-ink/80" : "text-muted",
                      )}
                    >
                      {node.sub}
                    </p>
                  )}
                </div>
                {hasBranch && flow.branch && (
                  <div className="ml-6 flex flex-col items-start lg:ml-0 lg:items-center">
                    <span aria-hidden className="h-5 w-px border-l border-dashed border-ochre" />
                    <div className="rounded-lg border border-dashed border-ochre bg-paper px-3 py-2">
                      <p className="text-xs font-medium text-ochre">↳ {flow.branch.label}</p>
                      {flow.branch.sub && (
                        <p className="mt-0.5 font-mono text-[0.65rem] text-muted">{flow.branch.sub}</p>
                      )}
                    </div>
                  </div>
                )}
              </li>
              {i < flow.nodes.length - 1 && (
                <li aria-hidden className="flex shrink-0 items-center justify-center py-1.5 lg:h-[3.6rem] lg:w-8 lg:py-0">
                  <svg viewBox="0 0 24 24" className="size-4 rotate-90 text-muted lg:rotate-0">
                    <path d="M3 12h16m-5-5 5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
      <figcaption className="mt-6 flex items-center gap-3 border-t border-rule pt-4">
        <span className="shrink-0 text-sm font-bold text-ochre">Fig.</span>
        <span className="text-sm text-ink-2">{flow.caption}</span>
      </figcaption>
    </figure>
  );
}
