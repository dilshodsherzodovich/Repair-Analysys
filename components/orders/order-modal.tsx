"use client";

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  memo,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { Modal } from "@/ui/modal";
import { Input } from "@/ui/input";
import { Textarea } from "@/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/ui/select";
import { Button } from "@/ui/button";
import { Label } from "@/ui/label";
import { Card } from "@/ui/card";
import type {
  OrderData,
  CreateOrderPayload,
  UpdateOrderPayload,
} from "@/api/types/orders";
import { useGetLocomotives } from "@/api/hooks/use-locomotives";
import { FormField } from "@/ui/form-field";

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (orderData: CreateOrderPayload | UpdateOrderPayload) => void;
  order?: OrderData | null;
  mode: "create" | "edit";
  isPending: boolean;
}

type LocomotiveOption = {
  id: number;
  label: string;
  value: string;
};

type FormData = {
  train_number: string;
  responsible_department: string;
  responsible_person: string;
  damage_amount: string;
  locomotive: string;
  case_description: string;
  date: string;
};

const INITIAL_FORM_DATA: FormData = {
  train_number: "",
  responsible_department: "",
  responsible_person: "",
  damage_amount: "",
  locomotive: "",
  case_description: "",
  date: "",
};

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
        <Select value={value} onValueChange={onChange} disabled={isLoading}>
          <SelectTrigger id="locomotive">
            <SelectValue placeholder="Lokomotivni tanlang" />
          </SelectTrigger>
          <SelectContent>
            {isLoading ? (
              <SelectItem value="loading" disabled>
                Yuklanmoqda...
              </SelectItem>
            ) : options.length ? (
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

export function OrderModal({
  isOpen,
  onClose,
  onSave,
  order,
  mode,
  isPending,
}: OrderModalProps) {
  const [formData, setFormData] = useState<FormData>(() => ({
    ...INITIAL_FORM_DATA,
  }));

  const { data: locomotivesData, isPending: isLoadingLocomotives } =
    useGetLocomotives(isOpen);

  const locomotiveOptions = useMemo<LocomotiveOption[]>(() => {
    if (!locomotivesData) return [];
    return locomotivesData.map((locomotive) => ({
      id: locomotive.id,
      label: `${locomotive.name} (${locomotive.model_name})`,
      value: locomotive.id.toString(),
    }));
  }, [locomotivesData]);

  useEffect(() => {
    if (!isOpen) return;

    if (mode === "edit" && order) {
      const dateValue = order.date
        ? new Date(order.date).toISOString().slice(0, 16)
        : "";

      setFormData({
        train_number: order.train_number ?? "",
        responsible_department: order.responsible_department ?? "",
        responsible_person: order.responsible_person ?? "",
        damage_amount: order.damage_amount ?? "",
        locomotive: order.locomotive ? String(order.locomotive) : "",
        case_description: order.case_description ?? "",
        date: dateValue,
      });
    } else {
      setFormData(() => ({ ...INITIAL_FORM_DATA }));
    }
  }, [isOpen, mode, order]);

  const handleTrainNumberChange = useCallback((value: string) => {
    setFormData((prev) => {
      if (prev.train_number === value) return prev;
      return { ...prev, train_number: value };
    });
  }, []);

  const handleDateChange = useCallback((value: string) => {
    setFormData((prev) => {
      if (prev.date === value) return prev;
      return { ...prev, date: value };
    });
  }, []);

  const handleLocomotiveChange = useCallback((value: string) => {
    setFormData((prev) => {
      if (prev.locomotive === value) return prev;
      return { ...prev, locomotive: value };
    });
  }, []);

  const handleDepartmentChange = useCallback((value: string) => {
    setFormData((prev) => {
      if (prev.responsible_department === value) return prev;
      return { ...prev, responsible_department: value };
    });
  }, []);

  const handlePersonChange = useCallback((value: string) => {
    setFormData((prev) => {
      if (prev.responsible_person === value) return prev;
      return { ...prev, responsible_person: value };
    });
  }, []);

  const handleDamageChange = useCallback((value: string) => {
    setFormData((prev) => {
      if (prev.damage_amount === value) return prev;
      return { ...prev, damage_amount: value };
    });
  }, []);

  const handleDescriptionChange = useCallback((value: string) => {
    setFormData((prev) => {
      if (prev.case_description === value) return prev;
      return { ...prev, case_description: value };
    });
  }, []);

  const handleSubmit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      if (!formData.locomotive) return;

      const dateISO = formData.date
        ? new Date(formData.date).toISOString()
        : "";

      const payload = {
        train_number: formData.train_number.trim(),
        responsible_department: formData.responsible_department.trim(),
        responsible_person: formData.responsible_person.trim(),
        damage_amount: formData.damage_amount.trim(),
        locomotive: Number(formData.locomotive),
        case_description: formData.case_description.trim(),
        date: dateISO,
      };

      onSave(payload);
    },
    [formData, onSave]
  );

  const handleClose = useCallback(() => {
    setFormData(() => ({ ...INITIAL_FORM_DATA }));
    onClose();
  }, [onClose]);

  const title =
    mode === "create" ? "Buyruq MPR yaratish" : "Buyruq MPR ni tahrirlash";
  const submitText = mode === "create" ? "Yaratish" : "O'zgarishlarni saqlash";
  const actionText =
    mode === "create" ? "Yaratilmoqda..." : "O'zgartirilmoqda...";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="lg">
      <Card className="border-none p-0 mt-4">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              id="train_number"
              label="Poyezd raqami"
              value={formData.train_number}
              onChange={handleTrainNumberChange}
              placeholder="Poyezd raqamini kiriting"
              required
            />

            <FormField
              id="date"
              label="Sana va vaqt"
              type="datetime-local"
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
              id="responsible_department"
              label="Mas'ul tashkilot"
              value={formData.responsible_department}
              onChange={handleDepartmentChange}
              placeholder="Mas'ul tashkilotni kiriting"
              required
            />

            <FormField
              id="responsible_person"
              label="Mas'ul shaxs"
              value={formData.responsible_person}
              onChange={handlePersonChange}
              placeholder="Mas'ul shaxsni kiriting"
              required
            />

            <FormField
              id="damage_amount"
              label="Zarar summasi"
              type="number"
              step="0.01"
              value={formData.damage_amount}
              onChange={handleDamageChange}
              placeholder="Zarar summasini kiriting"
              required
            />
          </div>

          <FormField
            id="case_description"
            label="Hodisa tavsifi"
            type="textarea"
            rows={4}
            value={formData.case_description}
            onChange={handleDescriptionChange}
            placeholder="Hodisa tavsifini kiriting"
            required
          />

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
              {isPending ? actionText : submitText}
            </Button>
          </div>
        </form>
      </Card>
    </Modal>
  );
}
