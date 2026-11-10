"use client";


import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { Modal, ModalFooter } from "@/ui/modal";
import { Input } from "@/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/ui/select";
import { Button } from "@/ui/button";
import { Department, DepartmentCreateParams } from "@/api/types/deparments";
import { useOrganizations } from "@/api/hooks/use-organizations";

import { Field, FieldGrid } from "@/ui/field";
interface DepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (department: DepartmentCreateParams) => void;
  department?: Department | null;
  mode: "create" | "edit";
  isDoingAction: boolean;
}

export function DepartmentModal({
  isOpen,
  onClose,
  onSave,
  department,
  mode,
  isDoingAction,
}: DepartmentModalProps) {
  const tc = useTranslations("Common");
  const [formData, setFormData] = useState({
    name: "",
    organization: "",
  });

  const [orgSearchTerm, setOrgSearchTerm] = useState("");

  const { data: organizationsData, isPending } = useOrganizations({
    no_page: true,
  });

  // Initialize form data when modal opens, department changes, or organizations load
  useEffect(() => {
    if (department && mode === "edit") {
      setFormData({
        name: department.name,
        organization: department.organization_id,
      });
    } else if (mode === "create") {
      setFormData({
        name: "",
        organization: "",
      });
    }
    // Clear search when modal opens
    setOrgSearchTerm("");
  }, [department, mode, isOpen, organizationsData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: formData?.name.trim()!,
      organization_id: formData.organization,
    });
  };

  const handleClose = () => {
    setFormData({
      name: "",
      organization: "",
    });
    setOrgSearchTerm("");
    onClose();
  };

  const title =
    mode === "create"
      ? "Quyi tashkilot yaratish"
      : "Quyi tashkilotni tahrirlash";
  const submitText = mode === "create" ? "Yaratish" : "O'zgarishlarni saqlash";
  const actionText = mode === "create" ? "Yaratilmmoqda" : "O'zgartirilmoqda";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
          <FieldGrid>
            <Field label="Quyi tashkilot nomi">
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Quyi tashkilot nomini kiriting"
                required
              />
            </Field>
            <Field label="Quyi tashkilot tegishli tashkilot">
              <Select
                value={formData.organization}
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, organization: value }));
                  setOrgSearchTerm(""); // Clear search after selection
                }}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tashkilot tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2 border-b border-border">
                    <Input variant="compact"
                      type="text"
                      placeholder="Qidirish..."
                      value={orgSearchTerm}
                      onKeyDown={(e) => e.stopPropagation()}
                      onKeyUp={(e) => e.stopPropagation()}
                      onChange={(e) => setOrgSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {organizationsData?.results
                      ?.filter((org) =>
                        org.name
                          .toLowerCase()
                          .includes(orgSearchTerm.toLowerCase())
                      )
                      ?.map((opt) => (
                        <SelectItem key={opt.id} value={opt.id}>
                          <span className="truncate block" title={opt.name}>
                            {opt.name}
                          </span>
                        </SelectItem>
                      ))}
                    {organizationsData?.results?.filter((org) =>
                      org.name
                        .toLowerCase()
                        .includes(orgSearchTerm.toLowerCase())
                    )?.length === 0 && (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        Tashkilot topilmadi
                      </div>
                    )}
                  </div>
                </SelectContent>
              </Select>
            </Field>
          </FieldGrid>
          <ModalFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              {tc("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isDoingAction}
            >
              {isDoingAction ? actionText : submitText}
            </Button>
          </ModalFooter>
        </form>
    </Modal>
  );
}
