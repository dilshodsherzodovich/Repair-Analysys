"use client";

import { useMemo, useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { format, differenceInDays } from "date-fns";
import { PageHeader } from "@/ui/page-header";
import PageFilters, { type FiltersQuery } from "@/ui/filters";
import { Tabs, TabsList, TabsTrigger } from "@/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";
import { TableSkeleton } from "@/ui/table-skeleton";
import { useFilterParams } from "@/lib/hooks/useFilterParams";
import { useOrganizations } from "@/api/hooks/use-organizations";
import { useLocomotiveMileageReport } from "@/api/hooks/use-locomotive-mileage-report";
import { locomotiveMileageReportService } from "@/api/services/locomotive-mileage-report.service";
import type {
  LocomotiveMileageReportResponse,
  MileageReportLocomotiveData,
  MileageReportInspectionEntry,
} from "@/api/types/locomotive-mileage-report";
import {
  MILEAGE_REPORT_INSPECTION_KEYS,
  MILEAGE_REPORT_INSPECTION_LABELS,
} from "@/api/types/locomotive-mileage-report";
import { cn } from "@/lib/utils";
import { canAccessSection } from "@/lib/permissions";
import { useSnackbar } from "@/providers/snackbar-provider";
import UnauthorizedPage from "../unauthorized/page";
import type { UserData } from "@/api/types/auth";

type DisplayMode = "km" | "kun";

function formatReportDate(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "—";
    return format(d, "dd.MM.yyyy");
  } catch {
    return "—";
  }
}

function getDaysFromToday(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "—";
    const days = differenceInDays(new Date(), d);
    return String(days);
  } catch {
    return "—";
  }
}

function flattenReport(
  data: LocomotiveMileageReportResponse | undefined
): { locomotive: string; model: string; locNumber: string; data: MileageReportLocomotiveData }[] {
  if (!data) return [];
  const rows: { locomotive: string; model: string; locNumber: string; data: MileageReportLocomotiveData }[] = [];
  for (const [modelName, locs] of Object.entries(data)) {
    if (!locs || typeof locs !== "object") continue;
    for (const [locNumber, locData] of Object.entries(locs)) {
      if (!locData || typeof locData !== "object") continue;
      rows.push({
        locomotive: `${locNumber} ${modelName}`,
        model: modelName,
        locNumber,
        data: locData as MileageReportLocomotiveData,
      });
    }
  }
  return rows;
}

function getEntry(
  data: MileageReportLocomotiveData,
  key: (typeof MILEAGE_REPORT_INSPECTION_KEYS)[number]
): MileageReportInspectionEntry {
  return data[key] ?? { date: null, mileage: 0 };
}

export default function LocomotiveMileageReportPage() {
  const t = useTranslations("LocomotiveMileageReportPage");
  const searchParams = useSearchParams();
  const { updateQuery, getQueryValue } = useFilterParams();

  const currentUser: UserData | null =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "null")
      : null;

  if (!currentUser || !canAccessSection(currentUser, "inspections")) {
    return <UnauthorizedPage />;
  }

  const organizationParam = getQueryValue("organization");
  const locNumberParam = getQueryValue("loc_number");
  const tabParam = (getQueryValue("tab") as DisplayMode) || "km";

  const [displayMode, setDisplayMode] = useState<DisplayMode>(tabParam);
  const [isExporting, setIsExporting] = useState(false);

  const { data: organizationsData, isLoading: isLoadingOrganizations } =
    useOrganizations();
  const organizations = Array.isArray(organizationsData)
    ? organizationsData
    : (organizationsData as { results?: { id: number; name: string }[] } | undefined)
        ?.results ?? [];

  const organizationId = organizationParam ? Number(organizationParam) : undefined;
  const reportParams = useMemo(
    () =>
      organizationId != null
        ? {
            organization: organizationId,
            loc_number: locNumberParam || undefined,
          }
        : null,
    [organizationId, locNumberParam]
  );

  const { data: reportData, isLoading: isLoadingReport } =
    useLocomotiveMileageReport(reportParams);

  // When user is not admin, set organization to their organization
  useEffect(() => {
    if (!currentUser || currentUser.role === "admin") return;
    const userOrgId = (currentUser.branch as { organization?: { id: number } } | undefined)
      ?.organization?.id;
    if (userOrgId == null) return;
    if (organizationParam !== String(userOrgId)) {
      updateQuery({ organization: String(userOrgId) });
    }
  }, [currentUser, organizationParam, updateQuery]);

  // Sync URL tab with local state
  useEffect(() => {
    const tab = (searchParams.get("tab") as DisplayMode) || "km";
    setDisplayMode(tab);
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    const mode = value as DisplayMode;
    setDisplayMode(mode);
    updateQuery({ tab: mode });
  };

  const flatRows = useMemo(() => flattenReport(reportData), [reportData]);
  const { showError } = useSnackbar();

  const handleExport = useCallback(async () => {
    if (organizationId == null) {
      showError(t("choose_organization"));
      return;
    }
    setIsExporting(true);
    try {
      const blob = await locomotiveMileageReportService.exportExcel({
        organization: organizationId,
        search: locNumberParam || undefined,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${t("export_filename")}-${format(new Date(), "yyyy-MM-dd")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      showError(
        err instanceof Error ? err.message : t("export_error")
      );
    } finally {
      setIsExporting(false);
    }
  }, [organizationId, locNumberParam, showError, t]);

  const pageFilters = useMemo((): FiltersQuery[] => {
    const orgOptions = [
      { label: t("choose_organization"), value: "" },
      ...organizations.map((org: { id: number; name: string }) => ({
        label: org.name,
        value: String(org.id),
      })),
    ];
    return [
      {
        name: "loc_number",
        label: t("loc_number_placeholder"),
        isSelect: false,
        placeholder: t("loc_number_placeholder"),
      },
      {
        name: "organization",
        label: t("choose_organization"),
        isSelect: true,
        options: orgOptions,
        placeholder: t("choose_organization"),
        loading: isLoadingOrganizations,
        permission: "choose_inspection_organization",
      },
    ];
  }, [organizations, isLoadingOrganizations, t]);

  useEffect(() => {
    if (organizationId != null || isLoadingOrganizations || organizations.length === 0) return;
    const firstOrg = organizations[0] as { id: number } | undefined;
    if (firstOrg?.id != null) {
      updateQuery({ organization: String(firstOrg.id) });
    }
  }, [organizationId, isLoadingOrganizations, organizations, updateQuery]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
      />

      <div className="mb-4">
        <Tabs value={displayMode} onValueChange={handleTabChange}>
          <TabsList className="bg-white border border-gray-200 p-1 gap-2 rounded-md inline-flex">
            <TabsTrigger
              value="km"
              className="px-3 py-2 text-sm font-semibold transition-all duration-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-gray-700 data-[state=inactive]:hover:text-gray-900 data-[state=inactive]:hover:bg-gray-50 data-[state=inactive]:hover:border-gray-300"
            >
              {t("tab_km")}
            </TabsTrigger>
            <TabsTrigger
              value="kun"
              className="px-3 py-2 text-sm font-semibold transition-all duration-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-gray-700 data-[state=inactive]:hover:text-gray-900 data-[state=inactive]:hover:bg-gray-50 data-[state=inactive]:hover:border-gray-300"
            >
              {t("tab_kun")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <PageFilters
        filters={pageFilters}
        hasSearch={false}
        onExport={handleExport}
        exportButtonText={t("export_excel")}
        exportLoading={isExporting}
      />

      <div className="rounded-lg border border-[#CAD5E2] overflow-hidden bg-white">
        {isLoadingReport ? (
          <Table className="w-full min-w-[900px]">
            <TableHeader>
              <TableRow className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <TableHead className="min-w-[140px] py-3 px-4 text-[#475569] font-medium border-r border-[#E2E8F0]">
                  {t("columns.locomotive")}
                </TableHead>
                {MILEAGE_REPORT_INSPECTION_KEYS.map((key) => (
                  <TableHead
                    key={key}
                    colSpan={2}
                    className="min-w-[120px] py-3 px-4 text-[#475569] font-medium border-r border-[#E2E8F0] last:border-r-0 text-center"
                  >
                    {MILEAGE_REPORT_INSPECTION_LABELS[key]}
                  </TableHead>
                ))}
              </TableRow>
              <TableRow className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <TableHead className="py-2 px-4 border-r border-[#E2E8F0]" />
                {MILEAGE_REPORT_INSPECTION_KEYS.flatMap((key) => [
                  <TableHead key={`${key}-sana`} className="py-2 px-4 text-[#64748B] text-sm font-normal border-r border-[#E2E8F0]">
                    {t("columns.sana")}
                  </TableHead>,
                  <TableHead key={`${key}-masofa`} className="py-2 px-4 text-[#64748B] text-sm font-normal border-r border-[#E2E8F0] last:border-r-0">
                    {displayMode === "kun" ? t("columns.den") : t("columns.masofa")}
                  </TableHead>,
                ])}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableSkeleton
                rows={8}
                columns={1 + MILEAGE_REPORT_INSPECTION_KEYS.length * 2}
                cellClassName="py-3 px-4"
              />
            </TableBody>
          </Table>
        ) : (
          <Table className="w-full min-w-[900px]">
            <TableHeader>
              <TableRow className="bg-[#F8FAFC] hover:bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <TableHead className="min-w-[140px] py-3 px-4 text-[#475569] font-medium border-r border-[#E2E8F0]">
                  {t("columns.locomotive")}
                </TableHead>
                {MILEAGE_REPORT_INSPECTION_KEYS.map((key) => (
                  <TableHead
                    key={key}
                    colSpan={2}
                    className="min-w-[120px] py-3 px-4 text-[#475569] font-medium border-r border-[#E2E8F0] last:border-r-0 text-center"
                  >
                    {MILEAGE_REPORT_INSPECTION_LABELS[key]}
                  </TableHead>
                ))}
              </TableRow>
              <TableRow className="bg-[#F8FAFC] hover:bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <TableHead className="py-2 px-4 border-r border-[#E2E8F0]" />
                {MILEAGE_REPORT_INSPECTION_KEYS.flatMap((key) => [
                  <TableHead key={`${key}-sana`} className="py-2 px-4 text-[#64748B] text-sm font-normal border-r border-[#E2E8F0] w-[100px]">
                    {t("columns.sana")}
                  </TableHead>,
                  <TableHead key={`${key}-masofa`} className="py-2 px-4 text-[#64748B] text-sm font-normal border-r border-[#E2E8F0] last:border-r-0 w-[90px]">
                    {displayMode === "kun" ? t("columns.den") : t("columns.masofa")}
                  </TableHead>,
                ])}
              </TableRow>
            </TableHeader>
            <TableBody>
              {flatRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={1 + MILEAGE_REPORT_INSPECTION_KEYS.length * 2}
                    className="py-8 text-center text-[#64748B]"
                  >
                    {t("empty_title")}
                  </TableCell>
                </TableRow>
              ) : (
                flatRows.map((row) => (
                  <TableRow
                    key={row.locomotive}
                    className="hover:bg-[#F8FAFC] border-b border-[#E2E8F0] last:border-b-0"
                  >
                    <TableCell className="py-3 px-4 text-[#0F172B] font-medium border-r border-[#E2E8F0]">
                      {row.locomotive}
                    </TableCell>
                    {MILEAGE_REPORT_INSPECTION_KEYS.flatMap((key, idx) => {
                      const entry = getEntry(row.data, key);
                      const masofaValue =
                        displayMode === "km"
                          ? (entry.mileage != null && entry.mileage > 0
                              ? String(entry.mileage)
                              : "0")
                          : getDaysFromToday(entry.date);
                      const isLast = idx === MILEAGE_REPORT_INSPECTION_KEYS.length - 1;
                      return [
                        <TableCell
                          key={`${row.locomotive}-${key}-sana`}
                          className="py-3 px-4 text-[#64748B] border-r border-[#E2E8F0]"
                        >
                          {formatReportDate(entry.date)}
                        </TableCell>,
                        <TableCell
                          key={`${row.locomotive}-${key}-masofa`}
                          className={cn(
                            "py-3 px-4 text-[#0F172B] font-medium border-r border-[#E2E8F0]",
                            isLast && "border-r-0"
                          )}
                        >
                          {masofaValue}
                        </TableCell>,
                      ];
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
