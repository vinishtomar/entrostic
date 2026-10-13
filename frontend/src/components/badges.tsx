import { Loader2, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui";
import type { AnalysisStatus, Stage } from "@/lib/api";
import { STAGE_META } from "@/lib/format";

export function StageBadge({ stage }: { stage: Stage }) {
  const m = STAGE_META[stage];
  return (
    <Badge className={m.badge}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </Badge>
  );
}

/** Only rendered when the CV isn't processed yet; a processed CV needs no badge. */
export function ProcessingBadge({ status }: { status: AnalysisStatus }) {
  if (status === "processed") return null;
  return status === "pending" ? (
    <Badge className="bg-slate-50 text-slate-600 ring-slate-500/15">
      <Loader2 className="h-3 w-3 animate-spin" /> Reading CV
    </Badge>
  ) : (
    <Badge className="bg-red-50 text-red-700 ring-red-600/15">
      <TriangleAlert className="h-3 w-3" /> CV unreadable
    </Badge>
  );
}
