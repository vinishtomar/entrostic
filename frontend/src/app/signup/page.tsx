"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { Clock } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { Alert, Button, ButtonLink, Field, Input } from "@/components/ui";
import { api, ApiError } from "@/lib/api";

export default function SignupPage() {
  const [form, setForm] = useState({ company_name: "", website: "", full_name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.signup(form);
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <AuthLayout title="Request received" subtitle="Thanks for your interest in Entrostic.">
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl bg-indigo-50/60 p-6 ring-1 ring-indigo-100">
          <Clock className="h-6 w-6 text-indigo-600" />
          <p className="mt-3 font-medium text-slate-900">We&apos;re reviewing {form.company_name}</p>
          <p className="mt-1 text-sm text-slate-600">
            Once approved, you can sign in with <span className="font-medium text-slate-800">{form.email}</span>.
          </p>
        </motion.div>
        <ButtonLink href="/login" variant="secondary" className="mt-6 w-full">Go to sign in</ButtonLink>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Request access"
      subtitle={<>Already approved? <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">Sign in</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company name"><Input required minLength={2} value={form.company_name} onChange={set("company_name")} /></Field>
          <Field label="Website" optional><Input type="url" placeholder="https://" value={form.website} onChange={set("website")} /></Field>
        </div>
        <Field label="Your name"><Input required autoComplete="name" value={form.full_name} onChange={set("full_name")} /></Field>
        <Field label="Work email"><Input required type="email" autoComplete="email" value={form.email} onChange={set("email")} /></Field>
        <Field label="Password" hint="At least 10 characters.">
          <Input required type="password" minLength={10} autoComplete="new-password" value={form.password} onChange={set("password")} />
        </Field>
        <AnimatePresence>{error && <Alert>{error}</Alert>}</AnimatePresence>
        <Button type="submit" size="lg" loading={busy} className="w-full">Request access</Button>
        <p className="text-center text-xs text-slate-500">Every company is reviewed before getting access.</p>
      </form>
    </AuthLayout>
  );
}
