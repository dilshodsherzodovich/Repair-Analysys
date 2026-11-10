"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { createPortal } from "react-dom";
import { SlidersHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/ui/button";
import { DatePicker } from "@/ui/date-picker";
import { DateRangeField } from "@/ui/date-range-field";
import { FilterBar, FilterField, SearchInput } from "@/ui/filter-bar";
import { FilterCardFooter } from "@/ui/page-header";
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/popover";
import { Badge } from "@/ui/badge";
import { Chip } from "@/ui/chip";
import { formatDate } from "@/lib/format";
import { hasPermission } from "@/lib/permissions";
import { authService } from "@/api/services/auth.service";
import { SearchableSelect } from "@/ui/select";
import { Permission } from "@/lib/permissions";
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
  /**
   * Shown in the toolbar line. When no filter is marked, the first ones are
   * (three controls next to search, the date counting as one); the rest go
   * into the "Filtrlar" panel.
   */
  primary?: boolean;
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

/** Controls next to search in the toolbar line, the date included. */
const TOOLBAR_SLOTS = 3;

/**
 * URL-driven filter toolbar for list pages (see "FilterBar" in the spec):
 * - one line: search, the main filters and the date, then "Filtrlar · N"
 *   holding the other filters in a panel;
 * - under it, only while something is set, a chip per active filter (× to
 *   remove) and "Tozalash";
 * - every change writes to the query string at once (text after a debounce).
 * Put it in PageHeader's `filters` slot (or a FilterPanel); the page actions
 * sit on the right of the same card.
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

  const field = (filter: FiltersQuery, inPanel = false) => (
    <FilterField
      key={filter.name}
      label={filter.label}
      width={inPanel ? "auto" : (filter.width ?? "md")}
      className={inPanel ? "w-full" : undefined}
    >
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

  // Filters the user may not see are left out before choosing the toolbar ones
  const user = authService.getUser();
  const allowed = filters.filter((f) => !f.permission || hasPermission(user, f.permission));
  const dateSlots = (hasDatePicker ? 1 : 0) + (hasDateRangePicker ? 1 : 0);
  const anyPrimary = allowed.some((f) => f.primary);
  const toolbar = anyPrimary
    ? allowed.filter((f) => f.primary)
    : allowed.slice(0, Math.max(0, TOOLBAR_SLOTS - dateSlots));
  const panel = allowed.filter((f) => !toolbar.includes(f));
  const panelActive = panel.filter((f) => getQueryValue(f.name)).length;

  // One chip per active filter, in the order of the controls
  const optionLabel = (f: FiltersQuery, value: string) =>
    f.options?.find((o) => o.value === value)?.label ?? value;
  const chips: { key: string; label: string; clear: Record<string, null> }[] = [];
  if (hasSearch && getQueryValue("q")) {
    chips.push({ key: "q", label: `${tc("search")}: ${getQueryValue("q")}`, clear: { q: null } });
  }
  for (const f of allowed) {
    const value = getQueryValue(f.name);
    if (value) {
      chips.push({
        key: f.name,
        label: `${f.label}: ${f.isSelect ? optionLabel(f, value) : value}`,
        clear: { [f.name]: null },
      });
    }
  }
  if (hasDatePicker && getQueryValue("date")) {
    chips.push({
      key: "date",
      label: `${datePickerLabel ?? tc("date")}: ${formatDate(getQueryValue("date"))}`,
      clear: { date: null },
    });
  }
  const rangeFrom = getQueryValue(dateRangeStartKey);
  const rangeTo = getQueryValue(dateRangeEndKey);
  if (hasDateRangePicker && (rangeFrom || rangeTo)) {
    chips.push({
      key: "range",
      label: `${dateRangePickerLabel ?? tc("period")}: ${formatDate(rangeFrom, "…")} – ${formatDate(rangeTo, "…")}`,
      clear: { [dateRangeStartKey]: null, [dateRangeEndKey]: null },
    });
  }
  const removeChip = (clear: Record<string, null>) => {
    for (const key of Object.keys(clear)) {
      clearTimeout(timers.current[key]);
      if (textKeys.includes(key)) setText((prev) => ({ ...prev, [key]: "" }));
    }
    updateQuery(clear);
  };

  const footer = React.useContext(FilterCardFooter);
  const chipRow = isActive && chips.length > 0 && (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <Chip
          key={chip.key}
          onRemove={() => removeChip(chip.clear)}
          removeLabel={tc("remove_filter")}
          className="min-w-0 max-w-[20rem]"
        >
          <span className="truncate">{chip.label}</span>
        </Chip>
      ))}
      <Button variant="ghost" size="sm" onClick={reset}>
        {tc("reset")}
      </Button>
    </div>
  );

  return (
    <>
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

        {toolbar.map((filter) => field(filter))}

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

        {panel.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <SlidersHorizontal />
                {tc("filters")}
                {panelActive > 0 && (
                  <Badge variant="primary_solid" size="sm">
                    {panelActive}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-[min(36rem,calc(100vw-2rem))] bg-background p-4"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {panel.map((filter) => field(filter, true))}
              </div>
            </PopoverContent>
          </Popover>
        )}

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
      {chipRow && (footer ? createPortal(chipRow, footer) : <div className="mt-3">{chipRow}</div>)}
    </>
  );
}
