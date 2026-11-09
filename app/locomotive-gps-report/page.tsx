"use client";

import { useState } from "react";
import { withRole } from "@/components/withRole";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useReportFilters } from "@/lib/hooks/useReportFilters";
import { useTranslations } from "next-intl";
import {
  useLocomotiveGpsReport,
  GpsReportOrganization,
  GpsReportModel,
  GpsReportLocomotive,
} from "@/api/hooks/use-locomotive-gps-report";
import { useTrainTypes } from "@/api/hooks/use-locomotives";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import {
  Loader2,
  Satellite,
  ChevronDown,
  RotateCcw,
  CheckCircle2,
  XCircle,
  MinusCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ReportOrganizationSelect,
  useReportOrganization,
} from "@/components/reports/report-organization-select";

const LOCOMOTIVE_TYPES = [
  "electric_loco",
  "diesel_loco",
  "electric_train",
  "high_speed",
  "carriage",
] as const;

const SERVICE_TYPES = [
  "passenger",
  "freight",
  "mixed",
  "intercity",
  "afrosiyob",
  "switcher",
  "pusher",
  "lead",
  "carriage",
] as const;

function LocomotiveGpsReportPage() {
  const t = useTranslations("LocomotiveGpsReport");
  const tTrains = useTranslations("Trains");
  const user = useCurrentUser();
  const { filters, setFilters } = useReportFilters();

  // The selector always resolves to a concrete organization, which is sent on
  // every request — admins included, rather than the old "omit for all orgs".
  const { organizationId: organization } = useReportOrganization();

  const ready = !!user;

  const { data: locomotiveModels } = useTrainTypes({ no_page: true });

  const { data, isFetching } = useLocomotiveGpsReport({
    organization,
    locomotiveModel: filters.locomotive_model,
    serviceType: filters.service_type,
    locomotiveType: filters.locomotive_type,
    enabled: ready,
  });

  const orgs = data?.data ?? [];

  const localeTypeLabel = (type: string) => {
    switch (type) {
      case "electric_loco":
        return tTrains("locType.electricLoco");
      case "diesel_loco":
        return tTrains("locType.dieselLoco");
      case "electric_train":
        return tTrains("locType.electricTrain");
      case "high_speed":
        return tTrains("locType.highSpeed");
      case "carriage":
        return tTrains("locType.carriage");
      default:
        return type || "—";
    }
  };

  const serviceTypeLabel = (type: string) => {
    try {
      return tTrains(`serviceType.${type}` as any) || type;
    } catch {
      return type || "—";
    }
  };

  const hasActiveFilters =
    !!filters.locomotive_type ||
    !!filters.service_type ||
    !!filters.locomotive_model;

  const resetFilters = () =>
    setFilters({ locomotive_type: "", service_type: "", locomotive_model: "" });

  return (
    <div className="space-y-4">
      {/* ─── Header Card ─── */}
      <div className="bg-background rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-muted">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-sm">
              <Satellite className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-foreground font-semibold text-base leading-tight">
                {t("title")}
              </h1>
              <p className="text-foreground-subtle text-xs mt-0.5">{t("description")}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-5 py-3 bg-surface-muted/60 flex flex-wrap items-end gap-3">
          <ReportOrganizationSelect />
          <Select
            value={filters.locomotive_type || "all"}
            onValueChange={(value) =>
              setFilters({ locomotive_type: value === "all" ? "" : value })
            }
          >
            <SelectTrigger className="h-9 w-[220px] bg-background text-sm mb-0 sm:mb-0">
              <SelectValue placeholder={t("locomotiveType")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allTypes")}</SelectItem>
              {LOCOMOTIVE_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {localeTypeLabel(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.service_type || "all"}
            onValueChange={(value) =>
              setFilters({ service_type: value === "all" ? "" : value })
            }
          >
            <SelectTrigger className="h-9 w-[220px] bg-background text-sm mb-0 sm:mb-0">
              <SelectValue placeholder={t("serviceType")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allServiceTypes")}</SelectItem>
              {SERVICE_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {serviceTypeLabel(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.locomotive_model || "all"}
            onValueChange={(value) =>
              setFilters({ locomotive_model: value === "all" ? "" : value })
            }
          >
            <SelectTrigger className="h-9 w-[220px] bg-background text-sm mb-0 sm:mb-0">
              <SelectValue placeholder={t("model")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allModels")}</SelectItem>
              {locomotiveModels?.results?.map((model) => (
                <SelectItem key={model.id} value={model.id.toString()}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              title={t("reset")}
              className="h-9 w-9 flex items-center justify-center rounded-lg text-foreground-subtle hover:text-foreground-secondary hover:bg-muted border border-border transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {!ready || (isFetching && !data) ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : orgs.length === 0 ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground text-sm border rounded-lg">
          {t("noData")}
        </div>
      ) : (
        <div className="space-y-4">
          {orgs.map((org) => (
            <OrganizationCard
              key={org.organization_id}
              org={org}
              localeTypeLabel={localeTypeLabel}
              serviceTypeLabel={serviceTypeLabel}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OrganizationCard({
  org,
  localeTypeLabel,
  serviceTypeLabel,
}: {
  org: GpsReportOrganization;
  localeTypeLabel: (t: string) => string;
  serviceTypeLabel: (t: string) => string;
}) {
  const t = useTranslations("LocomotiveGpsReport");

  return (
    <div className="bg-background rounded-xl shadow-sm border border-border overflow-hidden">
      {/* Org header */}
      <div className="px-5 py-3.5 border-b border-muted flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold text-sm text-foreground">
          {org.organization_name}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <Stat label={t("total")} value={org.total_locomotives} tone="slate" />
          <Stat label={t("withGps")} value={org.with_gps} tone="emerald" />
          <Stat label={t("withoutGps")} value={org.without_gps} tone="rose" />
          <Stat label={t("valid")} value={org.valid_count} tone="blue" />
          <Stat label={t("invalid")} value={org.invalid_count} tone="amber" />
        </div>
      </div>

      {/* Models */}
      <div className="py-2 divide-y divide-muted">
        {org.locomotive_models.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">
            {t("noData")}
          </div>
        ) : (
          org.locomotive_models.map((model) => (
            <ModelSection
              key={model.model_id}
              model={model}
              localeTypeLabel={localeTypeLabel}
              serviceTypeLabel={serviceTypeLabel}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ModelSection({
  model,
  localeTypeLabel,
  serviceTypeLabel,
}: {
  model: GpsReportModel;
  localeTypeLabel: (t: string) => string;
  serviceTypeLabel: (t: string) => string;
}) {
  const t = useTranslations("LocomotiveGpsReport");
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-5 py-3 hover:bg-surface-muted transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-foreground-subtle transition-transform",
              open && "rotate-180",
            )}
          />
          <span className="font-medium text-sm text-foreground truncate">
            {model.model_name}
          </span>
          <span className="text-xs text-muted-foreground shrink-0">
            {localeTypeLabel(model.locomotive_type)}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Stat label={t("total")} value={model.total_locomotives} tone="slate" />
          <Stat label={t("withGps")} value={model.with_gps} tone="emerald" />
          <Stat label={t("withoutGps")} value={model.without_gps} tone="rose" />
          <Stat label={t("valid")} value={model.valid_count} tone="blue" />
          <Stat label={t("invalid")} value={model.invalid_count} tone="amber" />
        </div>
      </button>

      {open && (
        <div className="overflow-x-auto border-t border-muted">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted/40 text-2xs font-semibold text-muted-foreground tracking-wide">
                <th className="border-b px-2 py-2 text-center w-8">#</th>
                <th className="border-b px-3 py-2 text-left whitespace-nowrap">
                  {t("locomotive")}
                </th>
                <th className="border-b px-3 py-2 text-left whitespace-nowrap">
                  {t("serviceType")}
                </th>
                <th className="border-b px-3 py-2 text-center whitespace-nowrap">
                  {t("imei")}
                </th>
                <th className="border-b px-3 py-2 text-center whitespace-nowrap">
                  {t("gpsStatus")}
                </th>
                <th className="border-b px-3 py-2 text-left whitespace-nowrap">
                  {t("statusDetail")}
                </th>
              </tr>
            </thead>
            <tbody>
              {model.locomotives.map((loco, idx) => (
                <tr
                  key={loco.id}
                  className={cn(
                    "hover:bg-muted/30 transition-colors",
                    idx % 2 === 0 ? "bg-background" : "bg-muted/10",
                  )}
                >
                  <td className="border-b px-2 py-2 text-center text-muted-foreground text-xs">
                    {idx + 1}
                  </td>
                  <td className="border-b px-3 py-2 font-medium whitespace-nowrap">
                    {loco.name}
                  </td>
                  <td className="border-b px-3 py-2 text-xs whitespace-nowrap">
                    {serviceTypeLabel(loco.service_type)}
                  </td>
                  <td className="border-b px-3 py-2 text-center text-xs font-mono">
                    {loco.gps_imei_code || "—"}
                  </td>
                  <td className="border-b px-3 py-2 text-center">
                    <GpsStatusBadge
                      hasGps={loco.has_gps}
                      status={loco.gps_status}
                    />
                  </td>
                  <td className="border-b px-3 py-2 text-xs text-muted-foreground">
                    {loco.gps_status_detail || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function GpsStatusBadge({
  hasGps,
  status,
}: {
  hasGps: boolean;
  status: string;
}) {
  const t = useTranslations("LocomotiveGpsReport");

  if (!hasGps) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
        <MinusCircle className="w-3.5 h-3.5" />
        {t("noGps")}
      </span>
    );
  }
  if (status === "valid") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
        <CheckCircle2 className="w-3.5 h-3.5" />
        {t("statusValid")}
      </span>
    );
  }
  if (status === "invalid") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-warning">
        <XCircle className="w-3.5 h-3.5" />
        {t("statusInvalid")}
      </span>
    );
  }
  return <span className="text-xs text-muted-foreground">—</span>;
}

const toneMap = {
  slate: "bg-muted text-foreground-secondary",
  emerald: "bg-success-subtle text-success",
  rose: "bg-destructive-subtle text-destructive",
  blue: "bg-primary-subtle text-primary-hover",
  amber: "bg-warning-subtle text-warning",
};

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: keyof typeof toneMap;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-2xs font-medium",
        toneMap[tone],
      )}
    >
      <span className="opacity-80">{label}</span>
      <span className="font-bold tabular-nums">{value}</span>
    </span>
  );
}

export default withRole(LocomotiveGpsReportPage, [
  "admin",
  "dejurniy",
  "moderator",
  "dispatcher",
  "tchzr",
]);
