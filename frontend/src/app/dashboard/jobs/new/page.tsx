"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import JobForm from "@/components/JobForm";
import { useToast } from "@/components/ui";
import { api } from "@/lib/api";

export default function NewJobPage() {
  const router = useRouter();
  const toast = useToast();
  return (
    <>
      <Link href="/dashboard/jobs" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Jobs
      </Link>
      <PageHeader title="New job" description="It goes live as soon as you publish — you'll get a link to share." />
      <JobForm
        submitLabel="Publish job"
        onSubmit={async (v) => {
          const job = await api.createJob(v);
          toast("Job published");
          router.push(`/dashboard/jobs/${job.id}`);
        }}
      />
    </>
  );
}
