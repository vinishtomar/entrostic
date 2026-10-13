"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/AppShell";
import ApplicantTable from "@/components/ApplicantTable";
import { Card, Skeleton } from "@/components/ui";
import { api, type ApplicationSummary } from "@/lib/api";

export default function CandidatesPage() {
  const [apps, setApps] = useState<ApplicationSummary[] | null>(null);

  useEffect(() => {
    const load = () => api.applications().then(setApps).catch(() => setApps([]));
    load();
    const t = setInterval(load, 10_000);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <PageHeader title="Candidates" description="Everyone who has applied to any of your jobs." />
      <Card className="overflow-hidden">{apps ? <ApplicantTable apps={apps} showJob /> : <Skeleton className="m-4 h-40" />}</Card>
    </>
  );
}
