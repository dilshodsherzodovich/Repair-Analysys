"use client";

import { Input } from "@/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";

interface StructureFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCount: number;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  departmentFilter: string;
  onDepartmentChange: (value: string) => void;
}

export function StructureFilters({
  searchTerm,
  onSearchChange,
  selectedCount,
  categoryFilter,
  onCategoryChange,
  statusFilter,
  onStatusChange,
  departmentFilter,
  onDepartmentChange,
}: StructureFiltersProps) {
  return (
    <div className="flex items-center justify-between bg-[var(--table-header-bg)] p-4 border-b border-[var(--border)]">
      <div className="flex items-center gap-4 flex-1">
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Umumiy qidiruv..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="border-[var(--border)]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={categoryFilter} onValueChange={onCategoryChange}>
            <SelectTrigger className="w-40 border-[var(--border)]">
              <SelectValue placeholder="Kategoriya" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha kategoriyalar</SelectItem>
              <SelectItem value="Qishloq xo'jaligi">
                Qishloq xo'jaligi
              </SelectItem>
              <SelectItem value="San'at">San'at</SelectItem>
              <SelectItem value="Tibbiyot">Tibbiyot</SelectItem>
              <SelectItem value="Ta'lim">Ta'lim</SelectItem>
              <SelectItem value="Iqtisodiyot">Iqtisodiyot</SelectItem>
            </SelectContent>
          </Select>

          <Select value={departmentFilter} onValueChange={onDepartmentChange}>
            <SelectTrigger className="w-40 border-[var(--border)]">
              <SelectValue placeholder="Quyi tashkilot" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha Quyi tashkilotlar</SelectItem>
              <SelectItem value="Qishloq xo'jaligi Quyi tashkiloti">
                Qishloq xo'jaligi Quyi tashkiloti
              </SelectItem>
              <SelectItem value="San'at Quyi tashkiloti">
                San'at Quyi tashkiloti
              </SelectItem>
              <SelectItem value="Tibbiyot Quyi tashkiloti">
                Tibbiyot Quyi tashkiloti
              </SelectItem>
              <SelectItem value="Ta'lim Quyi tashkiloti">
                Ta'lim Quyi tashkiloti
              </SelectItem>
              <SelectItem value="Iqtisodiyot Quyi tashkiloti">
                Iqtisodiyot Quyi tashkiloti
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="w-40 border-[var(--border)]">
              <SelectValue placeholder="Holat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha holatlar</SelectItem>
              <SelectItem value="active">Faol</SelectItem>
              <SelectItem value="inactive">Nofaol</SelectItem>
              <SelectItem value="completed">Bajarilgan</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {selectedCount > 0 && (
          <div className="text-sm text-[var(--muted-foreground)]">
            {selectedCount} ta tanlangan
          </div>
        )}
      </div>
    </div>
  );
}
