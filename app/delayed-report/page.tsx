"use client";

import { useTranslations, useLocale } from "next-intl";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useState } from "react";
import { useDelayedLocomotives } from "@/api/hooks/use-reports";
import type { DelayedLocomotivesResponse, DelayedLocomotive } from "@/api/types/reports";
import { Loader2 } from "lucide-react";
import { generateDelayedReportPDF } from "@/utils/delayed-report-pdf-export";
import type { DelayedReportPDFData } from "@/utils/delayed-report-pdf-export";
import { generateDelayedReportExcel } from "@/utils/delayed-report-excel-export";
import { useOrganization } from "@/api/hooks/use-organizations";
import { delayedTrainTypeCount, delayedTrainTypeName } from "@/utils/delayed-report-train-types";
import { format } from "date-fns";
import { ReportOrganizationSelect, useReportOrganization } from "@/components/reports/report-organization-select";
import { PageHeader } from "@/ui/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import { ExportActions } from "@/ui/export-actions";
import { FilterBar } from "@/ui/filter-bar";
import { Page } from "@/ui/page";
import { StatCard, StatGrid } from "@/ui/stat-card";

import { EmptyState, LoadingState } from "@/ui/empty-state";
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

  if (isPending) return <LoadingState size="page" />;

  return (
    <Page>
      {/* ─── Header ─── */}
      <PageHeader
        title={t("delayedReportTitle")}
        description={<>
            {t("delayedReportDescription")}
            <span className="text-foreground-subtle">
              {" · "}
              {snapshotAt} {t("asOf")}
            </span>
            {isFetching && (
              <Loader2 className="inline w-3 h-3 ml-1.5 animate-spin text-foreground-subtle align-[-1px]" />
            )}
          </>}
        actions={
          <ExportActions
            onExcel={handleExportExcel}
            onPdf={handleExportPDF}
            busy={isExportingExcel ? "excel" : isExporting ? "pdf" : null}
          />
        }
        filters={
          <FilterBar>
            <ReportOrganizationSelect />
          </FilterBar>
        }
      />

      {/* ─── Summary: the total leads, the breakdown follows ─── */}
      <StatGrid columns={5}>
        <StatCard label={t("total")} tone="primary" value={totalDelayed} />
        {rows.map((trainType) => (
          <StatCard
            key={trainType.name}
            label={trainTypeName(trainType.name)}
            tone="warning"
            value={countOf(trainType)}
          />
        ))}
      </StatGrid>

      {/* ─── Detail per train type ─── */}
      {totalDelayed === 0 ? (
        <div className="bg-background rounded-xl border border-border shadow-sm py-16 text-center">
          <EmptyState title={t("noData")} />
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
                    <Table density="compact" wrapper={false}>
                      <TableHeader>
                        <TableRow className=" text-foreground-subtle">
                          <TableHead className="text-left">
                            {t("locomotive")}
                          </TableHead>
                          <TableHead className="text-right">
                            {t("hourKm")}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {type.locomotives.map((loc: DelayedLocomotive) => (
                          <TableRow
                            key={loc.id}
                          >
                            <TableCell className="font-medium">
                              {loc.name}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground tabular-nums whitespace-nowrap">
                              {loc.hour
                                ? `${loc.hour} ${globalT("hour").toLowerCase()}`
                                : ""}
                              {loc.hour && loc.mileage ? " / " : ""}
                              {loc.mileage
                                ? `${loc.mileage} ${globalT("Km").toLowerCase()}`
                                : ""}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </div>
            </SectionCard>
          );
        })
      )}
    </Page>
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
