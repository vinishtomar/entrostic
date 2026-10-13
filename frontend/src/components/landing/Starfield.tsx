"use client";

import { useEffect, useRef } from "react";
import { useCanvasLoop } from "./useCanvasLoop";

type Star = { x: number; y: number; z: number; phase: number };

/** Drifting parallax starfield; stars near the pointer link up into a live constellation. */
export default function Starfield({ className = "" }: { className?: string }) {
  const stars = useRef<Star[]>([]);
  const size = useRef({ w: 0, h: 0 });
  const mouse = useRef({ x: -9999, y: -9999, px: 0, py: 0, active: false });
  const shooting = useRef({ x: 0, y: 0, vx: 0, vy: 0, life: 0, next: 3 });

  const canvasRef = useCanvasLoop(({ ctx, w, h, t, dt }) => {
    if (size.current.w !== w || size.current.h !== h) {
      size.current = { w, h };
      const n = Math.min(320, Math.round((w * h) / 4200));
      stars.current = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: 0.15 + Math.random() * 0.85,
        phase: Math.random() * Math.PI * 2,
      }));
    }
    const m = mouse.current;
    // Ease the parallax offset toward the pointer.
    const tx = m.active ? (m.x / w - 0.5) * 2 : 0;
    const ty = m.active ? (m.y / h - 0.5) * 2 : 0;
    m.px += (tx - m.px) * Math.min(1, dt * 3);
    m.py += (ty - m.py) * Math.min(1, dt * 3);

    ctx.clearRect(0, 0, w, h);

    const near: { x: number; y: number }[] = [];
    for (const s of stars.current) {
      s.x -= s.z * 6 * dt;
      if (s.x < -10) s.x = w + 10;
      const x = s.x - m.px * 18 * s.z;
      const y = s.y - m.py * 12 * s.z;
      const a = (0.25 + 0.75 * s.z) * (0.7 + 0.3 * Math.sin(t * 1.7 + s.phase));
      ctx.fillStyle = s.z > 0.75 ? `rgba(224,231,255,${a})` : `rgba(165,180,252,${a * 0.8})`;
      ctx.beginPath();
      ctx.arc(x, y, 0.4 + s.z * 1.25, 0, Math.PI * 2);
      ctx.fill();
      if (m.active && Math.hypot(x - m.x, y - m.y) < 170) near.push({ x, y });
    }

    // Constellation around the pointer
    if (m.active && near.length) {
      const glow = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 170);
      glow.addColorStop(0, "rgba(56,189,248,0.10)");
      glow.addColorStop(1, "rgba(56,189,248,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(m.x - 170, m.y - 170, 340, 340);
      ctx.lineWidth = 0.8;
      for (let i = 0; i < near.length; i++) {
        const p = near[i];
        const d = Math.hypot(p.x - m.x, p.y - m.y);
        ctx.strokeStyle = `rgba(125,211,252,${0.55 * (1 - d / 170)})`;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        for (let j = i + 1; j < near.length; j++) {
          const q = near[j];
          const dd = Math.hypot(p.x - q.x, p.y - q.y);
          if (dd < 80) {
            ctx.strokeStyle = `rgba(165,180,252,${0.35 * (1 - dd / 80)})`;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
      }
      ctx.fillStyle = "rgba(56,189,248,0.9)";
      ctx.beginPath();
      ctx.arc(m.x, m.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Occasional shooting star
    const sh = shooting.current;
    sh.next -= dt;
    if (sh.next <= 0 && sh.life <= 0) {
      sh.x = w * (0.3 + Math.random() * 0.7);
      sh.y = h * Math.random() * 0.4;
      sh.vx = -(420 + Math.random() * 220);
      sh.vy = 160 + Math.random() * 90;
      sh.life = 1;
      sh.next = 5 + Math.random() * 6;
    }
    if (sh.life > 0) {
      sh.life -= dt * 1.4;
      sh.x += sh.vx * dt;
      sh.y += sh.vy * dt;
      const g = ctx.createLinearGradient(sh.x, sh.y, sh.x - sh.vx * 0.18, sh.y - sh.vy * 0.18);
      g.addColorStop(0, `rgba(255,255,255,${Math.max(0, sh.life)})`);
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(sh.x, sh.y);
      ctx.lineTo(sh.x - sh.vx * 0.18, sh.y - sh.vy * 0.18);
      ctx.stroke();
    }
  });

  useEffect(() => {
    const el = canvasRef.current?.parentElement;
    if (!el) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      Object.assign(mouse.current, { x: e.clientX - r.left, y: e.clientY - r.top, active: true });
    };
    const leave = () => (mouse.current.active = false);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [canvasRef]);

  return <canvas ref={canvasRef} aria-hidden="true" className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} />;
}
