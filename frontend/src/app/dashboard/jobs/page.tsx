"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Briefcase, Globe, MapPin, Plus, Users } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { CopyLinkButton } from "@/components/SharePanel";
import { Badge, ButtonLink, Card, EmptyState, Skeleton, cn, fadeUp, stagger } from "@/components/ui";
import { api, type Job } from "@/lib/api";
import { EMPLOYMENT_LABEL, STAGES, STAGE_META, WORKPLACE_LABEL, timeAgo } from "@/lib/format";

type Filter = "open" | "closed" | "all";

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [filter, setFilter] = useState<Filter>("open");

  useEffect(() => {
    api.jobs().then(setJobs).catch(() => setJobs([]));
  }, []);

  const visible = (jobs ?? []).filter((j) => filter === "all" || j.status === filter);
  const count = (f: Filter) => (jobs ?? []).filter((j) => f === "all" || j.status === f).length;

  return (
    <>
      <PageHeader
        title="Jobs"
        description="Create roles and share their links to start receiving applicants."
        actions={<ButtonLink href="/dashboard/jobs/new"><Plus className="h-4 w-4" /> New job</ButtonLink>}
      />

      <div className="mb-5 inline-flex rounded-lg bg-slate-100 p-1">
        {(["open", "closed", "all"] as Filter[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={cn("relative rounded-md px-3.5 py-1.5 text-sm font-medium capitalize transition", filter === f ? "text-slate-900" : "text-slate-500 hover:text-slate-700")}>
            {filter === f && <motion.span layoutId="job-filter" className="absolute inset-0 rounded-md bg-white shadow-sm" transition={{ type: "spring", bounce: 0.2, duration: 0.35 }} />}
            <span className="relative">{f} <span className="text-slate-400">{jobs ? count(f) : ""}</span></span>
          </button>
        ))}
      </div>

      {!jobs ? (
        <div className="space-y-3">{[0, 1].map((i) => <Skeleton key={i} className="h-36" />)}</div>
      ) : visible.length === 0 ? (
        <Card>
          <EmptyState icon={Briefcase} title={jobs.length ? `No ${filter} jobs` : "Create your first job"}>
            {!jobs.length && (
              <>Post a role and you&apos;ll get a link to share anywhere.
                <div className="mt-5"><ButtonLink href="/dashboard/jobs/new"><Plus className="h-4 w-4" /> New job</ButtonLink></div>
              </>
            )}
          </EmptyState>
        </Card>
      ) : (
        <motion.div key={filter} variants={stagger(0.05)} initial="hidden" animate="show" className="space-y-3">
          {visible.map((j) => (
            <motion.div key={j.id} variants={fadeUp}>
              <div className="group">
                <Card className="relative p-5 transition duration-200 group-hover:shadow-lg group-hover:shadow-slate-900/5">
                  <div className="flex flex-wrap items-start gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Stretched link: the whole card is clickable, while the copy button stays a separate control */}
                        <Link href={`/dashboard/jobs/${j.id}`} className="text-[17px] font-semibold text-slate-900 after:absolute after:inset-0 after:rounded-2xl group-hover:text-indigo-600">
                          {j.title}
                        </Link>
                        {j.status === "open"
                          ? <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-600/20"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Open</Badge>
                          : <Badge className="bg-slate-100 text-slate-600 ring-slate-500/15">Closed</Badge>}
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                        {j.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{j.location}</span>}
                        <span className="inline-flex items-center gap-1"><Globe className="h-3.5 w-3.5" />{WORKPLACE_LABEL[j.workplace_type]}</span>
                        <span>{EMPLOYMENT_LABEL[j.employment_type]}</span>
                        <span className="text-slate-400">Created {timeAgo(j.created_at)}</span>
                      </div>
                    </div>
                    <div className="relative z-10"><CopyLinkButton slug={j.slug} /></div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-900">
                      <Users className="h-4 w-4 text-slate-400" /> {j.applicant_count} applicant{j.applicant_count === 1 ? "" : "s"}
                    </span>
                    <StageStrip job={j} />
                  </div>
                </Card>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </>
  );
}

/** Compact per-stage counts for a job (text + dot; zero stages are dimmed). */
function StageStrip({ job }: { job: Job }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
      {STAGES.filter((s) => s !== "rejected").map((s) => (
        <span key={s} className={cn("inline-flex items-center gap-1.5", job.stage_counts[s] ? "text-slate-700" : "text-slate-300")}>
          <span className={cn("h-1.5 w-1.5 rounded-full", job.stage_counts[s] ? STAGE_META[s].dot : "bg-slate-200")} />
          {STAGE_META[s].label} <span className="font-medium tabular-nums">{job.stage_counts[s]}</span>
        </span>
      ))}
    </div>
  );
}
