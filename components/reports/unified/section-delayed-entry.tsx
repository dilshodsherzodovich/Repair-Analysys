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
      <td
        className={cn(
          "border px-2 py-1 text-center tabular-nums",
          untracked && "text-gray-300",
        )}
      >
        {fmtNum(metric.actual)}
      </td>
      <td className="border px-2 py-1 text-center tabular-nums text-gray-500">
        {fmtNum(metric.interval)}
      </td>
      <td
        className={cn(
          "border px-2 py-1 text-center tabular-nums font-semibold",
          metric.is_delayed ? "text-red-600" : "text-gray-300",
        )}
      >
        {metric.is_delayed ? `+${fmtNum(metric.overrun)}` : "—"}
      </td>
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
      ? "bg-red-50 text-red-700 border-red-200"
      : kind === "hour"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-blue-50 text-blue-700 border-blue-200";
  return (
    <span
      className={cn(
        "text-[10px] font-semibold px-1.5 py-0.5 rounded-full border whitespace-nowrap",
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
          <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
            <span className="px-1.5 py-0.5 rounded-full bg-gray-100">
              {summary.delayed_locomotives_count} {t("delayedLocomotivesCount")}
            </span>
            <span className="px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700">
              {t("delayTypeHour")} {summary.hour_delayed_count}
            </span>
            <span className="px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
              {t("delayTypeMileage")} {summary.mileage_delayed_count}
            </span>
            <span className="px-1.5 py-0.5 rounded-full bg-red-50 text-red-700">
              {t("delayTypeBoth")} {summary.both_delayed_count}
            </span>
          </span>
        ) : undefined
      }
      isLoading={isLoading}
      isEmpty={rows.length === 0}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
              <th rowSpan={2} className="border px-2 py-1.5 text-center w-10">
                {globalT("no")}
              </th>
              <th rowSpan={2} className="border px-2 py-1.5 text-left">
                {t("locomotive")}
              </th>
              <th rowSpan={2} className="border px-2 py-1.5 text-center">
                {t("inspectionType")}
              </th>
              <th rowSpan={2} className="border px-2 py-1.5 text-left">
                {t("branch")}
              </th>
              <th rowSpan={2} className="border px-2 py-1.5 text-center">
                {t("openedAt")}
              </th>
              <th rowSpan={2} className="border px-2 py-1.5 text-center">
                {t("delayKind")}
              </th>
              <th colSpan={3} className="border px-2 py-1 text-center">
                {t("hoursLabel")}
              </th>
              <th colSpan={3} className="border px-2 py-1 text-center">
                {t("mileageLabel")}
              </th>
            </tr>
            <tr className="bg-gray-50 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
              <th className="border px-2 py-1 text-center">{t("actual")}</th>
              <th className="border px-2 py-1 text-center">{t("interval")}</th>
              <th className="border px-2 py-1 text-center">{t("overrunLabel")}</th>
              <th className="border px-2 py-1 text-center">{t("actual")}</th>
              <th className="border px-2 py-1 text-center">{t("interval")}</th>
              <th className="border px-2 py-1 text-center">{t("overrunLabel")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.inspection_id}
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
                <td className="border px-2 py-1 text-center">
                  {row.inspection_type_name}
                </td>
                <td className="border px-2 py-1 whitespace-nowrap">
                  {row.branch_name}
                </td>
                {/* Pre-formatted local time — rendered as-is, never re-parsed. */}
                <td className="border px-2 py-1 text-center whitespace-nowrap">
                  {row.created_time}
                </td>
                <td className="border px-2 py-1 text-center">
                  <DelayBadge kind={row.delay_type} />
                </td>
                <MetricCells metric={row.hours} />
                <MetricCells metric={row.mileage} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionShell>
  );
}
