"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";
import { Button } from "@/ui/button";
import { Checkbox } from "@/ui/checkbox";
import { Badge } from "@/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import { DepartmentsFilters } from "@/components/departments/department-filters";
import { Card } from "@/ui/card";
import { PaginatedData } from "@/api/types/general";
import { Department } from "@/api/types/deparments";
import { TableSkeleton } from "@/ui/table-skeleton";
import { format } from "date-fns";
import { PermissionGuard } from "../permission-guard";
import { Pagination } from "@/ui/pagination";
import { getPageCount } from "@/lib/utils";
import PageFilters from "@/ui/filters";

interface DepartmentTableProps {
  departments: PaginatedData<Department>;
  onEdit: (department: Department) => void;
  onDelete: (department: Department) => void;
  onBulkDelete: (departmentIds: string[]) => void;
  onCreateNew: () => void;
  isLoading?: boolean;
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
}

export function DepartmentTable({
  departments,
  onEdit,
  onDelete,
  onBulkDelete,
  onCreateNew,
  isLoading,
  totalPages,
  currentPage,
  onPageChange,
  totalItems,
}: DepartmentTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(departments?.results?.map((dept) => dept.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectDepartment = (departmentId: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, departmentId]);
    } else {
      setSelectedIds((prev) => prev.filter((id) => id !== departmentId));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length > 0) {
      onBulkDelete(selectedIds);
      setSelectedIds([]);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <PageFilters
          filters={[]}
          hasSearch={true}
          searchPlaceholder="Quyi tashkilot nomi"
          onAdd={onCreateNew}
          addButtonText="Yangi quyi tashkilot"
          addButtonPermittion="create_department"
          selectedCount={selectedIds.length}
          onBulkDelete={handleBulkDelete}
          bulkDeleteText="O'chirish"
        />
        <div className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 text-[var(--table-header-fg)] sticky top-0 z-10 ">
                <TableHead className="w-12 p-3 ">
                  <Checkbox
                    checked={
                      selectedIds.length === departments?.results?.length &&
                      departments?.results?.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-16 p-3 ">#</TableHead>
                <TableHead className="p-3">Quyi tashkilot</TableHead>
                <TableHead className="p-3">Tashkilot</TableHead>
                <TableHead className="p-3">Yaratilgan sana</TableHead>
                <TableHead className="w-32 p-3">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton columns={7} rows={5} />
              ) : (
                <>
                  {departments?.results?.map((department, index) => (
                    <TableRow
                      key={department.id}
                      className={" transition-colors hover:bg-muted/50 "}
                    >
                      <TableCell className="p-3">
                        <Checkbox
                          checked={selectedIds.includes(department.id)}
                          onCheckedChange={(checked) =>
                            handleSelectDepartment(department.id, !!checked)
                          }
                        />
                      </TableCell>
                      <TableCell className="font-semibold text-[var(--primary)] p-3">
                        {index + 1}
                      </TableCell>
                      <TableCell className="p-3">
                        <span className="font-medium">{department.name}</span>
                      </TableCell>
                      <TableCell className="p-3 text-[var(--muted-foreground)]">
                        {department.organization}
                      </TableCell>
                      <TableCell className="p-3 text-[var(--muted-foreground)]">
                        {department.created
                          ? format(department.created, "dd.MM.yyyy HH:mm")
                          : ""}
                      </TableCell>
                      <TableCell className="p-3">
                        <div className="flex items-center gap-2">
                          <PermissionGuard permission="edit_department">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => onEdit(department)}
                              className="h-8 w-8 p-0 border border-[var(--border)] hover:bg-[var(--primary)]/10"
                              aria-label="Tahrirlash"
                            >
                              <Edit className="h-4 w-4 text-[var(--primary)]" />
                            </Button>
                          </PermissionGuard>
                          <PermissionGuard permission="delete_department">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => onDelete(department)}
                              className="h-8 w-8 p-0 border border-[var(--border)] hover:bg-[var(--destructive)]/10"
                              aria-label="O'chirish"
                            >
                              <Trash2 className="h-4 w-4 text-[var(--destructive)]" />
                            </Button>
                          </PermissionGuard>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              )}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <div className="p-4 border-t border-[var(--border)]">
              <Pagination
                currentPage={currentPage}
                totalPages={getPageCount(totalPages, 10)}
                onPageChange={onPageChange}
                totalItems={totalItems}
              />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
