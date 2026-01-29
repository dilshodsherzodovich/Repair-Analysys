"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/ui/card";
import { Label } from "@/ui/label";
import { Input } from "@/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { Button } from "@/ui/button";
import {
  useGetLocomotives,
  useGetLocomotiveDetail,
} from "@/api/hooks/use-locomotives";
import { useInspectionTypes } from "@/api/hooks/use-inspection";
import { useComponents } from "@/api/hooks/use-component";
import { CreateComponentRegistryPayload } from "@/api/types/component-registry";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/ui/dialog";

interface ComponentRegistryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CreateComponentRegistryPayload) => void;
  organizationId: number;
  isPending: boolean;
}

type FormData = {
  locomotive_id: string;
  section_id: string;
  component_id: string;
  inspection_id: string;
  reason: string;
  defect_date: string;
  removed_manufacture_year: string;
  installed_manufacture_year: string;
  installed_manufacture_factory: string;
  removed_manufacture_factory: string;
};

const INITIAL_FORM_DATA: FormData = {
  locomotive_id: "",
  section_id: "",
  component_id: "",
  inspection_id: "",
  reason: "",
  defect_date: "",
  removed_manufacture_year: "",
  installed_manufacture_year: "",
  installed_manufacture_factory: "",
  removed_manufacture_factory: "",
};

// Memoized form field component
const FormField = memo(
  ({
    id,
    label,
    value,
    onChange,
    placeholder,
    required,
    type = "text",
    disabled,
  }: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    type?: string;
    disabled?: boolean;
  }) => {
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
      },
      [onChange]
    );

    return (
      <div>
        <Label htmlFor={id}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Input
          id={id}
          type={type}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          className="w-full"
          disabled={disabled}
        />
      </div>
    );
  }
);
FormField.displayName = "FormField";

export function ComponentRegistryModal({
  isOpen,
  onClose,
  onSave,
  organizationId,
  isPending,
}: ComponentRegistryModalProps) {
  const t = useTranslations("ComponentRegistryModal");
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);

  const { data: locomotivesData, isPending: loadingLocomotives } =
    useGetLocomotives(
      true,
      undefined,
      {
        no_page: true,
        organization: organizationId,
      }
    );

  const { data: locomotiveDetail, isPending: loadingLocomotiveDetail } =
    useGetLocomotiveDetail(
      formData.locomotive_id ? Number(formData.locomotive_id) : undefined,
      isOpen && !!formData.locomotive_id
    );

  const { data: inspectionTypesData, isPending: loadingInspectionTypes } =
    useInspectionTypes(isOpen);

  const { data: componentsData, isPending: loadingComponents } = useComponents(
    {
      locomotive: formData.locomotive_id
        ? Number(formData.locomotive_id)
        : undefined,
      section: formData.section_id ? Number(formData.section_id) : undefined,
      no_page: true,
    },
    isOpen && !!formData.locomotive_id && !!formData.section_id
  );

  const componentOptions =
    componentsData?.results?.map((component) => ({
      value: String(component.id),
      label: component.component,
    })) || [];

  const inspectionOptions =
    inspectionTypesData?.map((inspection) => ({
      value: String(inspection.id),
      label: inspection.name_uz || inspection.name,
    })) || [];

  const locomotiveOptions =
    locomotivesData?.results?.map((loc) => ({
      value: String(loc.id),
      label: `${loc.name} - ${loc.model_name || ""}`,
    })) || [];

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData(INITIAL_FORM_DATA);
    }
  }, [isOpen]);

  const handleFieldChange = useCallback(
    (field: keyof FormData, value: string) => {
      setFormData((prev) => {
        // Reset section_id and component_id when locomotive changes
        if (field === "locomotive_id") {
          return { ...prev, [field]: value, section_id: "", component_id: "" };
        }
        // Reset component_id when section changes
        if (field === "section_id") {
          return { ...prev, [field]: value, component_id: "" };
        }
        return { ...prev, [field]: value };
      });
    },
    []
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // Validation
      if (
        !formData.locomotive_id ||
        !formData.section_id ||
        !formData.component_id ||
        !formData.inspection_id
      ) {
        alert(t("validation_required"));
        return;
      }

      const payload: CreateComponentRegistryPayload = {
        organization_id: organizationId,
        locomotive_id: Number(formData.locomotive_id),
        section_id: Number(formData.section_id),
        component_id: Number(formData.component_id),
        inspection_id: Number(formData.inspection_id),
        reason: formData.reason,
        defect_date: formData.defect_date,
        removed_manufacture_year: formData.removed_manufacture_year,
        installed_manufacture_year: formData.installed_manufacture_year,
        installed_manufacture_factory: formData.installed_manufacture_factory,
        removed_manufacture_factory: formData.removed_manufacture_factory,
      };

      onSave(payload);
    },
    [formData, organizationId, onSave, t]
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:!max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="locomotive_id">
                {t("locomotive")} <span className="text-red-500 ml-1">*</span>
              </Label>
              <Select
                value={formData.locomotive_id}
                onValueChange={(value) =>
                  handleFieldChange("locomotive_id", value)
                }
                disabled={loadingLocomotives || isPending}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      loadingLocomotives
                        ? t("placeholder_loading")
                        : t("placeholder_locomotive")
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {locomotiveOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="section_id">
                {t("section")} <span className="text-red-500 ml-1">*</span>
              </Label>
              <Select
                value={formData.section_id}
                onValueChange={(value) =>
                  handleFieldChange("section_id", value)
                }
                disabled={
                  !formData.locomotive_id ||
                  loadingLocomotiveDetail ||
                  isPending
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      !formData.locomotive_id
                        ? t("placeholder_locomotive_first")
                        : loadingLocomotiveDetail
                        ? t("placeholder_loading")
                        : t("placeholder_section")
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {locomotiveDetail?.sections &&
                  locomotiveDetail.sections.length > 0
                    ? locomotiveDetail.sections.map((section) => (
                        <SelectItem
                          key={section.id}
                          value={section.id.toString()}
                        >
                          {section.name}
                        </SelectItem>
                      ))
                    : formData.locomotive_id &&
                      !loadingLocomotiveDetail && (
                        <SelectItem value="no-sections" disabled>
                          {t("no_sections")}
                        </SelectItem>
                      )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="component_id">
                {t("uzel")} <span className="text-red-500 ml-1">*</span>
              </Label>
              <Select
                value={formData.component_id}
                onValueChange={(value) =>
                  handleFieldChange("component_id", value)
                }
                disabled={
                  !formData.locomotive_id ||
                  !formData.section_id ||
                  loadingComponents ||
                  isPending
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      !formData.locomotive_id
                        ? t("placeholder_locomotive_first")
                        : !formData.section_id
                        ? t("placeholder_section_first")
                        : loadingComponents
                        ? t("placeholder_loading")
                        : t("placeholder_uzel")
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {componentOptions.length === 0 &&
                  formData.locomotive_id &&
                  formData.section_id &&
                  !loadingComponents ? (
                    <SelectItem value="no-components" disabled>
                      {t("no_components")}
                    </SelectItem>
                  ) : (
                    componentOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="inspection_id">
                {t("inspection_type")} <span className="text-red-500 ml-1">*</span>
              </Label>
              <Select
                value={formData.inspection_id}
                onValueChange={(value) =>
                  handleFieldChange("inspection_id", value)
                }
                disabled={loadingInspectionTypes || isPending}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      loadingInspectionTypes
                        ? t("placeholder_loading")
                        : t("placeholder_inspection")
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {inspectionOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <FormField
              id="reason"
              label={t("reason")}
              value={formData.reason}
              onChange={(value) => handleFieldChange("reason", value)}
              placeholder={t("placeholder_reason")}
            />

            <FormField
              id="defect_date"
              label={t("defect_date")}
              value={formData.defect_date}
              onChange={(value) => handleFieldChange("defect_date", value)}
              placeholder="YYYY-MM-DD"
              type="date"
            />

            <FormField
              id="removed_manufacture_year"
              label={t("removed_manufacture_year")}
              value={formData.removed_manufacture_year}
              onChange={(value) =>
                handleFieldChange("removed_manufacture_year", value)
              }
              placeholder={t("placeholder_date_example")}
            />

            <FormField
              id="installed_manufacture_year"
              label={t("installed_manufacture_year")}
              value={formData.installed_manufacture_year}
              onChange={(value) =>
                handleFieldChange("installed_manufacture_year", value)
              }
              placeholder={t("placeholder_date_example")}
            />

            <FormField
              id="installed_manufacture_factory"
              label={t("installed_manufacture_factory")}
              value={formData.installed_manufacture_factory}
              onChange={(value) =>
                handleFieldChange("installed_manufacture_factory", value)
              }
              placeholder={t("placeholder_factory")}
              disabled={!formData.component_id}
            />

            <FormField
              id="removed_manufacture_factory"
              label={t("removed_manufacture_factory")}
              value={formData.removed_manufacture_factory}
              onChange={(value) =>
                handleFieldChange("removed_manufacture_factory", value)
              }
              placeholder={t("placeholder_factory")}
              disabled={!formData.component_id}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t("saving") : t("save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
