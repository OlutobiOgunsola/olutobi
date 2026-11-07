"use client";
import { useEffect } from "react";

const GLYPHS = ["◎", "◇", "✳", "∿", "●", "✦", "◐"];
const COLORS = ["var(--ochre)", "var(--indigo)", "var(--pink)", "var(--vermilion)", "var(--live)"];

/**
 * Leaves a short-lived trail of adire glyphs behind the mouse. Plain DOM +
 * Web Animations so it never re-renders React. Off for touch and reduced motion.
 */
export function CursorTrail() {
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse), (prefers-reduced-motion: reduce)").matches) return;

    let lastX = 0;
    let lastY = 0;
    let live = 0;
    let n = 0;

    function onMove(e: PointerEvent) {
      if (e.pointerType !== "mouse") return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      if (dx * dx + dy * dy < 46 * 46 || live > 22) return;
      lastX = e.clientX;
      lastY = e.clientY;

      const el = document.createElement("span");
      el.textContent = GLYPHS[n % GLYPHS.length];
      el.setAttribute("aria-hidden", "true");
      Object.assign(el.style, {
        position: "fixed",
        left: `${e.clientX}px`,
        top: `${e.clientY}px`,
        pointerEvents: "none",
        zIndex: "70",
        fontSize: `${12 + (n % 4) * 4}px`,
        color: COLORS[n % COLORS.length],
        translate: "-50% -50%",
      });
      n++;
      live++;
      document.body.appendChild(el);

      const drift = (Math.random() - 0.5) * 60;
      el.animate(
        [
          { transform: "scale(0.2) rotate(0deg)", opacity: 0.95 },
          { transform: `translate(${drift * 0.4}px, -14px) scale(1.15) rotate(90deg)`, opacity: 0.9, offset: 0.25 },
          { transform: `translate(${drift}px, 38px) scale(0.4) rotate(220deg)`, opacity: 0 },
        ],
        { duration: 1100, easing: "cubic-bezier(.2,.7,.3,1)" },
      ).onfinish = () => {
        el.remove();
        live--;
      };
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return null;
}
