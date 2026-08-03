"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/ui/modal";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";
import { SpecialComponent } from "@/api/types/locomotive";
import { useUpdateSpecialComponent } from "@/api/hooks/use-special-components";
import { toast } from "@/ui/use-toast";

interface SpecialComponentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  locomotiveName: string;
  locomotiveModel: string;
  specialComponents: SpecialComponent[];
}

// Fields that are never rendered as editable inputs
const excludedFields = [
  "id",
  "section",
  "year_of_manufacture",
  "factory_number",
  "created_time",
  "service_type",
  "last_updated_time",
];

// Only primitive values are editable — `section` and any other nested object is skipped
const isEditableValue = (value: unknown): value is string | number | null =>
  value === null || typeof value === "string" || typeof value === "number";

// Trailing number of a field ("koren_12" -> 12); unnumbered fields sort last
const getFieldNumber = (fieldName: string): number => {
  const match = fieldName.match(/(\d+)$/);
  return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
};

// Field name without its trailing number ("koren_12" -> "koren")
const getFieldPrefix = (fieldName: string): string =>
  fieldName.replace(/[_-]?\d+$/, "");

// Determine input type based on field value
const getInputType = (value: string | number | null): string => {
  if (typeof value === "number") return "number";
  if (typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2}/)) return "date";
  return "text";
};

function SpecialComponentSection({
  specialComponent,
  onClose,
}: {
  specialComponent: SpecialComponent;
  onClose: () => void;
}) {
  const t = useTranslations("SpecialComponentsModal");
  const { mutate: updateSpecialComponent, isPending } = useUpdateSpecialComponent();

  // State to hold form values for the special component
  const [formValues, setFormValues] = useState<Record<string, string | number | null>>({});

  // Initialize form values when the rendered special component changes
  useEffect(() => {
    const editableFields: Record<string, string | number | null> = {};

    // Extract all fields except excluded and non-primitive ones
    Object.keys(specialComponent).forEach((key) => {
      const value = specialComponent[key];
      if (!excludedFields.includes(key) && isEditableValue(value)) {
        editableFields[key] = value;
      }
    });

    setFormValues(editableFields);
  }, [specialComponent]);

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
            const value = updatedComponent[key];
            if (isEditableValue(value)) {
              updatedFields[key] = value;
            }
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

  // Get field names from the component (excluding excluded fields).
  // Sorted by number, not alphabetically — a plain `.sort()` puts koren_10
  // before koren_2.
  const fieldNames = useMemo(
    () =>
      Object.keys(specialComponent)
        .filter(
          (key) =>
            !excludedFields.includes(key) && isEditableValue(specialComponent[key])
        )
        .sort((a, b) => {
          const prefixDiff = getFieldPrefix(a).localeCompare(getFieldPrefix(b));
          if (prefixDiff !== 0) return prefixDiff;
          const numberDiff = getFieldNumber(a) - getFieldNumber(b);
          if (numberDiff) return numberDiff;
          return a.localeCompare(b);
        }),
    [specialComponent]
  );

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

  const renderField = (fieldName: string) => {
    const rawValue = formValues[fieldName] ?? specialComponent[fieldName] ?? "";
    const value = isEditableValue(rawValue) ? rawValue ?? "" : "";
    const inputType = getInputType(value);

    return (
      <div key={fieldName} className="space-y-2">
        <Label htmlFor={`${specialComponent.id}-${fieldName}`} className="mb-2">
          {formatFieldName(fieldName)}
        </Label>
        <Input
          id={`${specialComponent.id}-${fieldName}`}
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
  };

  return (
    <>
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
            <div className="col-span-1 space-y-4">
              {fieldNames
                .filter((fieldName) => fieldName.includes("koren"))
                .map(renderField)}
            </div>
            <div className="col-span-1 space-y-4">
              {fieldNames
                .filter((fieldName) => fieldName.includes("shatun"))
                .map(renderField)}
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
    </>
  );
}

export function SpecialComponentsModal({
  isOpen,
  onClose,
  locomotiveName,
  locomotiveModel,
  specialComponents,
}: SpecialComponentsModalProps) {
  const t = useTranslations("SpecialComponentsModal");

  // One tab per section — sorted by section id so the tab order is stable
  const components = useMemo(() => {
    return [...(specialComponents ?? [])].sort(
      (a, b) => (a.section?.id ?? 0) - (b.section?.id ?? 0)
    );
  }, [specialComponents]);

  const [activeTab, setActiveTab] = useState<string>("");

  useEffect(() => {
    if (!isOpen) return;
    const firstTab = components.length ? String(components[0].id) : "";
    setActiveTab((prev) =>
      components.some((component) => String(component.id) === prev)
        ? prev
        : firstTab
    );
  }, [isOpen, components]);

  const getSectionLabel = (component: SpecialComponent, index: number): string =>
    component.section?.name ?? `${t("section")} ${index + 1}`;

  if (!components.length) {
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

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex w-full flex-col"
        >
          <TabsList className="inline-flex w-fit flex-wrap gap-1 rounded-lg border-0 bg-[#F1F5F9] p-1">
            {components.map((component, index) => (
              <TabsTrigger
                key={component.id}
                value={String(component.id)}
                className="px-6"
              >
                {getSectionLabel(component, index)}
              </TabsTrigger>
            ))}
          </TabsList>

          {components.map((component) => (
            // forceMount keeps every section mounted so unsaved edits survive
            // switching tabs
            <TabsContent
              key={component.id}
              value={String(component.id)}
              forceMount
              className="data-[state=inactive]:hidden"
            >
              <SpecialComponentSection
                specialComponent={component}
                onClose={onClose}
              />
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
