import { Input } from "@/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/ui/select";
import { Button } from "@/ui/button";
import { Trash2 } from "lucide-react";

interface ClassificatorsFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCount: number;
  onBulkDelete: () => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  onAdd: () => void;
}

export function ClassificatorsFilters({
  searchTerm,
  onSearchChange,
  selectedCount,
  onBulkDelete,
  statusFilter,
  onStatusChange,
  onAdd,
}: ClassificatorsFiltersProps) {
  return (
    <div className="flex gap-2 mb-4 items-center justify-end">
      {/* <Input
        placeholder="Klassifikator nomi..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-[280px] h-10 mb-0"
      /> */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-2">
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
            O'chirish
          </Button>
        </div>
      )}
      <div className="flex gap-2 items-center">
        {/* <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="max-w-[140px] h-10 mb-0">
            <SelectValue placeholder="Barcha holatlar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha holatlar</SelectItem>
            <SelectItem value="active">Faol</SelectItem>
            <SelectItem value="inactive">Nofaol</SelectItem>
          </SelectContent>
        </Select> */}
        <Button
          onClick={onAdd}
          className="h-10 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white whitespace-nowrap"
        >
          <span className="flex items-center">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Yangi klassifikator
          </span>
        </Button>
      </div>
    </div>
  );
}
