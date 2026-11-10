"use client";

import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { DelayedRepairDurationRow } from "@/api/types/delayed-repair-duration-report";
import { SectionShell } from "./section-shell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";

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
            <TableHead className="text-center">{t("normHours")}</TableHead>
            <TableHead className="text-center">{t("spentHours")}</TableHead>
            <TableHead className="text-center">
              {t("overrunHours")}
            </TableHead>
            <TableHead className="text-left">{t("delayReason")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow
              key={row.id ?? i}
              className={cn("", i % 2 === 1 && "")}
            >
              <TableCell className="text-center text-foreground-subtle">
                {i + 1}
              </TableCell>
              <TableCell className="font-medium whitespace-nowrap">
                {[row.locomotive_name, row.locomotive_model_name]
                  .filter(Boolean)
                  .join(" ")}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {row.branch_name}
              </TableCell>
              <TableCell className="text-center">
                {row.inspection_type_name}
              </TableCell>
              <TableCell className="text-center whitespace-nowrap">
                {fmtTime(row.entry_time)}
              </TableCell>
              <TableCell className="text-center whitespace-nowrap">
                {fmtTime(row.close_time)}
              </TableCell>
              <TableCell className="text-center text-muted-foreground tabular-nums">
                {fmtNum(row.interval_hours)}
              </TableCell>
              <TableCell className="text-center tabular-nums">
                {fmtNum(row.delayed_hours)}
              </TableCell>
              <TableCell className="text-center font-semibold text-destructive tabular-nums">
                {fmtNum(overrun(row))}
              </TableCell>
              <TableCell>
                {row.delay_reason_code ? (
                  <>
                    <span className="font-medium">
                      {delayLabel(row.delay_reason_code)}
                    </span>
                    {row.delay_reason_details && (
                      <span className="block text-2xs text-foreground-subtle mt-0.5">
                        {row.delay_reason_details}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-foreground-subtle">—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionShell>
  );
}
