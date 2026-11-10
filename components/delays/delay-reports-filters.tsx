"use client";

import { useCallback, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useFilterParams } from "@/lib/hooks/useFilterParams";
import { useOrganizations } from "@/api/hooks/use-organizations";
import { MultiSelect } from "@/ui/multi-select";
import { SearchableSelect } from "@/ui/select";
import { format, subDays, startOfMonth, endOfDay } from "date-fns";
import { authService } from "@/api/services/auth.service";
import { DateRangeField } from "@/ui/date-range-field";
import { FilterBar, FilterField, FilterReset } from "@/ui/filter-bar";

/** The delay reports FilterBar: period, year / month presets and organizations. */
export function DelayReportsFilters() {
  const t = useTranslations("DelayReportsFilters");
  const tc = useTranslations("Common");
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
  } = getAllQueryValues();


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

  const resetFilters = () => {
    const today = new Date();
    updateQuery({
      start_date: format(subDays(today, 30), "yyyy-MM-dd"),
      end_date: format(today, "yyyy-MM-dd"),
      organizations: null,
      year: null,
      month: null,
    });
  };

  return (
    <FilterBar>
      <FilterField label={tc("period")} width="lg">
        <DateRangeField
          value={{ from: startDate, to: endDate }}
          onChange={({ from, to }) =>
            updateQuery({
              start_date: from ? format(from, "yyyy-MM-dd") : "",
              end_date: to ? format(to, "yyyy-MM-dd") : "",
              year: null,
              month: null,
            })
          }
        />
      </FilterField>

      <FilterField label={t("year_placeholder")} width="sm">
        <SearchableSelect
          size="md"
          value={String(selectedYear)}
          onValueChange={handleYearChange}
          options={years.map((year) => ({ value: String(year), label: String(year) }))}
        />
      </FilterField>

      <FilterField label={t("month_placeholder")} width="sm">
        <SearchableSelect
          size="md"
          value={selectedMonthValue ?? ""}
          onValueChange={handleMonthChange}
          placeholder={tc("all")}
          options={[{ value: "", label: tc("all") }, ...months]}
        />
      </FilterField>

      {/* Depo-scoped roles only ever see their own depo */}
      {!isOrgScoped && (
        <FilterField label={tc("organization")} width="lg">
          <MultiSelect
            options={organizationOptions}
            selectedValues={selectedOrganizations}
            onSelectionChange={handleOrganizationsChange}
            placeholder={tc("all")}
            searchPlaceholder={t("organizations_search")}
            emptyMessage={t("organizations_empty")}
            disabled={isLoadingOrganizations}
            className="min-h-9 py-0"
          />
        </FilterField>
      )}

      <FilterReset
        active={Boolean(organizationsParam || yearParam || monthParam || activeQuickFilter !== "30days")}
        onReset={resetFilters}
      />
    </FilterBar>
  );
}
