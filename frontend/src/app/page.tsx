"use client";

import { motion, useScroll, useSpring, useTransform } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowDown } from "lucide-react";
import Bento from "@/components/landing/Bento";
import DecodeWord from "@/components/landing/DecodeWord";
import Starfield from "@/components/landing/Starfield";
import TalentGlobe from "@/components/landing/TalentGlobe";
import s from "@/components/landing/landing.module.css";
import { Logo, cn } from "@/components/ui";

const WORDS = ["engineers", "scientists", "designers", "builders", "dreamers"];

const ORBIT_CARDS = [
  { initials: "PR", role: "Backend Engineer", meta: "7 yrs · Berlin", tags: ["Python", "AWS"], pos: "left-[2%] top-[14%]", anim: s.float },
  { initials: "LM", role: "ML Researcher", meta: "PhD · Remote", tags: ["PyTorch", "NLP"], pos: "right-[0%] top-[46%]", anim: s.floatSlow },
  { initials: "JW", role: "Product Designer", meta: "5 yrs · Lisbon", tags: ["Figma", "UX"], pos: "left-[8%] bottom-[8%]", anim: s.floatAlt },
];

const STEPS = [
  { n: "01", title: "Launch a role", body: "Describe the job and the skills that matter. It goes live instantly." },
  { n: "02", title: "Share one link", body: "Post it anywhere. Candidates apply in under a minute, no account needed." },
  { n: "03", title: "Profiles assemble", body: "Every CV becomes a structured profile you can scan and compare at a glance." },
  { n: "04", title: "Hire with clarity", body: "Move the right people forward and keep the whole team aligned." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#02040f] text-slate-200 selection:bg-sky-400/30">
      <Header />
      <Hero />

      <section id="product" className="relative mx-auto max-w-6xl scroll-mt-24 px-4 py-24 sm:px-6 sm:py-32">
        <SectionTitle eyebrow="Mission control" title="Everything you need to find exceptional people." />
        <div className="mt-14"><Bento /></div>
      </section>

      <LaunchSequence />
      <FinalCta />

      <footer className="border-t border-white/5 py-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 text-sm text-slate-500 sm:px-6">
          <Logo light />
          <p>© {new Date().getFullYear()} Entrostic · Hiring for the people who build what&apos;s next.</p>
        </div>
      </footer>
    </div>
  );
}

function Header() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header className={cn("fixed inset-x-0 top-0 z-40 pt-[env(safe-area-inset-top)] transition-all duration-300",
      scrolled ? "border-b border-white/5 bg-[#02040f]/70 backdrop-blur-xl" : "bg-transparent")}>
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/"><Logo light /></Link>
        <nav className="hidden items-center gap-6 text-sm text-slate-400 md:flex">
          <a href="#product" className="transition hover:text-white">Product</a>
          <a href="#how" className="transition hover:text-white">How it works</a>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/login" className="rounded-lg px-3 py-1.5 text-sm text-slate-300 transition hover:text-white">Sign in</Link>
          <Link href="/signup" className="rounded-lg bg-white px-3.5 py-1.5 text-sm font-medium text-slate-950 transition hover:bg-sky-100">
            Request access
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative isolate flex min-h-[100svh] items-center overflow-hidden pt-16">
      {/* aurora + grid backdrop */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_75%_40%,rgba(79,70,229,0.28),transparent_70%),radial-gradient(40%_40%_at_10%_10%,rgba(56,189,248,0.14),transparent_70%)]" />
      <div className={`${s.gridFloor} -z-10 opacity-60`} />
      <Starfield />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-6 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_1fr]">
        <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}>
          <motion.p variants={rise}
            className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-sky-300 ring-1 ring-white/10">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Private beta
          </motion.p>
          <motion.h1 variants={rise} className="mt-6 text-[2.6rem] font-semibold leading-[1.08] tracking-tight text-white sm:text-[3.4rem] xl:text-[3.75rem]">
            Find the
            <br />
            <DecodeWord words={WORDS} />
            <br />
            <span className="bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent sm:whitespace-nowrap">who build the future.</span>
          </motion.h1>
          <motion.p variants={rise} className="mt-6 max-w-lg text-lg leading-8 text-slate-400">
            Entrostic turns every application into a clear, structured profile, so you see exceptional talent the moment it arrives.
          </motion.p>
          <motion.div variants={rise} className="mt-10 flex flex-wrap items-center gap-3">
            <Link href="/signup"
              className="group relative inline-flex h-12 items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 px-6 font-medium text-white shadow-[0_0_40px_-8px_rgba(56,189,248,0.7)] transition hover:shadow-[0_0_60px_-6px_rgba(56,189,248,0.9)]">
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition duration-700 group-hover:translate-x-full" />
              Request access <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
            <a href="#product" className="inline-flex h-12 items-center rounded-xl px-5 font-medium text-slate-300 ring-1 ring-white/15 transition hover:bg-white/5 hover:text-white">
              Explore the platform
            </a>
          </motion.div>
          <motion.p variants={rise} className="mt-8 hidden font-mono text-xs text-slate-500 sm:block">
            ↳ Move your cursor across the sky.
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className="relative mx-auto aspect-square w-full max-w-[560px]"
        >
          <TalentGlobe />
          {ORBIT_CARDS.map((c) => (
            <div key={c.role} className={`${c.anim} ${s.glass} absolute ${c.pos} hidden w-48 rounded-2xl p-3 sm:block`}>
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-indigo-400 to-sky-400 text-[11px] font-semibold text-slate-950">{c.initials}</span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-white">{c.role}</p>
                  <p className="font-mono text-[10px] text-slate-400">{c.meta}</p>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1">
                {c.tags.map((t) => <span key={t} className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-sky-200">{t}</span>)}
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.6)]" />
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      <a href="#product" aria-label="Scroll to product"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full p-2 text-slate-500 transition hover:text-white">
        <ArrowDown className={`${s.float} h-5 w-5`} />
      </a>
    </section>
  );
}

const rise = { hidden: { opacity: 0, y: 18, filter: "blur(6px)" }, show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const } } };

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
      className="mx-auto max-w-2xl text-center">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-sky-300/80">{eyebrow}</p>
      <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-white sm:text-5xl">{title}</h2>
    </motion.div>
  );
}

function LaunchSequence() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 55%"] });
  const progress = useSpring(scrollYProgress, { stiffness: 80, damping: 20 });
  const width = useTransform(progress, [0, 1], ["0%", "100%"]);

  return (
    <section id="how" className="relative scroll-mt-24 border-y border-white/5 bg-[radial-gradient(50%_80%_at_50%_0%,rgba(79,70,229,0.12),transparent)] py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionTitle eyebrow="Launch sequence" title="From first post to first day, in four moves." />
        <div ref={ref} className="relative mt-16">
          {/* the beam that charges up as you scroll */}
          <div className="absolute left-[12.5%] right-[12.5%] top-6 hidden h-px bg-white/10 md:block">
            <motion.div style={{ width }} className="h-full bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-300 shadow-[0_0_12px_2px_rgba(56,189,248,0.6)]" />
          </div>
          <div className="grid gap-10 md:grid-cols-4 md:gap-6">
            {STEPS.map((st, i) => (
              <motion.div key={st.n} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: i * 0.12, duration: 0.6 }} className="relative text-center">
                <div className="relative mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#02040f] font-mono text-sm text-sky-200 ring-1 ring-sky-400/40 shadow-[0_0_24px_-4px_rgba(56,189,248,0.6)]">
                  {st.n}
                </div>
                <h3 className="mt-5 font-semibold text-white">{st.title}</h3>
                <p className="mx-auto mt-2 max-w-[16rem] text-sm leading-6 text-slate-400">{st.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative isolate overflow-hidden py-32 sm:py-40">
      <div className={`${s.portal} -z-10`} />
      <div className={`${s.gridFloor} -z-10 opacity-40`} />
      <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
        className="mx-auto max-w-3xl px-4 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-sky-300/80">T-minus zero</p>
        <h2 className="mt-4 text-balance text-4xl font-semibold tracking-tight text-white sm:text-6xl">
          The future is hiring.
          <span className="block bg-gradient-to-r from-sky-300 via-indigo-300 to-violet-400 bg-clip-text text-transparent">Are you ready?</span>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg text-slate-400">Request access for your team. Every company is reviewed, so the platform stays focused and trusted.</p>
        <Link href="/signup"
          className="mt-10 inline-flex h-12 items-center gap-2 rounded-xl bg-white px-7 font-medium text-slate-950 shadow-[0_0_50px_-10px_rgba(255,255,255,0.6)] transition hover:bg-sky-100">
          Request access <ArrowRight className="h-4 w-4" />
        </Link>
      </motion.div>
    </section>
  );
}
