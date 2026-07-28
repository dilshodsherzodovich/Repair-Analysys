"use client";

import { useEffect, useState } from "react";
import { withRole } from "@/components/withRole";
import {
  useTxk2Report,
  Txk2ReportRow,
  NextInspectionType,
} from "@/api/hooks/use-txk2-report";
import { Loader2, CalendarIcon, Check, RotateCcw, ArrowRight, FileDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReportFilters } from "@/lib/hooks/useReportFilters";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/ui/button";
import { Calendar } from "@/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/ui/popover";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import { generateTxk2ReportExcel } from "@/utils/txk2-report-excel-export";
import {
  ReportOrganizationSelect,
  useReportOrganization,
} from "@/components/reports/report-organization-select";

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
    <div className="space-y-4">
      {/* ─── Header Card ─── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-gray-900 font-semibold text-base leading-tight">
                {t("title")}
              </h1>
              <p className="text-gray-400 text-xs mt-0.5">
                {t("description")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportExcel}
              disabled={isExporting || organizationId == null || rows.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              {isExporting ? t("generatingExcel") : t("exportExcel")}
            </button>
          </div>
        </div>
        <div className="px-5 py-3 bg-gray-50/60">
          <Txk2DateFilter dateFrom={dateFrom} dateTo={dateTo} />
        </div>
      </div>

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
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted/40 text-[11px] font-semibold text-muted-foreground tracking-wide align-bottom">
                  <th className="border px-2 py-2 text-center w-8">#</th>
                  <th className="border px-3 py-2 text-left whitespace-nowrap">{t("locomotive")}</th>
                  <th className="border px-3 py-2 text-left whitespace-nowrap">{t("serviceLocation")}</th>
                  <th className="border px-3 py-2 text-center whitespace-nowrap">{t("repairType")}</th>
                  <th className="border px-3 py-2 text-center min-w-[90px]">{t("entryTime")}</th>
                  <th className="border px-3 py-2 text-center min-w-[120px]">{t("maneuverTime")}</th>
                  <th className="border px-3 py-2 text-center min-w-[110px]">{t("kanavaEntry")}</th>
                  <th className="border px-3 py-2 text-center min-w-[120px]">{t("normTime")}</th>
                  <th className="border px-3 py-2 text-center min-w-[110px]">{t("serviceTime")}</th>
                  <th className="border px-3 py-2 text-center min-w-[110px]">{t("kanavaExit")}</th>
                  <th className="border px-3 py-2 text-center min-w-[120px]">{t("nextType")}</th>
                  <th className="border px-3 py-2 text-center min-w-[130px]">{t("nextEntry")}</th>
                  <th className="border px-3 py-2 text-center min-w-[130px]">{t("nextExit")}</th>
                  <th className="border px-3 py-2 text-center min-w-[110px]">{t("totalTime")}</th>
                  <th className="border px-3 py-2 text-center min-w-[120px]">{t("extraTime")}</th>
                  <th className="border px-3 py-2 text-center min-w-[170px]">{t("delayReasonCode")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row: Txk2ReportRow, idx) => (
                  <tr
                    key={idx}
                    className={cn(
                      "hover:bg-muted/30 transition-colors",
                      idx % 2 === 0 ? "bg-background" : "bg-muted/10",
                    )}
                  >
                    <td className="border px-2 py-2 text-center text-muted-foreground text-xs">{idx + 1}</td>
                    <td className="border px-3 py-2 font-medium whitespace-nowrap">{row.locomotive.split("|").join(" ")}</td>
                    <td className="border px-3 py-2 whitespace-nowrap text-xs">{row.branch}</td>
                    <td className="border px-3 py-2 text-center text-xs">{row.inspection_type}</td>
                    <td className="border px-3 py-2 text-center text-xs whitespace-nowrap">{fmtTime(row.entry_time)}</td>
                    <td className="border px-3 py-2 text-center text-xs">{fmtNum(row.fixed_maneuver_time)}</td>
                    <td className="border px-3 py-2 text-center text-xs whitespace-nowrap">{fmtTime(row.kanava_entry_time)}</td>
                    <td className="border px-3 py-2 text-center text-xs text-muted-foreground">{fmtNum(row.standard_duration)}</td>
                    <td className="border px-3 py-2 text-center text-xs">{fmtNum(row.technical_service_hours)}</td>
                    <td className="border px-3 py-2 text-center text-xs whitespace-nowrap">{fmtTime(row.kanava_exit_time)}</td>
                    <td className="border px-3 py-2 text-center text-xs whitespace-nowrap">{nextTypeName(row.next_inspection_type, locale) ?? "—"}</td>
                    <td className="border px-3 py-2 text-center text-xs whitespace-nowrap">{fmtTime(row.next_entry_time)}</td>
                    <td className="border px-3 py-2 text-center text-xs whitespace-nowrap">{fmtTime(row.next_exit_time)}</td>
                    <td className="border px-3 py-2 text-center text-xs font-medium">{fmtNum(row.total_time_hours)}</td>
                    <td className="border px-3 py-2 text-center text-xs">{fmtNum(row.time_except_inspection)}</td>
                    <td className="border px-3 py-2 text-left text-xs">
                      {row.delay_reason_code ? (
                        <>
                          <span className="font-medium">{delayLabel(row.delay_reason_code)}</span>
                          {row.delay_reason_details ? (
                            <span className="block text-[10px] text-muted-foreground mt-0.5">
                              {row.delay_reason_details}
                            </span>
                          ) : null}
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {rows.length === 0 && !isFetching && (
            <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
              {t("noData")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Txk2DateFilter({
  dateFrom,
  dateTo,
}: {
  dateFrom: string;
  dateTo: string;
}) {
  const t = useTranslations("Txk2Report");
  const { setFilters } = useReportFilters();

  const [from, setFrom] = useState<Date | undefined>(() => new Date(dateFrom));
  const [to, setTo] = useState<Date | undefined>(() => new Date(dateTo));

  const handleApply = () => {
    if (from && to) {
      setFilters({
        dateFrom: format(from, DATE_FMT),
        dateTo: format(to, DATE_FMT),
      });
    }
  };

  const handleReset = () => {
    const today = new Date();
    const f = firstOfMonth(today);
    const tt = firstOfNextMonth(today);
    setFrom(f);
    setTo(tt);
    setFilters({ dateFrom: format(f, DATE_FMT), dateTo: format(tt, DATE_FMT) });
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <ReportOrganizationSelect label={t("organization")} />
      <DateBox label={t("fromDate")} date={from} onSelect={setFrom} />
      <ArrowRight className="w-4 h-4 text-gray-300 shrink-0 mb-2.5" />
      <DateBox label={t("toDate")} date={to} onSelect={setTo} />
      <Button
        onClick={handleApply}
        className="h-9 px-4 text-sm bg-blue-600 hover:bg-blue-700 gap-1.5 mb-0"
      >
        <Check className="w-3.5 h-3.5" />
        {t("apply")}
      </Button>
      <button
        onClick={handleReset}
        title={t("reset")}
        className="h-9 w-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function DateBox({
  label,
  date,
  onSelect,
}: {
  label: string;
  date: Date | undefined;
  onSelect: (d: Date | undefined) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider pl-1">
        {label}
      </span>
      <Popover>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-2 px-3 h-9 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors whitespace-nowrap border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800/50 shadow-sm">
            <CalendarIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            {date ? format(date, "dd.MM.yyyy") : "—"}
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

export default withRole(Txk2ReportPage, [
  "admin",
  "payroll_admin",
  "tchzr",
  "urbpl",
  "dejurniy",
  "moderator",
]);
