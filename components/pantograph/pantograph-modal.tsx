"use client";

import { useState, useEffect, useMemo, useCallback, memo, FC } from "react";
import { Card } from "@/ui/card";
import { Label } from "@/ui/label";
import { Input } from "@/ui/input";
import { Textarea } from "@/ui/textarea";
import { Button } from "@/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { useGetLocomotives } from "@/api/hooks/use-locomotives";
import {
  PantographJournalEntry,
  CreatePantographJournalPayload,
  UpdatePantographJournalPayload,
} from "@/api/types/pantograph";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/ui/dialog";

interface PantographModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    payload: CreatePantographJournalPayload | UpdatePantographJournalPayload
  ) => void;
  entry?: PantographJournalEntry | null;
  mode: "create" | "edit";
  isPending: boolean;
}

type LocomotiveOption = {
  id: number;
  label: string;
  value: string;
};

const LocomotiveSelect: FC<{
  value: string;
  onChange: (value: string) => void;
  options: LocomotiveOption[];
  disabled?: boolean;
}> = memo(({ value, onChange, options, disabled }) => {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger id="locomotive">
        <SelectValue placeholder="Lokomotivni tanlang" />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.id} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
});

LocomotiveSelect.displayName = "PantographLocomotiveSelect";

export function PantographModal({
  isOpen,
  onClose,
  onSave,
  entry,
  mode,
  isPending,
}: PantographModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    locomotive: "",
    department: "",
    section: "",
    date: "",
    damage: "",
    description: "",
  });

  const { data: locomotivesData, isPending: isLoadingLocomotives } =
    useGetLocomotives();

  const locomotiveOptions = useMemo<LocomotiveOption[]>(() => {
    if (!locomotivesData) return [];
    return locomotivesData.map((locomotive) => ({
      id: locomotive.id,
      label: `${locomotive.name} (${
        locomotive.locomotive_model?.name ||
        (locomotive as { model_name?: string })?.model_name ||
        "—"
      })`,
      value: locomotive.id.toString(),
    }));
  }, [locomotivesData]);

  useEffect(() => {
    if (entry && mode === "edit") {
      setFormData({
        title: entry.title ?? "",
        locomotive: entry.locomotive ? String(entry.locomotive) : "",
        department: entry.department ?? "",
        section: entry.section ?? "",
        date: entry.date ? entry.date.slice(0, 10) : "",
        damage: entry.damage ?? "",
        description: entry.description ?? "",
      });
    } else if (mode === "create" && isOpen) {
      setFormData({
        title: "",
        locomotive: "",
        department: "",
        section: "",
        date: "",
        damage: "",
        description: "",
      });
    }
  }, [entry, mode, isOpen]);

  const handleInputChange = useCallback(
    (field: keyof typeof formData) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData((prev) => ({
          ...prev,
          [field]: e.target.value,
        }));
      },
    []
  );

  const handleLocomotiveSelect = useCallback((value: string) => {
    setFormData((prev) => ({
      ...prev,
      locomotive: value,
    }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      title: "",
      locomotive: "",
      department: "",
      section: "",
      date: "",
      damage: "",
      description: "",
    });
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      const basePayload = {
        title: formData.title.trim(),
        locomotive: Number(formData.locomotive),
        department: formData.department.trim(),
        section: formData.section.trim(),
        date: formData.date,
        damage: formData.damage.trim(),
        description: formData.description.trim(),
      };

      if (mode === "create") {
        onSave(basePayload as CreatePantographJournalPayload);
      } else {
        onSave(basePayload as UpdatePantographJournalPayload);
      }
    },
    [formData, mode, onSave]
  );

  const titleText =
    mode === "create"
      ? "Pantograf jurnalini yaratish"
      : "Pantograf jurnalini tahrirlash";
  const submitText = mode === "create" ? "Yaratish" : "Saqlash";
  const pendingText = mode === "create" ? "Yaratilmoqda..." : "Saqlanmoqda...";

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-3xl" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{titleText}</DialogTitle>
          <DialogDescription className="sr-only">
            {titleText} formasi
          </DialogDescription>
        </DialogHeader>
        <Card className="border-none p-0 mt-2">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Sarlavha</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={handleInputChange("title")}
                  placeholder="Sarlavhani kiriting"
                  required
                />
              </div>

              <div>
                <Label htmlFor="date">Sana</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange("date")}
                  required
                />
              </div>

              <div>
                <Label htmlFor="locomotive">Lokomotiv</Label>
                <Select
                  value={formData.locomotive}
                  onValueChange={handleLocomotiveSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Lokomotivni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {locomotiveOptions.map((option) => (
                      <SelectItem key={option.id} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="department">Mas'ul tashkilot</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={handleInputChange("department")}
                  placeholder="Mas'ul tashkilotni kiriting"
                  required
                />
              </div>

              <div>
                <Label htmlFor="section">Uchastka</Label>
                <Input
                  id="section"
                  value={formData.section}
                  onChange={handleInputChange("section")}
                  placeholder="Uchastkani kiriting"
                  required
                />
              </div>

              <div>
                <Label htmlFor="damage">Zarar summasi</Label>
                <Input
                  id="damage"
                  type="number"
                  step="0.01"
                  value={formData.damage}
                  onChange={handleInputChange("damage")}
                  placeholder="Zarar summasini kiriting"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Hodisa tavsifi</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={handleInputChange("description")}
                placeholder="Hodisa tavsifini kiriting"
                rows={4}
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isPending}
              >
                Bekor qilish
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? pendingText : submitText}
              </Button>
            </div>
          </form>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
