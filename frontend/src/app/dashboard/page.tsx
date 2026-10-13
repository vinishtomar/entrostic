"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Briefcase, CalendarCheck, Inbox, Plus, Users } from "lucide-react";
import { PageHeader, useSession } from "@/components/AppShell";
import { ProcessingBadge, StageBadge } from "@/components/badges";
import { DailyColumns, PipelineBars } from "@/components/charts";
import { Avatar, ButtonLink, Card, CountUp, EmptyState, Skeleton, fadeUp, stagger } from "@/components/ui";
import { api, type DashboardSummary } from "@/lib/api";
import { timeAgo } from "@/lib/format";

export default function Overview() {
  const user = useSession();
  const [data, setData] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    const load = () => api.dashboard().then(setData).catch(() => {});
    load();
    const t = setInterval(load, 15_000);
    return () => clearInterval(t);
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <>
      <PageHeader
        title={`${greeting}, ${user.full_name.split(" ")[0]}`}
        description="Here's what's happening with your hiring."
        actions={<ButtonLink href="/dashboard/jobs/new"><Plus className="h-4 w-4" /> New job</ButtonLink>}
      />

      {!data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <motion.div variants={stagger(0.06)} initial="hidden" animate="show" className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatTile icon={Briefcase} label="Open jobs" value={data.open_jobs} sub={`${data.total_jobs} total`} />
            <StatTile icon={Users} label="Total applicants" value={data.total_applications} sub="across all jobs" />
            <StatTile icon={Inbox} label="New this week" value={data.new_this_week} sub="last 7 days" />
            <StatTile icon={CalendarCheck} label="In interview" value={data.stage_counts.interview} sub={`${data.stage_counts.offer} at offer stage`} />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <motion.div variants={fadeUp}>
              <Card className="h-full p-6">
                <h2 className="font-semibold text-slate-900">Applications</h2>
                <p className="mb-6 text-sm text-slate-500">Last 14 days</p>
                <DailyColumns data={data.daily_applications} />
              </Card>
            </motion.div>
            <motion.div variants={fadeUp}>
              <Card className="h-full p-6">
                <h2 className="font-semibold text-slate-900">Pipeline</h2>
                <p className="mb-6 text-sm text-slate-500">Applicants by stage</p>
                <PipelineBars counts={data.stage_counts} />
              </Card>
            </motion.div>
          </div>

          <motion.div variants={fadeUp}>
            <Card>
              <div className="flex items-center justify-between px-6 pb-2 pt-5">
                <h2 className="font-semibold text-slate-900">Recent applicants</h2>
                <Link href="/dashboard/candidates" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500">
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              {data.recent_applications.length === 0 ? (
                <EmptyState icon={Inbox} title="No applicants yet">
                  Share a job link to start receiving applications.
                </EmptyState>
              ) : (
                <ul className="divide-y divide-slate-100 px-2 pb-2">
                  {data.recent_applications.map((a) => (
                    <li key={a.id}>
                      <Link href={`/dashboard/candidates/${a.id}`} className="flex items-center gap-4 rounded-xl px-4 py-3 transition hover:bg-slate-50">
                        <Avatar name={a.full_name} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-slate-900">{a.full_name}</p>
                          <p className="truncate text-sm text-slate-500">{a.headline ?? a.email} · <span className="text-slate-400">{a.job.title}</span></p>
                        </div>
                        <ProcessingBadge status={a.analysis_status} />
                        <StageBadge stage={a.stage} />
                        <span className="hidden w-16 text-right text-xs text-slate-400 sm:block">{timeAgo(a.created_at)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}

function StatTile({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: number; sub: string }) {
  return (
    <motion.div variants={fadeUp} whileHover={{ y: -2 }} transition={{ type: "spring", bounce: 0.3 }}>
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">{label}</p>
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
            <Icon className="h-4 w-4" />
          </span>
        </div>
        <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900"><CountUp value={value} /></p>
        <p className="mt-1 text-xs text-slate-400">{sub}</p>
      </Card>
    </motion.div>
  );
}
