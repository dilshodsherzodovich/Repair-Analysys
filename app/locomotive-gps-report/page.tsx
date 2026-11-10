"use client";

import { useState } from "react";
import { withRole } from "@/components/withRole";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useReportFilters } from "@/lib/hooks/useReportFilters";
import { useTranslations } from "next-intl";
import { useLocomotiveGpsReport, GpsReportOrganization, GpsReportModel } from "@/api/hooks/use-locomotive-gps-report";
import { useTrainTypes } from "@/api/hooks/use-locomotives";
import { CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReportOrganizationSelect, useReportOrganization } from "@/components/reports/report-organization-select";
import { PageHeader } from "@/ui/page-header";
import { DisclosureTrigger } from "@/ui/disclosure-trigger";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import { FilterBar, FilterField, FilterReset } from "@/ui/filter-bar";
import { SearchableSelect } from "@/ui/select";
import { Page } from "@/ui/page";

import { LoadingState, EmptyState } from "@/ui/empty-state";
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
    <Page>
      {/* ─── Header Card ─── */}
      <PageHeader
        title={t("title")}
        description={t("description")}
        filters={
          <FilterBar>
            <ReportOrganizationSelect />
            <FilterField label={t("locomotiveType")}>
              <SearchableSelect
                size="md"
                searchable
                value={filters.locomotive_type || ""}
                onValueChange={(value) => setFilters({ locomotive_type: value })}
                placeholder={t("allTypes")}
                options={[
                  { value: "", label: t("allTypes") },
                  ...LOCOMOTIVE_TYPES.map((type) => ({ value: type, label: localeTypeLabel(type) })),
                ]}
              />
            </FilterField>
            <FilterField label={t("serviceType")}>
              <SearchableSelect
                size="md"
                searchable
                value={filters.service_type || ""}
                onValueChange={(value) => setFilters({ service_type: value })}
                placeholder={t("allServiceTypes")}
                options={[
                  { value: "", label: t("allServiceTypes") },
                  ...SERVICE_TYPES.map((type) => ({ value: type, label: serviceTypeLabel(type) })),
                ]}
              />
            </FilterField>
            <FilterField label={t("model")}>
              <SearchableSelect
                size="md"
                searchable
                value={filters.locomotive_model || ""}
                onValueChange={(value) => setFilters({ locomotive_model: value })}
                placeholder={t("allModels")}
                options={[
                  { value: "", label: t("allModels") },
                  ...(locomotiveModels?.results ?? []).map((model) => ({ value: model.id.toString(), label: model.name })),
                ]}
              />
            </FilterField>
            <FilterReset active={hasActiveFilters} onReset={resetFilters} />
          </FilterBar>
        }
      />

      {/* Content */}
      {!ready || (isFetching && !data) ? (
        <LoadingState size="page" />
      ) : orgs.length === 0 ? (
        <EmptyState title={t("noData")} size="page" />
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
    </Page>
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
          <EmptyState title={t("noData")} />
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
      <DisclosureTrigger
        open={open}
        onClick={() => setOpen((v) => !v)}
        className="justify-between px-5 py-3"
      >
        <div className="flex items-center gap-3 min-w-0">
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
      </DisclosureTrigger>

      {open && (
        <Table frame>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center w-8">#</TableHead>
              <TableHead className="text-left">
                {t("locomotive")}
              </TableHead>
              <TableHead className="text-left">
                {t("serviceType")}
              </TableHead>
              <TableHead className="text-center">
                {t("imei")}
              </TableHead>
              <TableHead className="text-center">
                {t("gpsStatus")}
              </TableHead>
              <TableHead className="text-left">
                {t("statusDetail")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {model.locomotives.map((loco, idx) => (
              <TableRow
                key={loco.id}
                
              >
                <TableCell className="text-center text-muted-foreground">
                  {idx + 1}
                </TableCell>
                <TableCell className="font-medium whitespace-nowrap">
                  {loco.name}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {serviceTypeLabel(loco.service_type)}
                </TableCell>
                <TableCell className="text-center font-mono">
                  {loco.gps_imei_code || "—"}
                </TableCell>
                <TableCell className="text-center">
                  <GpsStatusBadge
                    hasGps={loco.has_gps}
                    status={loco.gps_status}
                  />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {loco.gps_status_detail || "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
