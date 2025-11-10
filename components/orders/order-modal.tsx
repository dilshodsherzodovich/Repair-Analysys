"use client";

import { useState, useEffect } from "react";
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Convert date from datetime-local to ISO string
    const dateISO = formData.date ? new Date(formData.date).toISOString() : "";

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
  };

  const handleClose = () => {
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
  };

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
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    train_number: e.target.value,
                  }))
                }
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
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, date: e.target.value }))
                }
                required
              />
            </div>

            {/* Locomotive */}
            <div>
              <Label htmlFor="locomotive">Lokomotiv</Label>
              <Select
                value={formData.locomotive}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, locomotive: value }))
                }
                disabled={isLoadingLocomotives}
              >
                <SelectTrigger
                  id="locomotive"
                  className="!h-10 !mb-4 !border-gray-300 !bg-white !focus:border-blue-500 !focus:ring-0 !hover:border-gray-400 !rounded-md !px-4 !py-2 !text-base md:!text-sm"
                >
                  <SelectValue placeholder="Lokomotivni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {locomotivesData?.map((locomotive) => (
                    <SelectItem
                      key={locomotive.id}
                      value={locomotive.id.toString()}
                    >
                      {locomotive.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Responsible Department */}
            <div>
              <Label htmlFor="responsible_department">Mas'ul tashkilot</Label>
              <Input
                id="responsible_department"
                value={formData.responsible_department}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    responsible_department: e.target.value,
                  }))
                }
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
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    responsible_person: e.target.value,
                  }))
                }
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
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    damage_amount: e.target.value,
                  }))
                }
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
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  case_description: e.target.value,
                }))
              }
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
