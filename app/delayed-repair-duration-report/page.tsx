"use client";

import { useMemo, useState } from "react";
import { withRole } from "@/components/withRole";
import { useDelayedRepairDurationReport, DelayedRepairDurationRow } from "@/api/hooks/use-delayed-repair-duration-report";
import { useBranches } from "@/api/hooks/use-branches";
import { useGetInspectionTypes } from "@/api/hooks/use-inspection-types";
import { useReportFilters } from "@/lib/hooks/useReportFilters";
import { useTranslations, useLocale } from "next-intl";
import { format } from "date-fns";
import { generateDelayedRepairDurationExcel } from "@/utils/delayed-repair-duration-report-excel-export";
import { ReportOrganizationSelect, useReportOrganization } from "@/components/reports/report-organization-select";
import { PageHeader } from "@/ui/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import { ExportActions } from "@/ui/export-actions";
import { FilterBar, FilterField, FilterReset } from "@/ui/filter-bar";
import { DateRangeField } from "@/ui/date-range-field";
import { SearchableSelect } from "@/ui/select";
import { Page } from "@/ui/page";

import { LoadingState, EmptyState } from "@/ui/empty-state";
import { formatNumber, formatShortDateTime } from "@/lib/format";
const DATE_FMT = "yyyy-MM-dd";

function firstOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

// Time fields arrive as "yyyy-MM-dd HH:mm" (or ISO, or null). Show "dd.MM HH:mm".
function fmtTime(value: string | null): string {
  return formatShortDateTime(value);
}

const fmtNum = (value: number | null) => formatNumber(value);

// Overrun = spent time − norm time. Null if either side is missing.
function delayedAmount(row: DelayedRepairDurationRow): number | null {
  if (row.delayed_hours == null || row.interval_hours == null) return null;
  return row.delayed_hours - row.interval_hours;
}

function DelayedRepairDurationReportPage() {
  const t = useTranslations("DelayedRepairDurationReport");
  const tReason = useTranslations("Inspects.detail.delayReason");
  const locale = useLocale();
  const { filters } = useReportFilters();

  const { organizationId: organization } = useReportOrganization();

  const today = useMemo(() => new Date(), []);
  const tc = useTranslations("Common");
  const [from, setFrom] = useState<Date | undefined>(() => firstOfMonth(today));
  const [to, setTo] = useState<Date | undefined>(() => today);
  const [branch, setBranch] = useState<string>("all");
  const [inspectionType, setInspectionType] = useState<string>("all");
  const [status, setStatus] = useState<string>("all"); // all | closed | open

  const fromDate = from ? format(from, DATE_FMT) : undefined;
  const toDate = to ? format(to, DATE_FMT) : undefined;

  const { data: branches } = useBranches();
  const { data: inspectionTypes } = useGetInspectionTypes();

  const filteredBranches = useMemo(() => {
    if (!branches) return [];
    if (!organization) return branches;
    return branches.filter((b) => b.organization.id === organization);
  }, [branches, organization]);

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

  const typeName = (it: { name: string; name_uz: string; name_ru: string }) =>
    locale === "ru"
      ? it.name_ru || it.name || it.name_uz
      : it.name_uz || it.name || it.name_ru;

  const { data: report, isFetching } = useDelayedRepairDurationReport({
    fromDate,
    toDate,
    organization,
    branch: branch !== "all" ? Number(branch) : undefined,
    inspectionType: inspectionType !== "all" ? Number(inspectionType) : undefined,
    isClosed: status === "all" ? undefined : status === "closed",
  });

  const rows = report?.data ?? [];

  const orgName =
    rows[0]?.organization_name ??
    branches?.find((b) => b.organization.id === organization)?.organization.name;

  const handleReset = () => {
    setFrom(firstOfMonth(today));
    setTo(today);
    setBranch("all");
    setInspectionType("all");
    setStatus("all");
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      await generateDelayedRepairDurationExcel({
        title: t("title"),
        orgName,
        dateFrom: fromDate || "",
        dateTo: toDate || "",
        headers: [
          t("locomotive"),
          t("branch"),
          t("inspectionType"),
          t("entryTime"),
          t("kanavaEntry"),
          t("closeTime"),
          t("intervalHours"),
          t("delayedHours"),
          t("delayedAmount"),
          t("delayReason"),
        ],
        rows,
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
            disabled={rows.length === 0}
          />
        }
        filters={
          <FilterBar>
            <ReportOrganizationSelect />
            <FilterField label={tc("period")} width="lg">
              <DateRangeField
                value={{ from, to }}
                onChange={(range) => {
                  setFrom(range.from);
                  setTo(range.to);
                }}
              />
            </FilterField>
            <FilterField label={t("branch")}>
              <SearchableSelect
                size="md"
                value={branch === "all" ? "" : branch}
                onValueChange={(v) => setBranch(v || "all")}
                placeholder={tc("all")}
                options={[
                  { value: "", label: tc("all") },
                  ...filteredBranches.map((b) => ({ value: b.id.toString(), label: b.name })),
                ]}
              />
            </FilterField>
            <FilterField label={t("inspectionType")}>
              <SearchableSelect
                size="md"
                value={inspectionType === "all" ? "" : inspectionType}
                onValueChange={(v) => setInspectionType(v || "all")}
                placeholder={tc("all")}
                options={[
                  { value: "", label: tc("all") },
                  ...(inspectionTypes ?? []).map((it) => ({ value: it.id.toString(), label: typeName(it) })),
                ]}
              />
            </FilterField>
            <FilterField label={t("status")}>
              <SearchableSelect
                size="md"
                value={status === "all" ? "" : status}
                onValueChange={(v) => setStatus(v || "all")}
                placeholder={tc("all")}
                options={[
                  { value: "", label: tc("all") },
                  { value: "closed", label: t("statusClosed") },
                  { value: "open", label: t("statusOpen") },
                ]}
              />
            </FilterField>
            <FilterReset
              active={
                branch !== "all" ||
                inspectionType !== "all" ||
                status !== "all" ||
                from?.getTime() !== firstOfMonth(today).getTime() ||
                to?.toDateString() !== today.toDateString()
              }
              onReset={handleReset}
            />
          </FilterBar>
        }
      />

      {/* Content */}
      {isFetching && !report ? (
        <LoadingState size="page" />
      ) : (
        <div className="rounded-lg border overflow-hidden shadow-sm">
          {/* Report header */}
          <div className="px-4 py-2.5 bg-muted/60 border-b flex items-center gap-2">
            {/* Always one organization now, so the old "all organizations"
                fallback would be wrong — show the generic label until the
                name resolves. */}
            <span className="font-semibold text-sm">{orgName ?? t("organization")}</span>
            <span className="text-xs text-muted-foreground">
              ({rows.length} {t("rowsSuffix")})
            </span>
          </div>

          {/* Table */}
          <Table bordered density="compact">
            <TableHeader>
              <TableRow className="align-bottom">
                <TableHead className="text-center w-8">#</TableHead>
                <TableHead className="text-left">{t("locomotive")}</TableHead>
                <TableHead className="text-left">{t("branch")}</TableHead>
                <TableHead className="text-center">{t("inspectionType")}</TableHead>
                <TableHead className="text-center min-w-[110px]">{t("entryTime")}</TableHead>
                <TableHead className="text-center min-w-[110px]">{t("kanavaEntry")}</TableHead>
                <TableHead className="text-center min-w-[110px]">{t("closeTime")}</TableHead>
                <TableHead className="text-center min-w-[100px]">{t("intervalHours")}</TableHead>
                <TableHead className="text-center min-w-[100px]">{t("delayedHours")}</TableHead>
                <TableHead className="text-center min-w-[100px]">{t("delayedAmount")}</TableHead>
                <TableHead className="text-left min-w-[170px]">{t("delayReason")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row: DelayedRepairDurationRow, idx) => (
                <TableRow
                  key={row.id ?? idx}
                  
                >
                  <TableCell className="text-center">{idx + 1}</TableCell>
                  <TableCell className="font-medium whitespace-nowrap">
                    {[row.locomotive_name, row.locomotive_model_name].filter(Boolean).join(" ")}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{row.branch_name}</TableCell>
                  <TableCell className="text-center">{row.inspection_type_name}</TableCell>
                  <TableCell className="text-center whitespace-nowrap">{fmtTime(row.entry_time)}</TableCell>
                  <TableCell className="text-center whitespace-nowrap">{fmtTime(row.kanava_entry_time)}</TableCell>
                  <TableCell className="text-center whitespace-nowrap">{fmtTime(row.close_time)}</TableCell>
                  <TableCell className="text-center">{fmtNum(row.interval_hours)}</TableCell>
                  <TableCell className="text-center">{fmtNum(row.delayed_hours)}</TableCell>
                  <TableCell className="text-center font-semibold text-destructive">{fmtNum(delayedAmount(row))}</TableCell>
                  <TableCell className="text-left">
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

          {rows.length === 0 && !isFetching && (
            <EmptyState title={t("noData")} size="page" />
          )}
        </div>
      )}
    </Page>
  );
}

export default withRole(DelayedRepairDurationReportPage, [
  "admin",
  "payroll_admin",
  "tchzr",
  "urbpl",
  "dejurniy",
  "moderator",
]);
