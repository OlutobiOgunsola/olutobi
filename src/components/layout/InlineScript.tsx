"use client";

/**
 * An inline script that runs during HTML parsing. On the client it renders as
 * text/plain, so React doesn't warn about rendering a <script> (it never re-runs).
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
