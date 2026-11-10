"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useInspectionCountStats } from "@/api/hooks/use-report-inspections";
import { useBranches } from "@/api/hooks/use-branches";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useReportFilters } from "@/lib/hooks/useReportFilters";
import { useInspectionsReport } from "@/api/hooks/use-report-inspections";
import { formatDate } from "@/utils/formatDate";
import { Inspection } from "@/api/types/report-inspection";
import { generateInspectionsPDF } from "@/utils/inspections-pdf-export";
import { generateInspectionReportExcel } from "@/utils/inspection-report-excel-export";
import { ReportOrganizationSelect, useReportOrganization } from "@/components/reports/report-organization-select";
import { PageHeader } from "@/ui/page-header";
import { Chip } from "@/ui/chip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import { ExportActions } from "@/ui/export-actions";
import { FilterBar, FilterField, FilterReset } from "@/ui/filter-bar";
import { DateRangeField } from "@/ui/date-range-field";
import { SearchableSelect } from "@/ui/select";
import { Page } from "@/ui/page";
import { StatCard } from "@/ui/stat-card";

import { LoadingState, EmptyState } from "@/ui/empty-state";
export default function InspectionReportPage() {
  const t = useTranslations("Statistics");
  const tc = useTranslations("Common");
  const globalT = useTranslations();
  const inspectsT = useTranslations("Inspects");
  const locale = useLocale();
  const { filters: globalFilters, setFilters } = useReportFilters();
  // Always a concrete organization; the report is never unscoped.
  const { organizationId } = useReportOrganization();
  const organization = String(organizationId);
  const { data: branches } = useBranches();
  // Filters live in the URL so the report is shareable / survives reloads.
  const branch = globalFilters.branch || "all";

  const filteredBranches = useMemo(() => {
    if (!branches) return [];
    return branches.filter((b) => b.organization.id === organizationId);
  }, [branches, organizationId]);

  const defaultDates = useMemo(() => {
    const today = new Date();
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    oneMonthAgo.setHours(0, 0, 0, 0);
    today.setHours(23, 59, 59, 999);
    return { start: oneMonthAgo, end: today };
  }, []);

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);

  // Dates are read from the URL (yyyy-MM-dd), falling back to the default range.
  const fromDateStr = globalFilters.fromDate || format(defaultDates.start, "yyyy-MM-dd");
  const toDateStr = globalFilters.toDate || format(defaultDates.end, "yyyy-MM-dd");
  const startDate = useMemo(() => new Date(`${fromDateStr}T00:00:00`), [fromDateStr]);
  const endDate = useMemo(() => new Date(`${toDateStr}T23:59:59`), [toDateStr]);

  // Top-card counts come from the fast aggregate endpoint, independent of the
  // (potentially huge) full inspections list below.
  const { data: inspectionStats, isLoading: isLoadingStats } = useInspectionCountStats({
    organization,
    branch: branch !== "all" ? branch : undefined,
    fromDate: fromDateStr,
    toDate: toDateStr,
  });

  // Row data for the per-type tables (and the PDF/Excel exports) comes from the
  // report endpoint, not the full `/inspections/` list.
  const { data: inspectionsData, isFetching: isLoadingInspections } = useInspectionsReport({
    organization: organizationId,
    fromDate: fromDateStr,
    toDate: toDateStr,
    no_page: true,
    // A full month of one organization is still a large payload — give it room
    // over the 60s default.
    timeout: 5 * 60 * 1000,
  });

  const filteredInspections = useMemo(() => {
    if (!inspectionsData?.results) return [];
    if (branch === "all") return inspectionsData.results;
    return inspectionsData.results.filter((i) => i.branch?.id.toString() === branch);
  }, [inspectionsData, branch]);

  // Fast counts-by-type from the aggregate endpoint ({ typeName: count }).
  const statsByType = useMemo(() => {
    if (!inspectionStats) return [];
    return Object.entries(inspectionStats)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);
  }, [inspectionStats]);

  const inspectionsByType = useMemo(() => {
    if (!filteredInspections.length) return {};
    const grouped: Record<string, { count: number; inspections: Inspection[] }> = {};
    filteredInspections.forEach((inspection) => {
      const typeName = inspection.inspection_type?.name || "Unknown";
      if (!grouped[typeName]) grouped[typeName] = { count: 0, inspections: [] };
      grouped[typeName].count++;
      grouped[typeName].inspections.push(inspection);
    });
    return grouped;
  }, [filteredInspections]);

  // Clicking a count card narrows the list below to that type; clicking the
  // active card again clears it. Kept in the URL like the other filters.
  const selectedType = globalFilters.inspectionType || null;

  const toggleType = (typeName: string) => {
    setFilters({ inspectionType: selectedType === typeName ? "" : typeName });
  };

  // What the tables render — and what the PDF/Excel exports contain, so a
  // download always matches what's on screen.
  const visibleInspectionsByType = useMemo(() => {
    if (!selectedType) return inspectionsByType;
    const group = inspectionsByType[selectedType];
    return group ? { [selectedType]: group } : {};
  }, [inspectionsByType, selectedType]);

  const handleDownloadPdf = async () => {
    if (!startDate || !endDate || !Object.keys(visibleInspectionsByType).length) return;
    setIsDownloadingPdf(true);
    try {
      await generateInspectionsPDF({
        inspectionsByType: visibleInspectionsByType,
        startDate,
        endDate,
        title: t("inspectionReport"),
        translations: {
          inspectionReport: t("inspectionReport"),
          inspectionCountsByType: t("inspectionCountsByType"),
          inspectionsList: t("inspectionsList"),
          no: globalT("no"),
          locomotive: globalT("locomotive"),
          branch: t("branch"),
          createdTime: globalT("createdTime"),
          closeTime: inspectsT("closeTime"),
        },
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (!Object.keys(visibleInspectionsByType).length) return;
    setIsDownloadingExcel(true);
    try {
      await generateInspectionReportExcel({
        inspectionsByType: visibleInspectionsByType,
        startDate,
        endDate,
        title: t("inspectionReport"),
        translations: {
          inspectionCountsByType: t("inspectionCountsByType"),
          inspectionsList: t("inspectionsList"),
          no: globalT("no"),
          locomotive: globalT("locomotive"),
          branch: t("branch"),
          createdTime: globalT("createdTime"),
          closeTime: inspectsT("closeTime"),
          total: globalT("total"),
        },
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsDownloadingExcel(false);
    }
  };

  return (
    <Page>
      {/* ─── Header Card ─── */}
      <PageHeader
        title="Texnik ko&apos;riklar hisoboti"
        description={new Date().toLocaleDateString(
            locale === "ru" ? "ru-RU" : "uz-UZ",
            { weekday: "long", year: "numeric", month: "long", day: "numeric" }
          )}
        actions={
          <ExportActions
            onExcel={handleDownloadExcel}
            onPdf={handleDownloadPdf}
            busy={isDownloadingExcel ? "excel" : isDownloadingPdf ? "pdf" : null}
            disabled={!Object.keys(visibleInspectionsByType).length}
          />
        }
        filters={
          <FilterBar>
            <ReportOrganizationSelect />
            <FilterField label={tc("period")} width="lg">
              <DateRangeField
                value={{ from: startDate, to: new Date(`${toDateStr}T00:00:00`) }}
                onChange={({ from, to }) =>
                  setFilters({
                    fromDate: from ? format(from, "yyyy-MM-dd") : "",
                    toDate: to ? format(to, "yyyy-MM-dd") : "",
                  })
                }
              />
            </FilterField>
            {filteredBranches.length > 0 && (
              <FilterField label={t("branch")}>
                <SearchableSelect
                  size="md"
                  searchable
                  value={branch === "all" ? "" : branch}
                  onValueChange={(v) => setFilters({ branch: v })}
                  placeholder={tc("all")}
                  options={[
                    { value: "", label: tc("all") },
                    ...filteredBranches.map((b) => ({ value: b.id.toString(), label: b.name })),
                  ]}
                />
              </FilterField>
            )}
            <FilterReset
              active={Boolean(globalFilters.fromDate || globalFilters.toDate || globalFilters.branch)}
              onReset={() => setFilters({ fromDate: "", toDate: "", branch: "" })}
            />
          </FilterBar>
        }
      />

      {/* ─── Counts by type ─── */}
      <div className="bg-background rounded-xl shadow-sm border border-border p-5">
        <h2 className="text-sm font-semibold mb-4">{t("inspectionCountsByType")}</h2>
        {isLoadingStats ? (
          <LoadingState />
        ) : statsByType.length === 0 ? (
          <EmptyState title={t("noData")} />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {statsByType.map(([typeName, count]) => {
              const isSelected = selectedType === typeName;
              return (
                <StatCard
                  key={typeName}
                  label={typeName}
                  value={count}
                  tone="primary"
                  selected={isSelected}
                  onClick={() => toggleType(typeName)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Inspections list grouped by type ─── */}
      <div className="bg-background rounded-xl shadow-sm border border-border p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-sm font-semibold">{t("inspectionsList")}</h2>
          {selectedType && (
            <Chip
              className="shrink-0"
              onRemove={() => setFilters({ inspectionType: "" })}
            >
              {selectedType}
            </Chip>
          )}
        </div>
        {isLoadingInspections ? (
          <LoadingState />
        ) : !Object.keys(visibleInspectionsByType).length ? (
          <EmptyState title={t("noData")} />
        ) : (
          <div
            className={cn(
              "grid grid-cols-1 gap-3",
              selectedType ? "lg:grid-cols-1" : "lg:grid-cols-2",
            )}
          >
            {Object.entries(visibleInspectionsByType)
              .sort((a, b) => b[1].count - a[1].count)
              .map(([typeName, data]) => (
                <div key={typeName} className="border border-border rounded-lg overflow-hidden">
                  <div className="px-3 py-1.5 bg-muted border-b border-border flex items-center justify-between">
                    <h4 className="font-semibold text-xs text-foreground">{typeName}</h4>
                    <span className="text-2xs font-bold px-1.5 py-0.5 rounded-full bg-primary-subtle text-primary-hover">
                      {data.count}
                    </span>
                  </div>
                  <Table bordered density="compact">
                    <TableHeader>
                      <TableRow className="align-bottom">
                        <TableHead className="text-center w-8">{globalT("no")}</TableHead>
                        <TableHead className="text-left">{globalT("locomotive")}</TableHead>
                        <TableHead className="text-left">{t("branch")}</TableHead>
                        <TableHead className="text-center">{globalT("createdTime")}</TableHead>
                        <TableHead className="text-center">{inspectsT("closeTime")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.inspections.map((inspection, index) => (
                        <TableRow
                          key={inspection.id}
                          
                        >
                          <TableCell className="text-center">{index + 1}</TableCell>
                          <TableCell className="font-medium whitespace-nowrap">
                            {[inspection.locomotive?.name, inspection.locomotive?.locomotive_model?.name]
                              .filter(Boolean)
                              .join(" ")}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{inspection.branch?.name}</TableCell>
                          <TableCell className="text-center whitespace-nowrap">{formatDate(inspection.created_time)}</TableCell>
                          <TableCell className="text-center whitespace-nowrap">
                            {inspection.is_closed_time ? formatDate(inspection.is_closed_time) : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
          </div>
        )}
      </div>
    </Page>
  );
}
