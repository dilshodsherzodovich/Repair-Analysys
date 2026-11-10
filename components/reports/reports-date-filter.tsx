"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useReportFilters } from "@/lib/hooks/useReportFilters";
import { DateRangeField } from "@/ui/date-range-field";
import { FilterField, FilterReset } from "@/ui/filter-bar";

const DEFAULT_HOURS = 12;

const defaultRange = () => {
  const now = new Date();
  return { from: new Date(now.getTime() - DEFAULT_HOURS * 60 * 60 * 1000), to: now };
};

/**
 * Period filter for the reports dashboard: the standard DateRangeField with
 * times (default: the last 12 hours), applied when the picker closes, and the
 * standard reset. Place it inside the page's FilterBar.
 */
export default function ReportsDateFilter() {
  const tc = useTranslations("Common");
  const { filters, setFilters } = useReportFilters();

  // A fresh page starts on the last 12 hours
  useEffect(() => {
    if (!filters.fromDate || !filters.toDate) {
      const { from, to } = defaultRange();
      setFilters({ fromDate: from.toISOString(), toDate: to.toISOString() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const from = filters.fromDate ? new Date(filters.fromDate) : undefined;
  const to = filters.toDate ? new Date(filters.toDate) : undefined;
  // "Active" once the range is anything but the default window's length
  const isCustom =
    !!from && !!to && Math.abs(to.getTime() - from.getTime() - DEFAULT_HOURS * 3600_000) > 60_000;

  return (
    <>
      <FilterField label={tc("period")} width="lg">
        <DateRangeField
          showTime
          value={{ from, to }}
          onChange={(range) => {
            if (range.from && range.to) {
              setFilters({ fromDate: range.from.toISOString(), toDate: range.to.toISOString() });
            }
          }}
        />
      </FilterField>
      <FilterReset
        active={isCustom}
        onReset={() => {
          const { from: f, to: t } = defaultRange();
          setFilters({ fromDate: f.toISOString(), toDate: t.toISOString() });
        }}
      />
    </>
  );
}
