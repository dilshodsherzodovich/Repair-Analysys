"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/formatDate";
import type { Inspection } from "@/api/types/report-inspection";
import { SectionShell } from "./section-shell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";

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
        <Table wrapper={false} className="w-full text-xs border-collapse">
          <TableHeader>
            <TableRow className="bg-surface-muted text-2xs font-semibold text-muted-foreground uppercase tracking-wide">
              <TableHead className="border px-2 py-1.5 text-center w-10">
                {globalT("no")}
              </TableHead>
              <TableHead className="border px-2 py-1.5 text-left">{t("locomotive")}</TableHead>
              <TableHead className="border px-2 py-1.5 text-left">{t("branch")}</TableHead>
              <TableHead className="border px-2 py-1.5 text-center">
                {t("inspectionType")}
              </TableHead>
              <TableHead className="border px-2 py-1.5 text-center">{t("entryTime")}</TableHead>
              <TableHead className="border px-2 py-1.5 text-center">{t("closeTime")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow
                key={row.id}
                className={cn("hover:bg-surface-muted", i % 2 === 1 && "bg-surface-muted/40")}
              >
                <TableCell className="border px-2 py-1 text-center text-foreground-subtle">
                  {i + 1}
                </TableCell>
                <TableCell className="border px-2 py-1 font-medium whitespace-nowrap">
                  {[row.locomotive?.name, row.locomotive?.locomotive_model?.name]
                    .filter(Boolean)
                    .join(" ")}
                </TableCell>
                <TableCell className="border px-2 py-1 whitespace-nowrap">
                  {row.branch?.name}
                </TableCell>
                <TableCell className="border px-2 py-1 text-center">
                  {row.inspection_type?.name}
                </TableCell>
                <TableCell className="border px-2 py-1 text-center whitespace-nowrap">
                  {formatDate(row.created_time)}
                </TableCell>
                <TableCell className="border px-2 py-1 text-center whitespace-nowrap">
                  {row.is_closed_time ? formatDate(row.is_closed_time) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </SectionShell>
  );
}
