"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Input } from "@/ui/input";
import { Button } from "@/ui/button";
import { DatePicker } from "@/ui/date-picker";
import { Trash2, Plus, Search, FileSpreadsheet, ChevronsUpDown, Check } from "lucide-react";
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

export interface FiltersQuery {
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
  searchPlaceholder,
  datePickerLabel,
  dateRangePickerLabel,
  onAdd,
  addButtonText,
  addButtonIcon,
  addButtonPermittion,
  onExport,
  exportButtonText,
  exportButtonIcon,
  selectedCount = 0,
  onBulkDelete,
  bulkDeleteText,
  className,
}: PageFiltersProps) {
  const t = useTranslations("Filters");
  const { updateQuery, getQueryValue } = useFilterParams();

  const effectiveSearchPlaceholder = searchPlaceholder ?? t("search_placeholder");
  const effectiveDatePickerLabel = datePickerLabel ?? t("date_label");
  const effectiveDateRangePickerLabel = dateRangePickerLabel ?? t("date_range_label");
  const effectiveAddButtonText = addButtonText ?? t("add_button");
  const effectiveExportButtonText = exportButtonText ?? t("export_button");
  const effectiveBulkDeleteText = bulkDeleteText ?? t("bulk_delete");
  const selectPlaceholder = t("select_placeholder");

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
              placeholder={effectiveSearchPlaceholder}
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
                  placeholder={filter.placeholder || selectPlaceholder}
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
                placeholder={filter.placeholder || selectPlaceholder}
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
            placeholder={effectiveDatePickerLabel}
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
              placeholder={`${effectiveDateRangePickerLabel} ${t("date_range_from")}`}
              value={currentStartDate}
              onValueChange={(date) =>
                handleDateRangeChange(date, currentEndDate)
              }
              className="w-full"
              size="md"
            />
            <DatePicker
              placeholder={`${effectiveDateRangePickerLabel} ${t("date_range_to")}`}
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
                  {effectiveAddButtonText}
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
                {effectiveExportButtonText}
              </span>
            </Button>
          )}
        </div>
      )}

      {/* Bulk Actions */}
      {selectedCount > 0 && onBulkDelete && (
        <div className="ml-auto shrink-0 flex items-center gap-2 w-full sm:w-auto">
          <span className="text-sm text-[#6b7280]">
            {t("selected_count", { count: selectedCount })}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="text-[#dc2626] border-[#dc2626] hover:bg-[#dc2626] hover:text-white bg-transparent"
            onClick={onBulkDelete}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            {effectiveBulkDeleteText}
          </Button>
        </div>
      )}
    </div>
  );
}

// Single-select with search: same pattern as multi-select (custom dropdown + search input + filtered list)
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
  const t = useTranslations("Filters");
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const [dropdownPosition, setDropdownPosition] = React.useState<
    "bottom" | "top"
  >("bottom");
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = React.useMemo(
    () => options.find((o) => o.value === value),
    [options, value]
  );

  const filteredOptions = React.useMemo(() => {
    if (!searchable || !searchValue.trim()) return options;
    const term = searchValue.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(term));
  }, [options, searchValue, searchable]);

  // Dropdown position when opening
  React.useEffect(() => {
    if (open && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 300;
      const spaceBelow = viewportHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;
      if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
        setDropdownPosition("top");
      } else {
        setDropdownPosition("bottom");
      }
    }
  }, [open]);

  // Close on click outside, clear search
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setSearchValue("");
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue);
    setOpen(false);
    setSearchValue("");
  };

  return (
    <div className="relative w-full">
      <div
        ref={triggerRef}
        className={cn(
          "flex items-center justify-between border border-[#CAD5E2] rounded-md bg-white hover:border-[#94a3b8] focus-within:ring-2 focus-within:ring-[#2354bf]/20 focus-within:border-[#2354bf] cursor-pointer min-h-10 h-10 px-3 text-sm text-left transition-colors",
          triggerClassName
        )}
        onClick={() => !loading && setOpen(!open)}
      >
        <span
          className={cn(
            "truncate flex-1 min-w-0",
            !selectedOption ? "text-[#90A1B9]" : "text-[#0F172B]"
          )}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-[#64748B]" />
      </div>

      {open && (
        <div
          ref={dropdownRef}
          className={cn(
            "absolute left-0 right-0 bg-white border border-[#CAD5E2] rounded-lg z-[999999] overflow-hidden min-w-[200px] max-w-[300px]",
            "animate-in fade-in-0 zoom-in-95 duration-100",
            dropdownPosition === "top"
              ? "bottom-full mb-1 slide-in-from-bottom-2"
              : "top-full mt-1 slide-in-from-top-2"
          )}
          style={{ zIndex: 999999 }}
        >
          {searchable && (
            <div className="p-2 border-b border-[#E2E8F0]">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
                <input
                  type="text"
                  placeholder={t("search_placeholder")}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-[#E2E8F0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2354bf]/20 focus:border-[#2354bf]"
                />
              </div>
            </div>
          )}
          <div className="max-h-[240px] overflow-y-auto py-0.5">
            {loading ? (
              <div className="p-4 text-center text-sm text-[#64748B]">
                {t("loading")}
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="py-3 text-center text-sm text-[#64748B]">
                {t("no_results")}
              </div>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={opt.disabled}
                  onClick={() => !opt.disabled && handleSelect(opt.value)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-[#F1F5F9] cursor-pointer transition-colors",
                    opt.value === value && "bg-[#EFF6FF] text-[#1d4ed8] font-medium",
                    opt.disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {opt.value === value && (
                    <Check className="h-4 w-4 shrink-0 text-[#2354bf]" />
                  )}
                  <span className="truncate">{opt.label}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
