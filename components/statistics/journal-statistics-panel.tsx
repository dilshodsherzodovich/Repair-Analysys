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
import { Card, CardContent } from "@/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/ui/chart";
import type { ChartConfig } from "@/ui/chart";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/ui/collapsible";
import { cn } from "@/lib/utils";
import { STAT_MONTHS, type GenericOrgStatistics } from "@/api/types/statistics";

export interface StatMetric {
  /** field name inside each month object and the chart series key */
  key: string;
  /** org-level total field name */
  totalKey: string;
  /** translated label */
  label: string;
  /** color (any valid CSS color) */
  color: string;
  kind?: "count" | "currency";
  chart?: "bar" | "line";
}

interface JournalStatisticsPanelProps {
  title: string;
  metrics: StatMetric[];
  data?: GenericOrgStatistics[];
  isLoading?: boolean;
  error?: unknown;
  defaultOpen?: boolean;
  className?: string;
}

const formatCount = (value: number) =>
  (value ?? 0).toLocaleString("ru-RU");

const formatCurrency = (value: number) =>
  (Number(value) || 0).toLocaleString("uz-UZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

const formatValue = (value: number, kind?: StatMetric["kind"]) =>
  kind === "currency" ? formatCurrency(value) : formatCount(value);

export function JournalStatisticsPanel({
  title,
  metrics,
  data,
  isLoading,
  error,
  defaultOpen = true,
  className,
}: JournalStatisticsPanelProps) {
  const t = useTranslations("JournalStatistics");
  const [open, setOpen] = useState(defaultOpen);

  const chartConfig = useMemo<ChartConfig>(() => {
    const cfg: ChartConfig = {};
    for (const m of metrics) {
      cfg[m.key] = { label: m.label, color: m.color };
    }
    return cfg;
  }, [metrics]);

  const hasCurrencyMetric = metrics.some((m) => m.kind === "currency");

  return (
    <Collapsible open={open} onOpenChange={setOpen} className={cn("mb-4", className)}>
      <Card className="overflow-hidden">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between px-5 py-3 text-left hover:bg-muted/40 transition-colors"
          >
            <span className="flex items-center gap-2 font-semibold text-sm">
              <BarChart3 className="h-4 w-4 text-primary" />
              {title}
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                open && "rotate-180"
              )}
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-5">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("loading")}
              </div>
            ) : error ? (
              <div className="py-10 text-center text-sm text-destructive">
                {t("error")}
              </div>
            ) : !data || data.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                {t("empty")}
              </div>
            ) : (
              <div className="space-y-6">
                {data.map((org) => (
                  <OrgStatisticsBlock
                    key={org.organization_id}
                    org={org}
                    metrics={metrics}
                    chartConfig={chartConfig}
                    hasCurrencyMetric={hasCurrencyMetric}
                    t={t}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function OrgStatisticsBlock({
  org,
  metrics,
  chartConfig,
  hasCurrencyMetric,
  t,
}: {
  org: GenericOrgStatistics;
  metrics: StatMetric[];
  chartConfig: ChartConfig;
  hasCurrencyMetric: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  const chartData = useMemo(
    () =>
      STAT_MONTHS.map((month) => {
        const monthData = (org.months?.[month] ?? {}) as Record<string, number>;
        const row: Record<string, number | string> = {
          month: t(`months.${month}`),
        };
        for (const m of metrics) {
          row[m.key] = monthData[m.key] ?? 0;
        }
        return row;
      }),
    [org, metrics, t]
  );

  return (
    <div className="rounded-lg border bg-card">
      <div className="border-b px-4 py-2.5 font-medium text-sm">
        {org.organization_name}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4">
        {metrics.map((m) => (
          <div
            key={m.key}
            className="rounded-md border bg-muted/30 px-3 py-2"
          >
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: m.color }}
              />
              {m.label}
            </div>
            <div className="mt-1 text-lg font-semibold tabular-nums">
              {formatValue(Number(org[m.totalKey] ?? 0), m.kind)}
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="px-2 pb-2">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[260px] w-full"
        >
          <ComposedChart data={chartData} margin={{ left: 4, right: 4 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              yAxisId="left"
              tickLine={false}
              axisLine={false}
              width={36}
              allowDecimals={false}
            />
            {hasCurrencyMetric && (
              <YAxis
                yAxisId="right"
                orientation="right"
                tickLine={false}
                axisLine={false}
                width={48}
                tickFormatter={(v) =>
                  Math.abs(v) >= 1000
                    ? `${Math.round(v / 1000)}k`
                    : String(v)
                }
              />
            )}
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            {metrics.map((m) => {
              const isCurrency = m.kind === "currency";
              const axisId = isCurrency ? "right" : "left";
              const renderAsLine = m.chart === "line" || isCurrency;
              return renderAsLine ? (
                <Line
                  key={m.key}
                  yAxisId={axisId}
                  type="monotone"
                  dataKey={m.key}
                  name={m.label}
                  stroke={m.color}
                  strokeWidth={2}
                  dot={false}
                />
              ) : (
                <Bar
                  key={m.key}
                  yAxisId={axisId}
                  dataKey={m.key}
                  name={m.label}
                  fill={m.color}
                  radius={[3, 3, 0, 0]}
                  maxBarSize={28}
                />
              );
            })}
          </ComposedChart>
        </ChartContainer>
      </div>

      {/* Monthly table */}
      <div className="overflow-x-auto px-4 pb-4">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="py-1.5 pr-3 text-left font-medium">
                {t("table_month")}
              </th>
              {metrics.map((m) => (
                <th key={m.key} className="py-1.5 px-2 text-right font-medium">
                  {m.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {STAT_MONTHS.map((month) => {
              const monthData = (org.months?.[month] ?? {}) as Record<
                string,
                number
              >;
              return (
                <tr key={month} className="border-b last:border-0">
                  <td className="py-1.5 pr-3 text-left">
                    {t(`months.${month}`)}
                  </td>
                  {metrics.map((m) => (
                    <td
                      key={m.key}
                      className="py-1.5 px-2 text-right tabular-nums"
                    >
                      {formatValue(monthData[m.key] ?? 0, m.kind)}
                    </td>
                  ))}
                </tr>
              );
            })}
            <tr className="font-semibold">
              <td className="py-1.5 pr-3 text-left">{t("table_total")}</td>
              {metrics.map((m) => (
                <td
                  key={m.key}
                  className="py-1.5 px-2 text-right tabular-nums"
                >
                  {formatValue(Number(org[m.totalKey] ?? 0), m.kind)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default JournalStatisticsPanel;
