"use client";

import { useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import {
  CalendarIcon,
  FileDown,
  FileSpreadsheet,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { withRole } from "@/components/withRole";
import { Calendar } from "@/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { useBranches } from "@/api/hooks/use-branches";
import { useGetInspectionTypes } from "@/api/hooks/use-inspection-types";
import { useReportFilters } from "@/lib/hooks/useReportFilters";
import {
  ReportOrganizationSelect,
  useReportOrganization,
  REPORT_FILTER_LABEL,
} from "@/components/reports/report-organization-select";
import {
  useUnifiedReportData,
  EXCLUDED_INSPECTION_TYPE_IDS,
} from "@/components/reports/unified/use-unified-report-data";
import {
  KpiStrip,
  type UnifiedSection,
} from "@/components/reports/unified/kpi-strip";
import { TypeBreakdown } from "@/components/reports/unified/type-breakdown";
import { SectionInspections } from "@/components/reports/unified/section-inspections";
import { SectionDelayedEntry } from "@/components/reports/unified/section-delayed-entry";
import { SectionDelayedDuration } from "@/components/reports/unified/section-delayed-duration";
import { generateUnifiedReportExcel } from "@/utils/unified-inspection-report-excel-export";
import { generateUnifiedReportPDF } from "@/utils/unified-inspection-report-pdf-export";
import type { UnifiedReportExportData } from "@/utils/unified-inspection-report-export-data";

const DATE_FMT = "yyyy-MM-dd";

const SECTIONS: UnifiedSection[] = ["inspections", "duration", "entry"];

const DELAY_REASON_CODES = [
  "ADDITIONAL_WORKS_FOUND",
  "SPARE_PARTS_SHORTAGE",
  "LABOR_SHORTAGE",
  "OTHER",
];

function UnifiedInspectionReportPage() {
  const t = useTranslations("UnifiedInspectionReport");
  const globalT = useTranslations();
  const tReason = useTranslations("Inspects.detail.delayReason");
  const locale = useLocale();
  const { filters, setFilters } = useReportFilters();
  const { organizationId } = useReportOrganization();

  const defaults = useMemo(() => {
    const today = new Date();
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return { from: format(monthAgo, DATE_FMT), to: format(today, DATE_FMT) };
  }, []);

  // Filters live in the URL so the report is shareable / survives reloads.
  const fromDate = filters.fromDate || defaults.from;
  const toDate = filters.toDate || defaults.to;
  const branch = filters.branch || "all";
  const inspectionType = filters.inspectionType || "all";

  // Drill-down: which single section to show, kept in the URL like every other
  // filter so a narrowed view can be shared or reloaded.
  const activeSection = SECTIONS.includes(filters.section as UnifiedSection)
    ? (filters.section as UnifiedSection)
    : null;
  const shows = (section: UnifiedSection) =>
    activeSection === null || activeSection === section;

  const { data: branches } = useBranches();
  const { data: allInspectionTypes } = useGetInspectionTypes();

  // Excluded types are kept out of the picker too — offering one would filter
  // the whole report down to nothing.
  const inspectionTypes = useMemo(
    () =>
      (allInspectionTypes ?? []).filter(
        (it) => !EXCLUDED_INSPECTION_TYPE_IDS.includes(it.id),
      ),
    [allInspectionTypes],
  );

  const filteredBranches = useMemo(
    () => (branches ?? []).filter((b) => b.organization.id === organizationId),
    [branches, organizationId],
  );

  const typeName = (it: { name: string; name_uz: string; name_ru: string }) =>
    locale === "ru"
      ? it.name_ru || it.name || it.name_uz
      : it.name_uz || it.name || it.name_ru;

  // The breakdown cards are keyed by the type *name* the stats endpoint returns,
  // while the filter travels as an id — so the two are mapped through
  // `inspectionTypes`. Selecting a card drives the same URL filter as the
  // dropdown, which means every query refetches scoped rather than the page
  // filtering rows locally.
  const activeTypeName =
    inspectionType === "all"
      ? null
      : (inspectionTypes.find((it) => String(it.id) === inspectionType)?.name ??
        null);

  const selectTypeByName = (name: string | null) => {
    if (!name) return setFilters({ inspectionType: "" });
    const match = inspectionTypes.find((it) => it.name === name);
    setFilters({ inspectionType: match ? String(match.id) : "" });
  };

  const data = useUnifiedReportData({
    organization: organizationId,
    fromDate,
    toDate,
    branch: branch !== "all" ? Number(branch) : undefined,
    inspectionType:
      inspectionType !== "all" ? Number(inspectionType) : undefined,
  });

  const orgLabel =
    data.delayedDuration.rows[0]?.organization_name ??
    filteredBranches[0]?.organization?.name ??
    "";

  const [busy, setBusy] = useState<null | "pdf" | "excel">(null);

  const buildExportData = (): UnifiedReportExportData => ({
    title: t("title"),
    organization: orgLabel,
    fromDate: format(new Date(`${fromDate}T00:00:00`), "dd.MM.yyyy"),
    toDate: format(new Date(`${toDate}T00:00:00`), "dd.MM.yyyy"),
    generatedAt: format(new Date(), "dd.MM.yyyy HH:mm"),
    // Exports mirror the screen, drill-down included.
    section: activeSection,
    typeFilter: activeTypeName,
    kpis: data.kpis,
    breakdown: data.breakdown,
    inspections: data.inspections.rows,
    delayedEntry: data.delayedEntry.locomotives,
    delayedDuration: data.delayedDuration.rows,
    delayReasonLabels: Object.fromEntries(
      DELAY_REASON_CODES.map((c) => [c, tReason(c as never)]),
    ),
    labels: {
      period: t("period"),
      organization: t("organization"),
      generatedAt: t("generatedAt"),
      inspectionTypeFilter: t("inspectionType"),
      sheetSummary: t("sheetSummary"),
      sheetInspections: t("sheetInspections"),
      sheetLeftLate: t("sheetLeftLate"),
      sheetEnteredLate: t("sheetEnteredLate"),
      kpiTotal: t("kpiTotal"),
      kpiDelayedEntry: t("kpiDelayedEntry"),
      kpiDelayedDuration: t("kpiDelayedDuration"),
      byType: t("byType"),
      sectionInspections: t("sectionInspections"),
      sectionDelayedEntry: t("sectionDelayedEntry"),
      sectionDelayedDuration: t("sectionDelayedDuration"),
      no: globalT("no"),
      locomotive: t("locomotive"),
      branch: t("branch"),
      inspectionType: t("inspectionType"),
      entryTime: t("entryTime"),
      closeTime: t("closeTime"),
      normHours: t("normHours"),
      spentHours: t("spentHours"),
      overrunHours: t("overrunHours"),
      delayReason: t("delayReason"),
      openedAt: t("openedAt"),
      delayKind: t("delayKind"),
      delayTypeHour: t("delayTypeHour"),
      delayTypeMileage: t("delayTypeMileage"),
      delayTypeBoth: t("delayTypeBoth"),
      hoursLabel: t("hoursLabel"),
      mileageLabel: t("mileageLabel"),
      actual: t("actual"),
      interval: t("interval"),
      overrunLabel: t("overrunLabel"),
      delayedLocomotivesCount: t("delayedLocomotivesCount"),
      total: globalT("total"),
    },
  });

  const runExport = async (kind: "pdf" | "excel") => {
    setBusy(kind);
    try {
      const payload = buildExportData();
      if (kind === "pdf") await generateUnifiedReportPDF(payload);
      else await generateUnifiedReportExcel(payload);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* ─── Header Card ─── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-100">
          <div className="min-w-0">
            <h1 className="text-gray-900 font-semibold text-base leading-tight">
              {t("title")}
            </h1>
            <p className="text-gray-400 text-xs mt-0.5">
              {orgLabel && `${orgLabel} · `}
              {format(new Date(`${fromDate}T00:00:00`), "dd.MM.yyyy")} –{" "}
              {format(new Date(`${toDate}T00:00:00`), "dd.MM.yyyy")}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => runExport("excel")}
              disabled={busy !== null}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-60"
            >
              {busy === "excel" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4" />
              )}
              {busy === "excel" ? t("generating") : t("exportExcel")}
            </button>
            <button
              onClick={() => runExport("pdf")}
              disabled={busy !== null}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-60"
            >
              {busy === "pdf" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              {busy === "pdf" ? t("generating") : t("exportPdf")}
            </button>
          </div>
        </div>

        {/* ─── Filters ─── */}
        <div className="px-5 py-3 bg-gray-50/60 flex flex-wrap items-end gap-3">
          <ReportOrganizationSelect label={t("organization")} />

          <DateBox
            label={t("period")}
            date={new Date(`${fromDate}T00:00:00`)}
            onSelect={(d) =>
              setFilters({ fromDate: d ? format(d, DATE_FMT) : "" })
            }
          />
          <DateBox
            label="—"
            date={new Date(`${toDate}T00:00:00`)}
            onSelect={(d) => setFilters({ toDate: d ? format(d, DATE_FMT) : "" })}
          />

          <div className="flex flex-col gap-1">
            <span className={REPORT_FILTER_LABEL}>{t("branch")}</span>
            <Select
              value={branch}
              onValueChange={(v) => setFilters({ branch: v === "all" ? "" : v })}
            >
              <SelectTrigger className="w-[190px] h-9 text-sm mb-0 sm:mb-0">
                <SelectValue placeholder={t("branch")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all")}</SelectItem>
                {filteredBranches.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <span className={REPORT_FILTER_LABEL}>{t("inspectionType")}</span>
            <Select
              value={inspectionType}
              onValueChange={(v) =>
                setFilters({ inspectionType: v === "all" ? "" : v })
              }
            >
              <SelectTrigger className="w-[170px] h-9 text-sm mb-0 sm:mb-0">
                <SelectValue placeholder={t("inspectionType")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all")}</SelectItem>
                {inspectionTypes.map((it) => (
                  <SelectItem key={it.id} value={String(it.id)}>
                    {typeName(it)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <button
            onClick={() =>
              setFilters({
                fromDate: "",
                toDate: "",
                branch: "",
                inspectionType: "",
                section: "",
              })
            }
            title={t("reset")}
            className="h-9 w-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <KpiStrip
        kpis={data.kpis}
        activeSection={activeSection}
        onSelectSection={(section) => setFilters({ section: section ?? "" })}
      />
      <TypeBreakdown
        rows={data.breakdown}
        activeType={activeTypeName}
        onSelectType={selectTypeByName}
      />

      {shows("inspections") && <SectionInspections {...data.inspections} />}
      {shows("duration") && <SectionDelayedDuration {...data.delayedDuration} />}
      {shows("entry") && <SectionDelayedEntry {...data.delayedEntry} />}
    </div>
  );
}

function DateBox({
  label,
  date,
  onSelect,
}: {
  label: string;
  date: Date;
  onSelect: (d: Date | undefined) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className={REPORT_FILTER_LABEL}>{label}</span>
      <Popover>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-2 px-3 py-2 h-9 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap border border-gray-200 rounded-lg bg-white shadow-sm">
            <CalendarIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            {format(date, "dd.MM.yyyy")}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={onSelect}
            captionLayout="dropdown"
            locale={uz}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default withRole(UnifiedInspectionReportPage, ["admin"]);
