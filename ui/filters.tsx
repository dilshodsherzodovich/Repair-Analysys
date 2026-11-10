"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { Button } from "@/ui/button";
import { DatePicker } from "@/ui/date-picker";
import { DateRangeField } from "@/ui/date-range-field";
import { FilterBar, FilterField, FilterReset, SearchInput } from "@/ui/filter-bar";
import { SearchableSelect } from "@/ui/select";
import { Permission } from "@/lib/permissions";
import { PermissionGuard } from "@/components/permission-guard";
import { useFilterParams } from "@/lib/hooks/useFilterParams";

interface Option {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface FiltersQuery {
  name: string;
  label: string;
  isSelect: boolean;
  options?: Option[];
  placeholder?: string;
  searchable?: boolean;
  clearable?: boolean;
  loading?: boolean;
  /** FilterField width; md by default. */
  width?: "sm" | "md" | "lg";
  permission?: Permission;
}

interface PageFiltersProps {
  filters: FiltersQuery[];
  hasSearch?: boolean;
  hasDatePicker?: boolean;
  hasDateRangePicker?: boolean;
  dateRangeStartKey?: string;
  dateRangeEndKey?: string;
  searchPlaceholder?: string;
  datePickerLabel?: string;
  dateRangePickerLabel?: string;
  selectedCount?: number;
  onBulkDelete?: () => void;
  bulkDeleteText?: string;
  className?: string;
}

const DEBOUNCE_MS = 400;
const toDay = (date: Date | undefined) => (date ? format(date, "yyyy-MM-dd") : "");
const fromDay = (value: string) => (value ? new Date(value) : undefined);

/**
 * URL-driven FilterBar for list pages: every filter is a labelled field,
 * changes write to the query string immediately (text after a debounce), and
 * "Tozalash" clears them. Put it in PageHeader's `filters` slot (or in a
 * FilterPanel inside a section); page actions (Add, exports) go in the header.
 */
export default function PageFilters({
  filters,
  hasSearch = true,
  hasDatePicker = false,
  hasDateRangePicker = false,
  dateRangeStartKey = "start_date",
  dateRangeEndKey = "end_date",
  searchPlaceholder,
  datePickerLabel,
  dateRangePickerLabel,
  selectedCount = 0,
  onBulkDelete,
  bulkDeleteText,
  className,
}: PageFiltersProps) {
  const t = useTranslations("Filters");
  const tc = useTranslations("Common");
  const { updateQuery, getQueryValue } = useFilterParams();
  const searchParams = useSearchParams();

  const timers = React.useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const debounce = (key: string, value: string) => {
    clearTimeout(timers.current[key]);
    timers.current[key] = setTimeout(() => updateQuery({ [key]: value }), DEBOUNCE_MS);
  };

  // Text inputs keep local state so typing stays smooth; the URL follows
  const textKeys = [
    ...(hasSearch ? ["q"] : []),
    ...filters.filter((f) => !f.isSelect).map((f) => f.name),
  ];
  const readText = () =>
    Object.fromEntries(textKeys.map((key) => [key, getQueryValue(key)]));
  const [text, setText] = React.useState<Record<string, string>>(readText);
  React.useEffect(() => {
    setText(readText());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, filters]);

  const onText = (key: string, value: string) => {
    setText((prev) => ({ ...prev, [key]: value }));
    debounce(key, value);
  };

  // Every query key this bar owns, for "Tozalash"
  const ownedKeys = [
    ...textKeys,
    ...filters.filter((f) => f.isSelect).map((f) => f.name),
    ...(hasDatePicker ? ["date"] : []),
    ...(hasDateRangePicker ? [dateRangeStartKey, dateRangeEndKey] : []),
  ];
  const isActive = ownedKeys.some((key) => getQueryValue(key));
  const reset = () => {
    Object.values(timers.current).forEach(clearTimeout);
    setText(Object.fromEntries(textKeys.map((key) => [key, ""])));
    updateQuery(Object.fromEntries(ownedKeys.map((key) => [key, null])));
  };

  const field = (filter: FiltersQuery) => (
    <FilterField key={filter.name} label={filter.label} width={filter.width ?? "md"}>
      {filter.isSelect ? (
        <SearchableSelect
          size="md"
          searchable={filter.searchable !== false}
          clearable={filter.clearable}
          loading={filter.loading}
          placeholder={filter.placeholder || tc("all")}
          options={filter.options || []}
          value={getQueryValue(filter.name)}
          onValueChange={(value) => updateQuery({ [filter.name]: value })}
        />
      ) : (
        <SearchInput
          value={text[filter.name] ?? ""}
          placeholder={filter.placeholder}
          onChange={(value) => onText(filter.name, value)}
        />
      )}
    </FilterField>
  );

  return (
    <FilterBar className={className}>
      {hasSearch && (
        <FilterField label={tc("search")} width="lg">
          <SearchInput
            value={text.q ?? ""}
            placeholder={searchPlaceholder}
            onChange={(value) => onText("q", value)}
          />
        </FilterField>
      )}

      {filters.map((filter) =>
        filter.permission ? (
          <PermissionGuard key={filter.name} permission={filter.permission}>
            {field(filter)}
          </PermissionGuard>
        ) : (
          field(filter)
        ),
      )}

      {hasDatePicker && (
        <FilterField label={datePickerLabel ?? tc("date")}>
          <DatePicker
            value={fromDay(getQueryValue("date"))}
            onValueChange={(date) => updateQuery({ date: toDay(date) })}
            className="w-full"
            size="md"
          />
        </FilterField>
      )}

      {hasDateRangePicker && (
        <FilterField label={dateRangePickerLabel ?? tc("period")} width="lg">
          <DateRangeField
            value={{
              from: fromDay(getQueryValue(dateRangeStartKey)),
              to: fromDay(getQueryValue(dateRangeEndKey)),
            }}
            onChange={({ from, to }) =>
              updateQuery({ [dateRangeStartKey]: toDay(from), [dateRangeEndKey]: toDay(to) })
            }
          />
        </FilterField>
      )}

      <FilterReset active={isActive} onReset={reset} />

      {selectedCount > 0 && onBulkDelete && (
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {t("selected_count", { count: selectedCount })}
          </span>
          <Button variant="outline-destructive" size="sm" className="h-9" onClick={onBulkDelete}>
            <Trash2 />
            {bulkDeleteText ?? tc("delete")}
          </Button>
        </div>
      )}
    </FilterBar>
  );
}
