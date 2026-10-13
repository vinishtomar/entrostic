"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { X } from "lucide-react";
import { Alert, Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import type { EmploymentType, JobInput, WorkplaceType } from "@/lib/api";
import { EMPLOYMENT_LABEL, WORKPLACE_LABEL } from "@/lib/format";

const EMPTY: JobInput = {
  title: "",
  location: "",
  workplace_type: "onsite",
  employment_type: "full_time",
  description: "",
  must_have_skills: [],
  nice_to_have_skills: [],
};

export default function JobForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: JobInput;
  submitLabel: string;
  onSubmit: (v: JobInput) => Promise<void>;
}) {
  const [v, setV] = useState<JobInput>(() => {
    if (!initial) return EMPTY;
    const { title, location, workplace_type, employment_type, description, must_have_skills, nice_to_have_skills } = initial;
    return { title, location, workplace_type, employment_type, description, must_have_skills, nice_to_have_skills };
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await onSubmit({ ...v, location: v.location?.trim() || null });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the job.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <Card className="divide-y divide-slate-100">
        <Section title="Basics" description="What candidates see first.">
          <Field label="Job title">
            <Input required minLength={2} maxLength={200} placeholder="e.g. Senior Backend Engineer" value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Location" optional>
              <Input placeholder="e.g. Berlin, Germany" value={v.location ?? ""} onChange={(e) => setV({ ...v, location: e.target.value })} />
            </Field>
            <Field label="Workplace">
              <Select value={v.workplace_type} onChange={(e) => setV({ ...v, workplace_type: e.target.value as WorkplaceType })}>
                {Object.entries(WORKPLACE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </Select>
            </Field>
            <Field label="Employment type">
              <Select value={v.employment_type} onChange={(e) => setV({ ...v, employment_type: e.target.value as EmploymentType })}>
                {Object.entries(EMPLOYMENT_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </Select>
            </Field>
          </div>
        </Section>

        <Section title="Description" description="Blank lines start a new paragraph; lines starting with “- ” become bullet points.">
          <Textarea
            required
            minLength={20}
            rows={12}
            placeholder={"About the role…\n\nWhat you'll do\n- …\n- …\n\nWhat we offer\n- …"}
            value={v.description}
            onChange={(e) => setV({ ...v, description: e.target.value })}
          />
        </Section>

        <Section title="Skills" description="Used to evaluate and compare applicants. Press Enter or comma to add.">
          <Field label="Must-have"><SkillInput value={v.must_have_skills} onChange={(s) => setV({ ...v, must_have_skills: s })} /></Field>
          <Field label="Nice-to-have" optional><SkillInput value={v.nice_to_have_skills} onChange={(s) => setV({ ...v, nice_to_have_skills: s })} /></Field>
        </Section>
      </Card>

      <div className="mt-5 space-y-4">
        <AnimatePresence>{error && <Alert>{error}</Alert>}</AnimatePresence>
        <div className="flex justify-end">
          <Button type="submit" size="lg" loading={busy}>{submitLabel}</Button>
        </div>
      </div>
    </form>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-6 p-6 md:grid-cols-[220px_1fr]">
      <div>
        <h3 className="font-medium text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function SkillInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const add = (raw: string) => {
    const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
    const next = [...value];
    for (const p of parts) if (!next.some((x) => x.toLowerCase() === p.toLowerCase())) next.push(p);
    onChange(next);
    setDraft("");
  };
  return (
    <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-lg bg-white px-2 py-1.5 shadow-sm ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-indigo-500">
      <AnimatePresence initial={false}>
        {value.map((s) => (
          <motion.span
            key={s}
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="inline-flex items-center gap-1 rounded-md bg-indigo-50 py-1 pl-2.5 pr-1 text-sm text-indigo-700"
          >
            {s}
            <button type="button" onClick={() => onChange(value.filter((x) => x !== s))} className="rounded p-0.5 hover:bg-indigo-100" aria-label={`Remove ${s}`}>
              <X className="h-3 w-3" />
            </button>
          </motion.span>
        ))}
      </AnimatePresence>
      <input
        value={draft}
        onChange={(e) => (e.target.value.endsWith(",") ? add(e.target.value) : setDraft(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (draft.trim()) add(draft);
          } else if (e.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={() => draft.trim() && add(draft)}
        placeholder={value.length ? "" : "e.g. Python, PostgreSQL"}
        className="min-w-[8rem] flex-1 bg-transparent px-1.5 py-1 text-[15px] outline-none placeholder:text-slate-400"
      />
    </div>
  );
}
