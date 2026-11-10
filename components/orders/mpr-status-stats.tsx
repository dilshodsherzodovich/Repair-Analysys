"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Bar, CartesianGrid, ComposedChart, Legend, XAxis, YAxis } from "recharts";
import {
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Clock,
  Layers,
  Loader2,
  XCircle,
} from "lucide-react";
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
}

const ALL = "all";

const STATUS_META: Record<
  ConfirmStatus,
  { color: string; icon: LucideIcon; ring: string }
> = {
  pending: { color: "#f59e0b", icon: Clock, ring: "ring-amber-400" },
  confirmed: { color: "#16a34a", icon: CheckCircle2, ring: "ring-green-500" },
  rejected: { color: "#dc2626", icon: XCircle, ring: "ring-red-500" },
};

const STATUSES: ConfirmStatus[] = ["pending", "confirmed", "rejected"];

const formatCount = (v: number) => (v ?? 0).toLocaleString("ru-RU");
const formatMoney = (value: number) => {
  const v = Number(value) || 0;
  if (Math.abs(v) >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)} mlrd`;
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} mln`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)} ming`;
  return v.toLocaleString("ru-RU");
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
      pending: { label: t("status_pending"), color: STATUS_META.pending.color },
      confirmed: { label: t("status_confirmed"), color: STATUS_META.confirmed.color },
      rejected: { label: t("status_not_confirmed"), color: STATUS_META.rejected.color },
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

  return (
    <section className="px-6 pt-5">
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        {/* Header + filters */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-800 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-800 dark:text-slate-100">
            <BarChart3 className="h-5 w-5 text-primary" />
            {title}
          </h2>
          <div className="flex flex-wrap items-end gap-3">
            {locomotiveOptions && (
              <Field label={tc("locomotive")}>
                <SearchableSelect
                  value={locomotive}
                  onValueChange={setLocomotive}
                  options={[{ value: ALL, label: tc("all") }, ...locomotiveOptions]}
                  searchable
                  size="sm"
                  triggerClassName="min-w-[180px] bg-white dark:bg-slate-950"
                />
              </Field>
            )}
            <Field label={tc("organization")}>
              <SearchableSelect
                value={org}
                onValueChange={setOrg}
                options={orgOptions}
                searchable={orgOptions.length > 8}
                size="sm"
                triggerClassName="min-w-[200px] bg-white dark:bg-slate-950"
              />
            </Field>
          </div>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {tc("loading")}
            </div>
          ) : hasError ? (
            <div className="py-12 text-center text-sm text-destructive">
              {tc("error")}
            </div>
          ) : (
            <>
              {/* Status tiles: click to filter the list below */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatusTile
                  label={t("statistics.all_statuses")}
                  icon={Layers}
                  color="#475569"
                  active={activeStatus === ""}
                  ringClass="ring-slate-400"
                  totals={grand}
                  share={null}
                  labels={{
                    mpr: t("statistics.mpr"),
                    invalid: t("statistics.invalid"),
                    defect: t("statistics.defect"),
                    damage: t("statistics.damage_amount"),
                  }}
                  onClick={() => onStatusSelect("")}
                />
                {STATUSES.map((s) => (
                  <StatusTile
                    key={s}
                    label={statusLabel(s)}
                    icon={STATUS_META[s].icon}
                    color={STATUS_META[s].color}
                    ringClass={STATUS_META[s].ring}
                    active={activeStatus === s}
                    totals={totals[s]}
                    share={grand.total ? totals[s].total / grand.total : 0}
                    labels={{
                      mpr: t("statistics.mpr"),
                      invalid: t("statistics.invalid"),
                      defect: t("statistics.defect"),
                      damage: t("statistics.damage_amount"),
                    }}
                    onClick={() => onStatusSelect(activeStatus === s ? "" : s)}
                  />
                ))}
              </div>

              {/* Monthly dynamics, stacked by status */}
              <div className="mt-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setChartOpen((v) => !v)}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {tc("monthly_dynamics")}
                  <ChevronDown
                    className={cn("h-4 w-4 transition-transform", chartOpen && "rotate-180")}
                  />
                </button>
                {chartOpen && (
                  <div className="px-2 pb-3 pt-1">
                    <ChartContainer
                      config={chartConfig}
                      className="aspect-auto h-[280px] w-full"
                    >
                      <ComposedChart
                        data={chartData}
                        margin={{ top: 8, left: 4, right: 4, bottom: 0 }}
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
                          tickLine={false}
                          axisLine={false}
                          width={36}
                          allowDecimals={false}
                          className="text-xs"
                        />
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
                        {STATUSES.map((s, i) => (
                          <Bar
                            key={s}
                            dataKey={s}
                            name={statusLabel(s)}
                            stackId="status"
                            fill={STATUS_META[s].color}
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
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </span>
      {children}
    </label>
  );
}

function StatusTile({
  label,
  icon: Icon,
  color,
  ringClass,
  active,
  totals,
  share,
  labels,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  color: string;
  ringClass: string;
  active: boolean;
  totals: StatusTotals;
  /** 0..1 share of all records, or null to hide the bar */
  share: number | null;
  labels: { mpr: string; invalid: string; defect: string; damage: string };
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "group relative flex flex-col gap-3 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all",
        "hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2",
        "dark:border-slate-700 dark:bg-slate-950",
        active ? cn("ring-2", ringClass) : "focus-visible:ring-slate-400",
      )}
      style={{ borderTop: `3px solid ${color}` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </span>
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}1a`, color }}
        >
          <Icon className="h-4 w-4" strokeWidth={2.25} />
        </span>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
          {formatCount(totals.total)}
        </span>
        {share !== null && (
          <span className="text-xs font-medium tabular-nums text-slate-500">
            {Math.round(share * 100)}%
          </span>
        )}
      </div>

      {share !== null && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${Math.max(share * 100, share > 0 ? 3 : 0)}%`, backgroundColor: color }}
          />
        </div>
      )}

      <dl className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center dark:border-slate-800">
        {(
          [
            [labels.mpr, totals.mpr],
            [labels.invalid, totals.invalid],
            [labels.defect, totals.defect],
          ] as const
        ).map(([l, v]) => (
          <div key={l}>
            <dd className="text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-100">
              {formatCount(v)}
            </dd>
            <dt className="text-[11px] text-slate-500">{l}</dt>
          </div>
        ))}
      </dl>

      <div className="flex items-center justify-between rounded-md bg-slate-50 px-2.5 py-1.5 text-xs dark:bg-slate-900">
        <span className="text-slate-500">{labels.damage}</span>
        <span
          className="font-semibold tabular-nums text-slate-800 dark:text-slate-100"
          title={totals.damage.toLocaleString("ru-RU")}
        >
          {formatMoney(totals.damage)}
        </span>
      </div>
    </button>
  );
}

export default MprStatusStats;
