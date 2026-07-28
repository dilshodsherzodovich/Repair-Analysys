"use client";

import { Button } from "@/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { useState } from "react";
import api from "@/api/axios";
import { useReportFilters } from "@/lib/hooks/useReportFilters";
import { generateInspectionsExcel } from "@/utils/inspections-excel-export";
import { format } from "date-fns";
import { InspectionResponse } from "@/api/types/report-inspection";
import { useTranslations } from "next-intl";

export function InspectionsExcelExportButton() {
  const [isExporting, setIsExporting] = useState(false);
  const { filters } = useReportFilters();
  const t = useTranslations("Inspects");
  const tRoot = useTranslations();

  const handleExport = async () => {
    if (!filters.organization) return;
    setIsExporting(true);
    try {
      const status =
        filters.is_closed === "true"
          ? "closed"
          : filters.is_cancelled === "true"
          ? "cancelled"
          : "in_progress";

      const params: Record<string, string | number | boolean> = {
        organization: +filters.organization,
        no_page: true,
      };

      if (filters.locomotive_type) params.locomotive_type = filters.locomotive_type;
      if (filters.inspection_type) params.inspection_type = filters.inspection_type;

      if (status === "closed") {
        params.is_closed = true;
        if (filters.loc_number) params.search = filters.loc_number;
        if (filters.inspectionFromDate) params.fromDate = filters.inspectionFromDate;
        if (filters.inspectionToDate) params.toDate = filters.inspectionToDate;
      } else if (status === "cancelled") {
        params.is_cancelled = true;
      } else {
        params.is_closed = false;
        params.is_cancelled = false;
      }

      // Auth is applied by the shared axios interceptor.
      const { data: response } = await api.get<InspectionResponse>(
        "/inspections/",
        { params },
      );

      const titleMap: Record<string, string> = {
        closed: t("closed"),
        cancelled: t("canceledInspections"),
        in_progress: t("title"),
      };

      await generateInspectionsExcel({
        inspections: response.results,
        title: titleMap[status],
        status,
        exportDate: format(new Date(), "dd.MM.yyyy"),
        translations: {
          num: "№",
          locomotive: tRoot("locomotive"),
          inspectionType: t("inspectionType"),
          xkp: tRoot("xkp"),
          section: t("section"),
          author: t("author"),
          createdTime: t("createdTime"),
          closedTime: t("closedTime"),
          canceledTime: t("canceledTime"),
          lastUpdated: t("closedTime"),
          inspectionStartMileage: t("inspectionStartMileage"),
          interval: t("interval"),
          comment: t("comment"),
          total: tRoot("total"),
          exportDate: t("date"),
          period: tRoot("period"),
          sectionNames: (section: string | null) => section ? t("sectionNames." + section) : "-"
        },
        ...(filters.inspectionFromDate && { startDate: filters.inspectionFromDate }),
        ...(filters.inspectionToDate && { endDate: filters.inspectionToDate }),
      });
    } catch (error) {
      console.error("Excel export error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      className="bg-green-600 hover:bg-green-700 text-white"
    >
      {isExporting ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <FileDown className="w-4 h-4 mr-2" />
      )}
      {isExporting ? tRoot("loading") : tRoot("excelExport")}
    </Button>
  );
}
