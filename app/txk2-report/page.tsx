"use client";

import { useEffect, useState } from "react";
import { withRole } from "@/components/withRole";
import { useTxk2Report, Txk2ReportRow, NextInspectionType } from "@/api/hooks/use-txk2-report";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReportFilters } from "@/lib/hooks/useReportFilters";
import { useTranslations, useLocale } from "next-intl";
import { format } from "date-fns";
import { generateTxk2ReportExcel } from "@/utils/txk2-report-excel-export";
import { ReportOrganizationSelect, useReportOrganization } from "@/components/reports/report-organization-select";
import { PageHeader } from "@/ui/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import { ExportActions } from "@/ui/export-actions";
import { FilterBar, FilterField, FilterReset } from "@/ui/filter-bar";
import { DateRangeField } from "@/ui/date-range-field";
import { Page } from "@/ui/page";

const DATE_FMT = "yyyy-MM-dd";

function firstOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function firstOfNextMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1);
}

// next_inspection_type may be an InspectionType object, a plain name string, or
// empty. Resolve it to a display name (null when there is no follow-up).
function nextTypeName(value: NextInspectionType, locale: string): string | null {
  if (!value) return null;
  if (typeof value === "string") return value || null;
  if (locale === "ru") return value.name_ru || value.name || value.name_uz;
  return value.name_uz || value.name || value.name_ru;
}

// Time fields arrive as ISO datetimes (or null). Show HH:mm when parseable.
function fmtTime(value: string | null): string {
  if (!value) return "—";
  if (value.includes("T")) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return format(d, "HH:mm");
  }
  return value;
}

function fmtNum(value: number | null): string {
  if (value == null) return "—";
  return value.toLocaleString();
}

function Txk2ReportPage() {
  const t = useTranslations("Txk2Report");
  const tReason = useTranslations("Inspects.detail.delayReason");
  const locale = useLocale();
  const tc = useTranslations("Common");
  const { filters, setFilters } = useReportFilters();

  // delay_reason_code is one of the known DelayReason codes; fall back to the raw
  // value if the backend ever sends something else.
  const delayLabel = (code: string | null) => {
    if (!code) return "—";
    try {
      return tReason(code as any);
    } catch {
      return code;
    }
  };

  const { organizationId } = useReportOrganization();

  // Default range: current month → start of next month.
  const today = new Date();
  const dateFrom = filters.dateFrom || format(firstOfMonth(today), DATE_FMT);
  const dateTo = filters.dateTo || format(firstOfNextMonth(today), DATE_FMT);

  useEffect(() => {
    if (!filters.dateFrom || !filters.dateTo) {
      setFilters({ dateFrom, dateTo });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: report, isFetching } = useTxk2Report({
    organizationId,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
  });

  const rows = report?.data ?? [];

  const [isExporting, setIsExporting] = useState(false);

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      await generateTxk2ReportExcel({
        title: t("title"),
        orgName: report?.organization_name,
        dateFrom: filters.dateFrom || dateFrom,
        dateTo: filters.dateTo || dateTo,
        headers: [
          t("locomotive"),
          t("serviceLocation"),
          t("repairType"),
          t("entryTime"),
          t("maneuverTime"),
          t("kanavaEntry"),
          t("normTime"),
          t("serviceTime"),
          t("kanavaExit"),
          t("nextType"),
          t("nextEntry"),
          t("nextExit"),
          t("totalTime"),
          t("extraTime"),
          t("delayReasonCode"),
        ],
        rows,
        locale,
        delayReasonLabels: {
          ADDITIONAL_WORKS_FOUND: tReason("ADDITIONAL_WORKS_FOUND"),
          SPARE_PARTS_SHORTAGE: tReason("SPARE_PARTS_SHORTAGE"),
          LABOR_SHORTAGE: tReason("LABOR_SHORTAGE"),
          OTHER: tReason("OTHER"),
        },
        metaLabels: { organization: t("organization"), period: t("period") },
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Page>
      {/* ─── Header Card ─── */}
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <ExportActions
            onExcel={handleExportExcel}
            busy={isExporting ? "excel" : null}
            disabled={organizationId == null || rows.length === 0}
          />
        }
        filters={
          <FilterBar>
            <ReportOrganizationSelect />
            <FilterField label={tc("period")} width="lg">
              <DateRangeField
                value={{ from: new Date(dateFrom), to: new Date(dateTo) }}
                onChange={({ from, to }) => {
                  if (from && to) {
                    setFilters({ dateFrom: format(from, DATE_FMT), dateTo: format(to, DATE_FMT) });
                  }
                }}
              />
            </FilterField>
            <FilterReset
              active={
                dateFrom !== format(firstOfMonth(today), DATE_FMT) ||
                dateTo !== format(firstOfNextMonth(today), DATE_FMT)
              }
              onReset={() =>
                setFilters({
                  dateFrom: format(firstOfMonth(today), DATE_FMT),
                  dateTo: format(firstOfNextMonth(today), DATE_FMT),
                })
              }
            />
          </FilterBar>
        }
      />

      {/* Content */}
      {organizationId == null ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground text-sm border rounded-lg">
          {t("selectOrganization")}
        </div>
      ) : isFetching && !report ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden shadow-sm">
          {/* Report header */}
          <div className="px-4 py-2.5 bg-muted/60 border-b flex items-center gap-2">
            <span className="font-semibold text-sm">
              {report?.organization_name}
            </span>
            <span className="text-xs text-muted-foreground">
              ({rows.length} {t("rowsSuffix")})
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto py-2">
            <Table wrapper={false} className="w-full text-sm border-collapse">
              <TableHeader>
                <TableRow className="bg-muted/40 text-2xs font-semibold text-muted-foreground tracking-wide align-bottom">
                  <TableHead className="border px-2 py-2 text-center w-8">#</TableHead>
                  <TableHead className="border px-3 py-2 text-left whitespace-nowrap">{t("locomotive")}</TableHead>
                  <TableHead className="border px-3 py-2 text-left whitespace-nowrap">{t("serviceLocation")}</TableHead>
                  <TableHead className="border px-3 py-2 text-center whitespace-nowrap">{t("repairType")}</TableHead>
                  <TableHead className="border px-3 py-2 text-center min-w-[90px]">{t("entryTime")}</TableHead>
                  <TableHead className="border px-3 py-2 text-center min-w-[120px]">{t("maneuverTime")}</TableHead>
                  <TableHead className="border px-3 py-2 text-center min-w-[110px]">{t("kanavaEntry")}</TableHead>
                  <TableHead className="border px-3 py-2 text-center min-w-[120px]">{t("normTime")}</TableHead>
                  <TableHead className="border px-3 py-2 text-center min-w-[110px]">{t("serviceTime")}</TableHead>
                  <TableHead className="border px-3 py-2 text-center min-w-[110px]">{t("kanavaExit")}</TableHead>
                  <TableHead className="border px-3 py-2 text-center min-w-[120px]">{t("nextType")}</TableHead>
                  <TableHead className="border px-3 py-2 text-center min-w-[130px]">{t("nextEntry")}</TableHead>
                  <TableHead className="border px-3 py-2 text-center min-w-[130px]">{t("nextExit")}</TableHead>
                  <TableHead className="border px-3 py-2 text-center min-w-[110px]">{t("totalTime")}</TableHead>
                  <TableHead className="border px-3 py-2 text-center min-w-[120px]">{t("extraTime")}</TableHead>
                  <TableHead className="border px-3 py-2 text-center min-w-[170px]">{t("delayReasonCode")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row: Txk2ReportRow, idx) => (
                  <TableRow
                    key={idx}
                    className={cn(
                      "hover:bg-muted/30 transition-colors",
                      idx % 2 === 0 ? "bg-background" : "bg-muted/10",
                    )}
                  >
                    <TableCell className="border px-2 py-2 text-center text-muted-foreground text-xs">{idx + 1}</TableCell>
                    <TableCell className="border px-3 py-2 font-medium whitespace-nowrap">{row.locomotive.split("|").join(" ")}</TableCell>
                    <TableCell className="border px-3 py-2 whitespace-nowrap text-xs">{row.branch}</TableCell>
                    <TableCell className="border px-3 py-2 text-center text-xs">{row.inspection_type}</TableCell>
                    <TableCell className="border px-3 py-2 text-center text-xs whitespace-nowrap">{fmtTime(row.entry_time)}</TableCell>
                    <TableCell className="border px-3 py-2 text-center text-xs">{fmtNum(row.fixed_maneuver_time)}</TableCell>
                    <TableCell className="border px-3 py-2 text-center text-xs whitespace-nowrap">{fmtTime(row.kanava_entry_time)}</TableCell>
                    <TableCell className="border px-3 py-2 text-center text-xs text-muted-foreground">{fmtNum(row.standard_duration)}</TableCell>
                    <TableCell className="border px-3 py-2 text-center text-xs">{fmtNum(row.technical_service_hours)}</TableCell>
                    <TableCell className="border px-3 py-2 text-center text-xs whitespace-nowrap">{fmtTime(row.kanava_exit_time)}</TableCell>
                    <TableCell className="border px-3 py-2 text-center text-xs whitespace-nowrap">{nextTypeName(row.next_inspection_type, locale) ?? "—"}</TableCell>
                    <TableCell className="border px-3 py-2 text-center text-xs whitespace-nowrap">{fmtTime(row.next_entry_time)}</TableCell>
                    <TableCell className="border px-3 py-2 text-center text-xs whitespace-nowrap">{fmtTime(row.next_exit_time)}</TableCell>
                    <TableCell className="border px-3 py-2 text-center text-xs font-medium">{fmtNum(row.total_time_hours)}</TableCell>
                    <TableCell className="border px-3 py-2 text-center text-xs">{fmtNum(row.time_except_inspection)}</TableCell>
                    <TableCell className="border px-3 py-2 text-left text-xs">
                      {row.delay_reason_code ? (
                        <>
                          <span className="font-medium">{delayLabel(row.delay_reason_code)}</span>
                          {row.delay_reason_details ? (
                            <span className="block text-2xs text-muted-foreground mt-0.5">
                              {row.delay_reason_details}
                            </span>
                          ) : null}
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {rows.length === 0 && !isFetching && (
            <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
              {t("noData")}
            </div>
          )}
        </div>
      )}
    </Page>
  );
}

export default withRole(Txk2ReportPage, [
  "admin",
  "payroll_admin",
  "tchzr",
  "urbpl",
  "dejurniy",
  "moderator",
]);
