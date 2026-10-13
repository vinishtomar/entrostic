"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Globe, Link2, Mail, Newspaper, ShieldCheck } from "lucide-react";
import s from "./landing.module.css";

function useSpotlight() {
  return (e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
}

function Card({ className = "", eyebrow, title, body, children }: {
  className?: string; eyebrow: string; title: string; body: string; children: React.ReactNode;
}) {
  const onMove = useSpotlight();
  return (
    <motion.article
      onPointerMove={onMove}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`${s.glass} ${s.spot} flex flex-col overflow-hidden rounded-3xl ${className}`}
    >
      <div className="relative h-56 sm:h-60">{children}</div>
      <div className="border-t border-white/5 p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-sky-300/70">{eyebrow}</p>
        <h3 className="mt-2 text-lg font-semibold text-white">{title}</h3>
        <p className="mt-1.5 text-sm leading-6 text-slate-400">{body}</p>
      </div>
    </motion.article>
  );
}

/* ---- 1. One link, every channel ---- */
const CHANNELS = [
  { label: "LinkedIn", icon: Link2, x: 14, y: 22 },
  { label: "Email", icon: Mail, x: 14, y: 78 },
  { label: "Your site", icon: Globe, x: 86, y: 22 },
  { label: "Job boards", icon: Newspaper, x: 86, y: 78 },
];
function LinkBeams() {
  return (
    <div className="absolute inset-0">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {CHANNELS.map((c) => (
          <path key={c.label} d={`M${c.x} ${c.y} C ${(c.x + 50) / 2} ${c.y}, ${(c.x + 50) / 2} 50, 50 50`}
            fill="none" stroke="rgb(56 189 248 / 0.7)" strokeWidth={1.5} vectorEffect="non-scaling-stroke"
            className={s.beam} />
        ))}
      </svg>
      {CHANNELS.map((c, i) => (
        <span key={c.label}
          className={`${i % 2 ? s.floatSlow : s.float} absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-white/[0.06] px-3 py-1.5 text-xs text-slate-200 ring-1 ring-white/10 backdrop-blur`}
          style={{ left: `${c.x}%`, top: `${c.y}%` }}>
          <c.icon className="h-3.5 w-3.5 text-sky-300" />{c.label}
        </span>
      ))}
      <div className={`${s.pulse} absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-2xl bg-slate-950/80 px-4 py-2.5 font-mono text-xs text-sky-200 ring-1 ring-sky-400/40`}>
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        entrostic.com/j/senior-engineer
      </div>
    </div>
  );
}

/* ---- 2. CVs, decoded ---- */
const FIELDS = ["Python", "PostgreSQL", "7 yrs", "Senior", "Berlin", "Kafka"];
function DecodeCV() {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const id = setTimeout(() => setN(FIELDS.length), 0);
      return () => clearTimeout(id);
    }
    const id = setInterval(() => setN((v) => (v >= FIELDS.length + 7 ? 0 : v + 1)), 500);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="absolute inset-0 flex items-center gap-4 px-6">
      <div className="relative h-40 w-28 shrink-0 overflow-hidden rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/10">
        {[70, 90, 55, 85, 40, 75, 60, 80, 50].map((wd, i) => (
          <div key={i} className="mb-2 h-1.5 rounded-full bg-slate-500/40" style={{ width: `${wd}%` }} />
        ))}
        <div className={s.scanline} />
      </div>
      <div className="flex flex-1 flex-wrap content-center gap-1.5">
        <AnimatePresence>
          {FIELDS.slice(0, Math.min(n, FIELDS.length)).map((f) => (
            <motion.span key={f} initial={{ opacity: 0, scale: 0.6, x: -12 }} animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              className="rounded-md bg-indigo-500/15 px-2 py-1 font-mono text-[11px] text-indigo-200 ring-1 ring-indigo-400/30">
              {f}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ---- 3. Private by design ---- */
function Shield() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className={`${s.spin} absolute h-44 w-44 rounded-full border border-dashed border-sky-400/30`} />
      <div className={`${s.spinRev} absolute h-32 w-32 rounded-full border border-indigo-400/30`}>
        <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-indigo-300 shadow-[0_0_10px_2px_rgb(129_140_248/0.7)]" />
      </div>
      <div className={`${s.pulse} grid h-16 w-16 place-items-center rounded-2xl bg-slate-950 ring-1 ring-sky-400/40`}>
        <ShieldCheck className="h-7 w-7 text-sky-300" />
      </div>
    </div>
  );
}

/* ---- 4. Pipeline in motion ---- */
const STAGES = ["New", "Screening", "Interview", "Offer", "Hired"];
const PARTICLES = [
  { d: 5, delay: 0, end: 96, rest: 15 }, { d: 5, delay: -1, end: 96, rest: 30 }, { d: 5, delay: -2.5, end: 76, rest: 45 },
  { d: 5, delay: -3.5, end: 58, rest: 60 }, { d: 5, delay: -4.2, end: 38, rest: 25 }, { d: 6, delay: -0.5, end: 58, rest: 50 },
  { d: 6, delay: -2, end: 38, rest: 10 }, { d: 6, delay: -4, end: 76, rest: 70 }, { d: 7, delay: -1.5, end: 38, rest: 35 },
];
function Pipeline() {
  return (
    <div className="absolute inset-0 flex flex-col justify-center gap-5 px-6">
      <div className="grid grid-cols-5 text-center font-mono text-[10px] uppercase tracking-wider text-slate-500 sm:text-[11px]">
        {STAGES.map((st) => <span key={st}>{st}</span>)}
      </div>
      <div className="relative h-14 rounded-2xl bg-white/[0.03] ring-1 ring-white/10">
        <div className="absolute inset-0 grid grid-cols-5">
          {STAGES.map((st, i) => <div key={st} className={i ? "border-l border-white/5" : ""} />)}
        </div>
        {PARTICLES.map((p, i) => (
          <span key={i} className={s.flow}
            style={{ top: `${18 + (i % 4) * 18}%`, ["--d" as string]: `${p.d}s`, ["--delay" as string]: `${p.delay}s`,
              ["--end" as string]: `${p.end}%`, ["--rest" as string]: `${p.rest}%` }} />
        ))}
      </div>
    </div>
  );
}

export default function Bento() {
  return (
    <div className="grid gap-4 lg:grid-cols-6">
      <Card className="lg:col-span-4" eyebrow="Distribution" title="One link. Every channel."
        body="Publish a role and share a single, beautiful job page on LinkedIn, by email, on job boards or your own site.">
        <LinkBeams />
      </Card>
      <Card className="lg:col-span-2" eyebrow="Signal" title="CVs, decoded."
        body="Every CV arrives as a clean, structured profile: skills, experience and seniority, side by side.">
        <DecodeCV />
      </Card>
      <Card className="lg:col-span-2" eyebrow="Trust" title="Private by design."
        body="Each company sees only its own applicants, and any candidate's data can be erased on request.">
        <Shield />
      </Card>
      <Card className="lg:col-span-4" eyebrow="Momentum" title="A pipeline in motion."
        body="Move people from new to hired and watch every role progress in real time, across your whole team.">
        <Pipeline />
      </Card>
    </div>
  );
}
