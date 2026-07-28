"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useInspectionCountStats } from "@/api/hooks/use-report-inspections";
import { useBranches } from "@/api/hooks/use-branches";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import { Calendar } from "@/ui/calendar";
import { Button } from "@/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { CalendarIcon, Download, FileDown, FileSpreadsheet, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReportFilters } from "@/lib/hooks/useReportFilters";
import { useInspectionsReport } from "@/api/hooks/use-report-inspections";
import { formatDate } from "@/utils/formatDate";
import { Inspection } from "@/api/types/report-inspection";
import { generateInspectionsPDF } from "@/utils/inspections-pdf-export";
import { generateInspectionReportExcel } from "@/utils/inspection-report-excel-export";
import {
  ReportOrganizationSelect,
  useReportOrganization,
} from "@/components/reports/report-organization-select";

export default function InspectionReportPage() {
  const t = useTranslations("Statistics");
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
    <div className="space-y-4">
      {/* ─── Header Card ─── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-sm">
              <FileDown className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-gray-900 dark:text-white font-semibold text-base leading-tight">
                Texnik ko&apos;riklar hisoboti
              </h1>
              <p className="text-gray-400 text-xs mt-0.5">
                {new Date().toLocaleDateString(
                  locale === "ru" ? "ru-RU" : "uz-UZ",
                  { weekday: "long", year: "numeric", month: "long", day: "numeric" }
                )}
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <button
              onClick={handleDownloadExcel}
              disabled={isDownloadingExcel || !Object.keys(visibleInspectionsByType).length}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-60"
            >
              {isDownloadingExcel ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4" />
              )}
              {isDownloadingExcel ? t("downloading") : t("downloadExcel")}
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf || !Object.keys(visibleInspectionsByType).length}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-60"
            >
              {isDownloadingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isDownloadingPdf ? t("downloading") : t("downloadPdf")}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="px-5 py-3 bg-gray-50/60 dark:bg-gray-900/30 flex flex-wrap items-end gap-2">
          <ReportOrganizationSelect />
          {/* Start date */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-9 w-[140px] justify-start text-left font-normal text-xs",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-3 w-3" />
                {startDate ? format(startDate, "dd/MM/yyyy") : t("selectDate")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(d) =>
                  setFilters({ fromDate: d ? format(d, "yyyy-MM-dd") : "" })
                }
                captionLayout="dropdown"
                locale={uz}
              />
            </PopoverContent>
          </Popover>

          {/* End date */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-9 w-[140px] justify-start text-left font-normal text-xs",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-3 w-3" />
                {endDate ? format(endDate, "dd/MM/yyyy") : t("selectDate")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(d) =>
                  setFilters({ toDate: d ? format(d, "yyyy-MM-dd") : "" })
                }
                captionLayout="dropdown"
                locale={uz}
              />
            </PopoverContent>
          </Popover>

          {/* Branch */}
          {filteredBranches.length > 0 && (
            <Select
              value={branch}
              onValueChange={(v) => setFilters({ branch: v === "all" ? "" : v })}
            >
              <SelectTrigger className="w-[200px] h-9 text-xs mb-0 sm:mb-0">
                <SelectValue placeholder={t("branch")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all")}</SelectItem>
                {filteredBranches.map((b) => (
                  <SelectItem key={b.id} value={b.id.toString()}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* ─── Counts by type ─── */}
      <div className="bg-white dark:bg-gray-800/50 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <h2 className="text-sm font-semibold mb-4">{t("inspectionCountsByType")}</h2>
        {isLoadingStats ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : statsByType.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-400">{t("noData")}</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {statsByType.map(([typeName, count]) => {
              const isSelected = selectedType === typeName;
              return (
                <button
                  key={typeName}
                  type="button"
                  onClick={() => toggleType(typeName)}
                  aria-pressed={isSelected}
                  className={cn(
                    "p-3 rounded-lg border text-left transition-colors",
                    isSelected
                      ? "bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-400 ring-1 ring-blue-500"
                      : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-gray-800",
                  )}
                >
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{typeName}</div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                    {count}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Inspections list grouped by type ─── */}
      <div className="bg-white dark:bg-gray-800/50 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-sm font-semibold">{t("inspectionsList")}</h2>
          {selectedType && (
            <button
              type="button"
              onClick={() => setFilters({ inspectionType: "" })}
              className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline shrink-0"
            >
              <X className="h-3 w-3" />
              {selectedType}
            </button>
          )}
        </div>
        {isLoadingInspections ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !Object.keys(visibleInspectionsByType).length ? (
          <div className="text-center py-8 text-sm text-gray-400">{t("noData")}</div>
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
                <div key={typeName} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h4 className="font-semibold text-xs text-gray-900 dark:text-white">{typeName}</h4>
                    <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400">
                      {data.count}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-muted/40 text-[10px] font-semibold text-muted-foreground tracking-wide align-bottom">
                          <th className="border px-1.5 py-1 text-center w-8">{globalT("no")}</th>
                          <th className="border px-2 py-1 text-left whitespace-nowrap">{globalT("locomotive")}</th>
                          <th className="border px-2 py-1 text-left whitespace-nowrap">{t("branch")}</th>
                          <th className="border px-2 py-1 text-center whitespace-nowrap">{globalT("createdTime")}</th>
                          <th className="border px-2 py-1 text-center whitespace-nowrap">{inspectsT("closeTime")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.inspections.map((inspection, index) => (
                          <tr
                            key={inspection.id}
                            className={cn(
                              "hover:bg-muted/30 transition-colors",
                              index % 2 === 0 ? "bg-background" : "bg-muted/10",
                            )}
                          >
                            <td className="border px-1.5 py-1 text-center text-muted-foreground">{index + 1}</td>
                            <td className="border px-2 py-1 font-medium whitespace-nowrap">
                              {[inspection.locomotive?.name, inspection.locomotive?.locomotive_model?.name]
                                .filter(Boolean)
                                .join(" ")}
                            </td>
                            <td className="border px-2 py-1 whitespace-nowrap">{inspection.branch?.name}</td>
                            <td className="border px-2 py-1 text-center whitespace-nowrap">{formatDate(inspection.created_time)}</td>
                            <td className="border px-2 py-1 text-center whitespace-nowrap">
                              {inspection.is_closed_time ? formatDate(inspection.is_closed_time) : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
