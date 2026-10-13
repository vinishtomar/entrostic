"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Check, Copy, ExternalLink, Share2 } from "lucide-react";
import { Button, Card, useToast } from "@/components/ui";
import { jobUrl, linkedInShareUrl } from "@/lib/format";

export function CopyLinkButton({ slug, size = "sm" }: { slug: string; size?: "sm" | "md" }) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  async function copy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    await navigator.clipboard.writeText(jobUrl(slug));
    setCopied(true);
    toast("Job link copied");
    setTimeout(() => setCopied(false), 1800);
  }
  return (
    <Button variant="secondary" size={size} onClick={copy}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={String(copied)} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }}>
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
        </motion.span>
      </AnimatePresence>
      {copied ? "Copied" : "Copy link"}
    </Button>
  );
}

export default function SharePanel({ slug, isOpen }: { slug: string; isOpen: boolean }) {
  const url = jobUrl(slug);
  return (
    <Card className="overflow-hidden">
      <div className="flex items-start gap-3 p-5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
          <Share2 className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-slate-900">Share this job</p>
          <p className="text-sm text-slate-500">
            {isOpen ? "Post this link on LinkedIn, job boards or your website." : "This job is closed — the link shows that applications are closed."}
          </p>
          <div className="mt-3 truncate rounded-lg bg-slate-50 px-3 py-2 font-mono text-[13px] text-slate-700 ring-1 ring-inset ring-slate-200">{url}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <CopyLinkButton slug={slug} />
            <a href={linkedInShareUrl(url)} target="_blank" rel="noopener noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#0a66c2] px-3 text-[13px] font-medium text-white shadow-sm transition hover:bg-[#0958a8] active:scale-[0.98]">
              Share on LinkedIn
            </a>
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium text-slate-600 transition hover:bg-slate-100">
              <ExternalLink className="h-4 w-4" /> Preview
            </a>
          </div>
        </div>
      </div>
    </Card>
  );
}
