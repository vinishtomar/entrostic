"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Globe, MapPin } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import ApplicantTable from "@/components/ApplicantTable";
import JobForm from "@/components/JobForm";
import SharePanel from "@/components/SharePanel";
import { Badge, Button, Card, Skeleton, cn, useToast } from "@/components/ui";
import { api, type ApplicationSummary, type Job } from "@/lib/api";
import { EMPLOYMENT_LABEL, WORKPLACE_LABEL } from "@/lib/format";

type Tab = "applicants" | "details";

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [job, setJob] = useState<Job | null>(null);
  const [apps, setApps] = useState<ApplicationSummary[] | null>(null);
  const [tab, setTab] = useState<Tab>("applicants");
  const [toggling, setToggling] = useState(false);
  const [missing, setMissing] = useState(false);

  const load = useCallback(() => {
    api.job(id).then(setJob).catch(() => setMissing(true));
    api.jobApplications(id).then(setApps).catch(() => setApps([]));
  }, [id]);
  useEffect(load, [load]);

  // Keep refreshing while any CV is still being read.
  const anyPending = apps?.some((a) => a.analysis_status === "pending");
  useEffect(() => {
    if (!anyPending) return;
    const t = setInterval(() => api.jobApplications(id).then(setApps).catch(() => {}), 3000);
    return () => clearInterval(t);
  }, [anyPending, id]);

  async function toggleStatus() {
    if (!job) return;
    setToggling(true);
    const next = job.status === "open" ? "closed" : "open";
    try {
      setJob(await api.updateJob(job.id, { status: next }));
      toast(next === "open" ? "Job reopened" : "Job closed");
    } catch {
      toast("Could not update job", "error");
    } finally {
      setToggling(false);
    }
  }

  if (missing) return <p className="text-slate-600">Job not found.</p>;

  return (
    <>
      <Link href="/dashboard/jobs" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Jobs
      </Link>

      {!job ? (
        <Skeleton className="h-40" />
      ) : (
        <>
          <PageHeader
            title={
              <span className="flex flex-wrap items-center gap-3">
                {job.title}
                {job.status === "open"
                  ? <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-600/20"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Open</Badge>
                  : <Badge className="bg-slate-100 text-slate-600 ring-slate-500/15">Closed</Badge>}
              </span>
            }
            description={
              <span className="flex flex-wrap gap-x-4 gap-y-1">
                {job.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>}
                <span className="inline-flex items-center gap-1"><Globe className="h-3.5 w-3.5" />{WORKPLACE_LABEL[job.workplace_type]}</span>
                <span>{EMPLOYMENT_LABEL[job.employment_type]}</span>
              </span>
            }
            actions={
              <Button variant={job.status === "open" ? "secondary" : "primary"} loading={toggling} onClick={toggleStatus}>
                {job.status === "open" ? "Close job" : "Reopen job"}
              </Button>
            }
          />

          <SharePanel slug={job.slug} isOpen={job.status === "open"} />

          <div className="mb-4 mt-8 flex gap-6 border-b border-slate-200">
            {(["applicants", "details"] as Tab[]).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={cn("relative pb-3 text-sm font-medium capitalize transition", tab === t ? "text-slate-900" : "text-slate-500 hover:text-slate-700")}>
                {t === "applicants" ? `Applicants (${apps?.length ?? "…"})` : "Job details"}
                {tab === t && <motion.span layoutId="job-tab" className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-indigo-600" />}
              </button>
            ))}
          </div>

          {tab === "applicants" ? (
            <Card className="overflow-hidden">{apps ? <ApplicantTable apps={apps} /> : <Skeleton className="m-4 h-32" />}</Card>
          ) : (
            <JobForm
              key={job.updated_at}
              initial={job}
              submitLabel="Save changes"
              onSubmit={async (v) => {
                setJob(await api.updateJob(job.id, v));
                toast("Changes saved");
              }}
            />
          )}
        </>
      )}
    </>
  );
}
