"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/ui/modal";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { SpecialComponent } from "@/api/types/locomotive";
import { useUpdateSpecialComponent } from "@/api/hooks/use-special-components";
import { toast } from "@/ui/use-toast";

interface SpecialComponentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  locomotiveName: string;
  locomotiveModel: string;
  specialComponent: SpecialComponent | null;
}

export function SpecialComponentsModal({
  isOpen,
  onClose,
  locomotiveName,
  locomotiveModel,
  specialComponent,
}: SpecialComponentsModalProps) {
  const t = useTranslations("SpecialComponentsModal");
  const { mutate: updateSpecialComponent, isPending } = useUpdateSpecialComponent();
  
  // State to hold form values for the special component
  const [formValues, setFormValues] = useState<Record<string, string | number | null>>({});

  // Fields to exclude from editing
  const excludedFields = [
    "id",
    "year_of_manufacture",
    "factory_number",
    "created_time",
    "service_type",
    "last_updated_time",
  ];

  // Initialize form values when modal opens or specialComponent changes
  useEffect(() => {
    if (isOpen && specialComponent) {
      const editableFields: Record<string, string | number | null> = {};
      
      // Extract all fields except excluded ones
      Object.keys(specialComponent).forEach((key) => {
        if (!excludedFields.includes(key)) {
          editableFields[key] = specialComponent[key];
        }
      });
      
      setFormValues(editableFields);
    }
  }, [isOpen, specialComponent]);

  const handleFieldChange = (
    fieldName: string,
    value: string | number | null
  ) => {
    setFormValues((prev) => {
      return {
        ...prev,
        [fieldName]: value,
      };
    });
  };

  const handleSave = () => {
    if (!specialComponent) {
      return;
    }

    // Filter out unchanged values
    const payload: Record<string, string | number | null> = {};
    let hasChanges = false;

    Object.keys(formValues).forEach((key) => {
      const originalValue = specialComponent[key];
      const newValue = formValues[key];
      
      if (originalValue !== newValue) {
        payload[key] = newValue;
        hasChanges = true;
      }
    });

    if (!hasChanges) {
      toast({
        title: t("no_changes"),
        description: t("no_changes_description"),
      });
      return;
    }

    updateSpecialComponent(
      {
        id: specialComponent.id,
        payload,
      },
      {
        onSuccess: (updatedComponent) => {
          // Update the form values with the response data
          const updatedFields: Record<string, string | number | null> = {};
          Object.keys(payload).forEach((key) => {
            updatedFields[key] = updatedComponent[key];
          });
          
          setFormValues((prev) => ({
            ...prev,
            ...updatedFields,
          }));
          
          toast({
            title: t("success_updated"),
            description: t("success_description"),
          });
        },
        onError: (error: any) => {
          console.error("Error updating special component:", error);
          toast({
            variant: "destructive",
            title: t("error_title"),
            description:
              error?.response?.data?.message ||
              t("error_description"),
          });
        },
      }
    );
  };

  // Get field names from the component (excluding excluded fields)
  const getFieldNames = (): string[] => {
    if (!specialComponent) return [];
    return Object.keys(specialComponent)
      .filter((key) => !excludedFields.includes(key))
      .sort();
  };

  const fieldNames = getFieldNames();

  // Format field name for display (convert snake_case to Title Case)
  const formatFieldName = (fieldName: string): string => {
    const fieldNameNumber = fieldName.split("_").pop();
    if(fieldName.includes("koren")) {
      return `${t("koren_prefix")}-${fieldNameNumber}`;
    } else if(fieldName.includes("shatun")) {
      return `${t("shatun_prefix")}-${fieldNameNumber}`;
    } else return fieldName
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    
  };

  // Determine input type based on field value
  const getInputType = (value: string | number | null): string => {
    if (typeof value === "number") return "number";
    if (typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2}/)) return "date";
    return "text";
  };

  if (!specialComponent) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-[#0F172B]">
              {t("title")} - {locomotiveName} ({locomotiveModel})
            </DialogTitle>
          </DialogHeader>

          <div className="text-center py-8 text-muted-foreground">
            {t("not_found")}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={onClose}
            >
              {t("close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#0F172B]">
            {t("title")} - {locomotiveName} ({locomotiveModel})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="rounded-lg border border-[#E5ECF8] bg-[#F8FBFF] p-4 space-y-4">
            <div className="flex items-center justify-end border-b border-[#E5ECF8] pb-2 mb-4">
              <div className="text-sm text-muted-foreground space-y-1">
                {specialComponent.year_of_manufacture && (
                  <div>
                    <span className="font-medium">{t("year_of_manufacture")}: </span>
                    {specialComponent.year_of_manufacture}
                  </div>
                )}
                {specialComponent.factory_number && (
                  <div>
                    <span className="font-medium">{t("factory_number")}: </span>
                    {specialComponent.factory_number}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1">
                {fieldNames.filter((fieldName) => fieldName.includes("koren")).map((fieldName) => {
                  const value = formValues[fieldName] ?? specialComponent[fieldName] ?? "";
                const inputType = getInputType(value);
                
                return (
                  <div key={fieldName} className="space-y-2">
                    <Label htmlFor={fieldName} className="mb-2">
                      {formatFieldName(fieldName)}
                    </Label>
                    <Input
                      id={fieldName}
                      type={inputType}
                      value={value}
                      onChange={(e) => {
                        handleFieldChange(fieldName, e.target.value);
                      }}
                      className="w-full"
                      placeholder={`${formatFieldName(fieldName)} ${t("placeholder_enter")}`}
                    />
                  </div>
                );
                })}
              </div>
              <div className="col-span-1">
                {fieldNames.filter((fieldName) => fieldName.includes("shatun")).map((fieldName) => {
                  const value = formValues[fieldName] ?? specialComponent[fieldName] ?? "";
                const inputType = getInputType(value);
                
                return (
                  <div key={fieldName} className="space-y-2">
                    <Label htmlFor={fieldName} className="mb-2">
                      {formatFieldName(fieldName)}
                    </Label>
                    <Input
                      id={fieldName}
                      type={inputType}
                      value={value}
                      onChange={(e) => {
                        handleFieldChange(fieldName, e.target.value);
                      }}
                      className="w-full"
                      placeholder={`${formatFieldName(fieldName)} ${t("placeholder_enter")}`}
                    />
                  </div>
                );
                })}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            {t("close")}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending}
            variant="default"
          >
            {isPending ? t("saving") : t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

