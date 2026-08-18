"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { TypeBreakdownRow } from "./use-unified-report-data";

/** Share of a type's inspections, as a whole percentage. 0 when the type is empty. */
const share = (part: number, total: number) =>
  total === 0 ? 0 : Math.round((part / total) * 100);

function DelayStat({
  label,
  value,
  total,
  tone,
}: {
  label: string;
  value: number;
  total: number;
  tone: "entry" | "duration";
}) {
  const pct = share(value, total);
  const dot = tone === "entry" ? "bg-red-400" : "bg-amber-400";
  const bar = tone === "entry" ? "bg-red-400" : "bg-amber-400";

  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="flex items-center gap-1.5 text-gray-500 min-w-0">
          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dot)} />
          <span className="truncate">{label}</span>
        </span>
        <span className="shrink-0 tabular-nums">
          <span
            className={cn(
              "font-semibold",
              value > 0 ? "text-gray-800" : "text-gray-300",
            )}
          >
            {value}
          </span>
          <span className="text-gray-400"> · {pct}%</span>
        </span>
      </div>
      {/* Each bar is scaled to this type's own total. The two are drawn
          separately rather than stacked: one inspection can be both late and
          overrun, so a stacked bar would imply a sum that does not exist. */}
      <div className="h-1 rounded-full bg-gray-100 overflow-hidden mt-1">
        <div className={cn("h-full", bar)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function TypeBreakdown({
  rows,
  activeType,
  onSelectType,
}: {
  rows: TypeBreakdownRow[];
  /** Inspection-type *name* currently filtered on, or null for all types. */
  activeType: string | null;
  onSelectType: (name: string | null) => void;
}) {
  const t = useTranslations("UnifiedInspectionReport");

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">{t("byType")}</h2>

      {rows.length === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center">{t("noData")}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {rows.map((row) => {
            const active = activeType === row.name;
            const dimmed = activeType !== null && !active;
            return (
            <button
              key={row.name}
              type="button"
              // Clicking the active card clears the filter rather than re-applying it.
              onClick={() => onSelectType(active ? null : row.name)}
              aria-pressed={active}
              className={cn(
                "text-left rounded-lg border p-3.5 transition-all",
                "hover:border-gray-300 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
                active
                  ? "border-gray-400 bg-white ring-2 ring-gray-300"
                  : "border-gray-200 bg-gray-50/40",
                dimmed && "opacity-55 hover:opacity-100",
              )}
            >
              <h3
                className="text-xs font-semibold text-gray-700 truncate"
                title={row.name}
              >
                {row.name}
              </h3>
              <p className="text-2xl font-bold text-gray-900 tabular-nums leading-none mt-1.5">
                {row.total}
              </p>

              <div className="mt-3 space-y-2">
                <DelayStat
                  label={t("kpiDelayedEntry")}
                  value={row.delayedEntry}
                  total={row.total}
                  tone="entry"
                />
                <DelayStat
                  label={t("kpiDelayedDuration")}
                  value={row.delayedDuration}
                  total={row.total}
                  tone="duration"
                />
              </div>
            </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
