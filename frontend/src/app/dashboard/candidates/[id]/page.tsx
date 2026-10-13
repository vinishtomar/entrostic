"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Briefcase, Download, Link2, Loader2, Mail, RefreshCw, Trash2, TriangleAlert } from "lucide-react";
import ProfileView from "@/components/ProfileView";
import { Avatar, Button, Card, Modal, Skeleton, cn, useToast } from "@/components/ui";
import { api, type ApplicationDetail, type Stage } from "@/lib/api";
import { STAGES, STAGE_META, timeAgo } from "@/lib/format";

export default function CandidatePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const [app, setApp] = useState<ApplicationDetail | null>(null);
  const [missing, setMissing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => api.application(id).then(setApp).catch(() => setMissing(true)), [id]);
  useEffect(() => void load(), [load]);

  useEffect(() => {
    if (app?.analysis_status !== "pending") return;
    const t = setInterval(load, 2500);
    return () => clearInterval(t);
  }, [app?.analysis_status, load]);

  async function moveTo(stage: Stage) {
    if (!app || stage === app.stage) return;
    const prev = app;
    setApp({ ...app, stage }); // optimistic
    try {
      setApp(await api.setStage(app.id, stage));
      toast(`Moved to ${STAGE_META[stage].label}`);
    } catch {
      setApp(prev);
      toast("Could not update stage", "error");
    }
  }

  async function reparse() {
    if (!app) return;
    setBusy("reparse");
    try {
      setApp(await api.reanalyze(app.id));
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!app) return;
    setBusy("delete");
    try {
      await api.deleteApplication(app.id);
      toast("Application deleted");
      router.push(`/dashboard/jobs/${app.job.id}`);
    } catch {
      toast("Could not delete", "error");
      setBusy(null);
    }
  }

  if (missing) return <p className="text-slate-600">Candidate not found.</p>;
  if (!app) return <div className="space-y-4"><Skeleton className="h-28" /><Skeleton className="h-80" /></div>;

  return (
    <>
      <Link href={`/dashboard/jobs/${app.job.id}`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> {app.job.title}
      </Link>

      <Card className="mb-6 p-6">
        <div className="flex flex-wrap items-start gap-5">
          <Avatar name={app.full_name} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{app.full_name}</h1>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
              <a href={`mailto:${app.email}`} className="inline-flex items-center gap-1.5 hover:text-indigo-600"><Mail className="h-3.5 w-3.5" />{app.email}</a>
              {app.linkedin_url && (
                <a href={app.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-indigo-600"><Link2 className="h-3.5 w-3.5" />LinkedIn</a>
              )}
              <span className="inline-flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" />Applied {timeAgo(app.created_at)}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {app.cv && (
              <a href={api.cvUrl(app.id)} className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50">
                <Download className="h-4 w-4" /> CV
              </a>
            )}
            <Button variant="ghost" onClick={() => setConfirmDelete(true)} className="text-slate-500 hover:text-red-600" aria-label="Delete application">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stage selector */}
        <div className="mt-6 border-t border-slate-100 pt-5">
          <p className="mb-2.5 text-xs font-medium uppercase tracking-wider text-slate-400">Stage</p>
          <div className="flex flex-wrap gap-1.5">
            {STAGES.map((s) => (
              <button
                key={s}
                onClick={() => moveTo(s)}
                className={cn(
                  "relative rounded-lg px-3.5 py-1.5 text-sm font-medium transition",
                  app.stage === s ? "text-white" : "bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-100",
                )}
              >
                {app.stage === s && (
                  <motion.span layoutId="stage-select" className={cn("absolute inset-0 rounded-lg", s === "rejected" ? "bg-slate-600" : s === "hired" ? "bg-emerald-600" : "bg-indigo-600")}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }} />
                )}
                <span className="relative">{STAGE_META[s].label}</span>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {app.analysis_status === "pending" && (
        <Card className="flex items-center gap-3 p-6 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
          Reading the CV — the profile will appear here in a few seconds.
        </Card>
      )}
      {app.analysis_status === "failed" && (
        <Card className="flex flex-wrap items-center gap-4 p-6">
          <TriangleAlert className="h-5 w-5 text-red-600" />
          <div className="flex-1">
            <p className="font-medium text-slate-900">We couldn&apos;t read this CV</p>
            <p className="text-sm text-slate-500">{app.analysis_detail}</p>
          </div>
          <Button variant="secondary" loading={busy === "reparse"} onClick={reparse}><RefreshCw className="h-4 w-4" /> Try again</Button>
        </Card>
      )}
      {app.analysis_status === "processed" && app.profile && (
        <>
          <ProfileView profile={app.profile} />
          <div className="mt-6 flex justify-end">
            <button onClick={reparse} disabled={busy === "reparse"} className="inline-flex items-center gap-1.5 text-xs text-slate-400 transition hover:text-slate-600">
              <RefreshCw className={cn("h-3 w-3", busy === "reparse" && "animate-spin")} /> Re-read CV
            </button>
          </div>
        </>
      )}

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete this application?">
        <p className="text-sm text-slate-600">
          This permanently removes {app.full_name}&apos;s application and CV. Use this for data-erasure requests. It can&apos;t be undone.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmDelete(false)}>Cancel</Button>
          <Button variant="danger" loading={busy === "delete"} onClick={remove}>Delete permanently</Button>
        </div>
      </Modal>
    </>
  );
}
