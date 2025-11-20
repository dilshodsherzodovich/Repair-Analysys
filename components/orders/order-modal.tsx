"use client";

import { useState, useEffect, useCallback, useMemo, memo, FC } from "react";
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
import {
  OrderData,
  CreateOrderPayload,
  UpdateOrderPayload,
} from "@/api/types/orders";
import { useGetLocomotives } from "@/api/hooks/use-locomotives";

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

LocomotiveSelect.displayName = "LocomotiveSelect";

export function OrderModal({
  isOpen,
  onClose,
  onSave,
  order,
  mode,
  isPending,
}: OrderModalProps) {
  const [formData, setFormData] = useState({
    train_number: "",
    responsible_department: "",
    responsible_person: "",
    damage_amount: "",
    locomotive: "",
    case_description: "",
    date: "",
  });

  const { data: locomotivesData, isPending: isLoadingLocomotives } =
    useGetLocomotives();

  // Memoize locomotive options for better performance
  const locomotiveOptions = useMemo<LocomotiveOption[]>(() => {
    if (!locomotivesData) return [];
    return locomotivesData.map((locomotive) => ({
      id: locomotive.id,
      label: `${locomotive.name} (${locomotive.locomotive_model.name})`,
      value: locomotive.id.toString(),
    }));
  }, [locomotivesData]);

  // Initialize form data when modal opens or order changes
  useEffect(() => {
    if (order && mode === "edit") {
      // Format date from ISO string to datetime-local format (YYYY-MM-DDTHH:mm)
      const dateValue = order.date
        ? new Date(order.date).toISOString().slice(0, 16)
        : "";

      setFormData({
        train_number: order.train_number || "",
        responsible_department: order.responsible_department || "",
        responsible_person: order.responsible_person || "",
        damage_amount: order.damage_amount || "",
        locomotive: order.locomotive ? String(order.locomotive) : "",
        case_description: order.case_description || "",
        date: dateValue,
      });
    } else {
      // Reset form for create mode
      setFormData({
        train_number: "",
        responsible_department: "",
        responsible_person: "",
        damage_amount: "",
        locomotive: "",
        case_description: "",
        date: "",
      });
    }
  }, [order, mode, isOpen]);

  // Optimized input handlers using useCallback
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

  const handleSelectChange = useCallback((field: keyof typeof formData) => {
    return (value: string) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    };
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // Convert date from datetime-local to ISO string
      const dateISO = formData.date
        ? new Date(formData.date).toISOString()
        : "";

      if (mode === "create") {
        const payload: CreateOrderPayload = {
          train_number: formData.train_number.trim(),
          responsible_department: formData.responsible_department.trim(),
          responsible_person: formData.responsible_person.trim(),
          damage_amount: formData.damage_amount.trim(),
          locomotive: parseInt(formData.locomotive),
          case_description: formData.case_description.trim(),
          date: dateISO,
        };
        onSave(payload);
      } else {
        const payload: UpdateOrderPayload = {
          train_number: formData.train_number.trim(),
          responsible_department: formData.responsible_department.trim(),
          responsible_person: formData.responsible_person.trim(),
          damage_amount: formData.damage_amount.trim(),
          locomotive: parseInt(formData.locomotive),
          case_description: formData.case_description.trim(),
          date: dateISO,
        };
        onSave(payload);
      }
    },
    [formData, mode, onSave]
  );

  const handleClose = useCallback(() => {
    setFormData({
      train_number: "",
      responsible_department: "",
      responsible_person: "",
      damage_amount: "",
      locomotive: "",
      case_description: "",
      date: "",
    });
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
            {/* Train Number */}
            <div>
              <Label htmlFor="train_number">Poyezd raqami</Label>
              <Input
                id="train_number"
                value={formData.train_number}
                onChange={handleInputChange("train_number")}
                placeholder="Poyezd raqamini kiriting"
                required
              />
            </div>

            {/* Date */}
            <div>
              <Label htmlFor="date">Sana va vaqt</Label>
              <Input
                id="date"
                type="datetime-local"
                value={formData.date}
                onChange={handleInputChange("date")}
                required
              />
            </div>

            {/* Locomotive */}
            <div>
              <Label htmlFor="locomotive">Lokomotiv</Label>
              <LocomotiveSelect
                value={formData.locomotive}
                onChange={handleSelectChange("locomotive")}
                options={locomotiveOptions}
                disabled={isLoadingLocomotives}
              />
            </div>

            {/* Responsible Department */}
            <div>
              <Label htmlFor="responsible_department">Mas'ul tashkilot</Label>
              <Input
                id="responsible_department"
                value={formData.responsible_department}
                onChange={handleInputChange("responsible_department")}
                placeholder="Mas'ul tashkilotni kiriting"
                required
              />
            </div>

            {/* Responsible Person */}
            <div>
              <Label htmlFor="responsible_person">Mas'ul shaxs</Label>
              <Input
                id="responsible_person"
                value={formData.responsible_person}
                onChange={handleInputChange("responsible_person")}
                placeholder="Mas'ul shaxsni kiriting"
                required
              />
            </div>

            {/* Damage Amount */}
            <div>
              <Label htmlFor="damage_amount">Zarar summasi</Label>
              <Input
                id="damage_amount"
                type="number"
                step="0.01"
                value={formData.damage_amount}
                onChange={handleInputChange("damage_amount")}
                placeholder="Zarar summasini kiriting"
                required
              />
            </div>
          </div>

          {/* Case Description */}
          <div>
            <Label htmlFor="case_description">Hodisa tavsifi</Label>
            <Textarea
              id="case_description"
              value={formData.case_description}
              onChange={handleInputChange("case_description")}
              placeholder="Hodisa tavsifini kiriting"
              rows={4}
              required
            />
          </div>

          {/* Form Actions */}
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
