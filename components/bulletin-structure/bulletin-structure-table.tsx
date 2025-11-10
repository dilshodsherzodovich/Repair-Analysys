"use client";

import { useState } from "react";
import { Edit, Trash2, GripVertical, Plus } from "lucide-react";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";
import { BulletinColumn } from "@/api/types/bulleten";

interface BulletinStructureTableProps {
  fields: BulletinColumn[];
  onReorder: (fields: BulletinColumn[]) => void;
  onEdit: (field: BulletinColumn) => void;
  onDelete: (field: BulletinColumn) => void;
  onCreateNew: () => void;
}

export function BulletinStructureTable({
  fields,
  onReorder,
  onEdit,
  onDelete,
  onCreateNew,
}: BulletinStructureTableProps) {
  const [draggedField, setDraggedField] = useState<BulletinColumn | null>(null);

  const getFieldTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      number: "Raqam",
      text: "Matn",
      date: "Sana",
      classificator: "Klassifikator",
      file: "Fayl",
      string: "Matn",
      integer: "Raqam",
    };
    return labels[type] || type;
  };

  const getFieldTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      number: "bg-blue-100 text-blue-800",
      integer: "bg-blue-100 text-blue-800",
      text: "bg-green-100 text-green-800",
      string: "bg-green-100 text-green-800",
      date: "bg-purple-100 text-purple-800",
      classificator: "bg-orange-100 text-orange-800",
      file: "bg-gray-100 text-gray-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const handleDragStart = (e: React.DragEvent, field: BulletinColumn) => {
    setDraggedField(field);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetField: BulletinColumn) => {
    e.preventDefault();

    if (!draggedField || draggedField.id === targetField.id) {
      return;
    }

    const draggedIndex = fields.findIndex((f) => f.id === draggedField.id);
    const targetIndex = fields.findIndex((f) => f.id === targetField.id);

    const newFields = [...fields];
    const [removed] = newFields.splice(draggedIndex, 1);
    newFields.splice(targetIndex, 0, removed);

    // Update order numbers
    const reorderedFields = newFields.map((field, index) => ({
      ...field,
      order: index + 1,
    }));

    onReorder(reorderedFields);
    setDraggedField(null);
  };

  const handleDragEnd = () => {
    setDraggedField(null);
  };

  return (
    <Card className="rounded-xl">
      <div className="flex items-center justify-between bg-[var(--table-header-bg)] p-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">
            Maydonlar ro'yxati
          </h3>
          <div className="text-sm text-[var(--muted-foreground)]">
            {fields?.length} ta maydon
          </div>
        </div>
        <Button
          onClick={onCreateNew}
          className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Yangi maydon qo'shish
        </Button>
      </div>

      <div className="p-4">
        {fields?.length === 0 ? (
          <div className="text-center py-8 text-[var(--muted-foreground)]">
            Hech qanday maydon qo'shilmagan. Yangi maydon qo'shish uchun
            yuqoridagi tugmani bosing.
          </div>
        ) : (
          <div className="space-y-2">
            {fields?.map((field, index) => (
              <div
                key={field.id}
                draggable
                onDragStart={(e) => handleDragStart(e, field)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, field)}
                onDragEnd={handleDragEnd}
                className={`
                  flex items-center gap-3 p-3 border border-[var(--border)] rounded-lg bg-white
                  ${draggedField?.id === field.id ? "opacity-50" : ""}
                  hover:bg-[var(--muted)]/20 transition-all duration-150 cursor-move
                `}
              >
                {/* Drag Handle */}
                <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
                  <GripVertical className="w-4 h-4" />
                  <span className="text-xs font-medium">
                    Ustun {field.order}
                  </span>
                </div>

                {/* Field Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-row gap-3 text-sm text-[var(--foreground)] font-medium">
                    {field.name}
                    <Badge
                      variant="secondary"
                      className={`${getFieldTypeColor(field.type)} border-none`}
                    >
                      {getFieldTypeLabel(field.type)}
                    </Badge>
                    {field.type === "classificator" &&
                      field.classificatorName && (
                        <Badge
                          variant="outline"
                          className="text-xs border-[var(--border)]"
                        >
                          {field.classificatorName}
                        </Badge>
                      )}
                  </div>
                  <div className="flex items-center flex-row gap-3"></div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onEdit(field)}
                    className="h-8 w-8 p-0 border border-[var(--border)] hover:bg-[var(--primary)]/10"
                    aria-label="Tahrirlash"
                  >
                    <Edit className="h-4 w-4 text-[var(--primary)]" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onDelete(field)}
                    className="h-8 w-8 p-0 border border-[var(--border)] hover:bg-[var(--destructive)]/10"
                    aria-label="O'chirish"
                  >
                    <Trash2 className="h-4 w-4 text-[var(--destructive)]" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
