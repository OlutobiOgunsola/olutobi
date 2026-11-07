"use client";
import { useEffect, useRef } from "react";
import { seeded } from "@/lib/seed";

/**
 * A living adire cloth on canvas. Tiles breathe on their own; near the
 * pointer they swell, spin and take on dye colours. Pauses off-screen and
 * draws a single still frame under reduced motion. Colours come from the
 * theme tokens (--field and the dye accents), re-read when the theme changes.
 */
type Tile = { kind: number; rot: number; phase: number; heat: number; hue: number };

const DYES = ["--ochre", "--indigo", "--pink", "--vermilion", "--live"];

function drawMotif(ctx: CanvasRenderingContext2D, kind: number, s: number) {
  const h = s / 2;
  ctx.beginPath();
  switch (kind) {
    case 0: // rings
      ctx.arc(0, 0, h * 0.72, 0, Math.PI * 2);
      ctx.moveTo(h * 0.46, 0);
      ctx.arc(0, 0, h * 0.46, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, h * 0.2, 0, Math.PI * 2);
      ctx.fill();
      return;
    case 1: // dots
      for (let i = -1; i <= 1; i++)
        for (let j = -1; j <= 1; j++) {
          ctx.moveTo(i * h * 0.5 + h * 0.09, j * h * 0.5);
          ctx.arc(i * h * 0.5, j * h * 0.5, h * 0.09, 0, Math.PI * 2);
        }
      ctx.fill();
      return;
    case 2: // stitched diagonals
      ctx.setLineDash([s * 0.07, s * 0.07]);
      for (let o = -1; o <= 1; o += 0.5) {
        ctx.moveTo(-h + o * h, h);
        ctx.lineTo(h + o * h, -h);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      return;
    case 3: // scallops
      for (let r = -1; r <= 1; r++) {
        const y = r * h * 0.5 + h * 0.15;
        ctx.moveTo(-h * 0.9, y);
        for (let k = 0; k < 3; k++) ctx.quadraticCurveTo(-h * 0.9 + (k + 0.5) * h * 0.6, y - h * 0.4, -h * 0.9 + (k + 1) * h * 0.6, y);
      }
      ctx.stroke();
      return;
    case 4: // cross & seeds
      ctx.moveTo(0, -h * 0.75);
      ctx.lineTo(0, h * 0.75);
      ctx.moveTo(-h * 0.75, 0);
      ctx.lineTo(h * 0.75, 0);
      ctx.stroke();
      ctx.beginPath();
      for (const [x, y] of [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ]) {
        ctx.moveTo(x * h * 0.42 + h * 0.13, y * h * 0.42);
        ctx.arc(x * h * 0.42, y * h * 0.42, h * 0.13, 0, Math.PI * 2);
      }
      ctx.fill();
      return;
    case 5: // sun
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        ctx.moveTo(Math.cos(a) * h * 0.45, Math.sin(a) * h * 0.45);
        ctx.lineTo(Math.cos(a) * h * 0.78, Math.sin(a) * h * 0.78);
      }
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, h * 0.26, 0, Math.PI * 2);
      ctx.fill();
      return;
    case 6: // diamond in square
      ctx.rect(-h * 0.7, -h * 0.7, h * 1.4, h * 1.4);
      ctx.moveTo(0, -h * 0.55);
      ctx.lineTo(h * 0.55, 0);
      ctx.lineTo(0, h * 0.55);
      ctx.lineTo(-h * 0.55, 0);
      ctx.closePath();
      ctx.stroke();
      return;
    default: // eye
      ctx.moveTo(-h * 0.8, 0);
      ctx.quadraticCurveTo(0, -h * 0.9, h * 0.8, 0);
      ctx.quadraticCurveTo(0, h * 0.9, -h * 0.8, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, h * 0.18, 0, Math.PI * 2);
      ctx.fill();
  }
}

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function readPalette(el: HTMLElement) {
  const css = getComputedStyle(el);
  const token = (name: string) => hexToRgb(css.getPropertyValue(name).trim() || "#efe8d6");
  return {
    base: token("--field"),
    dyes: DYES.map(token),
    alpha: parseFloat(css.getPropertyValue("--field-alpha")) || 1,
  };
}

export function AdireField({ className, tile = 84, seed = "lagos" }: { className?: string; tile?: number; seed?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rand = seeded(seed);
    let tiles: Tile[] = [];
    let cols = 0;
    let rows = 0;
    let w = 0;
    let h = 0;
    const pointer = { x: -9999, y: -9999 };
    let raf = 0;
    let visible = true;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas!.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas!.width = Math.round(w * dpr);
      canvas!.height = Math.round(h * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / tile) + 1;
      rows = Math.ceil(h / tile) + 1;
      tiles = Array.from({ length: cols * rows }, () => ({
        kind: Math.floor(rand() * 8),
        rot: Math.floor(rand() * 4) * (Math.PI / 2),
        phase: rand() * Math.PI * 2,
        heat: 0,
        hue: Math.floor(rand() * DYES.length),
      }));
    }

    let palette = readPalette(canvas);

    function frame(t: number) {
      ctx!.clearRect(0, 0, w, h);
      ctx!.lineWidth = 1.6;
      ctx!.lineCap = "round";
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const tl = tiles[y * cols + x];
          const cx = x * tile + tile / 2;
          const cy = y * tile + tile / 2;
          const d = Math.hypot(pointer.x - cx, pointer.y - cy);
          const target = Math.max(0, 1 - d / 260);
          tl.heat += (target - tl.heat) * 0.12;

          const breathe = reduce ? 0 : Math.sin(t / 1400 + tl.phase + x * 0.35 + y * 0.2) * 0.5 + 0.5;
          const scale = 0.62 + breathe * 0.06 + tl.heat * 0.42;
          const spin = tl.rot + (reduce ? 0 : t / 9000 + tl.heat * 2.2) * (x % 2 ? 1 : -1);
          const base = palette.base;
          const c = palette.dyes[tl.hue];
          const mix = tl.heat;
          const r = Math.round(base[0] + (c[0] - base[0]) * mix);
          const g = Math.round(base[1] + (c[1] - base[1]) * mix);
          const b = Math.round(base[2] + (c[2] - base[2]) * mix);
          const alpha = Math.min(1, (0.07 + breathe * 0.05) * palette.alpha + tl.heat * 0.85);

          ctx!.save();
          ctx!.translate(cx, cy);
          ctx!.rotate(spin);
          ctx!.scale(scale, scale);
          ctx!.strokeStyle = ctx!.fillStyle = `rgba(${r},${g},${b},${alpha})`;
          drawMotif(ctx!, tl.kind, tile);
          ctx!.restore();
        }
      }
      if (!reduce && visible) raf = requestAnimationFrame(frame);
    }

    function onMove(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
    }
    function onLeave() {
      pointer.x = pointer.y = -9999;
    }

    resize();
    raf = requestAnimationFrame(frame);
    const ro = new ResizeObserver(() => {
      resize();
      if (reduce) frame(0);
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      const was = visible;
      visible = entry.isIntersecting;
      if (visible && !was && !reduce) raf = requestAnimationFrame(frame);
    });
    io.observe(canvas);
    const repaint = () => {
      palette = readPalette(canvas);
      if (reduce) frame(0);
    };
    const themeObserver = new MutationObserver(repaint);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      themeObserver.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [tile, seed]);

  return <canvas ref={ref} aria-hidden className={className} />;
}
