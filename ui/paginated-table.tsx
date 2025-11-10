"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";
import { PaginationEllipsis, PaginationLink } from "./pagination";
import { TableSkeleton } from "./table-skeleton";
import { EmptyState } from "./empty-state";
import { ErrorCard } from "./error-card";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import {
  MoreVertical,
  Edit,
  Trash2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface TableColumn<T = any> {
  key: string;
  header: string;
  accessor?: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  sortable?: boolean;
  width?: string;
}

export interface TableAction<T = any> {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  className?: string;
  variant?: "default" | "destructive" | "outline";
}

export interface PaginatedTableProps<T = any> {
  // Data
  columns: TableColumn<T>[];
  data: T[];
  isLoading?: boolean;
  error?: Error | null;
  getRowId: (row: T) => string | number;

  // Pagination
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;

  // Actions
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  extraActions?: TableAction<T>[];
  showActions?: boolean;
  actionsLabel?: string;

  // Empty & Error states
  emptyTitle?: string;
  emptyDescription?: string;
  errorTitle?: string;
  errorMessage?: string;
  onRetry?: () => void;

  // Selection
  selectable?: boolean;
  selectedIds?: (string | number)[];
  onSelectionChange?: (ids: (string | number)[]) => void;

  // Customization
  className?: string;
  headerClassName?: string;
  rowClassName?: string | ((row: T) => string);
  showCheckbox?: boolean;

  // Loading
  skeletonRows?: number;
}

export function PaginatedTable<T extends Record<string, any>>({
  columns,
  data,
  isLoading = false,
  error = null,
  getRowId,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage = 25,
  onPageChange,
  onItemsPerPageChange,
  onEdit,
  onDelete,
  extraActions = [],
  showActions = true,
  actionsLabel = "Amallar",
  emptyTitle = "Ma'lumot topilmadi",
  emptyDescription = "Jadvalda ko'rsatish uchun ma'lumot yo'q",
  errorTitle = "Xatolik yuz berdi",
  errorMessage = "Ma'lumotlarni yuklashda xatolik yuz berdi",
  onRetry,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  className,
  headerClassName,
  rowClassName,
  showCheckbox = false,
  skeletonRows = 10,
}: PaginatedTableProps<T>) {
  const allSelected = React.useMemo(() => {
    if (!selectable || data.length === 0) return false;
    return data.every((row) => selectedIds.includes(getRowId(row)));
  }, [data, selectedIds, selectable, getRowId]);

  const someSelected = React.useMemo(() => {
    if (!selectable) return false;
    return (
      selectedIds.length > 0 &&
      data.some((row) => selectedIds.includes(getRowId(row)))
    );
  }, [data, selectedIds, selectable, getRowId]);

  const handleSelectAll = (checked: boolean) => {
    if (!selectable || !onSelectionChange) return;
    if (checked) {
      const allIds = data.map((row) => getRowId(row));
      onSelectionChange([...new Set([...selectedIds, ...allIds])]);
    } else {
      const currentPageIds = data.map((row) => getRowId(row));
      onSelectionChange(
        selectedIds.filter((id) => !currentPageIds.includes(id))
      );
    }
  };

  const handleSelectRow = (rowId: string | number, checked: boolean) => {
    if (!selectable || !onSelectionChange) return;
    if (checked) {
      onSelectionChange([...selectedIds, rowId]);
    } else {
      onSelectionChange(selectedIds.filter((id) => id !== rowId));
    }
  };

  const hasActions =
    showActions && (onEdit || onDelete || extraActions.length > 0);

  // Add actions column if actions are available
  const displayColumns = React.useMemo(() => {
    if (hasActions) {
      return [
        ...columns,
        {
          key: "actions",
          header: actionsLabel,
          className: "w-[100px] text-center",
          headerClassName: "text-center",
        } as TableColumn<T>,
      ];
    }
    return columns;
  }, [columns, hasActions, actionsLabel]);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("w-full", className)}>
        <Table>
          <TableHeader>
            <TableRow className="bg-[#EFF6FF] hover:bg-[#EFF6FF]">
              {showCheckbox && (
                <TableHead className="w-[50px] bg-[#EFF6FF] px-4 py-[14px]">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded-md border-[#CBD5E1] bg-white text-primary focus:ring-primary w-4 h-4"
                  />
                </TableHead>
              )}
              {displayColumns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    "h-12 px-4 py-[14px] text-xs font-semibold text-[#475569] bg-[#EFF6FF]",
                    column.headerClassName
                  )}
                  style={{
                    width: column.width,
                    letterSpacing: "-0.005em",
                    lineHeight: "16px",
                    boxSizing: "border-box",
                  }}
                >
                  <div className="flex flex-row items-center gap-3">
                    {column.header}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableSkeleton
              rows={skeletonRows}
              columns={displayColumns.length + (showCheckbox ? 1 : 0)}
            />
          </TableBody>
        </Table>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn("w-full", className)}>
        <ErrorCard
          title={errorTitle}
          message={errorMessage || error.message}
          onRetry={onRetry}
          showBack={false}
          className="min-h-[400px]"
        />
      </div>
    );
  }

  // Empty state
  if (!isLoading && !error && data.length === 0) {
    return (
      <div className={cn("w-full", className)}>
        <Table>
          <TableHeader>
            <TableRow className="bg-[#EFF6FF] hover:bg-[#EFF6FF]">
              {showCheckbox && (
                <TableHead className="w-[50px] bg-[#EFF6FF] px-4 py-[14px]"></TableHead>
              )}
              {displayColumns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    "h-12 px-4 py-[14px] text-xs font-semibold text-[#475569] bg-[#EFF6FF]",
                    column.headerClassName
                  )}
                  style={{
                    letterSpacing: "-0.005em",
                    lineHeight: "16px",
                    boxSizing: "border-box",
                  }}
                >
                  <div className="flex flex-row items-center gap-3">
                    {column.header}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell
                colSpan={displayColumns.length + (showCheckbox ? 1 : 0)}
                className="h-[400px]"
              >
                <EmptyState
                  icon={<AlertCircle className="h-12 w-12" />}
                  title={emptyTitle}
                  description={emptyDescription}
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className={cn("w-full space-y-4", className)}>
      <div className="bg-transparent rounded-lg overflow-hidden">
        <Table className="">
          <TableHeader>
            <TableRow className="bg-[#EFF6FF] hover:bg-muted [&>th:first-child]:rounded-tl-[1rem] [&>th:last-child]:rounded-tr-[1rem]">
              {showCheckbox && (
                <TableHead className=" bg-[#EFF6FF] px-4 py-[14px]">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(input) => {
                      if (input)
                        input.indeterminate = someSelected && !allSelected;
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded-md border-[#CBD5E1] bg-white text-primary focus:ring-primary w-4 h-4"
                  />
                </TableHead>
              )}
              {displayColumns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    "h-12 px-4 py-[14px] text-xs font-semibold text-[#475569] bg-[#EFF6FF]",
                    column.headerClassName,
                    headerClassName
                  )}
                  style={{
                    width: column.width,
                    letterSpacing: "-0.005em",
                    lineHeight: "16px",
                    boxSizing: "border-box",
                  }}
                >
                  <div className="flex flex-row items-center gap-3">
                    {column.header}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => {
              const rowId = getRowId(row);
              const isSelected = selectedIds.includes(rowId);
              const rowClass =
                typeof rowClassName === "function"
                  ? rowClassName(row)
                  : rowClassName;
              const isLastRow = index === data.length - 1;

              return (
                <TableRow
                  key={rowId}
                  className={cn(
                    "group border-b border-border transition-colors",
                    isSelected
                      ? "bg-blue-50 hover:bg-blue-100 [&>td]:bg-blue-50 [&>td]:hover:bg-blue-100"
                      : "bg-white hover:bg-gray-50 [&>td]:bg-white [&>td]:group-hover:bg-gray-50",
                    isLastRow &&
                      "[&>td:first-child]:rounded-bl-lg [&>td:last-child]:rounded-br-lg",
                    rowClass
                  )}
                >
                  {showCheckbox && (
                    <TableCell className="py-2 px-4 transition-colors">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) =>
                          handleSelectRow(rowId, e.target.checked)
                        }
                        className="rounded-md border-[#CBD5E1] bg-white text-primary focus:ring-primary w-4 h-4"
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => {
                    const cellContent = column.accessor
                      ? column.accessor(row)
                      : row[column.key];

                    return (
                      <TableCell
                        key={column.key}
                        className={cn(
                          "py-2 px-4 transition-colors h-[56px] min-h-[56px]",
                          column.className
                        )}
                        style={{
                          boxSizing: "border-box",
                        }}
                      >
                        <span className="text-sm  font-medium text-[#475569]  peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          {cellContent ?? "-"}
                        </span>
                      </TableCell>
                    );
                  })}
                  {hasActions && (
                    <TableCell className="text-center py-2 px-4 h-14 transition-colors">
                      <ActionsDropdown
                        row={row}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        extraActions={extraActions}
                      />
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {(totalPages > 1 || onItemsPerPageChange) && (
        <div className="flex items-center justify-between pt-4 px-0">
          {/* Items per page selector */}
          <div className="flex items-center gap-2">
            {onItemsPerPageChange ? (
              <>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => onItemsPerPageChange(Number(value))}
                >
                  <SelectTrigger className="w-[80px] h-9 border border-[#E2E8F0] rounded-md bg-white text-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-600">Sahifa raqami</span>
              </>
            ) : (
              <span className="text-sm text-gray-600">
                {itemsPerPage} Sahifa raqami
              </span>
            )}
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center gap-4">
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
              />
              {totalItems && (
                <span className="text-sm text-gray-600 whitespace-nowrap">
                  Showing{" "}
                  {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}{" "}
                  of {totalItems} results
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Pagination Controls Component
function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const getVisiblePages = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    const halfVisible = Math.floor(maxVisible / 2);

    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, currentPage + halfVisible);

    if (currentPage <= halfVisible) {
      endPage = Math.min(totalPages, maxVisible);
    }
    if (currentPage > totalPages - halfVisible) {
      startPage = Math.max(1, totalPages - maxVisible + 1);
    }

    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push("...");
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push("...");
      }
      pages.push(totalPages);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <ul className="flex flex-row items-center gap-1">
      {currentPage > 1 && (
        <li>
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            className="inline-flex items-center justify-center h-9 px-3 rounded-md text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Orqaga</span>
          </button>
        </li>
      )}

      {visiblePages.map((page, index) => (
        <li key={index}>
          {page === "..." ? (
            <PaginationEllipsis />
          ) : (
            <PaginationLink
              isActive={page === currentPage}
              onClick={() => onPageChange(page as number)}
            >
              {page}
            </PaginationLink>
          )}
        </li>
      ))}

      {currentPage < totalPages && (
        <li>
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            className="inline-flex items-center justify-center h-9 px-3 rounded-md text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors gap-1"
          >
            <span>Oldinga</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </li>
      )}
    </ul>
  );
}

// Actions dropdown component
function ActionsDropdown<T>({
  row,
  onEdit,
  onDelete,
  extraActions,
}: {
  row: T;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  extraActions?: TableAction<T>[];
}) {
  const hasActions =
    onEdit || onDelete || (extraActions && extraActions.length > 0);

  if (!hasActions) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-gray-100"
        >
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Amallar</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {onEdit && (
          <DropdownMenuItem
            onClick={() => onEdit(row)}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Tahrirlash
          </DropdownMenuItem>
        )}
        {extraActions &&
          extraActions.map((action, index) => (
            <DropdownMenuItem
              key={index}
              onClick={() => action.onClick(row)}
              className={cn("flex items-center gap-2", action.className)}
            >
              {action.icon}
              {action.label}
            </DropdownMenuItem>
          ))}
        {onDelete && (
          <>
            {(onEdit || (extraActions && extraActions.length > 0)) && (
              <DropdownMenuSeparator />
            )}
            <DropdownMenuItem
              onClick={() => onDelete(row)}
              className="flex items-center gap-2 text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              O'chirish
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
