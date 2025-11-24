"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
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

type FormData = {
  title: string;
  locomotive: string;
  department: string;
  section: string;
  date: string;
  damage: string;
  description: string;
};

const INITIAL_FORM_DATA: FormData = {
  title: "",
  locomotive: "",
  department: "",
  section: "",
  date: "",
  damage: "",
  description: "",
};

// Memoized form field components to prevent unnecessary re-renders
const FormField = memo(
  ({
    id,
    label,
    value,
    onChange,
    placeholder,
    required,
    type = "text",
    step,
    rows,
  }: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    type?: string;
    step?: string;
    rows?: number;
  }) => {
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        onChange(e.target.value);
      },
      [onChange]
    );

    if (type === "textarea") {
      return (
        <div>
          <Label htmlFor={id}>{label}</Label>
          <Textarea
            id={id}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            rows={rows}
            required={required}
          />
        </div>
      );
    }

    return (
      <div>
        <Label htmlFor={id}>{label}</Label>
        <Input
          id={id}
          type={type}
          step={step}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
        />
      </div>
    );
  }
);
FormField.displayName = "FormField";

// Memoized locomotive select component
const LocomotiveSelect = memo(
  ({
    value,
    onChange,
    options,
    isLoading,
  }: {
    value: string;
    onChange: (value: string) => void;
    options: LocomotiveOption[];
    isLoading: boolean;
  }) => {
    return (
      <div>
        <Label htmlFor="locomotive">Lokomotiv</Label>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder="Lokomotivni tanlang" />
          </SelectTrigger>
          <SelectContent>
            {isLoading ? (
              <SelectItem value="loading" disabled>
                Yuklanmoqda...
              </SelectItem>
            ) : options.length > 0 ? (
              options.map((option) => (
                <SelectItem key={option.id} value={option.value}>
                  {option.label}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="empty" disabled>
                Lokomotiv topilmadi
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
    );
  }
);
LocomotiveSelect.displayName = "LocomotiveSelect";

export const PantographModal = memo(function PantographModal({
  isOpen,
  onClose,
  onSave,
  entry,
  mode,
  isPending,
}: PantographModalProps) {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);

  // Only fetch locomotives when modal is open
  const { data: locomotivesData, isPending: isLoadingLocomotives } =
    useGetLocomotives(isOpen);

  // Memoize locomotive options transformation
  const locomotiveOptions = useMemo<LocomotiveOption[]>(() => {
    if (!locomotivesData) return [];
    return locomotivesData.map((locomotive) => ({
      id: locomotive.id,
      label: `${locomotive.name} (${locomotive.model_name})`,
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
    } else {
      setFormData(INITIAL_FORM_DATA);
    }
  }, [entry, mode, isOpen]);

  // Stable field update handlers - created once and never change
  const handleTitleChange = useCallback((value: string) => {
    setFormData((prev) => {
      if (prev.title === value) return prev;
      return { ...prev, title: value };
    });
  }, []);

  const handleDateChange = useCallback((value: string) => {
    setFormData((prev) => {
      if (prev.date === value) return prev;
      return { ...prev, date: value };
    });
  }, []);

  const handleDepartmentChange = useCallback((value: string) => {
    setFormData((prev) => {
      if (prev.department === value) return prev;
      return { ...prev, department: value };
    });
  }, []);

  const handleSectionChange = useCallback((value: string) => {
    setFormData((prev) => {
      if (prev.section === value) return prev;
      return { ...prev, section: value };
    });
  }, []);

  const handleDamageChange = useCallback((value: string) => {
    setFormData((prev) => {
      if (prev.damage === value) return prev;
      return { ...prev, damage: value };
    });
  }, []);

  const handleDescriptionChange = useCallback((value: string) => {
    setFormData((prev) => {
      if (prev.description === value) return prev;
      return { ...prev, description: value };
    });
  }, []);

  const handleLocomotiveChange = useCallback((value: string) => {
    setFormData((prev) => {
      if (prev.locomotive === value) return prev;
      return { ...prev, locomotive: value };
    });
  }, []);

  // Memoized static text values
  const modalTexts = useMemo(
    () => ({
      title:
        mode === "create"
          ? "Pantograf jurnalini yaratish"
          : "Pantograf jurnalini tahrirlash",
      submit: mode === "create" ? "Yaratish" : "Saqlash",
      pending: mode === "create" ? "Yaratilmoqda..." : "Saqlanmoqda...",
    }),
    [mode]
  );

  // Form submission handler
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      const payload = {
        title: formData.title.trim(),
        locomotive: Number(formData.locomotive),
        department: formData.department.trim(),
        section: formData.section.trim(),
        date: formData.date,
        damage: formData.damage.trim(),
        description: formData.description.trim(),
      };

      if (mode === "create") {
        onSave(payload as CreatePantographJournalPayload);
      } else {
        onSave(payload as UpdatePantographJournalPayload);
      }
    },
    [formData, mode, onSave]
  );

  // Dialog close handler - reset form only when actually closing
  const handleDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        // Reset form immediately when closing to prepare for next open
        setFormData(INITIAL_FORM_DATA);
        onClose();
      }
    },
    [onClose]
  );

  // Cancel handler
  const handleCancel = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
    onClose();
  }, [onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-3xl" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{modalTexts.title}</DialogTitle>
          <DialogDescription className="sr-only">
            {modalTexts.title} formasi
          </DialogDescription>
        </DialogHeader>
        <Card className="border-none p-0 mt-2">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                id="title"
                label="Sarlavha"
                value={formData.title}
                onChange={handleTitleChange}
                placeholder="Sarlavhani kiriting"
                required
              />

              <FormField
                id="date"
                label="Sana"
                type="date"
                value={formData.date}
                onChange={handleDateChange}
                required
              />

              <LocomotiveSelect
                value={formData.locomotive}
                onChange={handleLocomotiveChange}
                options={locomotiveOptions}
                isLoading={isLoadingLocomotives}
              />

              <FormField
                id="department"
                label="Mas'ul tashkilot"
                value={formData.department}
                onChange={handleDepartmentChange}
                placeholder="Mas'ul tashkilotni kiriting"
                required
              />

              <FormField
                id="section"
                label="Uchastka"
                value={formData.section}
                onChange={handleSectionChange}
                placeholder="Uchastkani kiriting"
                required
              />

              <FormField
                id="damage"
                label="Zarar summasi"
                type="number"
                step="0.01"
                value={formData.damage}
                onChange={handleDamageChange}
                placeholder="Zarar summasini kiriting"
                required
              />
            </div>

            <FormField
              id="description"
              label="Hodisa tavsifi"
              type="textarea"
              rows={4}
              value={formData.description}
              onChange={handleDescriptionChange}
              placeholder="Hodisa tavsifini kiriting"
              required
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isPending}
              >
                Bekor qilish
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? modalTexts.pending : modalTexts.submit}
              </Button>
            </div>
          </form>
        </Card>
      </DialogContent>
    </Dialog>
  );
});
