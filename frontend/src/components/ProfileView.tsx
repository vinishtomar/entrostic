"use client";

import { motion } from "motion/react";
import { Award, GraduationCap, Languages, MapPin } from "lucide-react";
import { Card, fadeUp, stagger } from "@/components/ui";
import type { CandidateProfile } from "@/lib/api";
import { formatPeriod } from "@/lib/format";

export default function ProfileView({ profile }: { profile: CandidateProfile }) {
  return (
    <motion.div variants={stagger(0.06)} initial="hidden" animate="show" className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="min-w-0 space-y-6">
        <motion.div variants={fadeUp}>
          <Card className="p-6">
            <p className="text-lg font-semibold text-slate-900">{profile.headline}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
              <span className="rounded-full bg-indigo-50 px-2.5 py-1 capitalize text-indigo-700">{profile.seniority}</span>
              {profile.total_years_experience != null && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">{profile.total_years_experience} years experience</span>
              )}
              {profile.location && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
                  <MapPin className="h-3 w-3" />{profile.location}
                </span>
              )}
            </div>
            <p className="mt-4 leading-7 text-slate-700">{profile.summary}</p>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="p-6">
            <h3 className="mb-5 text-sm font-semibold text-slate-900">Experience</h3>
            {profile.experience.length === 0 ? <Muted /> : (
              <ol className="relative space-y-7 border-l border-slate-200 pl-6">
                {profile.experience.map((e, i) => (
                  <li key={i} className="relative">
                    <span className={`absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full ring-4 ring-white ${e.end ? "bg-slate-300" : "bg-indigo-500"}`} />
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                      <p className="font-medium text-slate-900">{e.title}</p>
                      <p className="text-xs tabular-nums text-slate-500">{formatPeriod(e.start, e.end)}</p>
                    </div>
                    <p className="text-sm text-slate-500">{e.company}</p>
                    {e.highlights.length > 0 && (
                      <ul className="mt-2.5 space-y-1.5 text-sm text-slate-600">
                        {e.highlights.map((h, j) => (
                          <li key={j} className="flex gap-2.5"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-400" />{h}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </motion.div>
      </div>

      <div className="space-y-6">
        <motion.div variants={fadeUp}>
          <Card className="p-6">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">Skills</h3>
            {profile.skills.length === 0 ? <Muted /> : (
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map((s) => <span key={s} className="rounded-md bg-indigo-50 px-2 py-1 text-[13px] text-indigo-700">{s}</span>)}
              </div>
            )}
            {profile.soft_skills.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {profile.soft_skills.map((s) => <span key={s} className="rounded-md bg-slate-100 px-2 py-1 text-[13px] text-slate-600">{s}</span>)}
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="divide-y divide-slate-100">
            <SideSection icon={GraduationCap} title="Education">
              {profile.education.length === 0 ? <Muted /> : profile.education.map((ed, i) => (
                <div key={i} className="text-sm">
                  <p className="font-medium text-slate-800">{[ed.degree, ed.field_of_study].filter(Boolean).join(", ") || "Studies"}</p>
                  <p className="text-slate-500">{ed.institution}{ed.graduation_year ? ` · ${ed.graduation_year}` : ""}</p>
                </div>
              ))}
            </SideSection>
            <SideSection icon={Languages} title="Languages">
              {profile.languages.length === 0 ? <Muted /> : <p className="text-sm text-slate-700">{profile.languages.join(" · ")}</p>}
            </SideSection>
            <SideSection icon={Award} title="Certifications">
              {profile.certifications.length === 0 ? <Muted /> : profile.certifications.map((c) => <p key={c} className="text-sm text-slate-700">{c}</p>)}
            </SideSection>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

function SideSection({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="p-5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900"><Icon className="h-4 w-4 text-slate-400" />{title}</h3>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function Muted() {
  return <p className="text-sm text-slate-400">Not listed</p>;
}
