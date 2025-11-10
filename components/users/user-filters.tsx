"use client";
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
import { userRoles } from "@/lib/users";
import { useOrganizations } from "@/api/hooks/use-organizations";
import { useDepartments } from "@/api/hooks/use-departmants";
import { PermissionGuard } from "../permission-guard";

interface UserFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCount: number;
  onBulkDelete: () => void;
  roleFilter: string;
  onRoleChange: (value: string) => void;
  orgFilter: string;
  onOrgChange: (value: string) => void;
  deptFilter: string;
  onDeptChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  onAdd: () => void;
}

export function UserFilters({
  searchTerm,
  onSearchChange,
  selectedCount,
  onBulkDelete,
  roleFilter,
  onRoleChange,
  orgFilter,
  onOrgChange,
  deptFilter,
  onDeptChange,
  statusFilter,
  onStatusChange,
  onAdd,
}: UserFiltersProps) {
  const { data: organizations, isPending: isOrgsPending } = useOrganizations({
    no_page: true,
  });
  const { data: departments, isPending: isDepsPending } = useDepartments({
    no_page: true,
  });

  const mapOut = (v: string) => (v === "all" ? "" : v);
  const mapIn = (v: string) => (v === "" ? "all" : v);

  return (
    <div className="flex gap-2 mb-4 items-center justify-between">
      <Input
        placeholder="Foydalanuvchi nomi yoki login..."
        className="min-w-[180px] h-10 mb-0"
        value={searchTerm}
        onChange={(e) => {
          console.log(e.target.value);
          onSearchChange(e.target.value);
        }}
      />
      <Select
        value={mapIn(roleFilter)}
        onValueChange={(v) => onRoleChange(mapOut(v))}
      >
        <SelectTrigger className="min-w-[160px] h-10 mb-0">
          <SelectValue placeholder="Barcha rollar" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Barcha rollar</SelectItem>
          {userRoles.slice(1).map((role) => (
            <SelectItem key={role} value={role}>
              {role}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={mapIn(orgFilter)}
        onValueChange={(v) => onOrgChange(mapOut(v))}
      >
        <SelectTrigger className="min-w-[200px] h-10 mb-0">
          <SelectValue placeholder="Barcha tashkilotlar" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Barcha tashkilotlar</SelectItem>
          {organizations?.results?.map((org) => (
            <SelectItem key={org.id} value={org.id}>
              {org.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={mapIn(deptFilter)}
        onValueChange={(v) => onDeptChange(mapOut(v))}
      >
        <SelectTrigger className="min-w-[220px] h-10 mb-0">
          <SelectValue placeholder="Barcha Quyi tashkilotlar" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Barcha Quyi tashkilotlar</SelectItem>
          {departments?.results?.map((dept) => (
            <SelectItem key={dept.id} value={dept.id}>
              {dept.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={mapIn(statusFilter)}
        onValueChange={(v) => onStatusChange(mapOut(v))}
      >
        <SelectTrigger className="min-w-[160px] h-10 mb-0">
          <SelectValue placeholder="Barcha holatlar" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Barcha holatlar</SelectItem>
          <SelectItem value="active">Faol</SelectItem>
          <SelectItem value="reserve">Zaxirada</SelectItem>
          <SelectItem value="repair">Ta'mirda</SelectItem>
          <SelectItem value="inactive">Nofaol</SelectItem>
        </SelectContent>
      </Select>
      <PermissionGuard permission="create_user">
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
            Yangi foydalanuvchi
          </span>
        </Button>
      </PermissionGuard>

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
    </div>
  );
}
