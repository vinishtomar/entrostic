"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { Logo } from "@/components/ui";

/** Split-screen layout for sign-in / sign-up. */
export default function AuthLayout({ title, subtitle, children }: { title: string; subtitle: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-4 py-8 sm:px-10">
        <Link href="/"><Logo /></Link>
        <div className="flex flex-1 items-center justify-center py-12">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-sm"
          >
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
            <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </motion.div>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-slate-950 lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_30%_20%,rgba(99,102,241,0.45),transparent),radial-gradient(50%_40%_at_80%_80%,rgba(56,189,248,0.25),transparent)]" />
        <div className="absolute inset-0 [background-image:radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:22px_22px]" />
        <div className="relative flex h-full flex-col justify-end p-12 text-white">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }} className="max-w-md">
            <p className="text-2xl font-medium leading-snug tracking-tight">
              From a shared inbox full of PDFs to a pipeline you can actually reason about.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-white/70">
              {["Post a job and share one link anywhere", "Every CV turned into a structured profile", "Track each candidate from new to hired"].map((t) => (
                <li key={t} className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                  {t}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
