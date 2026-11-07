"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/cn";

/** The email as a mailto link, plus a copy button. */
export function CopyEmail({ email, className }: { email: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  }

  return (
    <div className={cn("relative inline-flex items-stretch rounded-full bg-paper text-ink shadow-[0_20px_50px_-20px_rgba(0,0,0,.8)]", className)}>
      <a href={`mailto:${email}`} className="flex items-center rounded-l-full px-5 py-3.5 font-display text-base font-bold transition-colors hover:text-ochre sm:text-lg">
        {email}
      </a>
      <button
        type="button"
        onClick={copy}
        className="relative flex items-center gap-1.5 rounded-r-full border-l border-rule px-5 text-sm font-semibold transition-colors hover:bg-ochre hover:text-on-accent"
        aria-label={copied ? "Email copied" : "Copy email address"}
      >
        {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
        <span aria-live="polite">{copied ? "Copied!" : "Copy"}</span>
      </button>
    </div>
  );
}
