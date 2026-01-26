"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/ui/input";
import { Button } from "@/ui/button";
import { DatePicker } from "@/ui/date-picker";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/ui/select";
import { Trash2, Plus, Search, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Permission } from "@/lib/permissions";
import { PermissionGuard } from "@/components/permission-guard";
import { useFilterParams } from "@/lib/hooks/useFilterParams";

interface Option {
  label: string;
  value: string;
  disabled?: boolean;
}

interface FiltersQuery {
  name: string;
  label: string;
  isSelect: boolean;
  options?: Option[];
  placeholder?: string;
  searchable?: boolean;
  clearable?: boolean;
  loading?: boolean;
  minWidth?: string;
  permission?: Permission;
}

interface PageFiltersProps {
  filters: FiltersQuery[];
  hasSearch?: boolean;
  hasDatePicker?: boolean;
  hasDateRangePicker?: boolean;
  searchPlaceholder?: string;
  datePickerLabel?: string;
  dateRangePickerLabel?: string;
  onAdd?: () => void;
  addButtonPermittion?: Permission;
  addButtonText?: string;
  addButtonIcon?: React.ReactNode;
  onExport?: () => void;
  exportButtonText?: string;
  exportButtonIcon?: React.ReactNode;
  selectedCount?: number;
  onBulkDelete?: () => void;
  bulkDeleteText?: string;
  className?: string;
}

export default function PageFilters({
  filters,
  hasSearch = true,
  hasDatePicker = false,
  hasDateRangePicker = false,
  searchPlaceholder = "Qidirish...",
  datePickerLabel = "Sana",
  dateRangePickerLabel = "Sana oralig'i",
  onAdd,
  addButtonText = "Yangi qo'shish",
  addButtonIcon,
  addButtonPermittion,
  onExport,
  exportButtonText = "Export EXCEL",
  exportButtonIcon,
  selectedCount = 0,
  onBulkDelete,
  bulkDeleteText = "O'chirish",
  className,
}: PageFiltersProps) {
  const { updateQuery, getQueryValue } = useFilterParams();

  const searchParams = useSearchParams();
  const debounceMs = 400;
  const timersRef = React.useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {}
  );

  // Debounced updater per key
  const scheduleDebounce = (key: string, value: string) => {
    if (timersRef.current[key]) clearTimeout(timersRef.current[key]);
    timersRef.current[key] = setTimeout(() => {
      updateQuery({ [key]: value });
      delete timersRef.current[key];
    }, debounceMs);
  };

  // Local state for search input (q)
  const [searchLocal, setSearchLocal] = React.useState<string>(() =>
    getQueryValue("q")
  );
  React.useEffect(() => {
    setSearchLocal(getQueryValue("q"));
  }, [searchParams]);

  // Handle search input
  const handleSearchChange = (value: string) => {
    setSearchLocal(value);
    scheduleDebounce("q", value);
  };

  // Handle filter changes
  const handleFilterChange = (name: string, value: string) => {
    updateQuery({ [name]: value });
  };

  // Local state for text filter inputs (non-select filters)
  const getInitialTextValues = () => {
    const map: Record<string, string> = {};
    filters.forEach((f) => {
      if (!f.isSelect) {
        map[f.name] = getQueryValue(f.name);
      }
    });
    return map;
  };
  const [textValues, setTextValues] =
    React.useState<Record<string, string>>(getInitialTextValues);

  // Sync text inputs with URL and filters list changes
  React.useEffect(() => {
    setTextValues(getInitialTextValues());
  }, [filters, searchParams]);

  // Handle date picker changes
  const handleDateChange = (date: Date | undefined) => {
    const dateString = date ? format(date, "yyyy-MM-dd") : "";
    updateQuery({ date: dateString });
  };

  // Handle date range picker changes
  const handleDateRangeChange = (
    startDate: Date | undefined,
    endDate: Date | undefined
  ) => {
    const startString = startDate ? format(startDate, "yyyy-MM-dd") : "";
    const endString = endDate ? format(endDate, "yyyy-MM-dd") : "";
    updateQuery({
      start_date: startString,
      end_date: endString,
    });
  };

  // Get current date values
  const currentDate = getQueryValue("date")
    ? new Date(getQueryValue("date"))
    : undefined;
  const currentStartDate = getQueryValue("start_date")
    ? new Date(getQueryValue("start_date"))
    : undefined;
  const currentEndDate = getQueryValue("end_date")
    ? new Date(getQueryValue("end_date"))
    : undefined;

  return (
    <div
      className={cn(
        "flex flex-wrap items-stretch gap-3 md:gap-4 mb-4",
        className
      )}
    >
      {/* Search Input */}
      {hasSearch && (
        <div className="min-w-[200px] flex-1 max-w-[400px] flex-shrink-0">
          <div className="relative w-full h-full flex items-center">
            <input
              type="text"
              placeholder={searchPlaceholder}
              className="w-full h-full py-2 px-4 mb-0 border border-[#CAD5E2] rounded-md bg-white placeholder:text-[#90A1B9] text-sm text-[#0F172B] focus:border-[#CAD5E2] focus:outline-none focus:ring-0 hover:border-[#CAD5E2] transition-colors"
              value={searchLocal}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            <Search
              className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 pointer-events-none"
              strokeWidth={1.25}
              style={{
                color: "#90A1B9",
                stroke: "#90A1B9",
              }}
            />
          </div>
        </div>
      )}

      {/* Dynamic Filters */}
      {filters.map((filter) =>
        filter.permission ? (
          <PermissionGuard  key={filter.name}  permission={filter.permission}>
            <div className="min-w-[200px] flex-shrink-0">
              {filter.isSelect ? (
                <SelectWithSearch
                  placeholder={filter.placeholder || `Tanlang...`}
                  searchable={filter.searchable !== false}
                  loading={filter.loading}
                  options={filter.options || []}
                  value={getQueryValue(filter.name)}
                  onValueChange={(value) =>
                    handleFilterChange(filter.name, value)
                  }
                  triggerClassName="w-full h-10 mb-0 min-w-[200px] max-w-[300px]"
                />
              ) : (
                <Input
                  placeholder={filter.placeholder || filter.label}
                  className="w-full h-full py-2 px-4 mb-0 border border-[#CAD5E2] rounded-lg bg-white placeholder:text-[#90A1B9] text-sm text-[#0F172B] focus:border-[#CAD5E2] focus:outline-none focus:ring-0 hover:border-[#CAD5E2] transition-colors min-w-[200px] max-w-[300px]"
                  value={textValues[filter.name] ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setTextValues((prev) => ({ ...prev, [filter.name]: v }));
                    scheduleDebounce(filter.name, v);
                  }}
                />
              )}
            </div>
          </PermissionGuard>
        ) : (
          <div key={filter.name} className="min-w-[200px] flex-shrink-0">
            {filter.isSelect ? (
              <SelectWithSearch
                placeholder={filter.placeholder || `Tanlang...`}
                searchable={filter.searchable !== false}
                loading={filter.loading}
                options={filter.options || []}
                value={getQueryValue(filter.name)}
                onValueChange={(value) =>
                  handleFilterChange(filter.name, value)
                }
                triggerClassName="w-full h-10 mb-0 min-w-[200px] max-w-[300px]"
              />
            ) : (
              <Input
                placeholder={filter.placeholder || filter.label}
                className="w-full h-full py-2 px-4 mb-0 border border-[#CAD5E2] rounded-lg bg-white placeholder:text-[#90A1B9] text-sm text-[#0F172B] focus:border-[#CAD5E2] focus:outline-none focus:ring-0 hover:border-[#CAD5E2] transition-colors min-w-[200px] max-w-[300px]"
                value={textValues[filter.name] ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setTextValues((prev) => ({ ...prev, [filter.name]: v }));
                  scheduleDebounce(filter.name, v);
                }}
              />
            )}
          </div>
        )
      )}

      {/* Date Picker */}
      {hasDatePicker && (
        <div className="min-w-[200px] flex-shrink-0">
          <DatePicker
            placeholder={datePickerLabel}
            value={currentDate}
            onValueChange={handleDateChange}
            className="w-full min-w-[200px] max-w-[300px]"
            size="md"
          />
        </div>
      )}

      {/* Date Range Picker */}
      {hasDateRangePicker && (
        <div className="min-w-[400px] flex-shrink-0">
          <div className="grid grid-cols-2 gap-2">
            <DatePicker
              placeholder={`${dateRangePickerLabel} dan`}
              value={currentStartDate}
              onValueChange={(date) =>
                handleDateRangeChange(date, currentEndDate)
              }
              className="w-full"
              size="md"
            />
            <DatePicker
              placeholder={`${dateRangePickerLabel} gacha`}
              value={currentEndDate}
              onValueChange={(date) =>
                handleDateRangeChange(currentStartDate, date)
              }
              className="w-full"
              size="md"
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {(onAdd || onExport) && (
        <div className="ml-auto shrink-0 flex items-center gap-2 w-full sm:w-auto">
          {/* Create/Add Button */}
          {onAdd && (
            <PermissionGuard permission={addButtonPermittion}>
              <Button
                onClick={onAdd}
                className="h-10 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white whitespace-nowrap cursor-pointer"
              >
                <span className="flex items-center">
                  {addButtonIcon || <Plus className="w-4 h-4 mr-2" />}
                  {addButtonText}
                </span>
              </Button>
            </PermissionGuard>
          )}

          {/* Export Button */}
          {onExport && (
            <Button
              onClick={onExport}
              className="h-10 bg-green-600 hover:bg-green-700 text-white whitespace-nowrap cursor-pointer"
            >
              <span className="flex items-center">
                {exportButtonIcon || (
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                )}
                {exportButtonText}
              </span>
            </Button>
          )}
        </div>
      )}

      {/* Bulk Actions */}
      {selectedCount > 0 && onBulkDelete && (
        <div className="ml-auto shrink-0 flex items-center gap-2 w-full sm:w-auto">
          <span className="text-sm text-[#6b7280]">
            {selectedCount} ta tanlangan
          </span>
          <Button
            variant="outline"
            size="sm"
            className="text-[#dc2626] border-[#dc2626] hover:bg-[#dc2626] hover:text-white bg-transparent"
            onClick={onBulkDelete}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            {bulkDeleteText}
          </Button>
        </div>
      )}
    </div>
  );
}

// Local Select component with built-in search using shadcn/ui Select
function SelectWithSearch({
  placeholder,
  options,
  value,
  onValueChange,
  searchable = true,
  loading,
  triggerClassName,
}: {
  placeholder?: string;
  options: { label: string; value: string; disabled?: boolean }[];
  value: string;
  onValueChange: (v: string) => void;
  searchable?: boolean;
  loading?: boolean;
  triggerClassName?: string;
  style?: Record<string, string>;
}) {
  const [searchTerm, setSearchTerm] = React.useState("");

  // Map empty string option value to a non-empty sentinel for shadcn Select
  const EMPTY_SENTINEL = "__empty__";
  const hasEmptyOption = React.useMemo(
    () => options.some((o) => o.value === ""),
    [options]
  );

  const internalOptions = React.useMemo(
    () =>
      options.map((o) => ({
        ...o,
        value: o.value === "" ? EMPTY_SENTINEL : o.value,
      })),
    [options]
  );

  const filteredOptions = React.useMemo(() => {
    const source = internalOptions;
    if (!searchable || !searchTerm) return source;
    return source.filter((o) =>
      o.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [internalOptions, searchTerm, searchable]);

  // When there are no options (overall or filtered), or when value is empty without an explicit empty option,
  // use undefined to display the placeholder and avoid value becoming null.
  const noOverallOptions = internalOptions.length === 0;
  const noFilteredOptions = filteredOptions.length === 0;
  const mappedExternal =
    hasEmptyOption && value === "" ? EMPTY_SENTINEL : value;
  const valueForSelect =
    noOverallOptions || noFilteredOptions || (!hasEmptyOption && value === "")
      ? undefined
      : mappedExternal;
  const handleChange = (v: string) => {
    onValueChange(v === EMPTY_SENTINEL ? "" : v);
  };

  return (
    <Select value={valueForSelect} onValueChange={handleChange}>
      <SelectTrigger className={cn("h-10", triggerClassName)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {searchable && (
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7280]" />
              <input
                type="text"
                placeholder="Qidirish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-[#2354bf]/20"
              />
            </div>
          </div>
        )}
        {loading ? (
          <div className="p-4 text-center text-sm text-[#6b7280]">
            Yuklanmoqda...
          </div>
        ) : (
          <>
            {/* Keep hidden current item only when there are some results, to preserve focus and value */}
            {!noFilteredOptions &&
              valueForSelect &&
              !filteredOptions.some((o) => o.value === mappedExternal) && (
                <SelectItem
                  className="hidden"
                  value={mappedExternal}
                ></SelectItem>
              )}
            {filteredOptions.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
              >
                {opt.label}
              </SelectItem>
            ))}
            {noFilteredOptions && (
              <div className="p-4 text-center text-sm text-[#6b7280]">
                Natijalar yo'q
              </div>
            )}
          </>
        )}
      </SelectContent>
    </Select>
  );
}
