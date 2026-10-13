"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Building2, Check, Globe, Mail, X } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { Badge, Button, Card, EmptyState, Skeleton, cn, useToast } from "@/components/ui";
import { api, type AdminCompany, type CompanyStatus } from "@/lib/api";
import { timeAgo } from "@/lib/format";

const STATUS_BADGE: Record<CompanyStatus, string> = {
  pending: "bg-amber-50 text-amber-800 ring-amber-600/20",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  rejected: "bg-slate-100 text-slate-600 ring-slate-500/15",
};

export default function AdminCompanies() {
  const toast = useToast();
  const [companies, setCompanies] = useState<AdminCompany[] | null>(null);
  const [tab, setTab] = useState<CompanyStatus>("pending");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    api.adminCompanies().then(setCompanies).catch(() => setCompanies([]));
  }, []);

  async function review(c: AdminCompany, action: "approve" | "reject") {
    setBusy(c.id + action);
    try {
      const updated = action === "approve" ? await api.approveCompany(c.id) : await api.rejectCompany(c.id);
      setCompanies((list) => list!.map((x) => (x.id === c.id ? updated : x)));
      toast(action === "approve" ? `${c.name} approved` : `${c.name} rejected`);
    } catch {
      toast("Action failed", "error");
    } finally {
      setBusy(null);
    }
  }

  const visible = (companies ?? []).filter((c) => c.status === tab);
  const count = (s: CompanyStatus) => (companies ?? []).filter((c) => c.status === s).length;

  return (
    <>
      <PageHeader title="Companies" description="Review access requests. Approved companies can sign in and post jobs." />

      <div className="mb-5 inline-flex rounded-lg bg-slate-100 p-1">
        {(["pending", "approved", "rejected"] as CompanyStatus[]).map((s) => (
          <button key={s} onClick={() => setTab(s)} className={cn("relative rounded-md px-3.5 py-1.5 text-sm font-medium capitalize transition", tab === s ? "text-slate-900" : "text-slate-500 hover:text-slate-700")}>
            {tab === s && <motion.span layoutId="admin-tab" className="absolute inset-0 rounded-md bg-white shadow-sm" transition={{ type: "spring", bounce: 0.2, duration: 0.35 }} />}
            <span className="relative">
              {s}
              {s === "pending" && count("pending") > 0 ? (
                <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[11px] text-white">{count("pending")}</span>
              ) : (
                <span className="ml-1 text-slate-400">{companies ? count(s) : ""}</span>
              )}
            </span>
          </button>
        ))}
      </div>

      {!companies ? (
        <Skeleton className="h-40" />
      ) : visible.length === 0 ? (
        <Card><EmptyState icon={Building2} title={tab === "pending" ? "No pending requests" : `No ${tab} companies`}>{tab === "pending" && "You're all caught up."}</EmptyState></Card>
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-slate-100">
            <AnimatePresence initial={false}>
              {visible.map((c) => (
                <motion.li key={c.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: 30, transition: { duration: 0.2 } }}
                  className="flex flex-wrap items-center gap-4 px-5 py-4">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-slate-900 font-semibold text-white">{c.name[0]}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900">{c.name}</p>
                      <Badge className={STATUS_BADGE[c.status]}>{c.status}</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                      {c.contact_name && <span>{c.contact_name}</span>}
                      {c.contact_email && <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{c.contact_email}</span>}
                      {c.website && (
                        <a href={c.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-indigo-600">
                          <Globe className="h-3.5 w-3.5" />{c.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                        </a>
                      )}
                      <span className="text-slate-400">Requested {timeAgo(c.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {c.status !== "rejected" && (
                      <Button variant="secondary" size="sm" loading={busy === c.id + "reject"} onClick={() => review(c, "reject")}>
                        <X className="h-4 w-4" /> {c.status === "approved" ? "Revoke" : "Reject"}
                      </Button>
                    )}
                    {c.status !== "approved" && (
                      <Button size="sm" loading={busy === c.id + "approve"} onClick={() => review(c, "approve")}>
                        <Check className="h-4 w-4" /> Approve
                      </Button>
                    )}
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </Card>
      )}
    </>
  );
}
