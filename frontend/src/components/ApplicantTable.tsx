"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Inbox, Search } from "lucide-react";
import { ProcessingBadge, StageBadge } from "@/components/badges";
import { Avatar, EmptyState, cn } from "@/components/ui";
import type { ApplicationSummary, Stage } from "@/lib/api";
import { STAGES, STAGE_META, timeAgo } from "@/lib/format";

export default function ApplicantTable({ apps, showJob = false }: { apps: ApplicationSummary[]; showJob?: boolean }) {
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<Stage | "all">("all");

  const counts = useMemo(() => {
    const c = Object.fromEntries(STAGES.map((s) => [s, 0])) as Record<Stage, number>;
    apps.forEach((a) => c[a.stage]++);
    return c;
  }, [apps]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return apps.filter((a) => {
      if (stage !== "all" && a.stage !== stage) return false;
      if (!q) return true;
      return [a.full_name, a.email, a.headline, a.location, a.job.title, ...a.skills].join(" ").toLowerCase().includes(q);
    });
  }, [apps, query, stage]);

  return (
    <div>
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, skill, location…"
            className="h-9 w-full rounded-lg bg-slate-50 pl-9 pr-3 text-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="-mx-1 flex gap-1 overflow-x-auto px-1">
          {(["all", ...STAGES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStage(s)}
              className={cn(
                "relative shrink-0 rounded-full px-3 py-1 text-[13px] font-medium transition",
                stage === s ? "text-white" : "text-slate-600 hover:bg-slate-100",
              )}
            >
              {stage === s && <motion.span layoutId="stage-pill" className="absolute inset-0 rounded-full bg-slate-900" transition={{ type: "spring", bounce: 0.2, duration: 0.35 }} />}
              <span className="relative">
                {s === "all" ? "All" : STAGE_META[s].label}{" "}
                <span className={stage === s ? "text-white/60" : "text-slate-400"}>{s === "all" ? apps.length : counts[s]}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={Inbox} title={apps.length ? "No matching applicants" : "No applicants yet"}>
          {apps.length ? "Try a different search or stage." : "Share the job link to start receiving applications."}
        </EmptyState>
      ) : (
        <ul className="divide-y divide-slate-100">
          <AnimatePresence initial={false}>
            {visible.map((a, i) => (
              <motion.li
                key={a.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 10) * 0.025 } }}
                exit={{ opacity: 0 }}
              >
                <Link href={`/dashboard/candidates/${a.id}`} className="group flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50/80">
                  <Avatar name={a.full_name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-900 group-hover:text-indigo-600">{a.full_name}</p>
                      <ProcessingBadge status={a.analysis_status} />
                    </div>
                    <p className="truncate text-sm text-slate-500">
                      {a.headline ?? a.email}
                      {showJob && <span className="text-slate-400"> · {a.job.title}</span>}
                    </p>
                    {a.skills.length > 0 && (
                      <div className="mt-2 hidden flex-wrap gap-1 sm:flex">
                        {a.skills.slice(0, 5).map((s) => (
                          <span key={s} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{s}</span>
                        ))}
                        {a.skills.length > 5 && <span className="px-1 text-xs text-slate-400">+{a.skills.length - 5}</span>}
                      </div>
                    )}
                  </div>
                  <div className="hidden w-36 text-right text-sm md:block">
                    {a.seniority && <p className="font-medium capitalize text-slate-700">{a.seniority}</p>}
                    {a.total_years_experience != null && <p className="text-xs text-slate-500">{a.total_years_experience} yrs experience</p>}
                  </div>
                  <div className="flex w-28 flex-col items-end gap-1">
                    <StageBadge stage={a.stage} />
                    <span className="text-xs text-slate-400">{timeAgo(a.created_at)}</span>
                  </div>
                </Link>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
