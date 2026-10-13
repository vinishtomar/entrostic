"use client";

import { motion } from "motion/react";
import { ArrowRight, FileSearch, Kanban, Link2, ShieldCheck } from "lucide-react";
import { Avatar, ButtonLink, Logo, fadeUp, stagger } from "@/components/ui";
import WalkingCrowd from "@/components/WalkingCrowd";

const FEATURES = [
  { icon: Link2, title: "One link, everywhere", body: "Every job gets a clean, shareable page. Post it on LinkedIn, job boards, or your own site." },
  { icon: FileSearch, title: "Structured profiles", body: "Every CV becomes a consistent profile — skills, experience, seniority — so you compare like with like." },
  { icon: Kanban, title: "Pipeline at a glance", body: "Move candidates from new to hired and see where every role stands, in real time." },
  { icon: ShieldCheck, title: "Private by design", body: "Each company sees only its own applicants. Candidates' data can be erased on request." },
];

const PREVIEW = [
  { name: "Priya Raman", role: "Senior Backend Engineer", tags: ["Python", "PostgreSQL", "AWS"], stage: "Interview", tone: "bg-amber-50 text-amber-800" },
  { name: "Jonas Weber", role: "Platform Engineer", tags: ["Go", "Kubernetes"], stage: "Screening", tone: "bg-violet-50 text-violet-700" },
  { name: "Lea Martin", role: "Backend Engineer", tags: ["Django", "Kafka", "Docker"], stage: "New", tone: "bg-sky-50 text-sky-700" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Logo />
          <nav className="ml-auto flex items-center gap-2">
            <ButtonLink href="/login" variant="ghost" size="sm">Sign in</ButtonLink>
            <ButtonLink href="/signup" size="sm">Request access</ButtonLink>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_70%)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-24">
          <motion.div variants={stagger(0.08)} initial="hidden" animate="show">
            <motion.span variants={fadeUp} className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/15">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" /> Recruiting platform for growing teams
            </motion.span>
            <motion.h1 variants={fadeUp} className="mt-6 text-balance text-5xl font-semibold tracking-tight text-slate-900 sm:text-6xl sm:leading-[1.05]">
              Hire faster. <span className="text-slate-400">Review smarter.</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              Post a role, share one link anywhere, and review every applicant as a clean, structured profile —
              all in one calm, focused workspace.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="/signup" size="lg">
                Request access <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink href="/login" size="lg" variant="secondary">Sign in</ButtonLink>
            </motion.div>
          </motion.div>

          {/* Product preview */}
          <motion.div
            initial={{ opacity: 0, y: 24, rotate: -1 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-indigo-100 via-white to-sky-100 blur-2xl" />
            <div className="relative rounded-2xl bg-white p-5 shadow-2xl shadow-slate-900/10 ring-1 ring-slate-900/5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">Senior Backend Engineer</p>
                  <p className="text-lg font-semibold">24 applicants</p>
                </div>
                <div className="flex gap-1.5">
                  {[40, 64, 52, 80, 58, 92, 70].map((h, i) => (
                    <motion.span
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: h * 0.4 }}
                      transition={{ delay: 0.6 + i * 0.06, duration: 0.5, ease: "easeOut" }}
                      className="w-2 self-end rounded-t-[3px] bg-indigo-500"
                    />
                  ))}
                </div>
              </div>
              <div className="mt-5 space-y-2.5">
                {PREVIEW.map((p, i) => (
                  <motion.div
                    key={p.name}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + i * 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-center gap-3 rounded-xl p-3 ring-1 ring-slate-100"
                  >
                    <Avatar name={p.name} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{p.name}</p>
                      <div className="mt-1 flex gap-1">
                        {p.tags.map((t) => (
                          <span key={t} className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">{t}</span>
                        ))}
                      </div>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${p.tone}`}>{p.stage}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <WalkingCrowd />

      <section className="border-t border-slate-100 bg-slate-50/60">
        <motion.div
          variants={stagger(0.08)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="mx-auto grid max-w-6xl gap-6 px-4 py-20 sm:grid-cols-2 sm:px-6 lg:grid-cols-4"
        >
          {FEATURES.map((f) => (
            <motion.div key={f.title} variants={fadeUp} className="rounded-2xl bg-white p-6 ring-1 ring-slate-900/5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{f.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <footer className="border-t border-slate-100 py-8 text-center text-xs text-slate-400">© {new Date().getFullYear()} Entrostic</footer>
    </div>
  );
}
