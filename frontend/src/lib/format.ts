import type { EmploymentType, Stage, WorkplaceType } from "./api";

export const WORKPLACE_LABEL: Record<WorkplaceType, string> = { onsite: "On-site", hybrid: "Hybrid", remote: "Remote" };

export const EMPLOYMENT_LABEL: Record<EmploymentType, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
};

export const STAGES: Stage[] = ["new", "screening", "interview", "offer", "hired", "rejected"];

export const STAGE_META: Record<Stage, { label: string; badge: string; dot: string }> = {
  new: { label: "New", badge: "bg-sky-50 text-sky-700 ring-sky-600/15", dot: "bg-sky-500" },
  screening: { label: "Screening", badge: "bg-violet-50 text-violet-700 ring-violet-600/15", dot: "bg-violet-500" },
  interview: { label: "Interview", badge: "bg-amber-50 text-amber-800 ring-amber-600/20", dot: "bg-amber-500" },
  offer: { label: "Offer", badge: "bg-indigo-50 text-indigo-700 ring-indigo-600/15", dot: "bg-indigo-500" },
  hired: { label: "Hired", badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", dot: "bg-emerald-500" },
  rejected: { label: "Rejected", badge: "bg-slate-100 text-slate-600 ring-slate-500/15", dot: "bg-slate-400" },
};

export function timeAgo(iso: string): string {
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" });
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function jobUrl(slug: string): string {
  return `${typeof window === "undefined" ? "" : window.location.origin}/j/${slug}`;
}

export function linkedInShareUrl(url: string): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
}

export function formatPeriod(start: string | null, end: string | null): string {
  const fmt = (s: string) => {
    const [y, m] = s.split("-");
    return m ? new Date(Number(y), Number(m) - 1).toLocaleString("en", { month: "short", year: "numeric" }) : y;
  };
  return `${start ? fmt(start) : "?"} – ${end ? fmt(end) : "Present"}`;
}
