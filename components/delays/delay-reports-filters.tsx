"use client";

import { useCallback, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useFilterParams } from "@/lib/hooks/useFilterParams";
import { useOrganizations } from "@/api/hooks/use-organizations";
import { MultiSelect } from "@/ui/multi-select";
import { DatePicker } from "@/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { Button } from "@/ui/button";
import { SegmentedTabs } from "@/ui/segmented-tabs";
import { format, subDays, startOfMonth, endOfDay } from "date-fns";
import { Download } from "lucide-react";
import { authService } from "@/api/services/auth.service";

interface DelayReportsFiltersProps {
  onExport?: () => void;
}

export function DelayReportsFilters({ onExport }: DelayReportsFiltersProps) {
  const t = useTranslations("DelayReportsFilters");
  const { getAllQueryValues, updateQuery } = useFilterParams();

  // sriv_moderator only ever sees its own depo — the backend scopes the
  // response, so there is nothing to choose.
  const currentUser =
    authService.getUser();
  const isOrgScoped = currentUser?.role === "sriv_moderator";
  const {
    start_date,
    end_date,
    organizations: organizationsParam,
    year: yearParam,
    month: monthParam,
    service_type: serviceTypeParam,
  } = getAllQueryValues();

  // Get active service type (default to "passenger")
  const activeServiceType = serviceTypeParam || "passenger";

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

  const { data: organizationsData, isLoading: isLoadingOrganizations } =
    useOrganizations();

  const startDate = start_date ? new Date(start_date) : undefined;
  const endDate = end_date ? new Date(end_date) : undefined;


  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    const yearsList = [];
    for (let i = currentYear; i >= currentYear - 3; i--) {
      yearsList.push(i);
    }
    return yearsList;
  }, [currentYear]);

  const months = useMemo(() => {
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => ({
      value: String(m),
      label: t(`months.${m}`),
    }));
  }, [t]);

  const selectedYear = yearParam ? parseInt(yearParam) : currentYear;
  const selectedMonth = monthParam ? parseInt(monthParam) : undefined;

  const selectedMonthValue = selectedMonth ? String(selectedMonth) : undefined;

  const selectedOrganizations = useMemo(() => {
    if (!organizationsParam) return [];
    return organizationsParam.split(",").filter(Boolean);
  }, [organizationsParam]);

  const organizationOptions = useMemo(() => {
    if (!organizationsData) return [];
    return organizationsData.map((org) => ({
      value: String(org.id),
      label: org.name,
    }));
  }, [organizationsData]);

  const handleStartDateChange = useCallback(
    (date: Date | undefined) => {
      const dateString = date ? format(date, "yyyy-MM-dd") : "";
      updateQuery({ start_date: dateString, year: null, month: null });
    },
    [updateQuery]
  );

  const handleEndDateChange = useCallback(
    (date: Date | undefined) => {
      const dateString = date ? format(date, "yyyy-MM-dd") : "";
      updateQuery({ end_date: dateString, year: null, month: null });
    },
    [updateQuery]
  );

  const handleYearChange = useCallback(
    (year: string) => {
      const yearNum = parseInt(year);
      if (selectedMonth) {
        const monthNum = selectedMonth;
        const start = new Date(yearNum, monthNum - 1, 1);
        const end = endOfDay(new Date(yearNum, monthNum, 0));
        updateQuery({
          year,
          start_date: format(start, "yyyy-MM-dd"),
          end_date: format(end, "yyyy-MM-dd"),
        });
      } else {
        updateQuery({ year });
      }
    },
    [selectedMonth, updateQuery]
  );

  const handleMonthChange = useCallback(
    (month: string) => {
      if (month && month !== "") {
        const monthNum = parseInt(month);
        const year = selectedYear || currentYear;
        const start = new Date(year, monthNum - 1, 1);
        const end = endOfDay(new Date(year, monthNum, 0));
        updateQuery({
          month,
          start_date: format(start, "yyyy-MM-dd"),
          end_date: format(end, "yyyy-MM-dd"),
        });
      } else {
        updateQuery({ month: null });
      }
    },
    [selectedYear, currentYear, updateQuery]
  );

  const handleOrganizationsChange = useCallback(
    (values: string[]) => {
      const organizationsString = values.length > 0 ? values.join(",") : "";
      updateQuery({ organizations: organizationsString || null });
    },
    [updateQuery]
  );

  const handleServiceTypeChange = useCallback(
    (value: string) => {
      updateQuery({ service_type: value });
    },
    [updateQuery]
  );

  const activeQuickFilter = useMemo(() => {
    if (!startDate || !endDate || !start_date || !end_date) return null;

    const today = new Date();
    const todayEnd = endOfDay(today);
    const todayEndStr = format(todayEnd, "yyyy-MM-dd");

    const sevenDaysAgo = subDays(today, 7);
    const sevenDaysAgoStr = format(sevenDaysAgo, "yyyy-MM-dd");
    if (start_date === sevenDaysAgoStr && end_date === todayEndStr) {
      return "7days";
    }

    const thirtyDaysAgo = subDays(today, 30);
    const thirtyDaysAgoStr = format(thirtyDaysAgo, "yyyy-MM-dd");
    if (start_date === thirtyDaysAgoStr && end_date === todayEndStr) {
      return "30days";
    }

    const monthStart = startOfMonth(today);
    const monthStartStr = format(monthStart, "yyyy-MM-dd");
    if (start_date === monthStartStr && end_date === todayEndStr) {
      return "thismonth";
    }

    return null;
  }, [startDate, endDate, start_date, end_date]);

  return (
    <div className="px-6 py-4">
      <div className="mb-6">
        <SegmentedTabs
          value={activeServiceType}
          onValueChange={handleServiceTypeChange}
          options={[
            { value: "passenger", label: t("tab_passenger") },
            { value: "freight", label: t("tab_freight") },
          ]}
        />
      </div>

      <div className="bg-background border rounded-lg p-4 mb-4 flex justify-between items-center">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[200px] flex-shrink-0">
            <DatePicker
              placeholder={t("date_start")}
              value={startDate}
              onValueChange={handleStartDateChange}
              className="w-full"
              size="md"
            />
          </div>
          <div className="min-w-[200px] flex-shrink-0">
            <DatePicker
              placeholder={t("date_end")}
              value={endDate}
              onValueChange={handleEndDateChange}
              className="w-full"
              size="md"
            />
          </div>

          {/* Organization Multiselect — hidden for depo-scoped roles */}
          {!isOrgScoped && (
            <div className="min-w-[300px] flex-1 max-w-[400px] flex-shrink-0">
              <MultiSelect
                options={organizationOptions}
                selectedValues={selectedOrganizations}
                onSelectionChange={handleOrganizationsChange}
                placeholder={t("organizations_placeholder")}
                searchPlaceholder={t("organizations_search")}
                emptyMessage={t("organizations_empty")}
                disabled={isLoadingOrganizations}
                className="border-border-strong hover:border-border-strong focus:border-border-strong focus:ring-0 py-0 min-h-auto"
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
         
          
          {/* Year Select */}
          <div className="min-w-[120px] flex-shrink-0">
            <Select
              value={String(selectedYear)}
              onValueChange={handleYearChange}
            >
              <SelectTrigger className="w-full h-10 mb-0">
                <SelectValue placeholder={t("year_placeholder")} />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Month Select */}
          <div className="min-w-[150px] flex-shrink-0">
            <Select
              value={selectedMonthValue || undefined}
              onValueChange={handleMonthChange}
            >
              <SelectTrigger className="w-full h-10 mb-0">
                <SelectValue placeholder={t("month_placeholder")} />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

           {/* Export Button */}
           {onExport && (
            <Button size="md" onClick={onExport}>
              <Download />
              {t("export_button")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
