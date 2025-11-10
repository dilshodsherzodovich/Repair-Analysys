"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Filter, X } from "lucide-react";
import { EnhancedInput } from "@/ui/enhanced-input";
import { EnhancedSelect } from "@/ui/enhanced-select";
import { DatePicker } from "@/ui/date-picker";
import { EnhancedButton } from "@/ui/enhanced-button";

export interface DocumentSearchFilters {
  query?: string;
  category?: string;
  status?: string;
  author?: string;
  dateFrom?: Date;
  dateTo?: Date;
  tags?: string[];
  department?: string;
}

export interface DocumentSearchProps {
  filters: DocumentSearchFilters;
  onFiltersChange: (filters: DocumentSearchFilters) => void;
  categories?: Array<{ value: string; label: string }>;
  authors?: Array<{ value: string; label: string }>;
  departments?: Array<{ value: string; label: string }>;
  availableTags?: string[];
  className?: string;
}

const DocumentSearch = React.forwardRef<HTMLDivElement, DocumentSearchProps>(
  (
    {
      filters,
      onFiltersChange,
      categories = [],
      authors = [],
      departments = [],
      availableTags = [],
      className,
      ...props
    },
    ref
  ) => {
    const [showAdvanced, setShowAdvanced] = React.useState(false);
    const [selectedTags, setSelectedTags] = React.useState<string[]>(
      filters.tags || []
    );

    const statusOptions = [
      { value: "draft", label: "Черновик" },
      { value: "review", label: "На рассмотрении" },
      { value: "approved", label: "Утверждено" },
      { value: "archived", label: "Архивировано" },
    ];

    const handleFilterChange = (
      key: keyof DocumentSearchFilters,
      value: any
    ) => {
      onFiltersChange({ ...filters, [key]: value });
    };

    const handleTagToggle = (tag: string) => {
      const newTags = selectedTags.includes(tag)
        ? selectedTags.filter((t) => t !== tag)
        : [...selectedTags, tag];
      setSelectedTags(newTags);
      handleFilterChange("tags", newTags);
    };

    const clearFilters = () => {
      setSelectedTags([]);
      onFiltersChange({});
    };

    const hasActiveFilters = Object.values(filters).some(
      (value) =>
        value !== undefined &&
        value !== "" &&
        (Array.isArray(value) ? value.length > 0 : true)
    );

    return (
      <div
        ref={ref}
        className={cn("bg-white rounded-lg border p-6 space-y-4", className)}
        {...props}
      >
        {/* Search Input */}
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <EnhancedInput
              variant="search"
              placeholder="Поиск документов..."
              value={filters.query || ""}
              onChange={(e) => handleFilterChange("query", e.target.value)}
              clearable
            />
          </div>
          <EnhancedButton
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
            leftIcon={<Filter className="w-4 h-4" />}
          >
            Фильтры
          </EnhancedButton>
          {hasActiveFilters && (
            <EnhancedButton
              variant="ghost"
              onClick={clearFilters}
              leftIcon={<X className="w-4 h-4" />}
            >
              Очистить
            </EnhancedButton>
          )}
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="border-t border-[#e5e7eb] pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category */}
              <EnhancedSelect
                label="Категория"
                placeholder="Все категории"
                options={[{ value: "", label: "Все категории" }, ...categories]}
                value={filters.category || ""}
                onValueChange={(value) => handleFilterChange("category", value)}
                clearable
              />

              {/* Status */}
              <EnhancedSelect
                label="Статус"
                placeholder="Все статусы"
                options={[
                  { value: "", label: "Все статусы" },
                  ...statusOptions,
                ]}
                value={filters.status || ""}
                onValueChange={(value) => handleFilterChange("status", value)}
                clearable
              />

              {/* Author */}
              <EnhancedSelect
                label="Автор"
                placeholder="Все авторы"
                options={[{ value: "", label: "Все авторы" }, ...authors]}
                value={filters.author || ""}
                onValueChange={(value) => handleFilterChange("author", value)}
                searchable
                clearable
              />

              {/* Department */}
              <EnhancedSelect
                label="Подразделение"
                placeholder="Все подразделения"
                options={[
                  { value: "", label: "Все подразделения" },
                  ...departments,
                ]}
                value={filters.department || ""}
                onValueChange={(value) =>
                  handleFilterChange("department", value)
                }
                clearable
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DatePicker
                label="Дата от"
                placeholder="Выберите дату"
                value={filters.dateFrom}
                onValueChange={(date) => handleFilterChange("dateFrom", date)}
              />
              <DatePicker
                label="Дата до"
                placeholder="Выберите дату"
                value={filters.dateTo}
                onValueChange={(date) => handleFilterChange("dateTo", date)}
                minDate={filters.dateFrom}
              />
            </div>

            {/* Tags */}
            {availableTags.length > 0 && (
              <div>
                <label className="text-sm font-medium text-[#374151] mb-2 block">
                  Теги
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleTagToggle(tag)}
                      className={cn(
                        "px-3 py-1 rounded-full text-sm border transition-colors",
                        selectedTags.includes(tag)
                          ? "bg-[#2354bf] text-white border-[#2354bf]"
                          : "bg-white text-[#374151] border-[#d1d5db] hover:border-[#2354bf]"
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#e5e7eb]">
            <span className="text-sm text-[#6b7280]">Активные фильтры:</span>
            {filters.category && (
              <span className="px-2 py-1 bg-[#f3f4f6] text-[#374151] text-xs rounded border">
                Категория:{" "}
                {categories.find((c) => c.value === filters.category)?.label}
              </span>
            )}
            {filters.status && (
              <span className="px-2 py-1 bg-[#f3f4f6] text-[#374151] text-xs rounded border">
                Статус:{" "}
                {statusOptions.find((s) => s.value === filters.status)?.label}
              </span>
            )}
            {filters.author && (
              <span className="px-2 py-1 bg-[#f3f4f6] text-[#374151] text-xs rounded border">
                Автор: {authors.find((a) => a.value === filters.author)?.label}
              </span>
            )}
            {selectedTags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-[#2354bf]/10 text-[#2354bf] text-xs rounded border"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }
);
DocumentSearch.displayName = "DocumentSearch";

export { DocumentSearch };
