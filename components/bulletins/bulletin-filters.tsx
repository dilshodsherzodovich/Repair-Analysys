"use client";

import { Input } from "@/ui/input";
import { Button } from "@/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { Trash2, Plus, Search, Filter, X } from "lucide-react";
import { Organization } from "@/api/types/organizations";
import { Badge } from "@/ui/badge";
import { PermissionGuard } from "../permission-guard";

interface BulletinFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCount: number;
  onBulkDelete: () => void;
  organizationFilter: string;
  onOrganizationChange: (value: string) => void;
  periodTypeFilter: string;
  onPeriodTypeChange: (value: string) => void;
  onAdd: () => void;
  organizations: Organization[];
  isLoadingOrganizations?: boolean;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function BulletinFilters({
  searchTerm,
  onSearchChange,
  selectedCount,
  onBulkDelete,
  organizationFilter,
  onOrganizationChange,
  periodTypeFilter,
  onPeriodTypeChange,
  onAdd,
  organizations,
  isLoadingOrganizations = false,
  onClearFilters,
  hasActiveFilters,
}: BulletinFiltersProps) {
  const periodTypes = [
    { value: "all", label: "Barcha muddatlar" },
    { value: "weekly", label: "Haftalik" },
    { value: "monthly", label: "Oylik" },
    { value: "quarterly", label: "Choraklik" },
    { value: "every_n_months", label: "Har N oyda" },
    { value: "daily", label: "Kunlik" },
    { value: "yearly", label: "Yillik" },
  ];

  return (
    <div className="flex flex-col gap-3 bg-[var(--table-header-bg)] p-4 border-b border-[var(--border)]">
      {/* Main Filters Row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          {/* Search Input */}
          <div className="flex-1 max-w-sm relative flex items-center">
            <Search className=" h-4 w-4 text-gray-400 absolute left-2 translate-y-[-5px]" />
            <Input
              placeholder="Byulleten nomi bo'yicha qidiruv..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="border-[var(--border)] pl-10"
            />
          </div>

          {/* Organization Filter */}
          <Select
            value={organizationFilter}
            onValueChange={onOrganizationChange}
          >
            <SelectTrigger className="w-48 border-[var(--border)]">
              <SelectValue placeholder="Tashkilot tanlang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha tashkilotlar</SelectItem>
              {isLoadingOrganizations ? (
                <SelectItem value="loading" disabled>
                  Yuklanmoqda...
                </SelectItem>
              ) : (
                organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          {/* Period Type Filter */}
          <Select value={periodTypeFilter} onValueChange={onPeriodTypeChange}>
            <SelectTrigger className="w-40 border-[var(--border)]">
              <SelectValue placeholder="Muddat turi" />
            </SelectTrigger>
            <SelectContent>
              {periodTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear Filters Button */}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <Button
              variant="outline"
              onClick={onBulkDelete}
              className="text-[var(--destructive)] border-[var(--destructive)] hover:bg-[var(--destructive)]/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              O'chirish ({selectedCount})
            </Button>
          )}
          <PermissionGuard permission="create_journal">
            <Button
              onClick={onAdd}
              className="h-10 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white whitespace-nowrap flex items-center"
            >
              <Plus className="text-white size-5" />
              Yangi byulleten
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600">Faol filtrlar:</span>
          {organizationFilter !== "all" && (
            <Badge variant="secondary" className="text-xs">
              Tashkilot:{" "}
              {organizations.find((org) => org.id === organizationFilter)
                ?.name || organizationFilter}
            </Badge>
          )}
          {periodTypeFilter !== "all" && (
            <Badge variant="secondary" className="text-xs">
              Muddat:{" "}
              {periodTypes.find((type) => type.value === periodTypeFilter)
                ?.label || periodTypeFilter}
            </Badge>
          )}
          {searchTerm && (
            <Badge variant="secondary" className="text-xs">
              Qidiruv: "{searchTerm}"
            </Badge>
          )}
          {hasActiveFilters && (
            <Button size="sm" onClick={onClearFilters} variant="outline">
              <X className="h-4 w-4 mr-1" />
              Tozalash
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
