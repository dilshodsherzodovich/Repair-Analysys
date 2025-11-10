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
import { Edit, Plus, Trash2 } from "lucide-react";
import { Card } from "@/ui/card";
import { Input } from "@/ui/input";
import { ConfirmationDialog } from "@/ui/confirmation-dialog";
import { ClassificatorElement } from "@/api/types/classificator";

interface ClassificatorTableProps {
  elements: ClassificatorElement[];
  onEdit: (element: ClassificatorElement) => void;
  onDelete: (element: ClassificatorElement) => void;
  onBulkDelete: (elementIds: string[]) => void;
  onCreateNew: () => void;
}

export function ClassificatorTable({
  elements,
  onEdit,
  onDelete,
  onBulkDelete,
  onCreateNew,
}: ClassificatorTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const filteredElements = elements.filter((element) => {
    const matchesSearch = element.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredElements.map((element) => element.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectElement = (elementId: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, elementId]);
    } else {
      setSelectedIds((prev) => prev.filter((id) => id !== elementId));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length > 0) {
      setShowDeleteConfirmation(true);
    }
  };

  const confirmBulkDelete = () => {
    onBulkDelete(selectedIds);
    setSelectedIds([]);
  };

  const cancelBulkDelete = () => {
    setShowDeleteConfirmation(false);
  };

  return (
    <>
      <Card className="">
        {/* Filters */}
        <div className="flex items-center justify-between bg-[var(--table-header-bg)]">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex-1 max-w-sm">
              <Input
                placeholder="Element nomi bo'yicha qidirish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-[var(--border)]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <Button
                variant="outline"
                onClick={handleBulkDelete}
                className="text-[var(--destructive)] border-[var(--destructive)] hover:bg-[var(--destructive)]/10"
              >
                O'chirish ({selectedIds.length})
              </Button>
            )}
            <Button
              onClick={onCreateNew}
              className="h-10 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white whitespace-nowrap flex items-center"
            >
              <Plus className="text-white size-5" />
              Qo'shish
            </Button>
          </div>
        </div>

        <div className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 text-[var(--table-header-fg)] sticky top-0 z-10">
                <TableHead className="w-12 p-3">
                  <Checkbox
                    checked={
                      selectedIds.length === filteredElements.length &&
                      filteredElements.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-16 p-3">#</TableHead>
                <TableHead className="p-3">Element nomi</TableHead>
                <TableHead className="w-32 p-3">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredElements.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {searchTerm
                      ? "Qidiruv natijasi topilmadi"
                      : "Elementlar mavjud emas"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredElements.map((element, index) => (
                  <TableRow
                    key={element.id}
                    className="transition-colors hover:bg-muted/50"
                  >
                    <TableCell className="p-3">
                      <Checkbox
                        checked={selectedIds.includes(element.id)}
                        onCheckedChange={(checked) =>
                          handleSelectElement(element.id, !!checked)
                        }
                      />
                    </TableCell>
                    <TableCell className="font-semibold text-[var(--primary)] p-3">
                      {index + 1}
                    </TableCell>
                    <TableCell className="p-3">
                      <span className="font-medium">{element.name}</span>
                    </TableCell>
                    <TableCell className="p-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onEdit(element)}
                          className="h-8 w-8 p-0 border border-[var(--border)] hover:bg-[var(--primary)]/10"
                          aria-label="Tahrirlash"
                        >
                          <Edit className="h-4 w-4 text-[var(--primary)]" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onDelete(element)}
                          className="h-8 w-8 p-0 border border-[var(--border)] hover:bg-[var(--destructive)]/10"
                          aria-label="O'chirish"
                        >
                          <Trash2 className="h-4 w-4 text-[var(--destructive)]" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <ConfirmationDialog
        isOpen={showDeleteConfirmation}
        onClose={cancelBulkDelete}
        onConfirm={confirmBulkDelete}
        title="Elementlarni o'chirish"
        message={`${selectedIds.length} ta elementni o'chirishni xohlaysizmi? Bu amalni qaytarib bo'lmaydi.`}
        confirmText="O'chirish"
        cancelText="Bekor qilish"
        variant="danger"
      />
    </>
  );
}
