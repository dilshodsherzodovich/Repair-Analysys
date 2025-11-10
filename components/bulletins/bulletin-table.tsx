"use client";

import { useMemo, useState } from "react";
import {
  Edit,
  Trash2,
  Eye,
  UserCheck,
  BarChart3,
  Building2,
} from "lucide-react";
import { Badge } from "@/ui/badge";
import { Checkbox } from "@/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";
import { Pagination } from "@/ui/pagination";
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/popover";
import Link from "next/link";
import { Bulletin } from "@/api/types/bulleten";
import { TableSkeleton } from "@/ui/table-skeleton";
import { PermissionGuard } from "../permission-guard";
import { format } from "date-fns";
import PageFilters from "@/ui/filters";
import { useOrganizations } from "@/api/hooks/use-organizations";

interface BulletinTableProps {
  bulletins: Bulletin[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onEdit: (bulletin: Bulletin) => void;
  onDelete: (bulletin: Bulletin) => void;
  onBulkDelete: (ids: string[]) => void;
  onCreateNew: () => void;
  isLoading: boolean;
  isDeleting: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
}

// Deadline type mapping to Uzbek labels
const deadlineLabels: { [key: string]: string } = {
  weekly: "Haftalik",
  monthly: "Oylik",
  quarterly: "Choraklik",
  every_n_months: "Har N oyda",
  daily: "Kunlik",
  yearly: "Yillik",
};

const getDeadlineLabel = (periodType: string | undefined): string => {
  if (!periodType) return "N/A";
  return deadlineLabels[periodType] || periodType;
};

// Component for displaying organizations in a popover
const OrganizationsDisplay = ({ organizations }: { organizations: any[] }) => {
  if (!organizations || organizations.length === 0) {
    return (
      <div className="text-sm text-[var(--muted-foreground)] italic">
        Tashkilotlar tanlanmagan
      </div>
    );
  }

  const totalOrgs = organizations.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="flex items-center gap-1 cursor-pointer hover:bg-muted/50 rounded p-1 -m-1 transition-colors">
          <Building2 className="w-4 h-4 text-[var(--primary)]" />
          <span className="text-sm font-medium text-[var(--foreground)]">
            {totalOrgs} tashkilot
          </span>
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[500px] max-h-96 overflow-y-auto"
        align="start"
      >
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-[var(--foreground)] mb-2">
            Tashkilotlar ({totalOrgs})
          </h4>
          {organizations.map((mainOrg, index) => (
            <div
              key={mainOrg.id}
              className="border border-[var(--border)] rounded-lg p-3 bg-[var(--muted)]/10"
            >
              <div className="text-sm font-medium text-[var(--foreground)] mb-2">
                <div className="break-words leading-tight">{mainOrg.name}</div>
              </div>
              {mainOrg.secondary_organizations &&
              mainOrg.secondary_organizations.length > 0 ? (
                <div className="space-y-1">
                  <div className="text-xs text-[var(--muted-foreground)] font-medium">
                    Quyi tashkilotlar:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {mainOrg.secondary_organizations.map((secOrg: any) => (
                      <Badge
                        key={secOrg.id}
                        variant="secondary"
                        className="text-xs px-2 py-1 border-[var(--border)] break-words whitespace-normal"
                      >
                        {secOrg.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-[var(--muted-foreground)] italic">
                  Quyi tashkilotlar yo'q
                </div>
              )}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export function BulletinTable({
  bulletins,
  selectedIds = [],
  isLoading,
  currentPage,
  totalPages,
  onSelectionChange,
  onEdit,
  onDelete,
  onBulkDelete,
  onCreateNew,
  onPageChange,
  totalItems,
}: BulletinTableProps) {
  const { data: organizations, isPending: isOrgsPending } = useOrganizations({
    no_page: true,
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(bulletins.map((b) => b.id));
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

  const handleDeleteClick = (bulletin: Bulletin) => {
    onDelete(bulletin);
  };

  const byulletenFilters = useMemo(() => {
    return [
      {
        name: "org",
        label: "Tashkilot",
        isSelect: true,
        options: [
          { label: "Barcha tashkilotlar", value: "" },
          ...(organizations?.results?.map((org) => ({
            label: org.name,
            value: org.id,
          })) || []),
        ],
        placeholder: "Barcha tashkilotlar",
        searchable: true,
        clearable: true,
        loading: isOrgsPending,
        minWidth: "200px",
      },
      {
        name: "journal_type",
        label: "Byulleten turi",
        isSelect: true,
        options: [
          { label: "Barcha turlar", value: "" },
          {
            label: "Byulleten",
            value: "bulleten",
          },
          {
            label: "Jurnal",
            value: "journal",
          },
        ],
        placeholder: "Barcha turlar",
        loading: false,
        minWidth: "200px",
      },
    ];
  }, [organizations]);

  return (
    <Card className="rounded-xl">
      <PageFilters
        filters={byulletenFilters}
        hasSearch={true}
        searchPlaceholder="Byulleten nomi"
        onAdd={onCreateNew}
        addButtonText="Yangi byulleten"
        addButtonPermittion="create_journal"
        selectedCount={selectedIds.length}
        onBulkDelete={handleBulkDelete}
        bulkDeleteText="O'chirish"
      />

      <div className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 text-[var(--table-header-fg)] ">
              <PermissionGuard permission="delete_journal">
                <TableHead className="w-4 p-3 ">
                  <Checkbox
                    checked={
                      selectedIds.length === bulletins.length &&
                      bulletins.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
              </PermissionGuard>
              <TableHead className="w-8 p-3 ">№</TableHead>
              <TableHead className="p-3">Byulleten nomi</TableHead>
              <TableHead className="p-3">Byulleten tavsifi</TableHead>
              <PermissionGuard permission="view_bulletin_main_info">
                <TableHead className="p-3">Tashkilotlar</TableHead>
              </PermissionGuard>
              <TableHead className="p-3">Mas'ul shaxslar</TableHead>
              <TableHead className="p-3">Yaratilgan sana</TableHead>
              <TableHead className="p-3">Muddat turi</TableHead>
              <TableHead className="p-3">Muddati</TableHead>
              <TableHead className="w-32 p-3">Amallar </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton rows={10} columns={10} />
            ) : bulletins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  <div className="text-sm whitespace-nowrap text-[var(--muted-foreground)]">
                    Byulletenlar topilmadi.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              bulletins.map((bulletin, index) => (
                <TableRow
                  key={bulletin.id}
                  className={` transition-colors hover:bg-muted/50 `}
                >
                  <PermissionGuard permission="delete_journal">
                    <TableCell className="p-3">
                      <Checkbox
                        checked={selectedIds.includes(bulletin.id)}
                        onCheckedChange={(checked) =>
                          handleSelectOne(bulletin.id, !!checked)
                        }
                      />
                    </TableCell>
                  </PermissionGuard>

                  <TableCell className="font-semibold text-[var(--primary)] p-3">
                    {(currentPage - 1) * 10 + index + 1}
                  </TableCell>
                  <TableCell className="font-medium p-3 max-w-lg">
                    <div className="truncate" title={bulletin.name}>
                      {bulletin.name}
                    </div>
                  </TableCell>
                  <TableCell className="p-3 max-w-md">
                    <div className="truncate" title={bulletin.description}>
                      {bulletin.description}
                    </div>
                  </TableCell>
                  <PermissionGuard permission="view_bulletin_main_info">
                    <TableCell className="p-3">
                      <OrganizationsDisplay
                        organizations={bulletin.main_organizations_list || []}
                      />
                    </TableCell>
                  </PermissionGuard>
                  <TableCell className="p-3 max-w-xs">
                    <div className="flex flex-wrap gap-1">
                      {(bulletin.employees_list || []).map((emp) => (
                        <Badge
                          key={emp.id}
                          variant="outline"
                          className="text-xs px-2 py-1 border-[var(--border)] bg-[var(--primary)]/10 text-[var(--primary)] break-words"
                        >
                          <span className="break-words">
                            {emp.first_name} {emp.last_name}
                          </span>
                        </Badge>
                      ))}
                      {(!bulletin.employees_list ||
                        bulletin.employees_list.length === 0) && (
                        <div className="text-sm whitespace-nowrap text-[var(--muted-foreground)] italic">
                          Mas'ul shaxslar tanlanmagan
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="p-3 text-[var(--muted-foreground)]">
                    {format(bulletin.created, "dd.MM.yyyy")}
                  </TableCell>
                  <TableCell className="p-3">
                    <Badge
                      variant="secondary"
                      className="bg-[var(--muted)]/50 text-[var(--foreground)] border-none"
                    >
                      {getDeadlineLabel(bulletin.deadline?.period_type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="p-3 text-[var(--muted-foreground)]">
                    {format(bulletin.deadline?.current_deadline!, "dd.MM.yyyy")}
                  </TableCell>

                  <TableCell className="p-3">
                    <div className="flex items-center gap-2">
                      <PermissionGuard permission="edit_journal">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onEdit(bulletin)}
                          className="h-8 w-8 p-0 border border-[var(--border)] hover:bg-[var(--primary)]/10"
                          aria-label="Tahrirlash"
                        >
                          <Edit className="h-4 w-4 text-[var(--primary)]" />
                        </Button>
                      </PermissionGuard>
                      <PermissionGuard permission="delete_journal">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteClick(bulletin)}
                          className="h-8 w-8 p-0 border border-[var(--border)] hover:bg-[var(--destructive)]/10"
                          aria-label="O'chirish"
                        >
                          <Trash2 className="h-4 w-4 text-[var(--destructive)]" />
                        </Button>
                      </PermissionGuard>
                      <PermissionGuard permission="view_journal_detail">
                        <Link
                          href={`/bulletins/${bulletin.id}/detail`}
                          className="inline-flex items-center justify-center h-8 w-8 p-0 border border-[var(--border)] rounded-md hover:bg-[var(--primary)]/10 transition-colors"
                          aria-label="Ma'lumotlar"
                        >
                          <Eye className="h-4 w-4 text-[var(--primary)]" />
                        </Link>
                      </PermissionGuard>
                      <PermissionGuard permission="view_journal_structure">
                        <Link
                          href={`/bulletins/${bulletin.id}/structure`}
                          className="inline-flex items-center justify-center h-8 w-8 p-0 border border-[var(--border)] rounded-md hover:bg-[var(--primary)]/10 transition-colors"
                          aria-label="Struktura"
                        >
                          <BarChart3 className="h-4 w-4 text-[var(--primary)]" />
                        </Link>
                      </PermissionGuard>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-[var(--border)]">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            totalItems={totalItems}
          />
        </div>
      )}
    </Card>
  );
}
