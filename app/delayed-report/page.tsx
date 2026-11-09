"use client";

import { useTranslations, useLocale } from "next-intl";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useState } from "react";
import DelayedReportFilters from "@/components/reports/delayed-report-filters";
import { useDelayedLocomotives } from "@/api/hooks/use-reports";
import type { DelayedLocomotivesResponse, DelayedLocomotive } from "@/api/types/reports";
import PageLoading from "@/components/page-loading";
import { FileDown, Loader2 } from "lucide-react";
import { generateDelayedReportPDF } from "@/utils/delayed-report-pdf-export";
import type { DelayedReportPDFData } from "@/utils/delayed-report-pdf-export";
import { generateDelayedReportExcel } from "@/utils/delayed-report-excel-export";
import { useOrganization } from "@/api/hooks/use-organizations";
import {
  delayedTrainTypeCount,
  delayedTrainTypeName,
} from "@/utils/delayed-report-train-types";
import { format } from "date-fns";
import {
  ReportOrganizationSelect,
  useReportOrganization,
} from "@/components/reports/report-organization-select";

const SUPERVISOR_ROLES = ["admin", "dispatcher", "operator", "rb_admin"];

export default function DelayedReportPage() {
  const t = useTranslations("Reports");
  const globalT = useTranslations();
  const locale = useLocale();
  const user = useCurrentUser();
  const role = user?.role;

  if (role !== "admin" && role !== "tchzr") return null;

  const [isExporting, setIsExporting] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const isSupervisor = SUPERVISOR_ROLES.includes(role);
  const { data: organizations } = useOrganization();

  const { organizationId } = useReportOrganization();

  // With "all organizations" selected there is no single name to print on the
  // export, so it falls back to the user's own organization.
  const orgName =
    (isSupervisor
      ? organizations?.find(
          (o: { id: number; name: string }) => o.id === organizationId,
        )?.name
      : user?.branch?.organization?.name) ?? "";

  // Snapshot of what is overdue right now — no date window.
  const { data, isPending, isFetching, refetch, dataUpdatedAt } =
    useDelayedLocomotives({
      organization: organizationId,
    });

  const rows = (data as DelayedLocomotivesResponse[] | undefined) ?? [];

  const countOf = delayedTrainTypeCount;

  const totalDelayed = rows.reduce((sum, tt) => sum + countOf(tt), 0);

  // When the data was actually fetched — not "now", which would drift on every
  // re-render and overstate how fresh the snapshot is.
  const snapshotAt = dataUpdatedAt
    ? format(new Date(dataUpdatedAt), "dd.MM.yyyy HH:mm")
    : "—";


  const trainTypeLabels = {
    electricLocs: t("electric_locs"),
    dieselLocs: t("diesel_locs"),
    electricTrains: t("electric_trains"),
    freightLocos: t("freightElectric"),
    switcherLocos: t("switcherLocos"),
    passengerLocs: t("passenger_locs"),
  };
  const trainTypeName = (name: string) =>
    delayedTrainTypeName(name, trainTypeLabels);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const pdfData: DelayedReportPDFData = {
        title: t("delayedReportTitle"),
        date: format(new Date(), "dd.MM.yyyy"),
        time: format(new Date(), "HH:mm"),
        org: orgName,
        delayedLocomotives: rows,
        translations: {
          date: t("date"),
          time: t("time"),
          locomotive: t("locomotive"),
          hourKm: t("hourKm"),
          hour: globalT("hour"),
          km: globalT("Km"),
          freightLocos: t("freightElectric"),
          switcherLocos: t("switcherLocos"),
          passengerLocs: t("passenger_locs"),
          dieselLocs: t("diesel_locs"),
          electricLocs: t("electric_locs"),
          electricTrains: t("electric_trains"),
          organization: globalT("UserDialog.organization")
        },
      };
      await generateDelayedReportPDF(pdfData);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      await generateDelayedReportExcel({
        title: t("delayedReportTitle"),
        date: format(new Date(), "dd.MM.yyyy"),
        time: format(new Date(), "HH:mm"),
        org: orgName,
        delayedLocomotives: rows,
        translations: {
          date: t("date"),
          time: t("time"),
          locomotive: t("locomotive"),
          hourKm: t("hourKm"),
          hour: globalT("hour"),
          km: globalT("Km"),
          freightLocos: t("freightElectric"),
          switcherLocos: t("switcherLocos"),
          passengerLocs: t("passenger_locs"),
          dieselLocs: t("diesel_locs"),
          electricLocs: t("electric_locs"),
          electricTrains: t("electric_trains"),
          organization: globalT("UserDialog.organization"),
        },
      });
    } finally {
      setIsExportingExcel(false);
    }
  };

  if (isPending) return <PageLoading />;

  return (
    <div className="space-y-4">
      {/* ─── Header ─── */}
      <div className="bg-background rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-muted">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-warning flex items-center justify-center shrink-0 shadow-sm">
              <svg className="w-4 h-4 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-foreground font-semibold text-base leading-tight">
                {t("delayedReportTitle")}
              </h1>
              {/* The report has no date range — it always shows what is overdue
                  right now, so the description says so rather than leaving the
                  timestamp to be misread as "generated on". */}
              <p className="text-muted-foreground text-xs mt-1">
                {t("delayedReportDescription")}
                <span className="text-foreground-subtle">
                  {" · "}
                  {snapshotAt} {t("asOf")}
                </span>
                {isFetching && (
                  <Loader2 className="inline w-3 h-3 ml-1.5 animate-spin text-foreground-subtle align-[-1px]" />
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportExcel}
              disabled={isExportingExcel}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-success hover:bg-success text-success-foreground transition-colors disabled:opacity-60"
            >
              {isExportingExcel ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              {isExportingExcel ? t("generatingExcel") : t("exportExcel")}
            </button>
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary hover:bg-primary-hover text-primary-foreground transition-colors disabled:opacity-60"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              {isExporting ? t("generatingPDF") : t("exportPDF")}
            </button>
          </div>
        </div>
        <div className="px-5 py-3 bg-surface-muted/60">
          <DelayedReportFilters
            onRefresh={() => refetch()}
            leading={
              <ReportOrganizationSelect
                label
                labelClassName="text-sm font-normal normal-case tracking-normal text-foreground pl-0"
                className="gap-2"
              />
            }
          />
        </div>
      </div>

      {/* ─── Summary: the total leads, the breakdown follows ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-foreground rounded-xl px-4 py-3 shadow-sm">
          <p className="text-2xs font-semibold text-foreground-subtle uppercase tracking-wide">
            {t("total")}
          </p>
          <p className="text-3xl font-bold text-primary-foreground tabular-nums leading-none mt-2">
            {totalDelayed}
          </p>
        </div>
        {rows.map((trainType) => (
          <div
            key={trainType.name}
            className="bg-background rounded-xl border border-border border-t-4 border-t-warning px-4 py-3 shadow-sm"
          >
            <p className="text-2xs font-semibold text-muted-foreground uppercase tracking-wide leading-tight min-h-[24px]">
              {trainTypeName(trainType.name)}
            </p>
            <p className="text-3xl font-bold text-foreground tabular-nums leading-none mt-2">
              {countOf(trainType)}
            </p>
          </div>
        ))}
      </div>

      {/* ─── Detail per train type ─── */}
      {totalDelayed === 0 ? (
        <div className="bg-background rounded-xl border border-border shadow-sm py-16 text-center">
          <p className="text-sm text-foreground-subtle">{t("noData")}</p>
        </div>
      ) : (
        rows.map((trainType) => {
          const filtered = trainType.inspection_types.filter(
            (type) => type.locomotives.length > 0,
          );
          if (!filtered.length) return null;
          return (
            <SectionCard
              key={trainType.name}
              title={trainTypeName(trainType.name)}
              count={countOf(trainType)}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 p-4">
                {filtered.map((type) => (
                  <div
                    key={type.name}
                    className="border border-border rounded-lg overflow-hidden"
                  >
                    <div className="flex items-center justify-between gap-2 bg-surface-muted px-3 py-1.5 border-b border-border">
                      <p className="text-2xs font-semibold text-foreground-secondary uppercase tracking-wide truncate">
                        {type.name}
                      </p>
                      <span className="text-2xs font-bold px-1.5 py-0.5 rounded-full bg-background border border-border text-foreground-secondary tabular-nums shrink-0">
                        {type.locomotives.length}
                      </span>
                    </div>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-2xs font-semibold text-foreground-subtle uppercase tracking-wide">
                          <th className="text-left px-3 py-1.5 font-semibold">
                            {t("locomotive")}
                          </th>
                          <th className="text-right px-3 py-1.5 font-semibold">
                            {t("hourKm")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {type.locomotives.map((loc: DelayedLocomotive) => (
                          <tr
                            key={loc.id}
                            className="border-t border-muted hover:bg-surface-muted/60"
                          >
                            <td className="px-3 py-1.5 font-medium text-foreground">
                              {loc.name}
                            </td>
                            <td className="px-3 py-1.5 text-right text-muted-foreground tabular-nums whitespace-nowrap">
                              {loc.hour
                                ? `${loc.hour} ${globalT("hour").toLowerCase()}`
                                : ""}
                              {loc.hour && loc.mileage ? " / " : ""}
                              {loc.mileage
                                ? `${loc.mileage} ${globalT("Km").toLowerCase()}`
                                : ""}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </SectionCard>
          );
        })
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionCard({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  const locale = useLocale();
  const suffix = locale === "ru" ? " шт." : " ta";
  return (
    <section className="bg-background rounded-xl shadow-sm border border-border overflow-hidden">
      <header className="flex items-center justify-between gap-2 px-5 py-3 border-b border-muted">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-1.5 h-1.5 rounded-full bg-warning shrink-0" />
          <h2 className="text-sm font-semibold text-foreground truncate">{title}</h2>
        </div>
        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-warning-subtle text-warning border border-warning/30 shrink-0 tabular-nums">
          {count}
          {suffix}
        </span>
      </header>
      {children}
    </section>
  );
}
