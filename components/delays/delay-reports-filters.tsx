"use client";

import { useCallback, useMemo, useEffect } from "react";
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
import { Tabs, TabsList, TabsTrigger } from "@/ui/tabs";
import { format, subDays, startOfMonth, endOfDay } from "date-fns";
import { Download } from "lucide-react";

interface DelayReportsFiltersProps {
  onExport?: () => void;
}

export function DelayReportsFilters({ onExport }: DelayReportsFiltersProps) {
  const { getAllQueryValues, updateQuery } = useFilterParams();
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
  }, []); // Only run once on mount

  // Get organizations for multiselect
  const { data: organizationsData, isLoading: isLoadingOrganizations } =
    useOrganizations();

  // Parse date strings to Date objects
  const startDate = start_date ? new Date(start_date) : undefined;
  const endDate = end_date ? new Date(end_date) : undefined;

  // Year and month options
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    const yearsList = [];
    for (let i = currentYear; i >= currentYear - 3; i--) {
      yearsList.push(i);
    }
    return yearsList;
  }, [currentYear]);

  const months = useMemo(() => {
    return [
      { value: "1", label: "Январь" },
      { value: "2", label: "Февраль" },
      { value: "3", label: "Март" },
      { value: "4", label: "Апрель" },
      { value: "5", label: "Май" },
      { value: "6", label: "Июнь" },
      { value: "7", label: "Июль" },
      { value: "8", label: "Август" },
      { value: "9", label: "Сентябрь" },
      { value: "10", label: "Октябрь" },
      { value: "11", label: "Ноябрь" },
      { value: "12", label: "Декабрь" },
    ];
  }, []);

  const selectedYear = yearParam ? parseInt(yearParam) : currentYear;
  const selectedMonth = monthParam ? parseInt(monthParam) : undefined;

  // Get selected month value for Select component
  // Use undefined when not selected (Radix UI Select will show placeholder)
  // Use string when selected to match SelectItem values
  const selectedMonthValue = selectedMonth ? String(selectedMonth) : undefined;

  // Parse organizations from comma-separated string  
  const selectedOrganizations = useMemo(() => {
    if (!organizationsParam) return [];
    return organizationsParam.split(",").filter(Boolean);
  }, [organizationsParam]);

  // Organization options for multiselect
  const organizationOptions = useMemo(() => {
    if (!organizationsData) return [];
    return organizationsData.map((org) => ({
      value: String(org.id),
      label: org.name,
    }));
  }, [organizationsData]);

  // Handle date changes
  const handleStartDateChange = useCallback(
    (date: Date | undefined) => {
      const dateString = date ? format(date, "yyyy-MM-dd") : "";
      updateQuery({ start_date: dateString });
      updateQuery({ year: null, month: null });
    },
    [updateQuery]
  );

  const handleEndDateChange = useCallback(
    (date: Date | undefined) => {
      const dateString = date ? format(date, "yyyy-MM-dd") : "";
      updateQuery({ end_date: dateString });
      updateQuery({ year: null, month: null });
    },
    [updateQuery]
  );

  // Handle year/month changes
  const handleYearChange = useCallback(
    (year: string) => {
      const yearNum = parseInt(year);
      updateQuery({ year });
      if (selectedMonth) {
        const monthNum = selectedMonth;
        const start = new Date(yearNum, monthNum - 1, 1);
        const end = endOfDay(new Date(yearNum, monthNum, 0));
        updateQuery({
          start_date: format(start, "yyyy-MM-dd"),
          end_date: format(end, "yyyy-MM-dd"),
        });
      }
    },
    [selectedMonth, updateQuery]
  );

  const handleMonthChange = useCallback(
    (month: string) => {
      if (month && month !== "") {
        updateQuery({ month });
        const monthNum = parseInt(month);
        const year = selectedYear || currentYear;
        const start = new Date(year, monthNum - 1, 1);
        const end = endOfDay(new Date(year, monthNum, 0));
        updateQuery({
          start_date: format(start, "yyyy-MM-dd"),
          end_date: format(end, "yyyy-MM-dd"),
        });
      } else {
        updateQuery({ month: null });
      }
    },
    [selectedYear, currentYear, updateQuery]
  );

  // Quick filter handlers
  const handleQuickFilter = useCallback(
    (filterType: "7days" | "30days" | "thismonth") => {
      const today = new Date();
      let start: Date;
      let end: Date = endOfDay(today);

      switch (filterType) {
        case "7days":
          start = subDays(today, 7);
          break;
        case "30days":
          start = subDays(today, 30);
          break;
        case "thismonth":
          start = startOfMonth(today);
          break;
      }

      updateQuery({
        start_date: format(start, "yyyy-MM-dd"),
        end_date: format(end, "yyyy-MM-dd"),
        year: null,
        month: null,
      });
    },
    [updateQuery]
  );

  // Handle organization selection
  const handleOrganizationsChange = useCallback(
    (values: string[]) => {
      const organizationsString = values.length > 0 ? values.join(",") : "";
      updateQuery({ organizations: organizationsString || null });
    },
    [updateQuery]
  );

  // Handle service type tab change
  const handleServiceTypeChange = useCallback(
    (value: string) => {
      updateQuery({ service_type: value });
    },
    [updateQuery]
  );

  // Determine which quick filter is active
  const activeQuickFilter = useMemo(() => {
    if (!startDate || !endDate || !start_date || !end_date) return null;

    const today = new Date();
    const todayEnd = endOfDay(today);
    const todayEndStr = format(todayEnd, "yyyy-MM-dd");

    // Check for "Last 7 days"
    const sevenDaysAgo = subDays(today, 7);
    const sevenDaysAgoStr = format(sevenDaysAgo, "yyyy-MM-dd");
    if (start_date === sevenDaysAgoStr && end_date === todayEndStr) {
      return "7days";
    }

    // Check for "Last 30 days"
    const thirtyDaysAgo = subDays(today, 30);
    const thirtyDaysAgoStr = format(thirtyDaysAgo, "yyyy-MM-dd");
    if (start_date === thirtyDaysAgoStr && end_date === todayEndStr) {
      return "30days";
    }

    // Check for "This month"
    const monthStart = startOfMonth(today);
    const monthStartStr = format(monthStart, "yyyy-MM-dd");
    if (start_date === monthStartStr && end_date === todayEndStr) {
      return "thismonth";
    }

    return null;
  }, [startDate, endDate, start_date, end_date]);

  return (
    <div className="px-6 py-4">
      {/* Service Type Tabs */}
      <div className="mb-6">
        <Tabs value={activeServiceType} onValueChange={handleServiceTypeChange}>
          <TabsList className="bg-white border-1 border-gray-200 p-1 gap-2 rounded-md inline-flex">
            <TabsTrigger
              value="passenger"
              className="px-3 py-2 text-sm font-semibold transition-all duration-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-gray-700 data-[state=inactive]:hover:text-gray-900 data-[state=inactive]:hover:bg-gray-50 data-[state=inactive]:hover:border-gray-300"
            >
              Пассажирский
            </TabsTrigger>
            <TabsTrigger
              value="freight"
              className="px-3 py-2 text-sm font-semibold transition-all duration-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-gray-700 data-[state=inactive]:hover:text-gray-900 data-[state=inactive]:hover:bg-gray-50 data-[state=inactive]:hover:border-gray-300"
            >
              Грузовой
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="bg-white border rounded-lg p-4 mb-4 flex justify-between items-center">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[200px] flex-shrink-0">
            <DatePicker
              placeholder="Дата начала"
              value={startDate}
              onValueChange={handleStartDateChange}
              className="w-full"
              size="md"
            />
          </div>
          <div className="min-w-[200px] flex-shrink-0">
            <DatePicker
              placeholder="Дата окончания"
              value={endDate}
              onValueChange={handleEndDateChange}
              className="w-full"
              size="md"
            />
          </div>

          {/* Organization Multiselect */}
          <div className="min-w-[300px] flex-1 max-w-[400px] flex-shrink-0">
            <MultiSelect
              options={organizationOptions}
              selectedValues={selectedOrganizations}
              onSelectionChange={handleOrganizationsChange}
              placeholder="Выберите организации"
              searchPlaceholder="Поиск..."
              emptyMessage="Организация не найдена"
              disabled={isLoadingOrganizations}
              className="border-[#d1d5db] hover:border-[#d1d5db] focus:border-[#d1d5db] focus:ring-0 py-0 min-h-auto"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {/* Export Button */}
          {onExport && (
            <Button
              variant="default"
              size="md"
              onClick={onExport}
              className="rounded-md bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Экспорт в DOC
            </Button>
          )}
          
          {/* Year Select */}
          <div className="min-w-[120px] flex-shrink-0">
            <Select
              value={String(selectedYear)}
              onValueChange={handleYearChange}
            >
              <SelectTrigger className="w-full h-10 mb-0">
                <SelectValue placeholder="Выберите год" />
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
                <SelectValue placeholder="Выберите месяц" />
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

          {/* Quick Filter Buttons */}
          <Button
            variant={activeQuickFilter === "7days" ? "default" : "outline"}
            size="md"
            onClick={() => handleQuickFilter("7days")}
            className={
              activeQuickFilter === "7days"
                ? "rounded-md bg-blue-600 text-white hover:bg-blue-700"
                : "border-[#d1d5db] rounded-md"
            }
          >
            Последние 7 дней
          </Button>
          <Button
            variant={activeQuickFilter === "30days" ? "default" : "outline"}
            size="md"
            onClick={() => handleQuickFilter("30days")}
            className={
              activeQuickFilter === "30days"
                ? "rounded-md bg-blue-600 text-white hover:bg-blue-700"
                : "border-[#d1d5db] rounded-md"
            }
          >
            Последние 30 дней
          </Button>
          <Button
            variant={activeQuickFilter === "thismonth" ? "default" : "outline"}
            size="md"
            onClick={() => handleQuickFilter("thismonth")}
            className={
              activeQuickFilter === "thismonth"
                ? "rounded-md bg-blue-600 text-white hover:bg-blue-700"
                : "border-[#d1d5db] rounded-md"
            }
          >
            Этот месяц (1-{format(new Date(), "d")})
          </Button>
        </div>
      </div>
    </div>
  );
}
