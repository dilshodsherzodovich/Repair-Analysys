"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { format, startOfYear, startOfMonth, subDays } from "date-fns";
import {
  Wallet,
  CheckCircle2,
  Clock3,
  CircleDashed,
  Layers,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useFilterParams } from "@/lib/hooks/useFilterParams";
import { useOrganizations } from "@/api/hooks/use-organizations";
import { useSrivPaymentReport } from "@/api/hooks/use-delays";
import type {
  SrivPaymentReportRow,
  SrivPaymentBucket,
  SrivPaymentReportDetailsParams,
} from "@/api/types/delays";
import { DatePicker } from "@/ui/date-picker";
import { MultiSelect } from "@/ui/multi-select";
import { cn } from "@/lib/utils";
import { SrivPaymentDrilldownModal } from "./sriv-payment-drilldown-modal";

type BucketKey = "paid" | "unpaid" | "undetermined";

interface BucketMeta {
  key: BucketKey;
  labelKey: string;
  icon: LucideIcon;
  color: string; // solid (bars, dots)
  text: string; // text color class
  soft: string; // soft bg + ring for the card icon
}

const BUCKETS: BucketMeta[] = [
  {
    key: "paid",
    labelKey: "paid",
    icon: CheckCircle2,
    color: "#059669",
    text: "text-emerald-700",
    soft: "bg-emerald-50 text-emerald-600 ring-emerald-200",
  },
  {
    key: "unpaid",
    labelKey: "unpaid",
    icon: Clock3,
    color: "#d97706",
    text: "text-amber-700",
    soft: "bg-amber-50 text-amber-600 ring-amber-200",
  },
  {
    key: "undetermined",
    labelKey: "undetermined",
    icon: CircleDashed,
    color: "#64748b",
    text: "text-slate-700",
    soft: "bg-slate-100 text-slate-600 ring-slate-200",
  },
];

const fmtSum = (v: number) =>
  new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 0 }).format(
    Math.round(Number(v) || 0)
  );

const pct = (part: number, whole: number) =>
  whole > 0 ? (Number(part) / Number(whole)) * 100 : 0;

export function SrivPaymentReport() {
  const t = useTranslations("SrivPaymentReportPage");
  const { getAllQueryValues, updateQuery } = useFilterParams();
  const {
    start_date,
    end_date,
    organizations: organizationsParam,
  } = getAllQueryValues();

  // Default range: current year → today.
  useEffect(() => {
    if (!start_date || !end_date) {
      const today = new Date();
      updateQuery({
        start_date: format(startOfYear(today), "yyyy-MM-dd"),
        end_date: format(today, "yyyy-MM-dd"),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: organizationsData, isLoading: isLoadingOrganizations } =
    useOrganizations();

  const selectedOrganizations = useMemo(
    () => (organizationsParam ? organizationsParam.split(",").filter(Boolean) : []),
    [organizationsParam]
  );

  const organizationOptions = useMemo(
    () =>
      (organizationsData ?? []).map((org) => ({
        value: String(org.id),
        label: org.name,
      })),
    [organizationsData]
  );

  const params = useMemo(() => {
    if (!start_date || !end_date) return undefined;
    return {
      start_date,
      end_date,
      organizations:
        selectedOrganizations.length > 0
          ? selectedOrganizations.join(",")
          : undefined,
    };
  }, [start_date, end_date, selectedOrganizations]);

  const { data, isLoading, error } = useSrivPaymentReport(params);

  // depo name -> org id, to scope drill-down to a single depo row.
  const orgIdByName = useMemo(() => {
    const map = new Map<string, string>();
    (organizationsData ?? []).forEach((org) => map.set(org.name, String(org.id)));
    return map;
  }, [organizationsData]);

  const [drilldown, setDrilldown] = useState<{
    title: string;
    params: SrivPaymentReportDetailsParams;
  } | null>(null);

  const openDrilldown = useCallback(
    (bucket: SrivPaymentBucket | undefined, depo: string | undefined, label: string) => {
      if (!start_date || !end_date) return;
      // A specific depo row scopes by that org; total/aggregate uses current filter.
      const orgs =
        depo && orgIdByName.has(depo)
          ? orgIdByName.get(depo)
          : selectedOrganizations.length > 0
            ? selectedOrganizations.join(",")
            : undefined;
      setDrilldown({
        title: depo ? `${label} · ${depo}` : label,
        params: { start_date, end_date, bucket, organizations: orgs },
      });
    },
    [start_date, end_date, orgIdByName, selectedOrganizations]
  );

  const startDate = start_date ? new Date(start_date) : undefined;
  const endDate = end_date ? new Date(end_date) : undefined;

  const handleStartDate = useCallback(
    (d: Date | undefined) =>
      updateQuery({ start_date: d ? format(d, "yyyy-MM-dd") : "" }),
    [updateQuery]
  );
  const handleEndDate = useCallback(
    (d: Date | undefined) =>
      updateQuery({ end_date: d ? format(d, "yyyy-MM-dd") : "" }),
    [updateQuery]
  );
  const handleOrganizations = useCallback(
    (values: string[]) =>
      updateQuery({ organizations: values.length ? values.join(",") : null }),
    [updateQuery]
  );

  const quickRanges = useMemo(
    () => {
      const today = new Date();
      const todayStr = format(today, "yyyy-MM-dd");
      return [
        {
          key: "30days",
          label: t("range_30days"),
          start: format(subDays(today, 30), "yyyy-MM-dd"),
          end: todayStr,
        },
        {
          key: "thismonth",
          label: t("range_thismonth"),
          start: format(startOfMonth(today), "yyyy-MM-dd"),
          end: todayStr,
        },
        {
          key: "thisyear",
          label: t("range_thisyear"),
          start: format(startOfYear(today), "yyyy-MM-dd"),
          end: todayStr,
        },
      ];
    },
    [t]
  );

  const activeRange = quickRanges.find(
    (r) => r.start === start_date && r.end === end_date
  )?.key;

  const total = data?.total;
  const rows = data?.rows ?? [];

  return (
    <div className="space-y-5 px-6 pb-8">
      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <Field label={t("date_start")}>
            <DatePicker
              placeholder={t("date_start")}
              value={startDate}
              onValueChange={handleStartDate}
              size="md"
              className="w-[180px]"
            />
          </Field>
          <Field label={t("date_end")}>
            <DatePicker
              placeholder={t("date_end")}
              value={endDate}
              onValueChange={handleEndDate}
              size="md"
              className="w-[180px]"
            />
          </Field>

          <div className="flex items-center gap-1.5 pb-0.5">
            {quickRanges.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() =>
                  updateQuery({ start_date: r.start, end_date: r.end })
                }
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  activeRange === r.key
                    ? "border-primary bg-primary text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>

          <Field label={t("organizations")} className="min-w-[280px] flex-1 max-w-[420px]">
            <MultiSelect
              options={organizationOptions}
              selectedValues={selectedOrganizations}
              onSelectionChange={handleOrganizations}
              placeholder={t("organizations_placeholder")}
              disabled={isLoadingOrganizations}
              className="border-slate-300"
            />
          </Field>
        </div>
      </div>

      {isLoading ? (
        <SkeletonState />
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
          {t("error")}
        </div>
      ) : !total ? null : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              accent="#4f46e5"
              icon={Wallet}
              iconClass="bg-indigo-50 text-indigo-600 ring-indigo-200"
              label={t("total")}
              sum={total.total_sum}
              count={total.total_count}
              share={100}
              t={t}
              highlight
            />
            {BUCKETS.map((b) => (
              <SummaryCard
                key={b.key}
                accent={b.color}
                icon={b.icon}
                iconClass={b.soft}
                label={t(b.labelKey)}
                sum={total[`${b.key}_sum` as keyof SrivPaymentReportRow] as number}
                count={
                  total[`${b.key}_count` as keyof SrivPaymentReportRow] as number
                }
                share={pct(
                  total[`${b.key}_sum` as keyof SrivPaymentReportRow] as number,
                  total.total_sum
                )}
                t={t}
              />
            ))}
          </div>

          {/* Distribution bar */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Layers className="h-4 w-4 text-slate-400" />
              {t("distribution")}
            </div>
            <StackedBar row={total} className="h-4" />
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
              {BUCKETS.map((b) => (
                <div key={b.key} className="flex items-center gap-2 text-xs">
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: b.color }}
                  />
                  <span className="font-medium text-slate-600">
                    {t(b.labelKey)}
                  </span>
                  <span className="tabular-nums text-slate-400">
                    {pct(
                      total[
                        `${b.key}_sum` as keyof SrivPaymentReportRow
                      ] as number,
                      total.total_sum
                    ).toFixed(1)}
                    %
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Per-depo table */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3 font-semibold">{t("depo")}</th>
                    <th className="px-4 py-3 text-right font-semibold">
                      {t("total")}
                    </th>
                    {BUCKETS.map((b) => (
                      <th
                        key={b.key}
                        className="px-4 py-3 text-right font-semibold"
                      >
                        {t(b.labelKey)}
                      </th>
                    ))}
                    <th className="w-[160px] px-4 py-3 font-semibold">
                      {t("distribution")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-10 text-center text-sm text-slate-400"
                      >
                        {t("empty")}
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr
                        key={row.depo}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
                      >
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {row.depo}
                        </td>
                        <MoneyCell
                          sum={row.total_sum}
                          count={row.total_count}
                          bold
                          onClick={() =>
                            openDrilldown(undefined, row.depo, t("total"))
                          }
                        />
                        {BUCKETS.map((b) => (
                          <MoneyCell
                            key={b.key}
                            sum={
                              row[
                                `${b.key}_sum` as keyof SrivPaymentReportRow
                              ] as number
                            }
                            count={
                              row[
                                `${b.key}_count` as keyof SrivPaymentReportRow
                              ] as number
                            }
                            textClass={b.text}
                            onClick={() =>
                              openDrilldown(b.key, row.depo, t(b.labelKey))
                            }
                          />
                        ))}
                        <td className="px-4 py-3">
                          <StackedBar row={row} className="h-2.5" />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {rows.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
                      <td className="px-4 py-3 text-slate-800">
                        {total.depo || t("grand_total")}
                      </td>
                      <MoneyCell
                        sum={total.total_sum}
                        count={total.total_count}
                        bold
                        onClick={() =>
                          openDrilldown(undefined, undefined, t("total"))
                        }
                      />
                      {BUCKETS.map((b) => (
                        <MoneyCell
                          key={b.key}
                          sum={
                            total[
                              `${b.key}_sum` as keyof SrivPaymentReportRow
                            ] as number
                          }
                          count={
                            total[
                              `${b.key}_count` as keyof SrivPaymentReportRow
                            ] as number
                          }
                          textClass={b.text}
                          bold
                          onClick={() =>
                            openDrilldown(b.key, undefined, t(b.labelKey))
                          }
                        />
                      ))}
                      <td className="px-4 py-3">
                        <StackedBar row={total} className="h-2.5" />
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </>
      )}

      <SrivPaymentDrilldownModal
        isOpen={!!drilldown}
        onClose={() => setDrilldown(null)}
        params={drilldown?.params}
        title={drilldown?.title ?? ""}
      />
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </div>
  );
}

function SummaryCard({
  accent,
  icon: Icon,
  iconClass,
  label,
  sum,
  count,
  share,
  t,
  highlight,
}: {
  accent: string;
  icon: LucideIcon;
  iconClass: string;
  label: string;
  sum: number;
  count: number;
  share: number;
  t: ReturnType<typeof useTranslations>;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-white p-4 shadow-sm",
        highlight ? "border-slate-300" : "border-slate-200"
      )}
      style={{ borderLeft: `4px solid ${accent}` }}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg ring-1",
            iconClass
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={2.25} />
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">
        {fmtSum(sum)}
      </p>
      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
        <span className="tabular-nums">
          {t("count_n", { n: count })}
        </span>
        {!highlight && (
          <span className="tabular-nums text-slate-400">
            · {share.toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}

function MoneyCell({
  sum,
  count,
  textClass,
  bold,
  onClick,
}: {
  sum: number;
  count: number;
  textClass?: string;
  bold?: boolean;
  onClick?: () => void;
}) {
  const clickable = !!onClick && count > 0;
  return (
    <td className="px-4 py-3 text-right">
      <span
        className={cn(
          "tabular-nums",
          bold ? "font-semibold text-slate-900" : "text-slate-700",
          textClass
        )}
      >
        {fmtSum(sum)}
      </span>
      {clickable ? (
        <button
          type="button"
          onClick={onClick}
          className="ml-1 rounded text-xs tabular-nums text-slate-400 underline decoration-dotted underline-offset-2 transition-colors hover:text-primary"
          title={String(count)}
        >
          · {count}
        </button>
      ) : (
        <span className="ml-1 text-xs tabular-nums text-slate-400">
          · {count}
        </span>
      )}
    </td>
  );
}

function StackedBar({
  row,
  className,
}: {
  row: SrivPaymentReportRow;
  className?: string;
}) {
  const total = Number(row.total_sum) || 0;
  return (
    <div
      className={cn(
        "flex w-full overflow-hidden rounded-full bg-slate-100",
        className
      )}
    >
      {total > 0 &&
        BUCKETS.map((b) => {
          const val = Number(
            row[`${b.key}_sum` as keyof SrivPaymentReportRow] as number
          );
          const width = (val / total) * 100;
          if (width <= 0) return null;
          return (
            <div
              key={b.key}
              style={{ width: `${width}%`, backgroundColor: b.color }}
              title={`${b.key}: ${width.toFixed(1)}%`}
            />
          );
        })}
    </div>
  );
}

function SkeletonState() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-[104px] animate-pulse rounded-xl border border-slate-200 bg-slate-50"
          />
        ))}
      </div>
      <div className="h-24 animate-pulse rounded-xl border border-slate-200 bg-slate-50" />
      <div className="h-64 animate-pulse rounded-xl border border-slate-200 bg-slate-50" />
    </div>
  );
}

export default SrivPaymentReport;
