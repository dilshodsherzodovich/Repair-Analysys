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
      <Table bordered density="compact">
        <TableHeader>
          <TableRow>
            <TableHead className="text-center w-10">
              {globalT("no")}
            </TableHead>
            <TableHead className="text-left">{t("locomotive")}</TableHead>
            <TableHead className="text-left">{t("branch")}</TableHead>
            <TableHead className="text-center">
              {t("inspectionType")}
            </TableHead>
            <TableHead className="text-center">{t("entryTime")}</TableHead>
            <TableHead className="text-center">{t("closeTime")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow
              key={row.id}
              className={cn("", i % 2 === 1 && "")}
            >
              <TableCell className="text-center text-foreground-subtle">
                {i + 1}
              </TableCell>
              <TableCell className="font-medium whitespace-nowrap">
                {[row.locomotive?.name, row.locomotive?.locomotive_model?.name]
                  .filter(Boolean)
                  .join(" ")}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {row.branch?.name}
              </TableCell>
              <TableCell className="text-center">
                {row.inspection_type?.name}
              </TableCell>
              <TableCell className="text-center whitespace-nowrap">
                {formatDate(row.created_time)}
              </TableCell>
              <TableCell className="text-center whitespace-nowrap">
                {row.is_closed_time ? formatDate(row.is_closed_time) : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionShell>
  );
}
