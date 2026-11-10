"use client";

import type React from "react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Bar, CartesianGrid, ComposedChart, Legend, XAxis, YAxis } from "recharts";
import { BarChart3, CheckCircle2, Clock, Layers, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/ui/chart";
import type { ChartConfig } from "@/ui/chart";
import { SearchableSelect } from "@/ui/select";
import { cn } from "@/lib/utils";
import { useMprStatistics } from "@/api/hooks/use-statistics";
import { STAT_MONTHS } from "@/api/types/statistics";
import type {
  JournalStatisticsParams,
  MprOrgStatistics,
} from "@/api/types/statistics";
import type { ConfirmStatus } from "@/api/types/orders";
import { FilterBar, FilterField } from "@/ui/filter-bar";
import { StatCard, type StatTone } from "@/ui/stat-card";
import { DisclosureTrigger } from "@/ui/disclosure-trigger";
import { LoadingState, ErrorState } from "@/ui/empty-state";
import { formatNumber } from "@/lib/format";

interface SelectOption {
  value: string;
  label: string;
}

interface MprStatusStatsProps {
  title: string;
  locomotiveOptions?: SelectOption[];
  /** Currently applied list filter (confirm_status query value or ""). */
  activeStatus: string;
  /** Called with a status, or "" to clear the filter. */
  onStatusSelect: (status: string) => void;
  /**
   * Renders the page's filter card around the panel's filters, so the
   * statistics view keeps the same header and filter card as the list.
   */
  header: (filters: React.ReactNode) => React.ReactNode;
}

const ALL = "all";

/** Each status: tile tone, share-bar colour and chart colour, all tokens. */
const STATUS_META: Record<
  ConfirmStatus,
  { tone: StatTone; bar: string; chart: string; icon: LucideIcon }
> = {
  pending: { tone: "warning", bar: "bg-warning", chart: "var(--warning)", icon: Clock },
  confirmed: { tone: "success", bar: "bg-success", chart: "var(--success)", icon: CheckCircle2 },
  rejected: { tone: "danger", bar: "bg-destructive", chart: "var(--destructive)", icon: XCircle },
};

const STATUSES: ConfirmStatus[] = ["pending", "confirmed", "rejected"];

const formatCount = (v: number) => formatNumber(v ?? 0);
const formatMoney = (value: number) => {
  const v = Number(value) || 0;
  if (Math.abs(v) >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)} mlrd`;
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} mln`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)} ming`;
  return formatNumber(v);
};

interface StatusTotals {
  mpr: number;
  invalid: number;
  defect: number;
  total: number;
  damage: number;
  months: number[];
}

const emptyTotals = (): StatusTotals => ({
  mpr: 0,
  invalid: 0,
  defect: 0,
  total: 0,
  damage: 0,
  months: new Array(STAT_MONTHS.length).fill(0),
});

function summarize(orgs: MprOrgStatistics[]): StatusTotals {
  const acc = emptyTotals();
  for (const o of orgs) {
    acc.mpr += Number(o.total_mpr ?? 0);
    acc.invalid += Number(o.total_invalid ?? 0);
    acc.defect += Number(o.total_defect ?? 0);
    acc.damage += Number(o.total_damage_amount ?? 0);
    STAT_MONTHS.forEach((m, i) => {
      const c = o.months?.[m];
      acc.months[i] +=
        Number(c?.mpr ?? 0) + Number(c?.invalid ?? 0) + Number(c?.defect ?? 0);
    });
  }
  acc.total = acc.mpr + acc.invalid + acc.defect;
  return acc;
}

export function MprStatusStats({
  title,
  locomotiveOptions,
  activeStatus,
  onStatusSelect,
  header,
}: MprStatusStatsProps) {
  const t = useTranslations("OrdersPage");
  const tc = useTranslations("JournalStatistics");

  const [locomotive, setLocomotive] = useState(ALL);
  const [org, setOrg] = useState(ALL);
  const [chartOpen, setChartOpen] = useState(true);

  const base = useMemo<JournalStatisticsParams>(
    () => ({
      locomotive: locomotive !== ALL ? Number(locomotive) : undefined,
    }),
    [locomotive],
  );

  const pending = useMprStatistics({ ...base, confirm_status: "pending" });
  const confirmed = useMprStatistics({ ...base, confirm_status: "confirmed" });
  const rejected = useMprStatistics({ ...base, confirm_status: "rejected" });
  const queries = { pending, confirmed, rejected };

  const isLoading = STATUSES.some((s) => queries[s].isLoading);
  const hasError = STATUSES.some((s) => queries[s].error);

  const orgOptions = useMemo<SelectOption[]>(() => {
    const seen = new Map<number, string>();
    for (const s of STATUSES) {
      for (const o of queries[s].data ?? []) {
        seen.set(o.organization_id, o.organization_name);
      }
    }
    return [
      { value: ALL, label: tc("all_organizations") },
      ...[...seen].map(([id, name]) => ({ value: String(id), label: name })),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending.data, confirmed.data, rejected.data, tc]);

  const totals = useMemo(() => {
    const pick = (orgs?: MprOrgStatistics[]) =>
      summarize(
        (orgs ?? []).filter((o) => org === ALL || String(o.organization_id) === org),
      );
    return {
      pending: pick(pending.data),
      confirmed: pick(confirmed.data),
      rejected: pick(rejected.data),
    } satisfies Record<ConfirmStatus, StatusTotals>;
  }, [pending.data, confirmed.data, rejected.data, org]);

  const grand = useMemo(() => {
    const g = emptyTotals();
    for (const s of STATUSES) {
      const x = totals[s];
      g.mpr += x.mpr;
      g.invalid += x.invalid;
      g.defect += x.defect;
      g.total += x.total;
      g.damage += x.damage;
    }
    return g;
  }, [totals]);

  const chartConfig = useMemo<ChartConfig>(
    () => ({
      pending: { label: t("status_pending"), color: STATUS_META.pending.chart },
      confirmed: { label: t("status_confirmed"), color: STATUS_META.confirmed.chart },
      rejected: { label: t("status_not_confirmed"), color: STATUS_META.rejected.chart },
    }),
    [t],
  );

  const chartData = useMemo(
    () =>
      STAT_MONTHS.map((month, i) => ({
        month: tc(`months.${month}`),
        pending: totals.pending.months[i],
        confirmed: totals.confirmed.months[i],
        rejected: totals.rejected.months[i],
      })),
    [totals, tc],
  );

  const statusLabel = (s: ConfirmStatus) =>
    s === "pending"
      ? t("status_pending")
      : s === "confirmed"
        ? t("status_confirmed")
        : t("status_not_confirmed");

  const labels = {
    mpr: t("statistics.mpr"),
    invalid: t("statistics.invalid"),
    defect: t("statistics.defect"),
    damage: t("statistics.damage_amount"),
  };

  const filters = (
    <FilterBar>
      {locomotiveOptions && (
        <FilterField label={tc("locomotive")}>
          <SearchableSelect
            value={locomotive}
            onValueChange={setLocomotive}
            options={[{ value: ALL, label: tc("all") }, ...locomotiveOptions]}
            searchable
            size="md"
          />
        </FilterField>
      )}
      <FilterField label={tc("organization")}>
        <SearchableSelect
          value={org}
          onValueChange={setOrg}
          options={orgOptions}
          searchable={orgOptions.length > 8}
          size="md"
        />
      </FilterField>
    </FilterBar>
  );

  return (
    <>
      {header(filters)}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <BarChart3 className="size-5 text-primary" />
          {title}
        </h2>
        {isLoading ? (
          <LoadingState shape="cards" />
        ) : hasError ? (
          <ErrorState title={tc("error")} />
        ) : (
          <>
            {/* Status tiles: a click filters the list by that status */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatusTile
                label={t("statistics.all_statuses")}
                icon={Layers}
                tone="neutral"
                selected={activeStatus === ""}
                totals={grand}
                labels={labels}
                onClick={() => onStatusSelect("")}
              />
              {STATUSES.map((s) => (
                <StatusTile
                  key={s}
                  label={statusLabel(s)}
                  icon={STATUS_META[s].icon}
                  tone={STATUS_META[s].tone}
                  bar={STATUS_META[s].bar}
                  selected={activeStatus === s}
                  totals={totals[s]}
                  share={grand.total ? totals[s].total / grand.total : 0}
                  labels={labels}
                  onClick={() => onStatusSelect(activeStatus === s ? "" : s)}
                />
              ))}
            </div>

            {/* Monthly dynamics, stacked by status */}
            <div className="rounded-xl border border-border bg-background shadow-sm">
              <DisclosureTrigger
                open={chartOpen}
                chevronSide="end"
                onClick={() => setChartOpen((v) => !v)}
                className="justify-between px-4 py-2.5 text-sm font-medium text-foreground-secondary"
              >
                {tc("monthly_dynamics")}
              </DisclosureTrigger>
              {chartOpen && (
                <div className="px-2 pb-3 pt-1">
                  <ChartContainer config={chartConfig} className="aspect-auto h-[320px] w-full">
                    <ComposedChart data={chartData} margin={{ top: 8, left: 4, right: 4, bottom: 0 }}>
                      <CartesianGrid
                        vertical={false}
                        stroke="currentColor"
                        className="text-foreground-subtle"
                      />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} className="text-xs" />
                      <YAxis tickLine={false} axisLine={false} width={36} allowDecimals={false} className="text-xs" />
                      <ChartTooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent />} />
                      <Legend verticalAlign="top" height={32} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                      {STATUSES.map((s, i) => (
                        <Bar
                          key={s}
                          dataKey={s}
                          name={statusLabel(s)}
                          stackId="status"
                          fill={STATUS_META[s].chart}
                          radius={i === STATUSES.length - 1 ? [4, 4, 0, 0] : 0}
                          maxBarSize={34}
                        />
                      ))}
                    </ComposedChart>
                  </ChartContainer>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </>
  );
}

/** A StatCard for one status: total, share of all, breakdown and damage. */
function StatusTile({
  label,
  icon,
  tone,
  bar,
  selected,
  totals,
  share,
  labels,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  tone: StatTone;
  /** Share-bar colour class; omitted on the "all statuses" tile. */
  bar?: string;
  selected: boolean;
  totals: StatusTotals;
  /** 0..1 share of all records; omitted on the "all statuses" tile. */
  share?: number;
  labels: { mpr: string; invalid: string; defect: string; damage: string };
  onClick: () => void;
}) {
  return (
    <StatCard
      label={label}
      icon={icon}
      tone={tone}
      selected={selected}
      onClick={onClick}
      className="gap-3 py-4"
      value={
        <span className="flex items-baseline gap-2">
          {formatCount(totals.total)}
          {share !== undefined && (
            <span className="text-xs font-medium text-muted-foreground">
              {Math.round(share * 100)}%
            </span>
          )}
        </span>
      }
      caption={
        <span className="flex flex-col gap-3">
          {share !== undefined && bar && (
            <span className="block h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <span
                className={cn("block h-full rounded-full", bar)}
                style={{ width: `${Math.max(share * 100, share > 0 ? 3 : 0)}%` }}
              />
            </span>
          )}
          <span className="grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
            {(
              [
                [labels.mpr, totals.mpr],
                [labels.invalid, totals.invalid],
                [labels.defect, totals.defect],
              ] as const
            ).map(([l, v]) => (
              <span key={l} className="flex flex-col">
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {formatCount(v)}
                </span>
                <span className="text-2xs text-muted-foreground">{l}</span>
              </span>
            ))}
          </span>
          <span className="flex items-center justify-between rounded-md bg-surface-muted px-2.5 py-1.5 text-xs">
            <span className="text-muted-foreground">{labels.damage}</span>
            <span
              className="font-semibold tabular-nums text-foreground"
              title={formatNumber(totals.damage)}
            >
              {formatMoney(totals.damage)}
            </span>
          </span>
        </span>
      }
    />
  );
}

export default MprStatusStats;
