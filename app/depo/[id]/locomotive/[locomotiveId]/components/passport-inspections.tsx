"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Badge } from "@/ui/badge";
import { Wrench, Clock, Route, CalendarClock, BarChart3 } from "lucide-react";
import {
  SectionCard,
  EmptyBlock,
  LoadingBlock,
  fmtNumber,
  fmtDate,
} from "./passport-shared";
import type { Txk13Inspection, Txk13Locomotive } from "@/api/types/txk13-report";
import type { LocomotiveIntervalAnalyticsData } from "@/api/hooks/use-locomotive-interval-analytics";

type Status = "ok" | "warning" | "critical";

const statusFromRemaining = (remaining: number, norm: number): Status => {
  if (norm <= 0) return "ok";
  if (remaining <= 0) return "critical";
  if (remaining / norm < 0.15) return "warning";
  return "ok";
};

const statusColors: Record<Status, { bar: string; text: string; badge: string }> = {
  ok: {
    bar: "bg-emerald-500",
    text: "text-emerald-600",
    badge: "bg-emerald-500",
  },
  warning: { bar: "bg-amber-500", text: "text-amber-600", badge: "bg-amber-500" },
  critical: { bar: "bg-red-500", text: "text-red-600", badge: "bg-red-500" },
};

/** One metric (hours or km) progress line inside an inspection card. */
function Meter({
  icon: Icon,
  label,
  value,
  norm,
  remaining,
  nextDate,
  unit,
}: {
  icon: typeof Clock;
  label: string;
  value: number;
  norm: number;
  remaining: number;
  nextDate: string;
  unit: string;
}) {
  const t = useTranslations("locomotivePassport.inspections");
  const status = statusFromRemaining(remaining, norm);
  const colors = statusColors[status];
  const pct = norm > 0 ? Math.min(100, Math.max(0, (value / norm) * 100)) : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </span>
        <span className="font-medium text-[#0F172B]">
          {fmtNumber(value)} / {fmtNumber(norm)} {unit}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", colors.bar)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className={cn("font-medium", colors.text)}>
          {remaining <= 0
            ? t("overdue", { value: fmtNumber(Math.abs(remaining)), unit })
            : t("remaining", { value: fmtNumber(remaining), unit })}
        </span>
        <span className="flex items-center gap-1 text-muted-foreground">
          <CalendarClock className="h-3 w-3" />
          {fmtDate(nextDate)}
        </span>
      </div>
    </div>
  );
}

/** Compact "actual / norm" pill, coloured by how close the average interval
 *  runs to its norm. Rendered only when the norm (interval) is defined. */
function IntervalPill({
  unit,
  actual,
  norm,
}: {
  unit: string;
  actual: number;
  norm: number;
}) {
  const ratio = norm > 0 ? actual / norm : 0;
  const tone = ratio <= 1 ? "ok" : ratio <= 1.15 ? "warning" : "critical";
  const styles: Record<string, string> = {
    ok: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    warning: "bg-amber-50 text-amber-700 ring-amber-200",
    critical: "bg-red-50 text-red-700 ring-red-200",
  };
  return (
    <div
      className={cn(
        "rounded-lg px-2 py-1.5 text-center text-xs font-semibold tabular-nums ring-1 ring-inset",
        styles[tone]
      )}
    >
      {fmtNumber(actual)} / {fmtNumber(norm)}
      <span className="ml-1 font-normal opacity-70">{unit}</span>
    </div>
  );
}

function IntervalCard({
  detail,
}: {
  detail: {
    inspection_type: string;
    mileage_interval: number;
    hours_interval: number;
    inspection_start_mileage_avg: number;
    inspection_remaining_time_avg: number;
  };
}) {
  const hasKm = detail.mileage_interval > 0;
  const hasHours = detail.hours_interval > 0;

  // Hide inspection types that have neither a km nor an hours norm.
  if (!hasKm && !hasHours) return null;

  return (
    <div className="rounded-xl border bg-card p-3">
      <h3 className="truncate text-center text-sm font-semibold text-[#0F172B]">
        {detail.inspection_type}
      </h3>
      <div className="mt-2.5 space-y-1.5">
        {hasKm && (
          <IntervalPill
            unit="km"
            actual={detail.inspection_start_mileage_avg}
            norm={detail.mileage_interval}
          />
        )}
        {hasHours && (
          <IntervalPill
            unit="soat"
            actual={detail.inspection_remaining_time_avg}
            norm={detail.hours_interval}
          />
        )}
      </div>
    </div>
  );
}

function InspectionCard({ inspection }: { inspection: Txk13Inspection }) {
  const t = useTranslations("locomotivePassport.inspections");
  // A metric only applies when a norm is defined for it (norm > 0).
  const hasKm = inspection.km_norm > 0;
  const hasHours = inspection.hours_norm > 0;

  const kmStatus = statusFromRemaining(
    inspection.km_difference,
    inspection.km_norm
  );
  const hoursStatus = statusFromRemaining(
    inspection.hours_difference,
    inspection.hours_norm
  );

  // Card badge reflects the more urgent of the applicable metrics.
  const order: Status[] = ["ok", "warning", "critical"];
  const applicable: Status[] = [];
  if (hasKm) applicable.push(kmStatus);
  if (hasHours) applicable.push(hoursStatus);
  const worst = applicable.reduce<Status>(
    (acc, s) => (order.indexOf(s) > order.indexOf(acc) ? s : acc),
    "ok"
  );
  const worstLabel: Record<Status, string> = {
    ok: t("statusNormal"),
    warning: t("statusApproaching"),
    critical: t("statusOverdue"),
  };

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-[#0F172B]">
            {inspection.type}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t("last", { date: fmtDate(inspection.last_date) })}
          </p>
        </div>
        {applicable.length > 0 && (
          <Badge
            className={cn(
              "border-transparent text-white",
              statusColors[worst].badge
            )}
          >
            {worstLabel[worst]}
          </Badge>
        )}
      </div>

      {hasKm && (
        <Meter
          icon={Route}
          label={t("mileage")}
          value={inspection.km_value_since_repair}
          norm={inspection.km_norm}
          remaining={inspection.km_difference}
          nextDate={inspection.km_next_repair_date}
          unit={t("km")}
        />
      )}
      {hasHours && (
        <Meter
          icon={Clock}
          label={t("hours")}
          value={inspection.hours_value_since_repair}
          norm={inspection.hours_norm}
          remaining={inspection.hours_difference}
          nextDate={inspection.hours_next_repair_date}
          unit={t("hoursUnit")}
        />
      )}
      {!hasKm && !hasHours && (
        <p className="text-xs text-muted-foreground">{t("normNotSet")}</p>
      )}
    </div>
  );
}

export function PassportInspections({
  txk13,
  isLoading,
  analytics,
  isAnalyticsLoading,
}: {
  txk13?: Txk13Locomotive;
  isLoading?: boolean;
  analytics?: LocomotiveIntervalAnalyticsData;
  isAnalyticsLoading?: boolean;
}) {
  const t = useTranslations("locomotivePassport.inspections");
  const inspections = txk13?.inspections ?? [];

  return (
    <div className="space-y-6">
      <SectionCard
        title={t("intervalTitle")}
        description={t("intervalDescription")}
        icon={BarChart3}
        loading={isAnalyticsLoading}
      >
        {isAnalyticsLoading && !analytics ? (
          <LoadingBlock />
        ) : !analytics ||
          analytics.details.filter(
            (d) => d.mileage_interval > 0 || d.hours_interval > 0
          ).length === 0 ? (
          <EmptyBlock icon={BarChart3} message={t("intervalEmpty")} />
        ) : (
          <div className="grid grid-cols-7 gap-3">
            {analytics.details.map((d, i) => (
              <IntervalCard key={`${d.inspection_type}-${i}`} detail={d} />
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title={t("title")}
        description={t("description")}
        icon={Wrench}
        loading={isLoading}
      >
        {isLoading && !txk13 ? (
          <LoadingBlock />
        ) : inspections.length === 0 ? (
          <EmptyBlock icon={Wrench} message={t("empty")} />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {inspections.map((inspection) => (
              <InspectionCard
                key={inspection.type_id}
                inspection={inspection}
              />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
