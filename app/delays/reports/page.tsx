"use client";

import { useMemo, useEffect } from "react";
import { PageHeader } from "@/ui/page-header";
import { useFilterParams } from "@/lib/hooks/useFilterParams";
import {
  useDelayReportsByPassengerTrain,
  useDelayReportsByFreightTrain,
  useDepotReasonReports,
} from "@/api/hooks/use-delays";
import { exportDelayReportsToDoc } from "@/utils/export-delay-reports";
import { useCallback } from "react";
import { format, subDays } from "date-fns";
import {
  canAccessSection,
} from "@/lib/permissions";
import UnauthorizedPage from "@/app/unauthorized/page";
import { DelayReportsFilters } from "@/components/delays/delay-reports-filters";
import { DelayReportsTableByDelayType } from "@/components/delays/delay-reports-table-by-delay-type";
import { DelayReportsTableFreight } from "@/components/delays/delay-reports-table-freight";

export default function DelayReportsPage() {
  const { getAllQueryValues, updateQuery } = useFilterParams();
  const {
    start_date,
    end_date,
    organizations: organizationsParam,
    service_type: serviceTypeParam,
  } = getAllQueryValues();

  // Get active service type (default to "passenger")
  const activeServiceType = serviceTypeParam || "passenger";

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

  // Prepare API params for passenger trains
  const passengerReportParams = useMemo(() => {
    if (!startDate || !endDate || activeServiceType !== "passenger")
      return undefined;
    const params: any = {
      start_date: format(startDate, "yyyy-MM-dd"),
      end_date: format(endDate, "yyyy-MM-dd"),
      train_types: "passenger,electric,high_speed",
    };
    if (selectedOrganizations.length > 0) {
      params.organizations = selectedOrganizations.join(",");
    }
    return params;
  }, [startDate, endDate, selectedOrganizations, activeServiceType]);

  // Prepare API params for freight trains
  const freightReportParams = useMemo(() => {
    if (!startDate || !endDate || activeServiceType !== "freight")
      return undefined;
    const params: any = {
      start_date: format(startDate, "yyyy-MM-dd"),
      end_date: format(endDate, "yyyy-MM-dd"),
      train_type: "freight",
    };
    if (selectedOrganizations.length > 0) {
      params.organizations = selectedOrganizations.join(",");
    }
    return params;
  }, [startDate, endDate, selectedOrganizations, activeServiceType]);

  // Fetch delay reports for passenger trains
  const {
    data: passengerReportData,
    isLoading: isLoadingPassenger,
    error: passengerError,
  } = useDelayReportsByPassengerTrain(passengerReportParams);

  // Fetch delay reports for freight trains
  const {
    data: freightReportData,
    isLoading: isLoadingFreight,
    error: freightError,
  } = useDelayReportsByFreightTrain(freightReportParams);

  // Prepare params for depot reason reports
  const depotReasonParams = useMemo(() => {
    if (!startDate || !endDate) return undefined;
    const params: any = {
      start_date: format(startDate, "yyyy-MM-dd"),
      end_date: format(endDate, "yyyy-MM-dd"),
      train_type: activeServiceType,
    };
    if (selectedOrganizations.length > 0) {
      params.organizations = selectedOrganizations.join(",");
    }
    return params;
  }, [startDate, endDate, selectedOrganizations, activeServiceType]);

  // Fetch depot reason reports
  const { data: depotReasonData } = useDepotReasonReports(depotReasonParams);

  const breadcrumbs = [
    { label: "Главная", href: "/" },
    { label: "Отчеты по срывам", current: true },
  ];

  // Determine error based on active tab
  const passengerErrorObj =
    passengerError instanceof Error
      ? passengerError
      : passengerError
        ? new Error(passengerError?.message || "Произошла ошибка")
        : null;

  const freightErrorObj =
    freightError instanceof Error
      ? freightError
      : freightError
        ? new Error(freightError?.message || "Произошла ошибка")
        : null;

  const error =
    activeServiceType === "passenger" ? passengerErrorObj : freightErrorObj;

  // Export handler
  const handleExport = useCallback(() => {
    if (!start_date || !end_date) {
      alert("Пожалуйста, выберите дату начала и окончания.");
      return;
    }

    const mainReportData =
      activeServiceType === "passenger"
        ? passengerReportData
        : freightReportData;

    exportDelayReportsToDoc({
      mainReportData: mainReportData || null,
      depotReasonData: depotReasonData || null,
      startDate: start_date,
      endDate: end_date,
      serviceType: activeServiceType as "passenger" | "freight",
    });
  }, [
    start_date,
    end_date,
    activeServiceType,
    passengerReportData,
    freightReportData,
    depotReasonData,
  ]);

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Отчеты по срывам"
        description="Отчеты о задержках поездов"
        breadcrumbs={breadcrumbs}
      />

      <DelayReportsFilters onExport={handleExport} />

      {/* Show table for passenger trains */}
      {activeServiceType === "passenger" && (
        <DelayReportsTableByDelayType
          data={passengerReportData}
          isLoading={isLoadingPassenger}
          error={passengerErrorObj}
          startDate={startDate}
          endDate={endDate}
          start_date={start_date}
          end_date={end_date}
        />
      )}

      {/* Show table for freight trains */}
      {activeServiceType === "freight" && (
        <DelayReportsTableFreight
          data={freightReportData}
          isLoading={isLoadingFreight}
          error={freightErrorObj}
          startDate={startDate}
          endDate={endDate}
          start_date={start_date}
          end_date={end_date}
        />
      )}
    </div>
  );
}
