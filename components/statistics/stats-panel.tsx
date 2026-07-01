"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, ChevronDown, Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/ui/chart";
import type { ChartConfig } from "@/ui/chart";
import { SearchableSelect } from "@/ui/select";
import { cn } from "@/lib/utils";
import {
  STAT_MONTHS,
  type GenericOrgStatistics,
  type JournalStatisticsParams,
} from "@/api/types/statistics";

export interface StatMetric {
  key: string;
  totalKey: string;
  label: string;
  color: string;
  kind?: "count" | "currency";
  chart?: "bar" | "line";
  icon?: LucideIcon;
}

export interface StatsHookResult {
  data?: GenericOrgStatistics[];
  isLoading: boolean;
  error: unknown;
}

export type StatsHook = (params?: JournalStatisticsParams) => StatsHookResult;

interface SelectOption {
  value: string;
  label: string;
}

interface StatsPanelProps {
  title: string;
  metrics: StatMetric[];
  useStats: StatsHook;
  locomotiveOptions?: SelectOption[];
  inspectionTypeOptions?: SelectOption[];
  className?: string;
}

const ALL = "all";

const formatCount = (v: number) => (v ?? 0).toLocaleString("ru-RU");
const formatCurrencyCompact = (value: number) => {
  const v = Number(value) || 0;
  if (Math.abs(v) >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)} mlrd`;
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} mln`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)} ming`;
  return v.toLocaleString("ru-RU");
};
const formatValue = (v: number, kind?: StatMetric["kind"]) =>
  kind === "currency" ? formatCurrencyCompact(v) : formatCount(v);

export function StatsPanel({
  title,
  metrics,
  useStats,
  locomotiveOptions,
  inspectionTypeOptions,
  className,
}: StatsPanelProps) {
  const t = useTranslations("JournalStatistics");

  const [locomotive, setLocomotive] = useState(ALL);
  const [inspectionType, setInspectionType] = useState(ALL);
  const [org, setOrg] = useState(ALL);
  const [chartOpen, setChartOpen] = useState(true);

  const params = useMemo<JournalStatisticsParams>(
    () => ({
      locomotive:
        locomotive && locomotive !== ALL ? Number(locomotive) : undefined,
      inspection_type:
        inspectionType && inspectionType !== ALL
          ? Number(inspectionType)
          : undefined,
    }),
    [locomotive, inspectionType]
  );

  const { data, isLoading, error } = useStats(params);

  const chartConfig = useMemo<ChartConfig>(() => {
    const cfg: ChartConfig = {};
    for (const m of metrics) cfg[m.key] = { label: m.label, color: m.color };
    return cfg;
  }, [metrics]);

  const hasCurrencyMetric = metrics.some((m) => m.kind === "currency");

  const orgOptions = useMemo<SelectOption[]>(
    () => [
      { value: ALL, label: t("all_organizations") },
      ...(data ?? []).map((o) => ({
        value: String(o.organization_id),
        label: o.organization_name,
      })),
    ],
    [data, t]
  );

  const selectedOrgs = useMemo(
    () =>
      org === ALL
        ? data ?? []
        : (data ?? []).filter((o) => String(o.organization_id) === org),
    [data, org]
  );

  const totals = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const m of metrics) {
      acc[m.key] = selectedOrgs.reduce(
        (s, o) => s + Number(o?.[m.totalKey] ?? 0),
        0
      );
    }
    return acc;
  }, [selectedOrgs, metrics]);

  const series = useMemo(() => {
    const acc: Record<string, number[]> = {};
    for (const m of metrics) acc[m.key] = new Array(STAT_MONTHS.length).fill(0);
    for (const o of selectedOrgs) {
      STAT_MONTHS.forEach((month, i) => {
        const cell = (o.months?.[month] ?? {}) as Record<string, number>;
        for (const m of metrics) acc[m.key][i] += Number(cell[m.key] ?? 0);
      });
    }
    return acc;
  }, [selectedOrgs, metrics]);

  const chartData = useMemo(
    () =>
      STAT_MONTHS.map((month, i) => {
        const row: Record<string, number | string> = { month: t(`months.${month}`) };
        for (const m of metrics) row[m.key] = series[m.key][i];
        return row;
      }),
    [series, metrics, t]
  );

  return (
    <section className={cn("px-6 pt-5", className)}>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        {/* Header + filters */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-800 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-800 dark:text-slate-100">
            <BarChart3 className="h-5 w-5 text-primary" />
            {title}
          </h2>

          <div className="flex flex-wrap items-end gap-3">
            {locomotiveOptions && (
              <FilterField label={t("locomotive")}>
                <SearchableSelect
                  value={locomotive}
                  onValueChange={setLocomotive}
                  options={[
                    { value: ALL, label: t("all") },
                    ...locomotiveOptions,
                  ]}
                  searchable
                  size="sm"
                  triggerClassName="min-w-[180px] bg-white dark:bg-slate-950"
                />
              </FilterField>
            )}
            {inspectionTypeOptions && (
              <FilterField label={t("inspection_type")}>
                <SearchableSelect
                  value={inspectionType}
                  onValueChange={setInspectionType}
                  options={[
                    { value: ALL, label: t("all") },
                    ...inspectionTypeOptions,
                  ]}
                  size="sm"
                  triggerClassName="min-w-[180px] bg-white dark:bg-slate-950"
                />
              </FilterField>
            )}
            <FilterField label={t("organization")}>
              <SearchableSelect
                value={org}
                onValueChange={setOrg}
                options={orgOptions}
                searchable={orgOptions.length > 8}
                size="sm"
                triggerClassName="min-w-[200px] bg-white dark:bg-slate-950"
              />
            </FilterField>
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("loading")}
            </div>
          ) : error ? (
            <div className="py-12 text-center text-sm text-destructive">
              {t("error")}
            </div>
          ) : !data || data.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {t("empty")}
            </div>
          ) : (
            <>
              {/* KPI cards */}
              <div
                className={cn(
                  "grid grid-cols-1 gap-4",
                  metrics.length === 2 && "sm:grid-cols-2",
                  metrics.length === 3 && "sm:grid-cols-2 lg:grid-cols-3",
                  metrics.length >= 4 && "sm:grid-cols-2 xl:grid-cols-4"
                )}
              >
                {metrics.map((m) => (
                  <KpiCard
                    key={m.key}
                    metric={m}
                    total={totals[m.key]}
                    series={series[m.key]}
                  />
                ))}
              </div>

              {/* Chart */}
              <div className="mt-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setChartOpen((v) => !v)}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {t("monthly_dynamics")}
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      chartOpen && "rotate-180"
                    )}
                  />
                </button>
                {chartOpen && (
                  <div className="px-2 pb-3 pt-1">
                    <ChartContainer
                      config={chartConfig}
                      className="aspect-auto h-[320px] w-full"
                    >
                      <ComposedChart
                        data={chartData}
                        margin={{ top: 8, left: 4, right: 4, bottom: 0 }}
                        barGap={2}
                      >
                        <CartesianGrid
                          vertical={false}
                          stroke="currentColor"
                          className="text-slate-200 dark:text-slate-700"
                        />
                        <XAxis
                          dataKey="month"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={10}
                          className="text-xs"
                        />
                        <YAxis
                          yAxisId="left"
                          tickLine={false}
                          axisLine={false}
                          width={36}
                          allowDecimals={false}
                          className="text-xs"
                        />
                        {hasCurrencyMetric && (
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            tickLine={false}
                            axisLine={false}
                            width={52}
                            className="text-xs"
                            tickFormatter={(v) =>
                              Math.abs(v) >= 1_000_000
                                ? `${(v / 1_000_000).toFixed(0)}M`
                                : Math.abs(v) >= 1000
                                  ? `${Math.round(v / 1000)}k`
                                  : String(v)
                            }
                          />
                        )}
                        <ChartTooltip
                          cursor={{ fill: "rgba(148,163,184,0.12)" }}
                          content={<ChartTooltipContent />}
                        />
                        <Legend
                          verticalAlign="top"
                          height={32}
                          iconType="circle"
                          wrapperStyle={{ fontSize: 12 }}
                        />
                        {metrics.map((m) => {
                          const isCurrency = m.kind === "currency";
                          const axisId = isCurrency ? "right" : "left";
                          const asLine = m.chart === "line" || isCurrency;
                          return asLine ? (
                            <Line
                              key={m.key}
                              yAxisId={axisId}
                              type="monotone"
                              dataKey={m.key}
                              name={m.label}
                              stroke={m.color}
                              strokeWidth={2.5}
                              dot={{ r: 3, fill: m.color }}
                              activeDot={{ r: 5 }}
                            />
                          ) : (
                            <Bar
                              key={m.key}
                              yAxisId={axisId}
                              dataKey={m.key}
                              name={m.label}
                              fill={m.color}
                              radius={[4, 4, 0, 0]}
                              maxBarSize={26}
                            />
                          );
                        })}
                      </ComposedChart>
                    </ChartContainer>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </span>
      {children}
    </label>
  );
}

function KpiCard({
  metric,
  total,
  series,
}: {
  metric: StatMetric;
  total: number;
  series: number[];
}) {
  const Icon = metric.icon;
  const max = Math.max(1, ...series);

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 pl-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-950"
      style={{ borderLeft: `4px solid ${metric.color}` }}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {metric.label}
        </p>
        {Icon && (
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${metric.color}1a`, color: metric.color }}
          >
            <Icon className="h-4 w-4" strokeWidth={2.25} />
          </span>
        )}
      </div>

      <p
        className="mt-2 text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50"
        title={
          metric.kind === "currency"
            ? (Number(total) || 0).toLocaleString("ru-RU")
            : undefined
        }
      >
        {formatValue(total, metric.kind)}
      </p>

      {/* sparkline */}
      <div className="mt-3 flex h-8 items-end gap-[3px]" aria-hidden>
        {series.map((v, i) => (
          <span
            key={i}
            className="flex-1 rounded-sm"
            style={{
              height: `${Math.max(6, (v / max) * 100)}%`,
              backgroundColor: metric.color,
              opacity: v === 0 ? 0.15 : 0.4 + (v / max) * 0.6,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default StatsPanel;
