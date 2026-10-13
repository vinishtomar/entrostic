"use client";

import { AnimatePresence } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthLayout from "@/components/AuthLayout";
import { Alert, Button, Field, Input } from "@/components/ui";
import { api, ApiError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const user = await api.login(email, password);
      router.push(user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sign-in failed.");
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle={<>New here? <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">Request access for your company</Link></>}
    >
      <form onSubmit={submit} className="space-y-5">
        <Field label="Work email">
          <Input type="email" required autoComplete="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password">
          <Input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <AnimatePresence>{error && <Alert>{error}</Alert>}</AnimatePresence>
        <Button type="submit" size="lg" loading={busy} className="w-full">Sign in</Button>
      </form>
    </AuthLayout>
  );
}
