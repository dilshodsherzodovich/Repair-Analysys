"use client";

import { useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { format } from "date-fns";
import { withRole } from "@/components/withRole";
import { useBranches } from "@/api/hooks/use-branches";
import { useGetInspectionTypes } from "@/api/hooks/use-inspection-types";
import { useReportFilters } from "@/lib/hooks/useReportFilters";
import { ReportOrganizationSelect, useReportOrganization } from "@/components/reports/report-organization-select";
import { useUnifiedReportData, EXCLUDED_INSPECTION_TYPE_IDS } from "@/components/reports/unified/use-unified-report-data";
import { KpiStrip, type UnifiedSection } from "@/components/reports/unified/kpi-strip";
import { TypeBreakdown } from "@/components/reports/unified/type-breakdown";
import { SectionInspections } from "@/components/reports/unified/section-inspections";
import { SectionDelayedEntry } from "@/components/reports/unified/section-delayed-entry";
import { SectionDelayedDuration } from "@/components/reports/unified/section-delayed-duration";
import { generateUnifiedReportExcel } from "@/utils/unified-inspection-report-excel-export";
import { generateUnifiedReportPDF } from "@/utils/unified-inspection-report-pdf-export";
import type { UnifiedReportExportData } from "@/utils/unified-inspection-report-export-data";
import { PageHeader } from "@/ui/page-header";
import { SearchableSelect } from "@/ui/select";
import { ExportActions } from "@/ui/export-actions";
import { FilterBar, FilterField, FilterReset } from "@/ui/filter-bar";
import { DateRangeField } from "@/ui/date-range-field";
import { Page } from "@/ui/page";

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
  const tc = useTranslations("Common");
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

  // The breakdown cards are keyed by the type *name* the report's `counts` carry,
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
    <Page>
      {/* ─── Header Card ─── */}
      <PageHeader
        title={t("title")}
        description={<>
            {orgLabel && `${orgLabel} · `}
            {format(new Date(`${fromDate}T00:00:00`), "dd.MM.yyyy")} –{" "}
            {format(new Date(`${toDate}T00:00:00`), "dd.MM.yyyy")}
          </>}
        actions={
          <ExportActions
            onExcel={() => runExport("excel")}
            onPdf={() => runExport("pdf")}
            busy={busy}
          />
        }
        filters={
          <FilterBar>
            <ReportOrganizationSelect />
            <FilterField label={tc("period")} width="lg">
              <DateRangeField
                value={{
                  from: new Date(`${fromDate}T00:00:00`),
                  to: new Date(`${toDate}T00:00:00`),
                }}
                onChange={({ from, to }) =>
                  setFilters({
                    fromDate: from ? format(from, DATE_FMT) : "",
                    toDate: to ? format(to, DATE_FMT) : "",
                  })
                }
              />
            </FilterField>
            <FilterField label={t("branch")}>
              <SearchableSelect
                size="md"
                searchable
                value={branch === "all" ? "" : branch}
                onValueChange={(v) => setFilters({ branch: v })}
                placeholder={tc("all")}
                options={[
                  { value: "", label: tc("all") },
                  ...filteredBranches.map((b) => ({ value: String(b.id), label: b.name })),
                ]}
              />
            </FilterField>
            <FilterField label={t("inspectionType")}>
              <SearchableSelect
                size="md"
                searchable
                value={inspectionType === "all" ? "" : inspectionType}
                onValueChange={(v) => setFilters({ inspectionType: v })}
                placeholder={tc("all")}
                options={[
                  { value: "", label: tc("all") },
                  ...inspectionTypes.map((it) => ({ value: String(it.id), label: typeName(it) })),
                ]}
              />
            </FilterField>
            <FilterReset
              active={Boolean(
                filters.fromDate ||
                  filters.toDate ||
                  filters.branch ||
                  filters.inspectionType ||
                  filters.section
              )}
              onReset={() =>
                setFilters({ fromDate: "", toDate: "", branch: "", inspectionType: "", section: "" })
              }
            />
          </FilterBar>
        }
      />

      <KpiStrip
        kpis={data.kpis}
        excludedTypes={data.excludedTypes}
        activeSection={activeSection}
        onSelectSection={(section) => setFilters({ section: section ?? "" })}
      />
      <TypeBreakdown
        rows={data.breakdown}
        excludedTypes={data.excludedTypes}
        activeType={activeTypeName}
        onSelectType={selectTypeByName}
      />

      {shows("inspections") && <SectionInspections {...data.inspections} />}
      {shows("duration") && <SectionDelayedDuration {...data.delayedDuration} />}
      {shows("entry") && <SectionDelayedEntry {...data.delayedEntry} />}
    </Page>
  );
}

export default withRole(UnifiedInspectionReportPage, ["admin"]);
