"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useTranslations } from "next-intl";
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
import { useGetLocomotives } from "@/api/hooks/use-locomotives";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/ui/modal";
import {
  CreateLocomotiveReplacementOilPayload,
  UpdateLocomotiveReplacementOilPayload,
  LocomotiveReplacementOil,
  MaintenanceType,
  LubricantType,
  MAINTENANCE_TYPE_LABELS,
  LUBRICANT_TYPE_LABELS,
} from "@/api/types/locomotive-replacement-oil";

interface ReplacementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    payload:
      | CreateLocomotiveReplacementOilPayload
      | UpdateLocomotiveReplacementOilPayload
  ) => void;
  isPending: boolean;
  replacement?: LocomotiveReplacementOil | null;
  mode?: "create" | "edit";
}

type FormData = {
  locomotive_id: string;
  section_id: string;
  lubricant_type: string;
  maintenance_type: string;
  service_date: string;
  consumption: string;
};

const INITIAL_FORM_DATA: FormData = {
  locomotive_id: "",
  section_id: "",
  lubricant_type: "",
  maintenance_type: "",
  service_date: "",
  consumption: "",
};

// Helper to format date for input (YYYY-MM-DD)
const formatDateForInput = (dateString: string | null | undefined): string => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
  } catch {
    return "";
  }
};

export function ReplacementModal({
  isOpen,
  onClose,
  onSave,
  isPending,
  replacement,
  mode = "create",
}: ReplacementModalProps) {
  const t = useTranslations("ReplacementModal");
  // Use refs for form data to avoid re-renders on every change
  const formDataRef = useRef<FormData>(INITIAL_FORM_DATA);
  const formKeyRef = useRef(0); // Key to force re-render of uncontrolled inputs

  // Only use state for fields that need to trigger UI updates
  const [locomotiveId, setLocomotiveId] = useState<string>("");
  const [sectionId, setSectionId] = useState<string>("");
  const [locomotiveSearchTerm, setLocomotiveSearchTerm] = useState("");
  const [maintenanceType, setMaintenanceType] = useState<string>("");
  const [lubricantType, setLubricantType] = useState<string>("");

  const { data: locomotivesData, isPending: loadingLocomotives } =
    useGetLocomotives(
      true, 
      undefined,
      {
        no_page: true,
      }
    );
  // Simple locomotive options
  const locomotiveOptions =
    locomotivesData?.results?.map((loc) => ({
      value: String(loc.id),
      label: `${loc.name} - ${loc.model_name || ""}`,
      sections: loc.sections || [],
    })) || [];

  // Simple filter - only when searching, but always include selected locomotive
  let filteredLocomotiveOptions = locomotiveSearchTerm.trim()
    ? locomotiveOptions.filter((loc) =>
        loc.label.toLowerCase().includes(locomotiveSearchTerm.toLowerCase())
      )
    : locomotiveOptions;

  // Always include selected locomotive if it exists and isn't in filtered list
  if (locomotiveId) {
    const selectedLoc = locomotiveOptions.find(
      (loc) => loc.value === locomotiveId
    );
    if (
      selectedLoc &&
      !filteredLocomotiveOptions.some((loc) => loc.value === selectedLoc.value)
    ) {
      filteredLocomotiveOptions = [selectedLoc, ...filteredLocomotiveOptions];
    }
  }

  // Get sections from selected locomotive
  const selectedLocomotive = locomotiveOptions.find(
    (loc) => loc.value === locomotiveId
  );
  let sectionOptions =
    selectedLocomotive?.sections?.map((section) => ({
      value: String(section.id),
      label: section.name,
    })) || [];

  // In edit mode, ensure current section is in options
  if (mode === "edit" && replacement && sectionId) {
    const hasSection = sectionOptions.some((s) => s.value === sectionId);
    if (!hasSection && replacement.section_name) {
      sectionOptions = [
        { value: sectionId, label: replacement.section_name },
        ...sectionOptions,
      ];
    }
  }

  // Initialize form data
  useEffect(() => {
    if (!isOpen) {
      setLocomotiveSearchTerm("");
      formDataRef.current = INITIAL_FORM_DATA;
      setLocomotiveId("");
      setSectionId("");
      formKeyRef.current += 1;
      return;
    }

    if (mode === "edit" && replacement) {
      const initialData: FormData = {
        locomotive_id:
          replacement.locomotive_id != null
            ? String(replacement.locomotive_id)
            : "",
        section_id:
          replacement.section_id != null ? String(replacement.section_id) : "",
        lubricant_type: replacement.lubricant_type || "",
        maintenance_type: replacement.maintenance_type || "",
        service_date: formatDateForInput(replacement.service_date),
        consumption: String(replacement.consumption || ""),
      };
      formDataRef.current = initialData;
      setLocomotiveId(initialData.locomotive_id);
      setSectionId(initialData.section_id);
      setMaintenanceType(initialData.maintenance_type);
      setLubricantType(initialData.lubricant_type);
      formKeyRef.current += 1;
    } else {
      formDataRef.current = INITIAL_FORM_DATA;
      setLocomotiveId("");
      setSectionId("");
      setMaintenanceType("");
      setLubricantType("");
      formKeyRef.current += 1;
    }
  }, [isOpen, mode, replacement?.id]);

  // Fast field change handler
  const handleFieldChange = useCallback((field: keyof FormData, value: string) => {
    formDataRef.current[field] = value;

    if (field === "locomotive_id") {
      setLocomotiveId(value);
      formDataRef.current.section_id = "";
      setSectionId("");
    } else if (field === "section_id") {
      setSectionId(value);
    } else if (field === "maintenance_type") {
      setMaintenanceType(value);
    } else if (field === "lubricant_type") {
      setLubricantType(value);
    }
  }, []);

  // Maintenance type options (labels from translations)
  const maintenanceTypeOptions = useMemo(
    () =>
      Object.keys(MAINTENANCE_TYPE_LABELS).map((value) => ({
        value,
        label: t(`maintenance_types.${value}`),
      })),
    [t]
  );

  // Lubricant type options (labels from translations)
  const lubricantTypeOptions = useMemo(
    () =>
      Object.keys(LUBRICANT_TYPE_LABELS).map((value) => ({
        value,
        label: t(`lubricant_types.${value}`),
      })),
    [t]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      const currentData = formDataRef.current;

      // Validation
      if (
        !currentData.locomotive_id ||
        !currentData.section_id ||
        !currentData.lubricant_type ||
        !currentData.maintenance_type ||
        !currentData.service_date ||
        !currentData.consumption
      ) {
        return;
      }

      // Build payload
      const payload: CreateLocomotiveReplacementOilPayload = {
        locomotive_id: Number(currentData.locomotive_id),
        section_id: Number(currentData.section_id),
        lubricant_type: currentData.lubricant_type as LubricantType,
        maintenance_type: currentData.maintenance_type as MaintenanceType,
        service_date: currentData.service_date,
        consumption: Number(currentData.consumption),
      };

      onSave(payload);
    },
    [onSave]
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#0F172B]">
            {mode === "edit" ? t("title_edit") : t("title_create")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6" key={formKeyRef.current}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="locomotive_id">
                {t("locomotive")} <span className="text-red-500">*</span>
              </Label>
              <Select
                value={locomotiveId || undefined}
                onValueChange={(value) => {
                  handleFieldChange("locomotive_id", value);
                  setLocomotiveSearchTerm("");
                }}
                disabled={isPending || loadingLocomotives || mode === "edit"}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("placeholder_locomotive")} />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2 border-b border-[#E5ECF8]">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7280]" />
                      <input
                        type="text"
                        placeholder={t("placeholder_search")}
                        value={locomotiveSearchTerm}
                        onChange={(e) => setLocomotiveSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                        onKeyUp={(e) => e.stopPropagation()}
                        className="w-full pl-8 pr-2 py-1.5 text-sm border border-[#d1d5db] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2354bf]/20"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {locomotiveId &&
                      !filteredLocomotiveOptions.some(
                        (opt) => opt.value === locomotiveId
                      ) && (
                        <SelectItem
                          key={locomotiveId}
                          value={locomotiveId}
                          className="hidden"
                        >
                          {replacement?.locomotive_name ||
                            `${t("locomotive")} #${locomotiveId}`}
                        </SelectItem>
                      )}
                    {filteredLocomotiveOptions.length > 0 ? (
                      filteredLocomotiveOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-[#6b7280] text-center">
                        {t("locomotive_not_found")}
                      </div>
                    )}
                  </div>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="section_id">
                {t("section")} <span className="text-red-500">*</span>
              </Label>
              <Select
                value={sectionId || undefined}
                onValueChange={(value) => handleFieldChange("section_id", value)}
                disabled={
                  isPending || !locomotiveId || mode === "edit"
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("placeholder_section")} />
                </SelectTrigger>
                <SelectContent>
                  {sectionOptions.length > 0 ? (
                    sectionOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-[#6b7280] text-center">
                      {t("section_not_found")}
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenance_type">
                {t("maintenance_type")} <span className="text-red-500">*</span>
              </Label>
              <Select
                value={maintenanceType || undefined}
                onValueChange={(value) =>
                  handleFieldChange("maintenance_type", value)
                }
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("placeholder_maintenance")} />
                </SelectTrigger>
                <SelectContent>
                  {maintenanceTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lubricant_type">
                {t("lubricant_type")} <span className="text-red-500">*</span>
              </Label>
              <Select
                value={lubricantType || undefined}
                onValueChange={(value) =>
                  handleFieldChange("lubricant_type", value)
                }
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("placeholder_lubricant")} />
                </SelectTrigger>
                <SelectContent>
                  {lubricantTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="service_date">
                {t("service_date")} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="service_date"
                type="date"
                defaultValue={formDataRef.current.service_date}
                onChange={(e) => handleFieldChange("service_date", e.target.value)}
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="consumption">
                {t("consumption")} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="consumption"
                type="number"
                defaultValue={formDataRef.current.consumption}
                onChange={(e) => handleFieldChange("consumption", e.target.value)}
                placeholder={t("placeholder_consumption")}
                required
                disabled={isPending}
                onWheel={(e) => e.currentTarget.blur()}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? t("saving")
                : mode === "edit"
                  ? t("save")
                  : t("add")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

