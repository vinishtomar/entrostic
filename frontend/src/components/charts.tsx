"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { Stage, StageCounts } from "@/lib/api";
import { STAGES, STAGE_META } from "@/lib/format";

// One series, one hue (validated: indigo-600 on white passes lightness, chroma and 3:1 contrast).
const SERIES = "#4f46e5";

/** Daily applications as columns (single series → no legend; the card title names it). */
export function DailyColumns({ data }: { data: { date: string; count: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.count));
  const top = niceCeil(max);
  const H = 160;
  const fmtDay = (iso: string, opts: Intl.DateTimeFormatOptions) => new Date(`${iso}T00:00:00`).toLocaleDateString("en", opts);

  return (
    <div>
      <div className="flex gap-3">
        {/* y-axis ticks */}
        <div className="flex flex-col justify-between py-0 text-right text-[11px] tabular-nums text-slate-400" style={{ height: H }}>
          <span>{top}</span>
          <span>{top / 2}</span>
          <span>0</span>
        </div>
        <div className="relative flex-1" style={{ height: H }}>
          {/* recessive hairline grid */}
          {[0, 0.5, 1].map((f) => (
            <div key={f} className="absolute inset-x-0 h-px bg-slate-100" style={{ top: `${f * 100}%` }} />
          ))}
          <div className="absolute inset-0 flex items-end gap-0.5">
            {data.map((d, i) => (
              <div
                key={d.date}
                className="relative flex h-full flex-1 cursor-default items-end justify-center"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              >
                {hover === i && <div className="absolute inset-0 rounded-md bg-slate-50" />}
                <motion.div
                  className="relative w-full max-w-6 rounded-t-[4px]"
                  style={{ backgroundColor: SERIES, opacity: hover === null || hover === i ? 1 : 0.45 }}
                  initial={{ height: 0 }}
                  animate={{ height: d.count ? Math.max(3, (d.count / top) * H) : 0 }}
                  transition={{ delay: i * 0.025, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                />
                <AnimatePresence>
                  {hover === i && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="pointer-events-none absolute z-10 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-lg"
                      style={{ bottom: Math.max(3, (d.count / top) * H) + 8 }}
                    >
                      <span className="text-slate-300">{fmtDay(d.date, { weekday: "short", month: "short", day: "numeric" })}</span>
                      <span className="ml-2 font-semibold">{d.count}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-2 flex justify-between pl-8 text-[11px] text-slate-400">
        <span>{fmtDay(data[0].date, { month: "short", day: "numeric" })}</span>
        <span>Today</span>
      </div>
      {/* Table view for screen readers */}
      <table className="sr-only">
        <caption>Applications per day</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.date}><td>{d.date}</td><td>{d.count}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Applicants per pipeline stage as horizontal bars with the value at the tip. */
export function PipelineBars({ counts }: { counts: StageCounts }) {
  const max = Math.max(1, ...STAGES.map((s) => counts[s]));
  return (
    <div className="space-y-3">
      {STAGES.map((s: Stage, i) => (
        <div key={s} className="flex items-center gap-3">
          <span className="w-20 shrink-0 text-sm text-slate-600">{STAGE_META[s].label}</span>
          <div className="flex flex-1 items-center gap-2">
            <motion.div
              className="h-2.5 rounded-r-[4px]"
              style={{ backgroundColor: SERIES }}
              initial={{ width: 0 }}
              animate={{ width: counts[s] ? `${Math.max(2, (counts[s] / max) * 85)}%` : 0 }}
              transition={{ delay: 0.1 + i * 0.05, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
            <span className="text-sm font-medium tabular-nums text-slate-900">{counts[s]}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function niceCeil(n: number): number {
  if (n <= 4) return 4;
  const step = Math.pow(10, Math.floor(Math.log10(n)));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * step >= n) return m * step;
  return 10 * step;
}
