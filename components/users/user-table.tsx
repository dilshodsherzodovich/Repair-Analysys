"use client";

import { useMemo, useState } from "react";
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

import { Edit, Trash2, User, Shield, Building } from "lucide-react";

import PageFilters from "@/ui/filters";
import { Card } from "@/ui/card";
import { PaginatedData } from "@/api/types/general";
import { UserData, UserRole } from "@/api/types/user";
import { getPageCount, getRoleName } from "@/lib/utils";
import { TableSkeleton } from "@/ui/table-skeleton";
import { PermissionGuard } from "../permission-guard";
import { Pagination } from "@/ui/pagination";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { userRoles } from "@/lib/users";
import { useOrganizations } from "@/api/hooks/use-organizations";
import { useDepartments } from "@/api/hooks/use-departmants";
import { useFilterParams } from "@/lib/hooks/useFilterParams";

interface UserTableProps {
  users: PaginatedData<UserData>;
  selectedIds: string[];
  onSelectionChange: (selected: string[]) => void;
  onEdit: (user: any) => void;
  onDelete: (user: any) => void;
  onBulkDelete: (ids: string[]) => void;
  onCreateNew: () => void;
  isLoading: boolean;
  totalPages: number;
  totalItems?: number;
  page: number;
  onPageChange: (page: number) => void;
}
export function UserTable({
  users,
  selectedIds = [],
  onSelectionChange,
  onEdit,
  onDelete,
  onBulkDelete,
  onCreateNew,
  isLoading,
  totalPages,
  totalItems,
  page,
  onPageChange,
}: UserTableProps) {
  const { updateQuery } = useFilterParams();
  const searchParams = useSearchParams();

  // Data hooks
  const { data: organizations, isPending: isOrgsPending } = useOrganizations({
    no_page: true,
  });
  const { data: departments, isPending: isDepsPending } = useDepartments({
    no_page: true,
  });

  const queryOrg = searchParams.get("org");
  const queryPage = parseInt(searchParams.get("page") || "1", 10);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(users?.results?.map((user) => user.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, userId]);
    } else {
      onSelectionChange(selectedIds.filter((id) => id !== userId));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length > 0) {
      onBulkDelete(selectedIds);
    }
  };

  const deptOptions = useMemo(() => {
    if (queryOrg) {
      return departments?.results
        ?.filter((dept) => dept.organization_id === queryOrg)
        .map((dept) => ({
          label: dept.name,
          value: dept.id,
        }));
    }
    return departments?.results?.map((dept) => ({
      label: dept.name,
      value: dept.id,
    }));
  }, [queryOrg, departments?.results]);

  const userFilters = useMemo(() => {
    return [
      {
        name: "role",
        label: "Rol",
        isSelect: true,
        options: [
          { label: "Barcha rollar", value: "" },
          ...userRoles.slice(1).map((role) => ({ label: role, value: role })),
        ],
        placeholder: "Barcha rollar",
        searchable: true,
        clearable: true,
      },
      // {
      //   name: "org",
      //   label: "Tashkilot",
      //   isSelect: true,
      //   options: [
      //     { label: "Barcha tashkilotlar", value: "" },
      //     ...(organizations?.results?.map((org) => ({
      //       label: org.name,
      //       value: org.id,
      //     })) || []),
      //   ],
      //   placeholder: "Barcha tashkilotlar",
      //   searchable: true,
      //   clearable: true,
      //   loading: isOrgsPending,
      //   minWidth: "200px",
      // },
      // {
      //   name: "dept",
      //   label: "Quyi tashkilot",
      //   isSelect: true,
      //   options: deptOptions,
      //   placeholder: "Barcha Quyi tashkilotlar",
      //   searchable: true,
      //   clearable: true,
      //   loading: isDepsPending,
      //   minWidth: "220px",
      // },
    ];
  }, [organizations, departments, deptOptions]);

  return (
    <div className="space-y-4">
      <Card className="rounded-xl">
        <PageFilters
          filters={userFilters}
          hasSearch={true}
          searchPlaceholder="Foydalanuvchi nomi yoki login..."
          onAdd={onCreateNew}
          addButtonText="Yangi foydalanuvchi"
          addButtonPermittion="create_user"
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
                      selectedIds.length === users?.results?.length &&
                      users?.results?.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-16 p-3 ">#</TableHead>
                <TableHead className="p-3">Foydalanuvchi</TableHead>
                <TableHead className="p-3">Rol</TableHead>
                <TableHead className="p-3">Quyi tashkilot</TableHead>
                <TableHead className="p-3">Yaratilgan sana</TableHead>
                <TableHead className="p-3">Holat</TableHead>
                <TableHead className="w-32 p-3">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton rows={10} columns={8} />
              ) : users?.results?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="p-3">
                    <div className="text-center py-8 text-[var(--muted-foreground)]">
                      Foydalanuvchilar topilmadi.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                users?.results?.map((user, index) => (
                  <TableRow
                    key={user.id}
                    className={` transition-colors hover:bg-muted/50 `}
                  >
                    <TableCell className="p-3">
                      <Checkbox
                        checked={selectedIds.includes(user.id)}
                        onCheckedChange={(checked) =>
                          handleSelectUser(user.id, !!checked)
                        }
                      />
                    </TableCell>
                    <TableCell className="font-semibold text-[var(--primary)] p-3">
                      {index + 1}
                    </TableCell>
                    <TableCell className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[var(--primary)]/10 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-[var(--primary)]" />
                        </div>
                        <div>
                          <p className="font-medium text-[var(--foreground)]">
                            {user.first_name + " " + user.last_name}
                          </p>
                          <p className="text-xs text-[var(--muted-foreground)]">
                            {user.username}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="p-3">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-[var(--primary)]" />
                        <Badge
                          variant="secondary"
                          className="bg-[var(--muted)] text-[var(--foreground)] border-none"
                        >
                          {getRoleName(user.role as UserRole).toUpperCase()}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="p-3">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-[var(--primary)]" />
                        <span className="text-[var(--muted-foreground)]">
                          {user?.profile?.secondary_organization?.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[var(--muted-foreground)] p-3">
                      {user.createdAt}
                    </TableCell>
                    <TableCell className="p-3">
                      <Badge
                        variant={user.is_active ? "default" : "secondary"}
                        className={
                          user.is_active
                            ? "bg-green-100 text-green-800 border-none"
                            : "bg-gray-100 text-gray-800 border-none"
                        }
                      >
                        {user.is_active ? "Faol" : "Nofaol"}
                      </Badge>
                    </TableCell>
                    <TableCell className="p-3">
                      <div className="flex items-center gap-2">
                        <PermissionGuard permission="edit_user">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => onEdit(user)}
                            className="h-8 w-8 p-0 border-1 border-[var(--border)] hover:bg-[var(--primary)]/10 shadow-none"
                            aria-label="Tahrirlash"
                          >
                            <Edit className="h-4 w-4 text-[var(--primary)]" />
                          </Button>
                        </PermissionGuard>
                        <PermissionGuard permission="delete_user">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => onDelete(user.id)}
                            className="h-8 w-8 p-0 border-1 border-[var(--border)] hover:bg-[var(--destructive)]/10 shadow-none"
                            aria-label="O'chirish"
                          >
                            <Trash2 className="h-4 w-4 text-[var(--destructive)]" />
                          </Button>
                        </PermissionGuard>
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
                currentPage={page || 1}
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
