"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Briefcase, Calendar, Clock, FileText, Globe, Link2, MapPin, Upload, X } from "lucide-react";
import JobDescription from "@/components/JobDescription";
import PublicShell from "@/components/PublicShell";
import { Alert, Button, Card, Field, Input, Skeleton, fadeUp, stagger } from "@/components/ui";
import { api, ApiError, type PublicJob } from "@/lib/api";
import { EMPLOYMENT_LABEL, WORKPLACE_LABEL, timeAgo } from "@/lib/format";

const MAX_MB = 10;
const ACCEPTED = [".pdf", ".docx"];

export default function JobPage() {
  const { slug } = useParams<{ slug: string }>();
  const [job, setJob] = useState<PublicJob | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [submittedAs, setSubmittedAs] = useState<string | null>(null);

  useEffect(() => {
    api.publicJob(slug).then(setJob).catch(() => setNotFound(true));
  }, [slug]);

  if (notFound) {
    return (
      <PublicShell>
        <div className="mx-auto max-w-lg px-4 py-24 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">
            <Briefcase className="h-6 w-6" />
          </div>
          <h1 className="mt-6 text-2xl font-semibold">This job posting isn&apos;t available</h1>
          <p className="mt-2 text-slate-600">The link may be incorrect, or the position has been removed.</p>
        </div>
      </PublicShell>
    );
  }

  return (
    <PublicShell companyName={job?.company_name} companySlug={job?.company_slug}>
      <AnimatePresence mode="wait">
        {submittedAs && job ? (
          <Success key="success" job={job} firstName={submittedAs} />
        ) : (
          <motion.div key="job" exit={{ opacity: 0, y: -8 }} className="mx-auto max-w-6xl px-4 pb-28 pt-10 sm:px-6 sm:pt-14 lg:pb-20">
            {!job ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-12 w-2/3" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : (
              <motion.div variants={stagger(0.06)} initial="hidden" animate="show">
                <motion.div variants={fadeUp}>
                  <Link href={`/careers/${job.company_slug}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    {job.company_name}
                  </Link>
                  <h1 className="mt-2 max-w-3xl text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-[2.6rem] sm:leading-[1.15]">
                    {job.title}
                  </h1>
                  <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                    {job.location && <Meta icon={MapPin}>{job.location}</Meta>}
                    <Meta icon={Globe}>{WORKPLACE_LABEL[job.workplace_type]}</Meta>
                    <Meta icon={Clock}>{EMPLOYMENT_LABEL[job.employment_type]}</Meta>
                    <Meta icon={Calendar}>Posted {timeAgo(job.posted_at)}</Meta>
                  </div>
                </motion.div>

                <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_400px] lg:gap-12">
                  <motion.div variants={fadeUp} className="min-w-0">
                    <JobDescription text={job.description} />
                    {job.must_have_skills.length > 0 && (
                      <SkillList title="What we're looking for" skills={job.must_have_skills} strong />
                    )}
                    {job.nice_to_have_skills.length > 0 && <SkillList title="Nice to have" skills={job.nice_to_have_skills} />}
                  </motion.div>

                  <motion.div variants={fadeUp} id="apply" className="scroll-mt-24">
                    <div className="lg:sticky lg:top-24">
                      {job.is_open ? (
                        <ApplyForm slug={job.slug} onDone={setSubmittedAs} />
                      ) : (
                        <Card className="p-6">
                          <p className="font-semibold text-slate-900">Applications closed</p>
                          <p className="mt-1 text-sm text-slate-600">This position is no longer accepting applications.</p>
                          <Link href={`/careers/${job.company_slug}`} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600">
                            See open positions <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Card>
                      )}
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
            {/* Mobile: the form sits below a long description, so keep a jump-to-apply button in reach */}
            {job?.is_open && (
              <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/90 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
                <a href="#apply" className="flex h-12 w-full items-center justify-center rounded-lg bg-indigo-600 text-[15px] font-medium text-white shadow-sm active:scale-[0.99]">
                  Apply for this role
                </a>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </PublicShell>
  );
}

function Meta({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="h-4 w-4 text-slate-400" />
      {children}
    </span>
  );
}

function SkillList({ title, skills, strong }: { title: string; skills: string[]; strong?: boolean }) {
  return (
    <div className="mt-8">
      <h3 className="mb-3 font-semibold text-slate-900">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {skills.map((s) => (
          <span key={s} className={strong ? "rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white" : "rounded-lg bg-white px-3 py-1.5 text-sm text-slate-700 ring-1 ring-slate-200"}>
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

function ApplyForm({ slug, onDone }: { slug: string; onDone: (firstName: string) => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) return setError("Please attach your CV.");
    setBusy(true);
    try {
      await api.apply(slug, { full_name: fullName, email, linkedin_url: linkedin, file });
      onDone(fullName.trim().split(/\s+/)[0]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-6 shadow-lg shadow-slate-900/[0.04]">
      <h2 className="text-lg font-semibold text-slate-900">Apply for this role</h2>
      <p className="mt-1 text-sm text-slate-500">It only takes a minute.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <Field label="Full name">
          <Input required maxLength={200} autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </Field>
        <Field label="Email">
          <Input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="LinkedIn profile" optional>
          <div className="relative">
            <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input type="url" placeholder="https://linkedin.com/in/…" className="pl-10" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
          </div>
        </Field>
        <Field label="CV / Résumé">
          <DropZone file={file} onFile={(f) => (setError(null), setFile(f))} onError={setError} />
        </Field>
        <AnimatePresence>{error && <Alert>{error}</Alert>}</AnimatePresence>
        <Button type="submit" size="lg" loading={busy} className="w-full">
          {busy ? "Submitting…" : "Submit application"}
        </Button>
      </form>
    </Card>
  );
}

function DropZone({ file, onFile, onError }: { file: File | null; onFile: (f: File | null) => void; onError: (m: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function accept(f: File | undefined) {
    if (!f) return;
    const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
    if (!ACCEPTED.includes(ext)) return onError("Please upload a PDF or Word (.docx) file.");
    if (f.size > MAX_MB * 1024 * 1024) return onError(`File is too large (max ${MAX_MB} MB).`);
    onFile(f);
  }

  if (file) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-3 rounded-xl bg-indigo-50/60 px-4 py-3 ring-1 ring-indigo-100">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-indigo-600 shadow-sm">
          <FileText className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-900">{file.name}</p>
          <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(0)} KB</p>
        </div>
        <button type="button" onClick={() => onFile(null)} className="rounded-md p-1.5 text-slate-400 hover:bg-white hover:text-slate-600" aria-label="Remove file">
          <X className="h-4 w-4" />
        </button>
      </motion.div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
      onDragOver={(e) => (e.preventDefault(), setDragging(true))}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => (e.preventDefault(), setDragging(false), accept(e.dataTransfer.files[0]))}
      className={`flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed px-4 py-7 text-center transition ${
        dragging ? "scale-[1.01] border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
      }`}
    >
      <input ref={inputRef} type="file" accept={ACCEPTED.join(",")} className="hidden" onChange={(e) => accept(e.target.files?.[0])} />
      <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-500">
        <Upload className="h-4.5 w-4.5" />
      </span>
      <p className="mt-3 text-sm font-medium text-slate-800">
        <span className="text-indigo-600">Click to upload</span> or drag and drop
      </p>
      <p className="mt-0.5 text-xs text-slate-500">PDF or DOCX · up to {MAX_MB} MB</p>
    </div>
  );
}

function Success({ job, firstName }: { job: PublicJob; firstName: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-lg px-4 py-24 text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.45, duration: 0.6 }}
        className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/50"
      >
        <svg viewBox="0 0 24 24" className="h-10 w-10 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.25, duration: 0.45, ease: "easeOut" }} />
        </svg>
      </motion.div>
      <h1 className="mt-8 text-3xl font-semibold tracking-tight">Application sent!</h1>
      <p className="mt-3 text-lg text-slate-600">
        Thanks, {firstName}. {job.company_name} has received your application for <span className="font-medium text-slate-900">{job.title}</span>.
      </p>
      <p className="mt-2 text-slate-500">If your profile is a match, the team will contact you by email.</p>
      <Link href={`/careers/${job.company_slug}`} className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-500">
        View other openings at {job.company_name} <ArrowRight className="h-4 w-4" />
      </Link>
    </motion.div>
  );
}
