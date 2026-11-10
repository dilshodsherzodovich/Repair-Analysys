"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type {
  DelayedInspectionMetric,
  DelayedInspectionRow,
  DelayedInspectionsLocomotive,
  DelayedInspectionsSummary,
} from "@/api/types/delayed-inspections-report";
import { SectionShell } from "./section-shell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";

/** One flat row per late inspection, carrying its locomotive down with it. */
export interface FlatDelayedEntryRow extends DelayedInspectionRow {
  locomotive_name: string;
  locomotive_model_name: string;
}

/**
 * The API groups by locomotive; the report reads better as one flat table, and
 * flattening here means the screen and both exports share the same row order.
 */
export function flattenDelayedEntry(
  locomotives: DelayedInspectionsLocomotive[],
): FlatDelayedEntryRow[] {
  const out: FlatDelayedEntryRow[] = [];
  for (const loco of locomotives) {
    for (const insp of loco.inspections) {
      out.push({
        ...insp,
        locomotive_name: loco.locomotive_name,
        locomotive_model_name: loco.locomotive_model_name,
      });
    }
  }
  return out;
}

const fmtNum = (v: number | null) => (v == null ? "—" : v.toLocaleString());

/**
 * A dimension cell. `interval === null` means the dimension is not tracked for
 * this model/type pair, which is different from "zero" — it is rendered as a
 * dash so it can never read as an on-target value.
 */
function MetricCells({ metric }: { metric: DelayedInspectionMetric }) {
  const untracked = metric.interval == null;
  return (
    <>
      <TableCell
        className={cn(
          "border px-2 py-1 text-center tabular-nums",
          untracked && "text-foreground-subtle",
        )}
      >
        {fmtNum(metric.actual)}
      </TableCell>
      <TableCell className="border px-2 py-1 text-center tabular-nums text-muted-foreground">
        {fmtNum(metric.interval)}
      </TableCell>
      <TableCell
        className={cn(
          "border px-2 py-1 text-center tabular-nums font-semibold",
          metric.is_delayed ? "text-destructive" : "text-foreground-subtle",
        )}
      >
        {metric.is_delayed ? `+${fmtNum(metric.overrun)}` : "—"}
      </TableCell>
    </>
  );
}

function DelayBadge({ kind }: { kind: DelayedInspectionRow["delay_type"] }) {
  const t = useTranslations("UnifiedInspectionReport");
  const label =
    kind === "hour"
      ? t("delayTypeHour")
      : kind === "mileage"
      ? t("delayTypeMileage")
      : t("delayTypeBoth");
  const tone =
    kind === "both"
      ? "bg-destructive-subtle text-destructive border-destructive/30"
      : kind === "hour"
      ? "bg-warning-subtle text-warning border-warning/30"
      : "bg-primary-subtle text-primary-hover border-primary/30";
  return (
    <span
      className={cn(
        "text-2xs font-semibold px-1.5 py-0.5 rounded-full border whitespace-nowrap",
        tone,
      )}
    >
      {label}
    </span>
  );
}

export function SectionDelayedEntry({
  locomotives,
  summary,
  isLoading,
}: {
  locomotives: DelayedInspectionsLocomotive[];
  summary?: DelayedInspectionsSummary;
  isLoading: boolean;
}) {
  const t = useTranslations("UnifiedInspectionReport");
  const globalT = useTranslations();

  const rows = flattenDelayedEntry(locomotives);

  return (
    <SectionShell
      index={3}
      title={t("sectionDelayedEntry")}
      count={isLoading ? null : rows.length}
      badge={
        summary && !isLoading ? (
          // The hour/mileage counts overlap by design — a "both" row is counted
          // in each — so they are shown as separate facts, never summed.
          <span className="flex items-center gap-1.5 text-2xs text-muted-foreground">
            <span className="px-1.5 py-0.5 rounded-full bg-muted">
              {summary.delayed_locomotives_count} {t("delayedLocomotivesCount")}
            </span>
            <span className="px-1.5 py-0.5 rounded-full bg-warning-subtle text-warning">
              {t("delayTypeHour")} {summary.hour_delayed_count}
            </span>
            <span className="px-1.5 py-0.5 rounded-full bg-primary-subtle text-primary-hover">
              {t("delayTypeMileage")} {summary.mileage_delayed_count}
            </span>
            <span className="px-1.5 py-0.5 rounded-full bg-destructive-subtle text-destructive">
              {t("delayTypeBoth")} {summary.both_delayed_count}
            </span>
          </span>
        ) : undefined
      }
      isLoading={isLoading}
      isEmpty={rows.length === 0}
    >
      <div className="overflow-x-auto">
        <Table wrapper={false} className="w-full text-xs border-collapse">
          <TableHeader>
            <TableRow className="bg-surface-muted text-2xs font-semibold text-muted-foreground uppercase tracking-wide">
              <TableHead rowSpan={2} className="border px-2 py-1.5 text-center w-10">
                {globalT("no")}
              </TableHead>
              <TableHead rowSpan={2} className="border px-2 py-1.5 text-left">
                {t("locomotive")}
              </TableHead>
              <TableHead rowSpan={2} className="border px-2 py-1.5 text-center">
                {t("inspectionType")}
              </TableHead>
              <TableHead rowSpan={2} className="border px-2 py-1.5 text-left">
                {t("branch")}
              </TableHead>
              <TableHead rowSpan={2} className="border px-2 py-1.5 text-center">
                {t("openedAt")}
              </TableHead>
              <TableHead rowSpan={2} className="border px-2 py-1.5 text-center">
                {t("delayKind")}
              </TableHead>
              <TableHead colSpan={3} className="border px-2 py-1 text-center">
                {t("hoursLabel")}
              </TableHead>
              <TableHead colSpan={3} className="border px-2 py-1 text-center">
                {t("mileageLabel")}
              </TableHead>
            </TableRow>
            <TableRow className="bg-surface-muted text-2xs font-semibold text-foreground-subtle uppercase tracking-wide">
              <TableHead className="border px-2 py-1 text-center">{t("actual")}</TableHead>
              <TableHead className="border px-2 py-1 text-center">{t("interval")}</TableHead>
              <TableHead className="border px-2 py-1 text-center">{t("overrunLabel")}</TableHead>
              <TableHead className="border px-2 py-1 text-center">{t("actual")}</TableHead>
              <TableHead className="border px-2 py-1 text-center">{t("interval")}</TableHead>
              <TableHead className="border px-2 py-1 text-center">{t("overrunLabel")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow
                key={row.inspection_id}
                className={cn("hover:bg-surface-muted", i % 2 === 1 && "bg-surface-muted/40")}
              >
                <TableCell className="border px-2 py-1 text-center text-foreground-subtle">
                  {i + 1}
                </TableCell>
                <TableCell className="border px-2 py-1 font-medium whitespace-nowrap">
                  {[row.locomotive_name, row.locomotive_model_name]
                    .filter(Boolean)
                    .join(" ")}
                </TableCell>
                <TableCell className="border px-2 py-1 text-center">
                  {row.inspection_type_name}
                </TableCell>
                <TableCell className="border px-2 py-1 whitespace-nowrap">
                  {row.branch_name}
                </TableCell>
                {/* Pre-formatted local time — rendered as-is, never re-parsed. */}
                <TableCell className="border px-2 py-1 text-center whitespace-nowrap">
                  {row.created_time}
                </TableCell>
                <TableCell className="border px-2 py-1 text-center">
                  <DelayBadge kind={row.delay_type} />
                </TableCell>
                <MetricCells metric={row.hours} />
                <MetricCells metric={row.mileage} />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </SectionShell>
  );
}
