"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { BulletinColumn } from "@/api/types/bulleten";
import { useGetClassificators } from "@/api/hooks/use-classificator";

interface BulletinStructureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BulletinFieldFormData) => void;
  mode: "create" | "edit";
  field?: BulletinColumn;
}

interface BulletinFieldFormData {
  name: string;
  type: "number" | "text" | "date" | "classificator";
  classificatorId?: string;
  classificatorName?: string;
}

export function BulletinStructureModal({
  isOpen,
  onClose,
  onSubmit,
  mode,
  field,
}: BulletinStructureModalProps) {
  const [formData, setFormData] = useState<BulletinFieldFormData>({
    name: "",
    type: "text",
    classificatorId: "",
    classificatorName: "",
  });

  const { data: classificators, isPending } = useGetClassificators();

  const classificatorOptions = useMemo(() => {
    if (classificators?.count) {
      return classificators?.results?.map((classificator) => ({
        label: classificator.name,
        value: classificator.id,
      }));
    } else return [];
  }, [classificators]);

  // Reset form when modal opens/closes or mode changes
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && field) {
        setFormData({
          name: field.name || "",
          type: field.type || "text",
          classificatorId: field.classificatorId || "",
          classificatorName: field.classificatorName || "",
        });
      } else {
        setFormData({
          name: "",
          type: "text",
          classificatorId: "",
          classificatorName: "",
        });
      }
    }
  }, [isOpen, mode, field]);

  const fieldTypeOptions = [
    { value: "number", label: "Raqam" },
    { value: "text", label: "Matn" },
    { value: "date", label: "Sana" },
    { value: "classificator", label: "Klassifikator" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      alert("Maydon nomini kiriting");
      return;
    }

    if (formData.type === "classificator" && !formData.classificatorId) {
      alert("Klassifikatorni tanlang");
      return;
    }

    onSubmit(formData);
    onClose();
  };

  const handleTypeChange = (type: string) => {
    setFormData({
      ...formData,
      type: type as any,
      // Clear classificator data if type is not classificator
      classificatorId: type === "classificator" ? formData.classificatorId : "",
      classificatorName:
        type === "classificator" ? formData.classificatorName : "",
    });
  };

  const handleClassificatorChange = (classificatorId: string) => {
    const selectedClassificator = classificatorOptions?.find(
      (c) => c.value === classificatorId
    );
    setFormData({
      ...formData,
      classificatorId,
      classificatorName: selectedClassificator?.label || "",
    });
  };

  const isFormValid = () => {
    if (!formData.name.trim()) return false;
    if (formData.type === "classificator" && !formData.classificatorId)
      return false;
    return true;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[var(--foreground)]">
            {mode === "create"
              ? "Yangi maydon qo'shish"
              : "Maydonni tahrirlash"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* Field Name */}
          <div className="space-y-3">
            <Label
              htmlFor="name"
              className="text-sm font-medium text-[var(--foreground)]"
            >
              Maydon nomi
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Maydon nomini kiriting"
              className="w-full border-[var(--border)]"
              required
            />
          </div>

          {/* Field Type */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-[var(--foreground)]">
              Maydon turi
            </Label>
            <div className="grid grid-cols-1 gap-3">
              {fieldTypeOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center space-x-3 p-3 border border-[var(--border)] rounded-lg cursor-pointer hover:bg-[var(--muted)]/20 transition-colors"
                >
                  <input
                    type="radio"
                    name="fieldType"
                    value={option.value}
                    checked={formData.type === option.value}
                    onChange={() => handleTypeChange(option.value)}
                    className="text-[var(--primary)] focus:ring-[var(--primary)]"
                  />
                  <span className="text-sm font-medium">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Classificator Selection (only show if type is classificator) */}
          {formData.type === "classificator" && (
            <div className="space-y-3">
              <Label className="text-sm font-medium text-[var(--foreground)]">
                Klassifikatorni tanlang
              </Label>
              <Select
                value={formData.classificatorId}
                onValueChange={handleClassificatorChange}
              >
                <SelectTrigger className="w-full border-[var(--border)]">
                  <SelectValue placeholder="Klassifikatorni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {classificatorOptions.map((classificator) => (
                    <SelectItem
                      key={classificator.value}
                      value={classificator.value}
                    >
                      {classificator.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-[var(--border)]">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-[var(--border)]"
            >
              Bekor qilish
            </Button>
            <Button
              type="submit"
              className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white px-6"
              disabled={!isFormValid()}
            >
              {mode === "create" ? "Qo'shish" : "O'zgarishlarni saqlash"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
