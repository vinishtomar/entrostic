"use client";

import { useEffect, useRef } from "react";
import { useCanvasLoop } from "./useCanvasLoop";

const N = 900;
// Evenly spread points on a unit sphere (Fibonacci lattice).
const POINTS = Array.from({ length: N }, (_, i) => {
  const y = 1 - (i / (N - 1)) * 2;
  const r = Math.sqrt(1 - y * y);
  const a = i * Math.PI * (3 - Math.sqrt(5));
  return [Math.cos(a) * r, y, Math.sin(a) * r] as const;
});
// Pairs of surface points joined by pulsing "data" arcs.
const ARCS = [[40, 610], [130, 455], [222, 780], [300, 520], [505, 860], [700, 90]];

/** Slowly rotating dot-sphere with orbit rings, satellites and data arcs; tilts toward the pointer. */
export default function TalentGlobe() {
  const tilt = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  const canvasRef = useCanvasLoop(({ ctx, w, h, t, dt }) => {
    const tl = tilt.current;
    tl.x += (tl.tx - tl.x) * Math.min(1, dt * 2.5);
    tl.y += (tl.ty - tl.y) * Math.min(1, dt * 2.5);

    const cx = w / 2, cy = h / 2;
    const R = Math.min(w, h) * 0.31;
    const ry = t * 0.16 + tl.x * 0.7;
    const rx = 0.32 + tl.y * 0.35;
    const cosY = Math.cos(ry), sinY = Math.sin(ry), cosX = Math.cos(rx), sinX = Math.sin(rx);
    const project = ([x, y, z]: readonly [number, number, number]) => {
      const x1 = x * cosY - z * sinY;
      const z1 = x * sinY + z * cosY;
      const y1 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;
      return { x: cx + x1 * R, y: cy + y1 * R, z: z2 };
    };

    ctx.clearRect(0, 0, w, h);

    // Atmosphere
    const atm = ctx.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 1.5);
    atm.addColorStop(0, "rgba(79,70,229,0.28)");
    atm.addColorStop(0.55, "rgba(56,189,248,0.08)");
    atm.addColorStop(1, "rgba(56,189,248,0)");
    ctx.fillStyle = atm;
    ctx.fillRect(0, 0, w, h);

    // Orbit rings (back half first, so the planet covers it)
    const rings = [
      { rx: R * 1.55, ry: R * 0.42, rot: -0.38, speed: 0.35, color: "56,189,248" },
      { rx: R * 1.3, ry: R * 0.3, rot: 0.55, speed: -0.5, color: "167,139,250" },
    ];
    const ringPass = (front: boolean) => {
      for (const ring of rings) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(ring.rot);
        ctx.strokeStyle = `rgba(${ring.color},${front ? 0.45 : 0.15})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, 0, ring.rx, ring.ry, 0, front ? 0 : Math.PI, front ? Math.PI : Math.PI * 2);
        ctx.stroke();
        // Satellite with a short trail
        const a = t * ring.speed;
        const sa = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const inFront = sa < Math.PI;
        if (inFront === front) {
          for (let k = 0; k < 8; k++) {
            const b = a - k * 0.035 * Math.sign(ring.speed);
            ctx.fillStyle = `rgba(${ring.color},${(front ? 0.9 : 0.35) * (1 - k / 8)})`;
            ctx.beginPath();
            ctx.arc(Math.cos(b) * ring.rx, Math.sin(b) * ring.ry, k === 0 ? 3 : 2 - k * 0.15, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      }
    };
    ringPass(false);

    // Sphere points: back hemisphere dim indigo, front bright cyan-white
    const proj = POINTS.map(project);
    for (const p of proj) {
      if (p.z >= 0) continue;
      const d = (p.z + 1) / 2;
      ctx.fillStyle = `rgba(99,102,241,${0.08 + d * 0.25})`;
      ctx.fillRect(p.x, p.y, 1.2, 1.2);
    }
    for (const p of proj) {
      if (p.z < 0) continue;
      const d = p.z;
      ctx.fillStyle = d > 0.6 ? `rgba(224,242,254,${0.35 + d * 0.6})` : `rgba(125,211,252,${0.25 + d * 0.6})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 0.6 + d * 1.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Data arcs between front-facing points, with a travelling pulse
    ARCS.forEach(([i, j], k) => {
      const a = proj[i], b = proj[j];
      if (a.z < 0.05 || b.z < 0.05) return;
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const lift = 1.35;
      const qx = cx + (mx - cx) * lift, qy = cy + (my - cy) * lift - 18;
      ctx.strokeStyle = "rgba(56,189,248,0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo(qx, qy, b.x, b.y);
      ctx.stroke();
      const u = (t * 0.45 + k * 0.17) % 1;
      const px = (1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * qx + u * u * b.x;
      const py = (1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * qy + u * u * b.y;
      ctx.fillStyle = "rgba(240,249,255,0.95)";
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    ringPass(true);
  });

  useEffect(() => {
    const el = canvasRef.current?.parentElement;
    if (!el) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      tilt.current.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      tilt.current.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    };
    const leave = () => Object.assign(tilt.current, { tx: 0, ty: 0 });
    window.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [canvasRef]);

  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />;
}
