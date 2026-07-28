"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Badge } from "@/ui/badge";
import { AlertTriangle, History } from "lucide-react";
import {
  SectionCard,
  EmptyBlock,
  LoadingBlock,
  fmtDateTime,
} from "./passport-shared";
import { useInspections } from "@/api/hooks/use-inspections";
import type { Inspection } from "@/api/types/inspections";

/* -------------------------------------------------------------------------- */
/*  Interval + duration helpers (ported from dejurniy)                         */
/* -------------------------------------------------------------------------- */

type IntervalStatus = "critical" | "ok" | "warning" | "disabled";

function getIntervalStatus(target: number, current: number): IntervalStatus {
  if (target === 0 && current === 0) return "disabled";
  if (target * 0.85 > current) return "warning";
  if (target * 1.15 < current) return "critical";
  return "ok";
}

const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

function getDurationTiming(inspection: Inspection) {
  if (!inspection.duration || !inspection.created_time) return null;
  const startMs = new Date(inspection.created_time).getTime();
  const durationMs = inspection.duration * HOUR_MS;
  const maneuverMs = (inspection.maneuver_time ?? 0) * MINUTE_MS;
  const totalMs = durationMs + maneuverMs;
  return { startMs, durationMs, maneuverMs, totalMs, deadlineMs: startMs + totalMs };
}

/* -------------------------------------------------------------------------- */
/*  Interval badge                                                             */
/* -------------------------------------------------------------------------- */

function IntervalBadge({ inspection }: { inspection: Inspection }) {
  const status = inspection.inspection_type?.is_interval
    ? inspection.mileage_interval
      ? getIntervalStatus(
          inspection.mileage_interval,
          inspection.inspection_start_mileage
        )
      : inspection.hour_interval
      ? getIntervalStatus(
          inspection.hour_interval,
          inspection.inspection_remaining_time
        )
      : null
    : null;

  const value = inspection.mileage_interval
    ? `${inspection.inspection_start_mileage} / ${inspection.mileage_interval}`
    : inspection.hour_interval
    ? `${inspection.inspection_remaining_time} / ${inspection.hour_interval}`
    : null;

  if (!status || status === "disabled" || !value) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <Badge
      variant={
        status === "critical"
          ? "destructive"
          : status === "warning"
          ? "warning"
          : "success"
      }
    >
      {value}
    </Badge>
  );
}

/* -------------------------------------------------------------------------- */
/*  Duration / progress bar                                                    */
/* -------------------------------------------------------------------------- */

function DurationTrack({
  percent,
  maneuverPct,
  fillClass,
}: {
  percent: number;
  maneuverPct: number;
  fillClass: string;
}) {
  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
      {maneuverPct > 0 && (
        <div
          className="absolute inset-y-0 right-0 bg-amber-200/80"
          style={{ width: `${maneuverPct}%` }}
        />
      )}
      <div
        className={cn(
          "absolute inset-y-0 left-0 rounded-full transition-all duration-500",
          fillClass
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

function OvertimeTrack() {
  return (
    <div className="relative flex h-2 w-full overflow-hidden rounded-full">
      <div className="h-full flex-1 rounded-l-full bg-emerald-500" />
      <div className="h-full w-3 shrink-0 rounded-r-full bg-red-500" />
    </div>
  );
}

function ProgressCell({
  inspection,
  now,
}: {
  inspection: Inspection;
  now: number;
}) {
  const t = useTranslations("locomotivePassport.history");
  const timing = getDurationTiming(inspection);
  if (!timing || inspection.is_cancelled) {
    return <span className="text-muted-foreground">—</span>;
  }

  const { startMs, durationMs, maneuverMs, totalMs, deadlineMs } = timing;
  const maneuverPct = totalMs > 0 ? (maneuverMs / totalMs) * 100 : 0;

  const norma = (
    <span className="text-muted-foreground">
      {t("norm")}{" "}
      <span className="font-medium text-foreground">{inspection.duration}h</span>
      {maneuverMs > 0 && (
        <span className="font-medium text-amber-600"> +{inspection.maneuver_time}m</span>
      )}
    </span>
  );

  // Closed: measure actual against the closed time; otherwise live elapsed.
  const endMs = inspection.is_closed
    ? inspection.is_closed_time
      ? new Date(inspection.is_closed_time).getTime()
      : startMs
    : now;
  const actualMs = endMs - startMs;
  const isOvertime = actualMs > totalMs;
  const percent = Math.min((actualMs / totalMs) * 100, 100);
  const inManeuver = actualMs > durationMs;

  const remainingMs = Math.max(deadlineMs - endMs, 0);
  const remH = Math.floor(remainingMs / HOUR_MS);
  const remM = Math.floor((remainingMs % HOUR_MS) / MINUTE_MS);
  const overMs = isOvertime ? actualMs - totalMs : 0;
  const overH = Math.floor(overMs / HOUR_MS);
  const overM = Math.floor((overMs % HOUR_MS) / MINUTE_MS);

  return (
    <div className="flex min-w-[110px] flex-col gap-1">
      {isOvertime ? (
        <OvertimeTrack />
      ) : (
        <DurationTrack
          percent={percent}
          maneuverPct={maneuverPct}
          fillClass={inManeuver ? "bg-amber-500" : "bg-emerald-500"}
        />
      )}
      <div className="flex flex-col text-[10px] leading-tight">
        {norma}
        {isOvertime ? (
          <span className="flex items-center gap-0.5 font-semibold text-red-600">
            <AlertTriangle className="h-2.5 w-2.5" />
            +{overH}h {overM}m
          </span>
        ) : inspection.is_closed ? (
          <span className="font-medium text-emerald-600">✓</span>
        ) : (
          <span className="text-muted-foreground">
            {t("remaining")}{" "}
            <span className="font-medium text-foreground">
              {remH}h {remM}m
            </span>
          </span>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Status badge                                                               */
/* -------------------------------------------------------------------------- */

function StatusBadge({ inspection }: { inspection: Inspection }) {
  const t = useTranslations("locomotivePassport.history");
  if (inspection.is_cancelled)
    return <Badge variant="destructive">{t("statusCancelled")}</Badge>;
  if (inspection.is_closed)
    return <Badge variant="success">{t("statusClosed")}</Badge>;
  return <Badge variant="warning">{t("statusInProgress")}</Badge>;
}

/* -------------------------------------------------------------------------- */
/*  History table                                                              */
/* -------------------------------------------------------------------------- */

export function PassportInspectionHistory({
  locomotiveId,
}: {
  locomotiveId: number;
}) {
  const t = useTranslations("locomotivePassport.history");
  const { data, isLoading } = useInspections({ locomotive: locomotiveId });
  const rows = data?.results ?? [];

  // Single shared ticker so ongoing progress bars advance without a timer/row.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const thBase =
    "border-b border-r border-border px-3 py-2.5 text-left font-semibold text-[#0F172B] last:border-r-0";
  const tdBase =
    "border-b border-r border-border px-3 py-2.5 align-top text-[#334155] last:border-r-0";

  return (
    <SectionCard
      title={t("title")}
      description={t("description")}
      icon={History}
      loading={isLoading}
    >
      {isLoading && !data ? (
        <LoadingBlock />
      ) : rows.length === 0 ? (
        <EmptyBlock icon={History} message={t("empty")} />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[900px] table-fixed border-collapse text-sm">
            <colgroup>
              <col style={{ width: "14%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "23%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "19%" }} />
              <col style={{ width: "10%" }} />
            </colgroup>
            <thead>
              <tr className="bg-muted/60">
                <th className={thBase}>{t("columns.createdTime")}</th>
                <th className={thBase}>{t("columns.kanavaEntry")}</th>
                <th className={thBase}>{t("columns.inspectionType")}</th>
                <th className={thBase}>{t("columns.xkp")}</th>
                <th className={thBase}>{t("columns.interval")}</th>
                <th className={thBase}>{t("columns.progress")}</th>
                <th className={thBase}>{t("columns.status")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="even:bg-muted/20">
                  <td className={cn(tdBase, "whitespace-nowrap")}>
                    {fmtDateTime(r.created_time)}
                  </td>
                  <td className={cn(tdBase, "whitespace-nowrap")}>
                    {r.kanava_entry_time ? fmtDateTime(r.kanava_entry_time) : "—"}
                  </td>
                  <td className={cn(tdBase, "whitespace-nowrap font-medium")}>
                    {r.inspection_type?.name ?? "—"}
                  </td>
                  <td className={cn(tdBase, "whitespace-normal break-words")}>
                    {r.branch?.name ?? "—"}
                  </td>
                  <td className={cn(tdBase, "whitespace-nowrap")}>
                    <IntervalBadge inspection={r} />
                  </td>
                  <td className={tdBase}>
                    <ProgressCell inspection={r} now={now} />
                  </td>
                  <td className={cn(tdBase, "whitespace-nowrap")}>
                    <StatusBadge inspection={r} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}
