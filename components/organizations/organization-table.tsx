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
import { Edit, Trash2, Building2, Download } from "lucide-react";
import { OrganizationsFilters } from "@/components/organizations/organization-filters";
import { Card } from "@/ui/card";
import { PaginatedData } from "@/api/types/general";
import { Organization } from "@/api/types/organizations";

import { TableSkeleton } from "@/ui/table-skeleton";
import { format } from "date-fns";
import { PermissionGuard } from "../permission-guard";
import { Pagination } from "@/ui/pagination";
import { getFileName, getPageCount } from "@/lib/utils";
import PageFilters from "@/ui/filters";

interface OrganizationTableProps {
  organizations: PaginatedData<Organization>;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onEdit: (organization: Organization) => void;
  onDelete: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onCreateNew: () => void;
  isLoading: boolean;
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
}

export function OrganizationTable({
  organizations,
  selectedIds,
  onSelectionChange,
  onEdit,
  onDelete,
  onBulkDelete,
  onCreateNew,
  isLoading,
  totalPages,
  currentPage,
  onPageChange,
  totalItems,
}: OrganizationTableProps) {
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(organizations?.results?.map((org) => org.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, id]);
    } else {
      onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length > 0) {
      onBulkDelete(selectedIds);
    }
  };

  return (
    <Card className="rounded-xl">
      <PageFilters
        filters={[]}
        hasSearch={true}
        searchPlaceholder="Tashkilot nomi"
        onAdd={onCreateNew}
        addButtonText="Yangi tashkilot"
        addButtonPermittion="create_organization"
        selectedCount={selectedIds.length}
        onBulkDelete={handleBulkDelete}
        bulkDeleteText="O'chirish"
      />
      <div className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 text-[var(--table-header-fg)] ">
              <TableHead className="w-12 p-3 ">
                <Checkbox
                  checked={
                    selectedIds.length === organizations?.results?.length &&
                    organizations?.results.length > 0
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="w-16 p-3 ">#</TableHead>
              <TableHead className="p-3">Tashkilot</TableHead>
              <TableHead className="p-3">Huquqiy asos</TableHead>
              <TableHead className="p-3">Asos fayl</TableHead>
              <TableHead className="p-3">Yaratilgan sana</TableHead>
              <TableHead className="w-32 p-3">Amallar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton rows={5} columns={8} />
            ) : organizations?.results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  <div className="text-center py-8 text-[var(--muted-foreground)]">
                    Tashkilotlar topilmadi.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              organizations?.results?.map((organization, index) => (
                <TableRow
                  key={organization.id}
                  className={` transition-colors hover:bg-muted/50 `}
                >
                  <TableCell className="p-3">
                    <Checkbox
                      checked={selectedIds.includes(organization.id)}
                      onCheckedChange={(checked) =>
                        handleSelectOne(organization.id, !!checked)
                      }
                    />
                  </TableCell>
                  <TableCell className="font-semibold text-[var(--primary)] p-3">
                    {index + 1}
                  </TableCell>
                  <TableCell className="p-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-[var(--primary)]" />
                      <span className="font-medium">{organization.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="p-3">
                    <span className="font-medium">
                      {organization.legal_basis}
                    </span>
                  </TableCell>
                  <TableCell className="p-3">
                    <a
                      href={organization.attachment_file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium"
                    >
                      {getFileName(organization.attachment_file)}
                    </a>
                  </TableCell>
                  <TableCell className="p-3 text-[var(--muted-foreground)]">
                    {format(organization.created, "dd.MM.yyyy HH:mm")}
                  </TableCell>
                  <TableCell className="p-3">
                    <div className="flex items-center gap-2">
                      <PermissionGuard permission="edit_organization">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onEdit(organization)}
                          className="h-8 w-8 p-0 border border-[var(--border)] hover:bg-[var(--primary)]/10"
                          aria-label="Tahrirlash"
                        >
                          <Edit className="h-4 w-4 text-[var(--primary)]" />
                        </Button>
                      </PermissionGuard>
                      <PermissionGuard permission="delete_organization">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onDelete(organization.id)}
                          className="h-8 w-8 p-0 border border-[var(--border)] hover:bg-[var(--destructive)]/10"
                          aria-label="O'chirish"
                        >
                          <Trash2 className="h-4 w-4 text-[var(--destructive)]" />
                        </Button>
                      </PermissionGuard>
                      <a
                        href={organization.attachment_file}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 p-0 border border-[var(--border)] hover:bg-[var(--primary)]/10"
                        >
                          <Download className="h-4 w-4 text-[var(--primary)]" />
                        </Button>
                      </a>
                    </div>
                  </TableCell>
                </TableRow>
              ))
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
  );
}
