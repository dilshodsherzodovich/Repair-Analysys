"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/ui/modal";
import { Input } from "@/ui/input";

import { Button } from "@/ui/button";
import { Label } from "@/ui/label";
import { Card } from "@/ui/card";
import {
  Organization,
  OrganizationCreateParams,
} from "@/api/types/organizations";
import { LoadingButton } from "@/ui/loading-button";
import { FileUpload } from "@/ui/file-upload";

interface OrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (organization: OrganizationCreateParams) => void;
  organization?: Organization;
  mode: "create" | "edit";
  isDoingAction: boolean;
}

export function OrganizationModal({
  isOpen,
  onClose,
  onSave,
  organization,
  mode,
  isDoingAction,
}: OrganizationModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    legal_basis: "",
    attachment_file: null as File | null,
  });

  useEffect(() => {
    if (organization && mode === "edit") {
      setFormData({
        name: organization.name,
        legal_basis: organization.legal_basis,
        // We cannot reconstruct a File object from a stored string; keep null until user selects a new file
        attachment_file: null,
      });
    } else {
      setFormData({
        name: "",
        legal_basis: "",
        attachment_file: null,
      });
    }
  }, [organization, mode, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: Partial<OrganizationCreateParams> = {
      name: formData.name.trim(),
      legal_basis: formData.legal_basis.trim(),
    };

    if (formData.attachment_file) {
      payload.attachment_file = formData.attachment_file;
    }

    // Casting here to satisfy the prop typing; for edit mode we might omit file
    onSave(payload as OrganizationCreateParams);
  };

  const title =
    mode === "create" ? "Tashkilot yaratish" : "Tashkilotni tahrirlash";
  const submitText =
    mode === "create" ? "Tashkilot yaratish" : "Tashkilotni yangilash";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <Card className="border-none p-0 mt-4">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label
                className="text-sm text-[var(--muted-foreground)]"
                aria-required
                htmlFor="name"
              >
                Tashkilot nomi
              </Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Tashkilot nomini kiriting"
                id="name"
                required
              />
            </div>
            <div>
              <Label
                className="text-sm text-[var(--muted-foreground)]"
                aria-required
                htmlFor="legal_basis"
              >
                Huquqiy asos
              </Label>
              <Input
                value={formData.legal_basis}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    legal_basis: e.target.value,
                  }))
                }
                placeholder="Huquqiy asosni kiriting"
                id="legal_basis"
                required
              />
            </div>
            <div>
              <Label
                className="text-sm text-[var(--muted-foreground)]"
                aria-required
                htmlFor="attachment_file"
              >
                Asos fayl
              </Label>
              <FileUpload
                filesUploaded={
                  formData.attachment_file ? [formData.attachment_file] : []
                }
                onFilesChange={(files) => {
                  setFormData((prev) => ({
                    ...prev,
                    attachment_file:
                      files && files.length > 0 ? files[0] : null,
                  }));
                }}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Bekor qilish
            </Button>
            <LoadingButton type="submit" isPending={isDoingAction}>
              {submitText}
            </LoadingButton>
          </div>
        </form>
      </Card>
    </Modal>
  );
}
