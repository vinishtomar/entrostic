"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpRight, Briefcase, Globe, MapPin } from "lucide-react";
import PublicShell from "@/components/PublicShell";
import { Card, EmptyState, Skeleton, fadeUp, stagger } from "@/components/ui";
import { api, type PublicCompany } from "@/lib/api";
import { EMPLOYMENT_LABEL, WORKPLACE_LABEL, timeAgo } from "@/lib/format";

export default function CareersPage() {
  const { slug } = useParams<{ slug: string }>();
  const [company, setCompany] = useState<PublicCompany | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.publicCompany(slug).then(setCompany).catch(() => setNotFound(true));
  }, [slug]);

  if (notFound) {
    return (
      <PublicShell>
        <EmptyState icon={Briefcase} title="Company not found">This careers page doesn&apos;t exist.</EmptyState>
      </PublicShell>
    );
  }

  return (
    <PublicShell companyName={company?.name} companySlug={company?.slug}>
      <section className="bg-grid border-b border-slate-200/70">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20">
          {company ? (
            <motion.div variants={stagger()} initial="hidden" animate="show">
              <motion.p variants={fadeUp} className="text-sm font-medium text-indigo-600">Careers</motion.p>
              <motion.h1 variants={fadeUp} className="mt-2 text-balance text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                Join {company.name}
              </motion.h1>
              <motion.p variants={fadeUp} className="mt-4 text-lg text-slate-600">
                {company.jobs.length === 1 ? "1 open position" : `${company.jobs.length} open positions`}
                {company.website && (
                  <>
                    {" · "}
                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                      {company.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                    </a>
                  </>
                )}
              </motion.p>
            </motion.div>
          ) : (
            <Skeleton className="mx-auto h-12 w-80" />
          )}
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        {company && company.jobs.length === 0 && (
          <Card>
            <EmptyState icon={Briefcase} title="No open positions right now">Check back soon.</EmptyState>
          </Card>
        )}
        <motion.div variants={stagger(0.06)} initial="hidden" animate="show" className="space-y-3">
          {company?.jobs.map((j) => (
            <motion.div key={j.slug} variants={fadeUp}>
              <Link href={`/j/${j.slug}`} className="group block">
                <Card className="flex items-center gap-4 p-5 transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-lg group-hover:shadow-slate-900/5">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900 group-hover:text-indigo-600">{j.title}</p>
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                      {j.location && (
                        <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{j.location}</span>
                      )}
                      <span className="inline-flex items-center gap-1"><Globe className="h-3.5 w-3.5" />{WORKPLACE_LABEL[j.workplace_type]}</span>
                      <span>{EMPLOYMENT_LABEL[j.employment_type]}</span>
                      <span className="text-slate-400">{timeAgo(j.posted_at)}</span>
                    </div>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-indigo-600" />
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </PublicShell>
  );
}
