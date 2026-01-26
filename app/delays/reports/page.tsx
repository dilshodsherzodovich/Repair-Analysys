"use client";

import { useMemo, useEffect } from "react";
import { PageHeader } from "@/ui/page-header";
import { useFilterParams } from "@/lib/hooks/useFilterParams";
import { useDelayReports } from "@/api/hooks/use-delays";
import { format, subDays } from "date-fns";
import {
  canAccessSection,
} from "@/lib/permissions";
import UnauthorizedPage from "@/app/unauthorized/page";
import { DelayReportsFilters } from "@/components/delays/delay-reports-filters";
import { DelayReportsTableByDelayType } from "@/components/delays/delay-reports-table-by-delay-type";

export default function DelayReportsPage() {
  const { getAllQueryValues, updateQuery } = useFilterParams();
  const {
    start_date,
    end_date,
    organizations: organizationsParam,
  } = getAllQueryValues();

  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  if (!currentUser || !canAccessSection(currentUser, "delays")) {
    return <UnauthorizedPage />;
  }

  // Initialize default dates (last 30 days) if not set
  useEffect(() => {
    if (!start_date || !end_date) {
      const today = new Date();
      const thirtyDaysAgo = subDays(today, 30);
      updateQuery({
        start_date: format(thirtyDaysAgo, "yyyy-MM-dd"),
        end_date: format(today, "yyyy-MM-dd"),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Parse date strings to Date objects
  const startDate = start_date ? new Date(start_date) : undefined;
  const endDate = end_date ? new Date(end_date) : undefined;

  // Parse organizations from comma-separated string
  const selectedOrganizations = useMemo(() => {
    if (!organizationsParam) return [];
    return organizationsParam.split(",").filter(Boolean);
  }, [organizationsParam]);

  // Prepare API params
  const reportParams = useMemo(() => {
    if (!startDate || !endDate) return undefined;
    const params: any = {
      start_date: format(startDate, "yyyy-MM-dd"),
      end_date: format(endDate, "yyyy-MM-dd"),
    };
    if (selectedOrganizations.length > 0) {
      params.organizations = selectedOrganizations.join(",");
    }
    return params;
  }, [startDate, endDate, selectedOrganizations]);

  // Fetch delay reports
  const {
    data: reportData,
    isLoading,
    error: apiError,
  } = useDelayReports(reportParams);

  const breadcrumbs = [
    { label: "Asosiy", href: "/" },
    { label: "Sriv hisobotlar", current: true },
  ];

  const error =
    apiError instanceof Error
      ? apiError
      : apiError
        ? new Error(apiError?.message || "Xatolik yuz berdi")
        : null;

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Sriv hisobotlar"
        description="Poyezd kechikishlar hisobotlari"
        breadcrumbs={breadcrumbs}
      />

      <DelayReportsFilters />

      <DelayReportsTableByDelayType
        data={reportData}
        isLoading={isLoading}
        error={error}
        startDate={startDate}
        endDate={endDate}
        start_date={start_date}
        end_date={end_date}
      />
    </div>
  );
}
