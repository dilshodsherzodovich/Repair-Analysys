"use client";


import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { Modal, ModalFooter } from "@/ui/modal";
import { Input } from "@/ui/input";

import { Button } from "@/ui/button";
import { Organization, OrganizationCreateParams } from "@/api/types/organizations";
import { FileUpload } from "@/ui/file-upload";

import { Field, FieldGrid } from "@/ui/field";
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
  const tc = useTranslations("Common");
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
      <form onSubmit={handleSubmit} className="space-y-5">
          <FieldGrid>
            <Field label="Tashkilot nomi" htmlFor="name">
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Tashkilot nomini kiriting"
                id="name"
                required
              />
            </Field>
            <Field label="Huquqiy asos" htmlFor="legal_basis">
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
            </Field>
            <Field label="Asos fayl" htmlFor="attachment_file">
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
            </Field>
          </FieldGrid>
          <ModalFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {tc("cancel")}
            </Button>
            <Button type="submit" loading={isDoingAction} className="min-w-24">
              {submitText}
            </Button>
          </ModalFooter>
        </form>
    </Modal>
  );
}
