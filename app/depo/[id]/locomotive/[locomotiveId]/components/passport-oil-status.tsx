"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Badge } from "@/ui/badge";
import {
  Droplets,
  Droplet,
  CalendarClock,
  RefreshCw,
  History,
} from "lucide-react";
import {
  SectionCard,
  EmptyBlock,
  LoadingBlock,
  fmtDate,
} from "./passport-shared";
import {
  useLocomotiveOilStatusEntries,
  type LocomotiveOilStatusEntry,
  type OilValidation,
} from "@/api/hooks/use-locomotive-oil-status";

function validationTone(
  validation: OilValidation | undefined,
  t: ReturnType<typeof useTranslations>,
): { label: string; badge: string; tile: string } {
  switch (validation) {
    case "VALID":
      return {
        label: t("valid"),
        badge: "bg-emerald-500",
        tile: "bg-emerald-50 text-emerald-600",
      };
    case "EXPIRED":
      return {
        label: t("expired"),
        badge: "bg-red-500",
        tile: "bg-red-50 text-red-600",
      };
    case "INVALID":
      return {
        label: t("invalid"),
        badge: "bg-red-500",
        tile: "bg-red-50 text-red-600",
      };
    default:
      return {
        label: validation ?? "—",
        badge: "bg-slate-400",
        tile: "bg-slate-100 text-slate-500",
      };
  }
}

function OilMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof RefreshCw;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <span className="font-semibold tabular-nums text-[#0F172B]">{value}</span>
    </div>
  );
}

function OilCard({ entry }: { entry: LocomotiveOilStatusEntry }) {
  const t = useTranslations("locomotivePassport.oilStatus");
  const label = t(`types.${entry.analysis}`);
  const status = entry.status;
  const tone = validationTone(status?.validation, t);

  return (
    <div className="flex flex-col rounded-2xl border bg-card p-4 transition-shadow hover:shadow-[0_14px_34px_-22px_rgba(15,23,43,0.55)]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className={cn(
              "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
              tone.tile,
            )}
          >
            <Droplet className="h-[18px] w-[18px]" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold leading-tight text-[#0F172B]">
              {label}
            </h3>
            {entry.modelName && (
              <p className="truncate text-[11px] text-muted-foreground">
                {entry.modelName}
              </p>
            )}
          </div>
        </div>
        <Badge
          className={cn("shrink-0 border-transparent text-white", tone.badge)}
        >
          {tone.label}
        </Badge>
      </div>

      <div className="mt-3.5 space-y-2 border-t border-dashed border-border/70 pt-3">
        <OilMetric
          icon={RefreshCw}
          label={t("exchangeDate")}
          value={fmtDate(status?.exchange_date)}
        />
        {status?.last_oil_date != null && (
          <OilMetric
            icon={CalendarClock}
            label={t("lastOilDate")}
            value={fmtDate(status.last_oil_date)}
          />
        )}
      </div>
    </div>
  );
}

export function PassportOilStatus({
  locomotiveId,
  locomotiveModelId,
}: {
  locomotiveId?: number;
  locomotiveModelId?: number;
}) {
  const t = useTranslations("locomotivePassport.oilStatus");
  const { entries, isLoading, isError } = useLocomotiveOilStatusEntries(
    locomotiveId,
    locomotiveModelId,
    !!locomotiveId,
  );

  // Only analyses with an actual result are shown; nulls are omitted.
  const shown = entries.filter((entry) => entry.status !== null);
  const hasAnyData = shown.length > 0;

  return (
    <div className="space-y-6">
      {/* Top: current status of each analysis */}
      <SectionCard
        title={t("title")}
        description={t("description")}
        icon={Droplets}
        loading={isLoading}
      >
        {isLoading && entries.length === 0 ? (
          <LoadingBlock />
        ) : isError ? (
          <EmptyBlock icon={Droplets} message={t("loadError")} />
        ) : !hasAnyData ? (
          <EmptyBlock icon={Droplets} message={t("empty")} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {shown.map((entry) => (
              <OilCard key={entry.analysis} entry={entry} />
            ))}
          </div>
        )}
      </SectionCard>

      {/* Bottom: analysis records — wired up once the endpoint is provided. */}
      <SectionCard
        title={t("historyTitle")}
        description={t("historyDescription")}
        icon={History}
      >
        <EmptyBlock icon={History} message={t("historyEmpty")} />
      </SectionCard>
    </div>
  );
}
