"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Trash2, Save, Loader2, Edit, Plus } from "lucide-react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";
import { BulletinRow, BulletinColumn } from "@/api/types/bulleten";
import { useGetClassificatorDetail } from "@/api/hooks/use-classificator-detail";
import { ConfirmationDialog } from "@/ui/confirmation-dialog";
import { PermissionGuard } from "../permission-guard";

interface BulletinDataGridProps {
  columns: BulletinColumn[];
  rows: BulletinRow[];
  onUpdateRow: (rowId: string, column: string, value: string | number) => void;
  onDeleteRow: (rowId: string) => void;
  onSaveRow: (
    rowId: string,
    updatedValues?: Record<string, string | number>
  ) => void;
  onAddRow: () => void;
  loadingRows: Set<string>;
}

// Editable cell component
function EditableCell({
  rowId,
  column,
  value,
  tempValue,
  onTempValueChange,
  isEditing,
}: {
  rowId: string;
  column: BulletinColumn;
  value: string | number | Date;
  tempValue: string;
  onTempValueChange: (rowId: string, columnId: string, value: string) => void;
  isEditing: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

  // Only call the hook when we have a valid classificator ID
  const { data: classificatorData } = useGetClassificatorDetail(
    column.classificator || ""
  );

  // Auto focus when editing starts
  useEffect(() => {
    if (isEditing) {
      if (column.type === "classificator" && selectRef.current) {
        selectRef.current.focus();
      } else if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }
  }, [isEditing, column.type]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // Don't save here, just prevent default
    }
  };

  // Handle select change for classificator
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    onTempValueChange(rowId, column.id, selectedId);
  };

  const getInputType = () => {
    switch (column.type) {
      case "number":
        return "number";
      case "date":
        return "date";
      default:
        return "text";
    }
  };

  const formatDisplayValue = (val: string | number | Date) => {
    if (val instanceof Date) {
      return val.toLocaleDateString();
    }
    if (column.type === "classificator" && classificatorData) {
      const element = classificatorData.elements?.find(
        (el: any) => el.id === val || el.value === val || el.name === val
      );
      return element?.name || String(val || "");
    }
    return String(val || "");
  };

  return (
    <TableCell className="min-w-[150px]">
      {isEditing ? (
        <>
          {column.type === "classificator" ? (
            <select
              ref={selectRef}
              value={tempValue}
              onChange={handleSelectChange}
              onKeyDown={handleKeyDown}
              className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tanlang...</option>
              {classificatorData?.elements?.map((element: any) => (
                <option key={element.id} value={element.id}>
                  {element.name}
                </option>
              ))}
            </select>
          ) : (
            <Input
              ref={inputRef}
              type={getInputType()}
              value={tempValue}
              onChange={(e) =>
                onTempValueChange(rowId, column.id, e.target.value)
              }
              onKeyDown={handleKeyDown}
              className="h-8 m-0 w-full"
            />
          )}
        </>
      ) : (
        <div className="py-1 px-2 min-h-[32px] flex items-center">
          {formatDisplayValue(value) || (
            <span className="text-gray-400 italic">Ma'lumot yo'q</span>
          )}
        </div>
      )}
    </TableCell>
  );
}

export function BulletinDataGrid({
  columns,
  rows,
  onUpdateRow,
  onDeleteRow,
  onSaveRow,
  onAddRow,
  loadingRows,
}: BulletinDataGridProps) {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [tempRowData, setTempRowData] = useState<
    Record<string, Record<string, string>>
  >({});

  // Sort columns by order
  const sortedColumns = useMemo(
    () => [...columns].sort((a, b) => a.order - b.order),
    [columns]
  );

  console.log(editingRow);

  // Memoize handleEditRow to prevent infinite loops
  const handleEditRow = useCallback(
    (rowId: string) => {
      const row = rows.find((r) => r.id === rowId);
      if (!row) return;

      // Initialize temp data with current row values
      const initialTempData: Record<string, string> = {};
      sortedColumns.forEach((column) => {
        const currentValue = row.values[column.id];
        initialTempData[column.id] = String(currentValue || "");
      });

      setTempRowData((prev) => ({
        ...prev,
        [rowId]: initialTempData,
      }));
      setEditingRow(rowId);
    },
    [rows, sortedColumns]
  );

  // Remove the auto-edit useEffect completely
  // useEffect(() => {
  //   const tempRows = rows.filter((row) => row.id.startsWith("temp-"));
  //   tempRows.forEach((tempRow) => {
  //     if (editingRow !== tempRow.id) {
  //       handleEditRow(tempRow.id);
  //     }
  //   });
  // }, [rows, editingRow, handleEditRow]);

  // Track previous rows length to detect new additions
  const [prevRowsLength, setPrevRowsLength] = useState(rows.length);

  // Auto-edit newly added temp rows
  useEffect(() => {
    if (rows.length > prevRowsLength) {
      const tempRows = rows.filter((row) => row.id.startsWith("temp-"));
      if (tempRows.length > 0 && !editingRow) {
        const lastTempRow = tempRows[tempRows.length - 1];
        handleEditRow(lastTempRow.id);
      }
    }
    setPrevRowsLength(rows.length);
  }, [rows.length, editingRow, handleEditRow, prevRowsLength]);

  // Get cell value for a specific row and column
  const getCellValue = (row: BulletinRow, columnId: string) => {
    return row.values[columnId] || "";
  };

  // Get temp cell value for a specific row and column
  const getTempCellValue = (rowId: string, columnId: string) => {
    return tempRowData[rowId]?.[columnId] || "";
  };

  // Check if row is loading
  const isRowLoading = (rowId: string) => {
    return loadingRows.has(rowId);
  };

  // Check if row is in edit mode
  const isRowEditing = (rowId: string) => {
    return editingRow === rowId;
  };

  const handleTempValueChange = (
    rowId: string,
    columnId: string,
    value: string
  ) => {
    setTempRowData((prev) => ({
      ...prev,
      [rowId]: {
        ...prev[rowId],
        [columnId]: value,
      },
    }));
  };

  const handleSaveRow = (rowId: string) => {
    const tempData = tempRowData[rowId];
    if (!tempData) return;

    // Prepare updated values object
    const updatedValues: Record<string, string | number> = {};
    sortedColumns.forEach((column) => {
      const tempValue = tempData[column.id];
      if (tempValue !== undefined && tempValue !== "") {
        const finalValue =
          column.type === "number" ? Number(tempValue) || 0 : tempValue;
        updatedValues[column.id] = finalValue;
      }
    });

    // First update the local state
    Object.entries(updatedValues).forEach(([columnId, value]) => {
      onUpdateRow(rowId, columnId, value);
    });

    // Then save with the updated values
    onSaveRow(rowId, updatedValues);

    // Clear editing state
    setEditingRow(null);
    setTempRowData((prev) => {
      const newData = { ...prev };
      delete newData[rowId];
      return newData;
    });
  };

  const handleCancelEdit = (rowId: string) => {
    setEditingRow(null);
    setTempRowData((prev) => {
      const newData = { ...prev };
      delete newData[rowId];
      return newData;
    });
  };

  const handleDeleteClick = (rowId: string) => {
    setRowToDelete(rowId);
    setShowDeleteConfirmation(true);
  };

  const confirmDelete = () => {
    if (rowToDelete) {
      onDeleteRow(rowToDelete);
      // Clear editing state if the deleted row was being edited
      if (editingRow === rowToDelete) {
        setEditingRow(null);
        setTempRowData((prev) => {
          const newData = { ...prev };
          delete newData[rowToDelete];
          return newData;
        });
      }
      setRowToDelete(null);
      setShowDeleteConfirmation(false);
    }
  };

  const cancelDelete = () => {
    setRowToDelete(null);
    setShowDeleteConfirmation(false);
  };

  if (sortedColumns.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Ustunlar mavjud emas. Avval ustunlarni sozlang.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 sticky left-0 bg-white z-10">
                #
              </TableHead>
              {sortedColumns.map((column) => (
                <TableHead
                  key={column.id}
                  className="min-w-[150px] max-w-[300px]"
                >
                  <div className="break-words leading-tight text-sm font-medium whitespace-normal">
                    {column.name}
                  </div>
                </TableHead>
              ))}
              <TableHead className="w-32 sticky right-0 bg-white z-10 border-l border-gray-200">
                <div className="text-center">Amallar</div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={sortedColumns.length + 2}
                  className="text-center py-8 text-gray-500"
                >
                  Ma'lumotlar mavjud emas. Qator qo'shish uchun 'Qator Qo'shish'
                  tugmasini bosing.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow key={row.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium text-gray-500 sticky left-0 bg-white z-10">
                    {index + 1}
                  </TableCell>
                  {sortedColumns.map((column) => (
                    <EditableCell
                      key={`${row.id}-${column.id}`}
                      rowId={row.id}
                      column={column}
                      value={getCellValue(row, column.id)}
                      tempValue={getTempCellValue(row.id, column.id)}
                      onTempValueChange={handleTempValueChange}
                      isEditing={isRowEditing(row.id)}
                    />
                  ))}
                  <TableCell className="sticky right-0 bg-white z-10 border-l border-gray-200">
                    <div className="flex items-center justify-center gap-2">
                      {isRowLoading(row.id) ? (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      ) : (
                        <>
                          {isRowEditing(row.id) ? (
                            <>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleSaveRow(row.id)}
                                className="h-8 w-8 p-0 border border-[var(--border)] hover:bg-[var(--primary)]/10"
                                aria-label="Saqlash"
                              >
                                <Save className="h-4 w-4 text-[var(--primary)]" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleCancelEdit(row.id)}
                                className="h-8 w-8 p-0 border border-[var(--border)] hover:bg-gray-100"
                                aria-label="Bekor qilish"
                              >
                                <span className="text-xs">×</span>
                              </Button>
                            </>
                          ) : (
                            <PermissionGuard permission="edit_journal_row">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleEditRow(row.id)}
                                className="h-8 w-8 p-0 border border-[var(--border)] hover:bg-[var(--primary)]/10"
                                aria-label="Tahrirlash"
                              >
                                <Edit className="h-4 w-4 text-[var(--primary)]" />
                              </Button>
                            </PermissionGuard>
                          )}
                          <PermissionGuard permission="delete_journal_row">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDeleteClick(row.id)}
                              disabled={
                                isRowLoading(row.id) || isRowEditing(row.id)
                              }
                              className="h-8 w-8 p-0 border border-[var(--border)] hover:bg-[var(--destructive)]/10 disabled:opacity-50"
                              aria-label="O'chirish"
                            >
                              <Trash2 className="h-4 w-4 text-[var(--destructive)]" />
                            </Button>
                          </PermissionGuard>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
            {/* Add Row Button Row - Only show when no row is being edited */}
            {!editingRow && (
              <TableRow className="border-t-2 border-dashed border-gray-300">
                <TableCell className="sticky left-0 bg-white z-10">
                  <PermissionGuard permission="create_journal_row">
                    <Button
                      onClick={onAddRow}
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0 border border-[var(--border)] hover:bg-[var(--primary)]/10"
                      aria-label="Yangi qator qo'shish"
                    >
                      <Plus className="h-4 w-4 text-[var(--primary)]" />
                    </Button>
                  </PermissionGuard>
                </TableCell>
                {sortedColumns.map((column) => (
                  <TableCell key={`add-${column.id}`} className="min-w-[150px]">
                    <div className="py-1 px-2 min-h-[32px] flex items-center">
                      <span className="text-gray-400 text-sm italic">
                        {column.name}
                      </span>
                    </div>
                  </TableCell>
                ))}
                <TableCell className="sticky right-0 bg-white z-10 border-l border-gray-200">
                  <div className="flex items-center justify-center">
                    <span className="text-xs text-gray-400">Yangi qator</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ConfirmationDialog
        isOpen={showDeleteConfirmation}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Qatorni o'chirish"
        message="Bu qatorni o'chirishni xohlaysizma? Bu amalni qaytarib bo'lmaydi."
        confirmText="O'chirish"
        cancelText="Bekor qilish"
        variant="danger"
        isDoingAction={isRowLoading(rowToDelete || "")}
      />
    </>
  );
}
