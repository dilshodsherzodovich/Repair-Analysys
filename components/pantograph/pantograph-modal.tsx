"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useTranslations } from "next-intl";
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

// Memoized locomotive select component (receives t from parent to avoid hook in memo)
function LocomotiveSelectInner({
  value,
  onChange,
  options,
  isLoading,
  label,
  placeholder,
  loadingText,
  emptyText,
}: {
  value: string;
  onChange: (value: string) => void;
  options: LocomotiveOption[];
  isLoading: boolean;
  label: string;
  placeholder: string;
  loadingText: string;
  emptyText: string;
}) {
  return (
    <div>
      <Label htmlFor="locomotive">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <SelectItem value="loading" disabled>
              {loadingText}
            </SelectItem>
          ) : options.length > 0 ? (
            options.map((option) => (
              <SelectItem key={option.id} value={option.value}>
                {option.label}
              </SelectItem>
            ))
          ) : (
            <SelectItem value="empty" disabled>
              {emptyText}
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

export const PantographModal = memo(function PantographModal({
  isOpen,
  onClose,
  onSave,
  entry,
  mode,
  isPending,
}: PantographModalProps) {
  const t = useTranslations("PantographModal");
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
      title: mode === "create" ? t("title_create") : t("title_edit"),
      submit: mode === "create" ? t("submit_create") : t("submit_edit"),
      pending: mode === "create" ? t("pending_create") : t("pending_edit"),
    }),
    [mode, t]
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
            {modalTexts.title} {t("form_description")}
          </DialogDescription>
        </DialogHeader>
        <Card className="border-none p-0 mt-2">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                id="title"
                label={t("fields.title")}
                value={formData.title}
                onChange={handleTitleChange}
                placeholder={t("fields.title_placeholder")}
                required
              />

              <FormField
                id="date"
                label={t("fields.date")}
                type="date"
                value={formData.date}
                onChange={handleDateChange}
                required
              />

              <LocomotiveSelectInner
                value={formData.locomotive}
                onChange={handleLocomotiveChange}
                options={locomotiveOptions}
                isLoading={isLoadingLocomotives}
                label={t("fields.locomotive")}
                placeholder={t("fields.locomotive_placeholder")}
                loadingText={t("fields.locomotive_loading")}
                emptyText={t("fields.locomotive_empty")}
              />

              <FormField
                id="department"
                label={t("fields.department")}
                value={formData.department}
                onChange={handleDepartmentChange}
                placeholder={t("fields.department_placeholder")}
                required
              />

              <FormField
                id="section"
                label={t("fields.section")}
                value={formData.section}
                onChange={handleSectionChange}
                placeholder={t("fields.section_placeholder")}
                required
              />

              <FormField
                id="damage"
                label={t("fields.damage")}
                type="number"
                step="0.01"
                value={formData.damage}
                onChange={handleDamageChange}
                placeholder={t("fields.damage_placeholder")}
                required
              />
            </div>

            <FormField
              id="description"
              label={t("fields.description")}
              type="textarea"
              rows={4}
              value={formData.description}
              onChange={handleDescriptionChange}
              placeholder={t("fields.description_placeholder")}
              required
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isPending}
              >
                {t("cancel")}
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
