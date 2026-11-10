"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { format, startOfYear, startOfMonth, subDays } from "date-fns";
import { Wallet, CheckCircle2, Clock3, CircleDashed, Layers } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useFilterParams } from "@/lib/hooks/useFilterParams";
import { useOrganizations } from "@/api/hooks/use-organizations";
import { useSrivPaymentReport } from "@/api/hooks/use-delays";
import type {
  SrivPaymentReportRow,
  SrivPaymentBucket,
  SrivPaymentReportDetailsParams,
} from "@/api/types/delays";
import { MultiSelect } from "@/ui/multi-select";
import { cn } from "@/lib/utils";
import { SrivPaymentDrilldownModal } from "./sriv-payment-drilldown-modal";
import { authService } from "@/api/services/auth.service";
import { Button } from "@/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";
import { DateRangeField } from "@/ui/date-range-field";
import { FilterBar, FilterField, FilterReset } from "@/ui/filter-bar";
import { Page } from "@/ui/page";
import { StatCard, type StatTone } from "@/ui/stat-card";

import { EmptyState, TableStateRow, ErrorState } from "@/ui/empty-state";
import { formatNumber } from "@/lib/format";
type BucketKey = "paid" | "unpaid" | "undetermined";

interface BucketMeta {
  key: BucketKey;
  labelKey: string;
  icon: LucideIcon;
  tone: StatTone;
  color: string;
  text: string; // text color class
}

const BUCKETS: BucketMeta[] = [
  {
    key: "paid",
    labelKey: "paid",
    icon: CheckCircle2,
    tone: "success" as const,
    color: "var(--success)", // bar fill in the depo breakdown
    text: "text-success",
  },
  {
    key: "unpaid",
    labelKey: "unpaid",
    icon: Clock3,
    tone: "warning" as const,
    color: "var(--warning)", // bar fill in the depo breakdown
    text: "text-warning",
  },
  {
    key: "undetermined",
    labelKey: "undetermined",
    icon: CircleDashed,
    tone: "neutral" as const,
    color: "var(--muted-foreground)", // bar fill in the depo breakdown
    text: "text-foreground-secondary",
  },
];

const fmtSum = (v: number) => formatNumber(Number(v) || 0);

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

  // sriv_moderator is pinned to its own depo (the backend scopes it too).
  const currentUser =
    authService.getUser();
  const scopedOrgId =
    currentUser?.role === "sriv_moderator"
      ? currentUser?.branch?.organization?.id
      : undefined;
  const isOrgScoped = !!scopedOrgId;

  const selectedOrganizations = useMemo(() => {
    if (scopedOrgId) return [String(scopedOrgId)];
    return organizationsParam ? organizationsParam.split(",").filter(Boolean) : [];
  }, [organizationsParam, scopedOrgId]);


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





  const total = data?.total;
  const rows = data?.rows ?? [];

  return (
    <Page>
      {isLoading ? (
        <SkeletonState />
      ) : error ? (
        <ErrorState title={t("error")} />
      ) : !total ? null : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              tone="primary"
              icon={Wallet}
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
                tone={b.tone}
                icon={b.icon}
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
          <div className="rounded-xl border border-border bg-background p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground-secondary">
              <Layers className="h-4 w-4 text-foreground-subtle" />
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
                  <span className="font-medium text-foreground-secondary">
                    {t(b.labelKey)}
                  </span>
                  <span className="tabular-nums text-foreground-subtle">
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
          <Table frame className=" min-w-[820px]">
            <TableHeader>
              <TableRow className="text-left">
                <TableHead>{t("depo")}</TableHead>
                <TableHead className="text-right">
                  {t("total")}
                </TableHead>
                {BUCKETS.map((b) => (
                  <TableHead
                    key={b.key}
                    className="text-right"
                  >
                    {t(b.labelKey)}
                  </TableHead>
                ))}
                <TableHead className="w-[160px]">
                  {t("distribution")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableStateRow colSpan={6}><EmptyState title={t("empty")} size="compact" /></TableStateRow>
              ) : (
                rows.map((row) => (
                  <TableRow
                    key={row.depo}
                    className="last:border-0"
                  >
                    <TableCell className="font-medium">
                      {row.depo}
                    </TableCell>
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
                    <TableCell>
                      <StackedBar row={row} className="h-2.5" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {rows.length > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell>
                    {total.depo || t("grand_total")}
                  </TableCell>
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
                  <TableCell>
                    <StackedBar row={total} className="h-2.5" />
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </>
      )}

      <SrivPaymentDrilldownModal
        isOpen={!!drilldown}
        onClose={() => setDrilldown(null)}
        params={drilldown?.params}
        title={drilldown?.title ?? ""}
      />
    </Page>
  );
}

function SummaryCard({
  tone,
  icon,
  label,
  sum,
  count,
  share,
  t,
  highlight,
}: {
  tone: StatTone;
  icon: LucideIcon;
  label: string;
  sum: number;
  count: number;
  share: number;
  t: ReturnType<typeof useTranslations>;
  /** The total: no share of itself. */
  highlight?: boolean;
}) {
  return (
    <StatCard
      label={label}
      icon={icon}
      tone={tone}
      value={fmtSum(sum)}
      caption={
        highlight
          ? t("count_n", { n: count })
          : `${t("count_n", { n: count })} · ${share.toFixed(1)}%`
      }
    />
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
    <TableCell className="text-right">
      <span
        className={cn(
          "tabular-nums",
          bold ? "font-semibold text-foreground" : "text-foreground-secondary",
          textClass
        )}
      >
        {fmtSum(sum)}
      </span>
      {clickable ? (
        <Button variant="link" size="xs" className="ml-1 h-auto p-0 tabular-nums text-foreground-subtle decoration-dotted"
          type="button"
          onClick={onClick}
          title={String(count)}
        >
          · {count}
        </Button>
      ) : (
        <span className="ml-1 text-xs tabular-nums text-foreground-subtle">
          · {count}
        </span>
      )}
    </TableCell>
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
        "flex w-full overflow-hidden rounded-full bg-muted",
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
            className="h-[104px] animate-pulse rounded-xl border border-border bg-surface-muted"
          />
        ))}
      </div>
      <div className="h-24 animate-pulse rounded-xl border border-border bg-surface-muted" />
      <div className="h-64 animate-pulse rounded-xl border border-border bg-surface-muted" />
    </div>
  );
}

export default SrivPaymentReport;

/**
 * Filters of the sriv payment report (standard FilterBar), rendered in the
 * page header: the period with quick ranges, and organizations.
 */
export function SrivPaymentFilters() {
  const t = useTranslations("SrivPaymentReportPage");
  const tc = useTranslations("Common");
  const { getAllQueryValues, updateQuery } = useFilterParams();
  const { start_date, end_date, organizations: organizationsParam } = getAllQueryValues();
  const { data: organizationsData, isLoading: isLoadingOrganizations } = useOrganizations();

  // sriv_moderator is pinned to its own depo (the backend scopes it too)
  const currentUser = authService.getUser();
  const isOrgScoped = currentUser?.role === "sriv_moderator";

  const today = new Date();
  const day = (value: string | undefined) => (value ? new Date(value) : undefined);
  const presets = [
    { label: t("range_30days"), from: subDays(today, 30) },
    { label: t("range_thismonth"), from: startOfMonth(today) },
    { label: t("range_thisyear"), from: startOfYear(today) },
  ].map(({ label, from }) => ({
    label,
    range: { from: day(format(from, "yyyy-MM-dd")), to: day(format(today, "yyyy-MM-dd")) },
  }));
  const yearStart = format(startOfYear(today), "yyyy-MM-dd");
  const todayStr = format(today, "yyyy-MM-dd");

  return (
    <FilterBar>
      <FilterField label={tc("period")} width="lg">
        <DateRangeField
          presets={presets}
          value={{ from: day(start_date), to: day(end_date) }}
          onChange={({ from, to }) =>
            updateQuery({
              start_date: from ? format(from, "yyyy-MM-dd") : "",
              end_date: to ? format(to, "yyyy-MM-dd") : "",
            })
          }
        />
      </FilterField>
      {!isOrgScoped && (
        <FilterField label={t("organizations")} width="lg">
          <MultiSelect
            options={(organizationsData ?? []).map((org) => ({ value: String(org.id), label: org.name }))}
            selectedValues={organizationsParam ? organizationsParam.split(",").filter(Boolean) : []}
            onSelectionChange={(values) =>
              updateQuery({ organizations: values.length ? values.join(",") : null })
            }
            placeholder={tc("all")}
            disabled={isLoadingOrganizations}
            className="min-h-9 py-0"
          />
        </FilterField>
      )}
      <FilterReset
        active={Boolean(organizationsParam) || start_date !== yearStart || end_date !== todayStr}
        onReset={() => updateQuery({ start_date: yearStart, end_date: todayStr, organizations: null })}
      />
    </FilterBar>
  );
}
