"use client";

import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { DelayedRepairDurationRow } from "@/api/types/delayed-repair-duration-report";
import { SectionShell } from "./section-shell";

/** Times arrive as "yyyy-MM-dd HH:mm", ISO, or null. */
export function fmtTime(value: string | null): string {
  if (!value) return "—";
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? value : format(d, "dd.MM HH:mm");
}

/** Overrun = spent − norm. Null if either side is missing. */
export function overrun(row: DelayedRepairDurationRow): number | null {
  if (row.delayed_hours == null || row.interval_hours == null) return null;
  return row.delayed_hours - row.interval_hours;
}

export const fmtNum = (v: number | null) => (v == null ? "—" : v.toLocaleString());

export function SectionDelayedDuration({
  rows,
  isLoading,
}: {
  rows: DelayedRepairDurationRow[];
  isLoading: boolean;
}) {
  const t = useTranslations("UnifiedInspectionReport");
  const tReason = useTranslations("Inspects.detail.delayReason");
  const globalT = useTranslations();

  // delay_reason_code is one of the known DelayReason codes; fall back to the
  // raw value if the backend ever sends something else.
  const delayLabel = (code: string | null) => {
    if (!code) return "—";
    try {
      return tReason(code as never);
    } catch {
      return code;
    }
  };

  return (
    <SectionShell
      index={2}
      title={t("sectionDelayedDuration")}
      count={isLoading ? null : rows.length}
      isLoading={isLoading}
      isEmpty={rows.length === 0}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
              <th className="border px-2 py-1.5 text-center w-10">
                {globalT("no")}
              </th>
              <th className="border px-2 py-1.5 text-left">{t("locomotive")}</th>
              <th className="border px-2 py-1.5 text-left">{t("branch")}</th>
              <th className="border px-2 py-1.5 text-center">
                {t("inspectionType")}
              </th>
              <th className="border px-2 py-1.5 text-center">{t("entryTime")}</th>
              <th className="border px-2 py-1.5 text-center">{t("closeTime")}</th>
              <th className="border px-2 py-1.5 text-center">{t("normHours")}</th>
              <th className="border px-2 py-1.5 text-center">{t("spentHours")}</th>
              <th className="border px-2 py-1.5 text-center">
                {t("overrunHours")}
              </th>
              <th className="border px-2 py-1.5 text-left">{t("delayReason")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.id ?? i}
                className={cn("hover:bg-gray-50", i % 2 === 1 && "bg-gray-50/40")}
              >
                <td className="border px-2 py-1 text-center text-gray-400">
                  {i + 1}
                </td>
                <td className="border px-2 py-1 font-medium whitespace-nowrap">
                  {[row.locomotive_name, row.locomotive_model_name]
                    .filter(Boolean)
                    .join(" ")}
                </td>
                <td className="border px-2 py-1 whitespace-nowrap">
                  {row.branch_name}
                </td>
                <td className="border px-2 py-1 text-center">
                  {row.inspection_type_name}
                </td>
                <td className="border px-2 py-1 text-center whitespace-nowrap">
                  {fmtTime(row.entry_time)}
                </td>
                <td className="border px-2 py-1 text-center whitespace-nowrap">
                  {fmtTime(row.close_time)}
                </td>
                <td className="border px-2 py-1 text-center text-gray-500 tabular-nums">
                  {fmtNum(row.interval_hours)}
                </td>
                <td className="border px-2 py-1 text-center tabular-nums">
                  {fmtNum(row.delayed_hours)}
                </td>
                <td className="border px-2 py-1 text-center font-semibold text-red-600 tabular-nums">
                  {fmtNum(overrun(row))}
                </td>
                <td className="border px-2 py-1">
                  {row.delay_reason_code ? (
                    <>
                      <span className="font-medium">
                        {delayLabel(row.delay_reason_code)}
                      </span>
                      {row.delay_reason_details && (
                        <span className="block text-[10px] text-gray-400 mt-0.5">
                          {row.delay_reason_details}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionShell>
  );
}
