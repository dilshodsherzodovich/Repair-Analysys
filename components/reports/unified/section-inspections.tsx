"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/formatDate";
import type { Inspection } from "@/api/types/report-inspection";
import { SectionShell } from "./section-shell";

export function SectionInspections({
  rows,
  isLoading,
}: {
  rows: Inspection[];
  isLoading: boolean;
}) {
  const t = useTranslations("UnifiedInspectionReport");
  const globalT = useTranslations();

  return (
    <SectionShell
      index={1}
      title={t("sectionInspections")}
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
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.id}
                className={cn("hover:bg-gray-50", i % 2 === 1 && "bg-gray-50/40")}
              >
                <td className="border px-2 py-1 text-center text-gray-400">
                  {i + 1}
                </td>
                <td className="border px-2 py-1 font-medium whitespace-nowrap">
                  {[row.locomotive?.name, row.locomotive?.locomotive_model?.name]
                    .filter(Boolean)
                    .join(" ")}
                </td>
                <td className="border px-2 py-1 whitespace-nowrap">
                  {row.branch?.name}
                </td>
                <td className="border px-2 py-1 text-center">
                  {row.inspection_type?.name}
                </td>
                <td className="border px-2 py-1 text-center whitespace-nowrap">
                  {formatDate(row.created_time)}
                </td>
                <td className="border px-2 py-1 text-center whitespace-nowrap">
                  {row.is_closed_time ? formatDate(row.is_closed_time) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionShell>
  );
}
