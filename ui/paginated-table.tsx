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
import { useFilterParams } from "@/lib/hooks/useFilterParams";
import { ConfirmationDialog } from "./confirmation-dialog";
import { PermissionGuard } from "@/components/permission-guard";
import { Permission, hasPermission } from "@/lib/permissions";

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
  permission?: Permission;
}

export interface PaginatedTableProps<T = any> {
  // Data
  columns: TableColumn<T>[];
  data: T[];
  isLoading?: boolean;
  error?: Error | null;
  getRowId: (row: T) => string | number;

  // Pagination
  totalPages: number;
  totalItems?: number;
  itemsPerPage?: number;
  currentPage?: number; // Optional: if not provided, will read from URL params
  onPageChange?: (page: number) => void; // Optional: if not provided, will update URL params
  onItemsPerPageChange?: (itemsPerPage: number) => void; // Optional: if not provided, will update URL params
  updateQueryParams?: boolean; // If true, updates URL query params for page and pageSize

  // Actions
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void | Promise<void>;
  extraActions?: TableAction<T>[];
  showActions?: boolean;
  actionsLabel?: string;
  deletePermission?: Permission;
  editPermission?: Permission;
  isDeleting?: boolean;

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

  // Density
  size?: "xs" | "sm" | "md" | "lg";

  // Loading
  skeletonRows?: number;
}

export function PaginatedTable<T extends Record<string, any>>({
  columns,
  data,
  isLoading = false,
  error = null,
  getRowId,
  currentPage: externalCurrentPage,
  totalPages,
  totalItems,
  itemsPerPage: externalItemsPerPage = 10,
  onPageChange: externalOnPageChange,
  onItemsPerPageChange: externalOnItemsPerPageChange,
  updateQueryParams = true,
  onEdit,
  deletePermission,
  editPermission,
  onDelete,
  isDeleting = false,
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
  size = "md",
}: PaginatedTableProps<T>) {
  const {
    currentPage,
    itemsPerPage,
    handlePageChange,
    handleItemsPerPageChange,
    shouldShowPagination,
  } = usePaginationControls({
    externalCurrentPage,
    externalItemsPerPage,
    externalOnPageChange,
    externalOnItemsPerPageChange,
    updateQueryParams,
    totalPages,
  });

  const {
    deleteState,
    handleDeleteClick,
    handleDeleteCancel,
    handleDeleteConfirm,
  } = useDeleteDialog<T>({ onDelete, getRowId });

  const { allSelected, someSelected, handleSelectAll, handleSelectRow } =
    useSelectionState({
      data,
      selectedIds,
      selectable,
      getRowId,
      onSelectionChange,
    });

  const hasActions =
    showActions && (onEdit || onDelete || extraActions.length > 0);

  const sizeClasses = React.useMemo(() => {
    switch (size) {
      case "xs":
        return {
          rowCell: "py-0 px-2",
          checkboxCell: "py-0.5 px-2",
          textSize: "text-sm leading-tight",
        };
      case "sm":
        return {
          rowCell: "py-1 px-3 h-10 min-h-10",
          checkboxCell: "py-1 px-3",
          textSize: "text-sm",
        };
      case "lg":
        return {
          rowCell: "py-3 px-5 h-[64px] min-h-[64px]",
          checkboxCell: "py-3 px-5",
          textSize: "text-lg",
        };
      case "md":
      default:
        return {
          rowCell: "py-2 px-4 h-[56px] min-h-[56px]",
          checkboxCell: "py-2 px-4",
          textSize: "text-base",
        };
    }
  }, [size]);

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

  const totalColumnCount = displayColumns.length + (showCheckbox ? 1 : 0);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("w-full", className)}>
        <Table>
          <TableHeader>
            <TableRow>
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
              cellClassName="py-2 px-0"
              columns={totalColumnCount}
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
          className=""
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
              <TableCell colSpan={totalColumnCount} className="">
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
                      : "",
                    isLastRow &&
                      "[&>td:first-child]:rounded-bl-lg [&>td:last-child]:rounded-br-lg",
                    rowClass
                  )}
                >
                  {showCheckbox && (
                    <TableCell
                      className={cn(
                        "transition-colors",
                        sizeClasses.checkboxCell,
                        sizeClasses.rowCell
                      )}
                    >
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
                          "transition-colors",
                          sizeClasses.rowCell,
                          column.className
                        )}
                        style={{
                          boxSizing: "border-box",
                        }}
                      >
                        <span
                          className={cn(
                            "font-medium text-[#475569] peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                            sizeClasses.textSize
                          )}
                        >
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
                        onDelete={onDelete ? handleDeleteClick : undefined}
                        extraActions={extraActions}
                        editPermission={editPermission}
                        deletePermission={deletePermission}
                      />
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {onDelete && (
        <ConfirmationDialog
          isOpen={deleteState.isOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title={deleteState.error ? "Xatolik" : "O'chirishni tasdiqlash"}
          message={
            deleteState.error
              ? `Xatolik yuz berdi: ${deleteState.error.message}. Iltimos, qayta urinib ko'ring yoki bekor qiling.`
              : deleteState.row
              ? "Bu ma'lumotni o'chirishni xohlaysizmi? Bu amalni bekor qilib bo'lmaydi."
              : "Bu ma'lumotni o'chirishni xohlaysizmi?"
          }
          confirmText={deleteState.error ? "Qayta urinish" : "O'chirish"}
          cancelText="Bekor qilish"
          variant={deleteState.error ? "warning" : "danger"}
          isDoingAction={isDeleting}
          isDoingActionText="O'chirilmoqda..."
        />
      )}

      {shouldShowPagination && (
        <div className="flex items-center justify-between pt-4 px-0">
          <div className="flex items-center gap-2">
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => handleItemsPerPageChange(Number(value))}
            >
              <SelectTrigger className="w-[80px] h-9 border border-[#E2E8F0] rounded-md bg-white text-primary mb-0">
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
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-4">
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
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

type PaginationControlOptions = {
  externalCurrentPage?: number;
  externalItemsPerPage?: number;
  externalOnPageChange?: (page: number) => void;
  externalOnItemsPerPageChange?: (itemsPerPage: number) => void;
  updateQueryParams: boolean;
  totalPages: number;
};

function usePaginationControls({
  externalCurrentPage,
  externalItemsPerPage = 10,
  externalOnPageChange,
  externalOnItemsPerPageChange,
  updateQueryParams,
  totalPages,
}: PaginationControlOptions) {
  const { updateQuery, getQueryValue } = useFilterParams();

  const hasInitialized = React.useRef(false);

  React.useEffect(() => {
    if (updateQueryParams && !externalOnPageChange && !hasInitialized.current) {
      const pageParam = getQueryValue("page");
      const pageSizeParam = getQueryValue("pageSize");

      if (!pageParam || !pageSizeParam) {
        hasInitialized.current = true;
        const updates: Record<string, string> = {};
        if (!pageParam) updates.page = "1";
        if (!pageSizeParam) updates.pageSize = externalItemsPerPage.toString();
        updateQuery(updates);
      }
    }
  }, [
    updateQueryParams,
    externalOnPageChange,
    externalItemsPerPage,
    updateQuery,
  ]);

  const useExternalControl =
    externalOnPageChange !== undefined &&
    externalOnItemsPerPageChange !== undefined;
  const useUrlParams = updateQueryParams && !useExternalControl;

  const urlPage = React.useMemo(() => {
    if (!useUrlParams) return 1;

    const pageParam = getQueryValue("page");
    return pageParam ? parseInt(pageParam) || 1 : 1;
  }, [getQueryValue, useUrlParams]);

  const urlPageSize = React.useMemo(() => {
    if (!useUrlParams) return externalItemsPerPage;

    const pageSizeParam = getQueryValue("pageSize");
    return pageSizeParam
      ? parseInt(pageSizeParam) || externalItemsPerPage
      : externalItemsPerPage;
  }, [getQueryValue, useUrlParams, externalItemsPerPage]);

  const currentPage = useExternalControl
    ? externalCurrentPage ?? 1
    : useUrlParams
    ? urlPage
    : externalCurrentPage ?? 1;

  const itemsPerPage = useExternalControl
    ? externalItemsPerPage
    : useUrlParams
    ? urlPageSize
    : externalItemsPerPage;

  const handlePageChange = React.useCallback(
    (page: number) => {
      if (useExternalControl && externalOnPageChange) {
        externalOnPageChange(page);
        return;
      }

      if (useUrlParams) {
        updateQuery({ page: page.toString() });
      }
    },
    [useExternalControl, externalOnPageChange, useUrlParams, updateQuery]
  );

  const handleItemsPerPageChange = React.useCallback(
    (newItemsPerPage: number) => {
      if (useExternalControl && externalOnItemsPerPageChange) {
        externalOnItemsPerPageChange(newItemsPerPage);
        return;
      }

      if (useUrlParams) {
        updateQuery({ page: "1", pageSize: newItemsPerPage.toString() });
      }
    },
    [
      useExternalControl,
      externalOnItemsPerPageChange,
      useUrlParams,
      updateQuery,
    ]
  );

  const shouldShowPagination =
    totalPages > 1 || updateQueryParams || useExternalControl;

  return {
    currentPage,
    itemsPerPage,
    handlePageChange,
    handleItemsPerPageChange,
    shouldShowPagination,
  };
}

type DeleteDialogState<T> = {
  isOpen: boolean;
  row: T | null;
  error: Error | null;
};

function useDeleteDialog<T>({
  onDelete,
  getRowId,
}: {
  onDelete?: (row: T) => void | Promise<void>;
  getRowId: (row: T) => string | number;
}) {
  const [state, setState] = React.useState<DeleteDialogState<T>>({
    isOpen: false,
    row: null,
    error: null,
  });

  const openDialog = React.useCallback(
    (row: T) => {
      if (!onDelete) return;
      setState({ isOpen: true, row, error: null });
    },
    [onDelete]
  );

  const closeDialog = React.useCallback(() => {
    setState({ isOpen: false, row: null, error: null });
  }, []);

  const confirmDelete = React.useCallback(async () => {
    if (!state.row || !onDelete) return;

    setState((prev) => ({ ...prev, error: null }));

    try {
      const result = onDelete(state.row);
      if (isPromise(result)) {
        await result;
      }
      console.log("Deleted row ID:", getRowId(state.row));
      closeDialog();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error
            : new Error(String(error) || "An error occurred during deletion"),
      }));
    }
  }, [state.row, onDelete, getRowId, closeDialog]);

  return {
    deleteState: state,
    handleDeleteClick: openDialog,
    handleDeleteCancel: closeDialog,
    handleDeleteConfirm: confirmDelete,
  };
}

function useSelectionState<T>({
  data,
  selectedIds,
  selectable,
  getRowId,
  onSelectionChange,
}: {
  data: T[];
  selectedIds: (string | number)[];
  selectable: boolean;
  getRowId: (row: T) => string | number;
  onSelectionChange?: (ids: (string | number)[]) => void;
}) {
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

  const handleSelectAll = React.useCallback(
    (checked: boolean) => {
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
    },
    [selectable, onSelectionChange, data, getRowId, selectedIds]
  );

  const handleSelectRow = React.useCallback(
    (rowId: string | number, checked: boolean) => {
      if (!selectable || !onSelectionChange) return;
      if (checked) {
        onSelectionChange([...selectedIds, rowId]);
      } else {
        onSelectionChange(selectedIds.filter((id) => id !== rowId));
      }
    },
    [selectable, onSelectionChange, selectedIds]
  );

  return { allSelected, someSelected, handleSelectAll, handleSelectRow };
}

function isPromise<T = unknown>(value: unknown): value is Promise<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    "then" in value &&
    typeof (value as any).then === "function"
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
  editPermission,
  deletePermission,
}: {
  row: T;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void | Promise<void>;
  extraActions?: TableAction<T>[];
  editPermission?: Permission;
  deletePermission?: Permission;
}) {
  const hasActions =
    onEdit || onDelete || (extraActions && extraActions.length > 0);

  if (!hasActions) {
    return null;
  }

  // Filter actions based on permissions
  const filteredExtraActions = React.useMemo(() => {
    if (!extraActions) return [];
    return extraActions.filter((action) => {
      if (action.permission) {
        const user = JSON.parse(localStorage.getItem("user") || "null");
        return hasPermission(user, action.permission);
      }
      return true;
    });
  }, [extraActions]);

  const canEdit =
    onEdit &&
    (!editPermission ||
      hasPermission(
        JSON.parse(localStorage.getItem("user") || "null"),
        editPermission
      ));
  const canDelete =
    onDelete &&
    (!deletePermission ||
      hasPermission(
        JSON.parse(localStorage.getItem("user") || "null"),
        deletePermission
      ));

  const totalActions =
    (canEdit ? 1 : 0) + (canDelete ? 1 : 0) + filteredExtraActions.length;

  // If only one action, show as button instead of dropdown
  if (totalActions === 1) {
    if (canEdit) {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-3 hover:bg-gray-100"
          onClick={() => onEdit(row)}
        >
          <Edit className="h-4 w-4 mr-2" />
          Tahrirlash
        </Button>
      );
    }
    if (canDelete) {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-3 hover:bg-gray-100 text-red-600 hover:text-red-700"
          onClick={() => onDelete(row)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          O'chirish
        </Button>
      );
    }
    if (filteredExtraActions.length === 1) {
      const action = filteredExtraActions[0];
      return (
        <Button
          variant={action.variant || "default"}
          size="sm"
          className={cn("h-8 px-3", action.className)}
          onClick={() => action.onClick(row)}
        >
          {action.icon}
          {action.label}
        </Button>
      );
    }
  }

  const [isOpen, setIsOpen] = React.useState(false);

  const closeMenu = React.useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleEdit = React.useCallback(() => {
    onEdit?.(row);
    closeMenu();
  }, [onEdit, row, closeMenu]);

  const handleDelete = React.useCallback(() => {
    onDelete?.(row);
    closeMenu();
  }, [onDelete, row, closeMenu]);

  const handleExtraAction = React.useCallback(
    (action: TableAction<T>) => {
      action.onClick(row);
      closeMenu();
    },
    [row, closeMenu]
  );

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
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
        {canEdit && (
          <DropdownMenuItem
            onClick={handleEdit}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Tahrirlash
          </DropdownMenuItem>
        )}
        {filteredExtraActions.map((action, index) => (
          <DropdownMenuItem
            key={index}
            onClick={() => handleExtraAction(action)}
            className={cn("flex items-center gap-2", action.className)}
          >
            {action.icon}
            {action.label}
          </DropdownMenuItem>
        ))}
        {canDelete && (
          <>
            {(canEdit || filteredExtraActions.length > 0) && (
              <DropdownMenuSeparator />
            )}
            <DropdownMenuItem
              onClick={handleDelete}
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
