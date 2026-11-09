"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Filter, Search, X } from "lucide-react";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { SearchableSelect } from "@/ui/select";
import { DatePicker } from "@/ui/date-picker";
import { Button } from "@/ui/button";

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
        className={cn("bg-background rounded-lg border p-6 space-y-4", className)}
        {...props}
      >
        {/* Search Input */}
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="mb-0 pl-9 sm:pl-9"
                placeholder="Поиск документов..."
                value={filters.query || ""}
                onChange={(e) => handleFilterChange("query", e.target.value)}
              />
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <Filter className="w-4 h-4" />
            Фильтры
          </Button>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={clearFilters}
            >
              <X className="w-4 h-4" />
              Очистить
            </Button>
          )}
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="border-t border-border pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category */}
              <div className="space-y-1.5">
                <Label>Категория</Label>
                <SearchableSelect
                placeholder="Все категории"
                options={[{ value: "", label: "Все категории" }, ...categories]}
                value={filters.category || ""}
                onValueChange={(value) => handleFilterChange("category", value)}
                clearable
              />
            </div>

              {/* Status */}
              <div className="space-y-1.5">
                <Label>Статус</Label>
                <SearchableSelect
                placeholder="Все статусы"
                options={[
                  { value: "", label: "Все статусы" },
                  ...statusOptions,
                ]}
                value={filters.status || ""}
                onValueChange={(value) => handleFilterChange("status", value)}
                clearable
              />
            </div>

              {/* Author */}
              <div className="space-y-1.5">
                <Label>Автор</Label>
                <SearchableSelect
                placeholder="Все авторы"
                options={[{ value: "", label: "Все авторы" }, ...authors]}
                value={filters.author || ""}
                onValueChange={(value) => handleFilterChange("author", value)}
                searchable
                clearable
              />
            </div>

              {/* Department */}
              <div className="space-y-1.5">
                <Label>Подразделение</Label>
                <SearchableSelect
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
                <Label className="text-sm font-medium text-foreground-secondary mb-2 block">
                  Теги
                </Label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleTagToggle(tag)}
                      className={cn(
                        "px-3 py-1 rounded-full text-sm border transition-colors",
                        selectedTags.includes(tag)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-foreground-secondary border-border-strong hover:border-primary"
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
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
            <span className="text-sm text-muted-foreground">Активные фильтры:</span>
            {filters.category && (
              <span className="px-2 py-1 bg-muted text-foreground-secondary text-xs rounded border">
                Категория:{" "}
                {categories.find((c) => c.value === filters.category)?.label}
              </span>
            )}
            {filters.status && (
              <span className="px-2 py-1 bg-muted text-foreground-secondary text-xs rounded border">
                Статус:{" "}
                {statusOptions.find((s) => s.value === filters.status)?.label}
              </span>
            )}
            {filters.author && (
              <span className="px-2 py-1 bg-muted text-foreground-secondary text-xs rounded border">
                Автор: {authors.find((a) => a.value === filters.author)?.label}
              </span>
            )}
            {selectedTags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-primary/10 text-primary text-xs rounded border"
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
