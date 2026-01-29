"use client";

import { useState, useEffect, useCallback, useMemo, memo, useRef } from "react";
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
import { DatePicker } from "@/ui/date-picker";
import {
  CreateLocomotivePassportInspectionPayload,
  UpdateLocomotivePassportInspectionPayload,
  LocomotivePassportInspection,
} from "@/api/types/locomotive-passport-inspections";

interface PassportInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    payload:
      | CreateLocomotivePassportInspectionPayload
      | UpdateLocomotivePassportInspectionPayload
  ) => void;
  isPending: boolean;
  inspection?: LocomotivePassportInspection | null;
  mode?: "create" | "edit";
}

type FormData = {
  locomotive_id: string;
  section_id: string;
  buksa_bearing_date: Date | undefined;
  ted_bearing_date: Date | undefined;
  compressor_oil_date: Date | undefined;
  air_filter_date: Date | undefined;
  oil_filter_date: Date | undefined;
  lubrication_date: Date | undefined;
  kozh_oil_date: Date | undefined;
  brake_rti_date: Date | undefined;
};

const INITIAL_FORM_DATA: FormData = {
  locomotive_id: "",
  section_id: "",
  buksa_bearing_date: undefined,
  ted_bearing_date: undefined,
  compressor_oil_date: undefined,
  air_filter_date: undefined,
  oil_filter_date: undefined,
  lubrication_date: undefined,
  kozh_oil_date: undefined,
  brake_rti_date: undefined,
};

// Helper to convert string to Date object
const stringToDate = (dateString: string | null | undefined): Date | undefined => {
  if (!dateString) return undefined;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return undefined;
    return date;
  } catch {
    return undefined;
  }
};

// Memoized inspection field component with DatePicker
const InspectionField = memo(
  ({
    label,
    dateField,
    dateValue,
    onDateChange,
    disabled,
    placeholder,
  }: {
    label: string;
    dateField: keyof FormData;
    dateValue: Date | undefined;
    onDateChange: (value: Date | undefined) => void;
    disabled: boolean;
    placeholder?: string;
  }) => {
    return (
      <div className="space-y-1.5">
        <DatePicker
          label={label}
          value={dateValue}
          onValueChange={onDateChange}
          disabled={disabled}
          placeholder={placeholder}
          size="sm"
        />
      </div>
    );
  }
);
InspectionField.displayName = "InspectionField";

export function PassportInspectionModal({
  isOpen,
  onClose,
  onSave,
  isPending,
  inspection,
  mode = "create",
}: PassportInspectionModalProps) {
  const t = useTranslations("PassportInspectionModal");
  // Use refs for form data to avoid re-renders on every change
  const formDataRef = useRef<FormData>(INITIAL_FORM_DATA);
  const formKeyRef = useRef(0); // Key to force re-render of uncontrolled inputs

  // Only use state for fields that need to trigger UI updates
  const [locomotiveId, setLocomotiveId] = useState<string>("");
  const [sectionId, setSectionId] = useState<string>("");
  const [locomotiveSearchTerm, setLocomotiveSearchTerm] = useState("");

  // State for date fields to ensure DatePicker updates properly
  const [dateFields, setDateFields] = useState<{
    buksa_bearing_date?: Date;
    ted_bearing_date?: Date;
    compressor_oil_date?: Date;
    air_filter_date?: Date;
    oil_filter_date?: Date;
    lubrication_date?: Date;
    kozh_oil_date?: Date;
    brake_rti_date?: Date;
  }>({});

  const { data: locomotivesData, isPending: loadingLocomotives } =
    useGetLocomotives(
      true
    );

  // Simple locomotive options - no heavy memoization
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
    if (selectedLoc && !filteredLocomotiveOptions.some((loc) => loc.value === selectedLoc.value)) {
      filteredLocomotiveOptions = [selectedLoc, ...filteredLocomotiveOptions];
    }
  }

  // Get sections from selected locomotive - simple and direct
  const selectedLocomotive = locomotiveOptions.find(
    (loc) => loc.value === locomotiveId
  );
  let sectionOptions = selectedLocomotive?.sections?.map((section) => ({
    value: String(section.id),
    label: section.name,
  })) || [];

  // In edit mode, ensure current section is in options
  if (mode === "edit" && inspection && sectionId) {
    const hasSection = sectionOptions.some((s) => s.value === sectionId);
    if (!hasSection && inspection.section_name) {
      sectionOptions = [
        { value: sectionId, label: inspection.section_name },
        ...sectionOptions,
      ];
    }
  }

  // Initialize form data - simple and direct
  useEffect(() => {
    if (!isOpen) {
      setLocomotiveSearchTerm("");
      formDataRef.current = INITIAL_FORM_DATA;
      setLocomotiveId("");
      setSectionId("");
      return;
    }

    if (mode === "edit" && inspection) {
      const initialData: FormData = {
        locomotive_id: String(inspection.locomotive_id),
        section_id: String(inspection.section_id),
        buksa_bearing_date: stringToDate(inspection.buksa_bearing_date),
        ted_bearing_date: stringToDate(inspection.ted_bearing_date),
        compressor_oil_date: stringToDate(inspection.compressor_oil_date),
        air_filter_date: stringToDate(inspection.air_filter_date),
        oil_filter_date: stringToDate(inspection.oil_filter_date),
        lubrication_date: stringToDate(inspection.lubrication_date),
        kozh_oil_date: stringToDate(inspection.kozh_oil_date),
        brake_rti_date: stringToDate(inspection.brake_rti_date),
      };
      formDataRef.current = initialData;
      setLocomotiveId(initialData.locomotive_id);
      setSectionId(initialData.section_id);
      // Set date fields state for DatePicker
      setDateFields({
        buksa_bearing_date: initialData.buksa_bearing_date,
        ted_bearing_date: initialData.ted_bearing_date,
        compressor_oil_date: initialData.compressor_oil_date,
        air_filter_date: initialData.air_filter_date,
        oil_filter_date: initialData.oil_filter_date,
        lubrication_date: initialData.lubrication_date,
        kozh_oil_date: initialData.kozh_oil_date,
        brake_rti_date: initialData.brake_rti_date,
      });
      formKeyRef.current += 1; // Force re-render of uncontrolled inputs
    } else {
      formDataRef.current = INITIAL_FORM_DATA;
      setLocomotiveId("");
      setSectionId("");
      setDateFields({});
      formKeyRef.current += 1; // Force re-render of uncontrolled inputs
    }
  }, [isOpen, mode, inspection?.id]);

  // Fast field change handler - updates refs immediately, state only when needed
  const handleFieldChange = (field: keyof FormData, value: string | Date | undefined) => {
    // Update ref immediately (no re-render)
    (formDataRef.current[field] as any) = value;

    // Only update state for fields that affect UI
    if (field === "locomotive_id") {
      setLocomotiveId(value as string);
      formDataRef.current.section_id = "";
      setSectionId("");
    } else if (field === "section_id") {
      setSectionId(value as string);
    } else if (field.endsWith("_date")) {
      // Update date fields state for DatePicker
      setDateFields((prev) => ({
        ...prev,
        [field]: value as Date | undefined,
      }));
    }
  };

  // Static inspection fields - labels from translations
  const inspectionFields = useMemo(
    () => [
      { labelKey: "buksa_bearing", dateField: "buksa_bearing_date" as keyof FormData },
      { labelKey: "ted_bearing", dateField: "ted_bearing_date" as keyof FormData },
      { labelKey: "compressor_oil", dateField: "compressor_oil_date" as keyof FormData },
      { labelKey: "air_filter", dateField: "air_filter_date" as keyof FormData },
      { labelKey: "oil_filter", dateField: "oil_filter_date" as keyof FormData },
      { labelKey: "lubrication", dateField: "lubrication_date" as keyof FormData },
      { labelKey: "kozh_oil", dateField: "kozh_oil_date" as keyof FormData },
      { labelKey: "brake_rti", dateField: "brake_rti_date" as keyof FormData },
    ],
    []
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // Read from ref (always has latest values)
      const currentData = formDataRef.current;

      // Validation
      if (!currentData.locomotive_id || !currentData.section_id) {
        return;
      }

      // Build payload from ref - KM fields are handled by external API, set to null
      // Convert Date to YYYY-MM-DD format for API
      const dateToYYYYMMDD = (date: Date | undefined): string | null => {
        if (!date) return null;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const payload: CreateLocomotivePassportInspectionPayload = {
        locomotive_id: Number(currentData.locomotive_id),
        section_id: Number(currentData.section_id),
        run_km: 0, // Will be handled by external API
        buksa_bearing_date: dateToYYYYMMDD(currentData.buksa_bearing_date),
        buksa_bearing_km: null,
        ted_bearing_date: dateToYYYYMMDD(currentData.ted_bearing_date),
        ted_bearing_km: null,
        compressor_oil_date: dateToYYYYMMDD(currentData.compressor_oil_date),
        compressor_oil_km: null,
        air_filter_date: dateToYYYYMMDD(currentData.air_filter_date),
        air_filter_km: null,
        oil_filter_date: dateToYYYYMMDD(currentData.oil_filter_date),
        oil_filter_km: null,
        lubrication_date: dateToYYYYMMDD(currentData.lubrication_date),
        lubrication_km: null,
        kozh_oil_date: dateToYYYYMMDD(currentData.kozh_oil_date),
        kozh_oil_km: null,
        brake_rti_date: dateToYYYYMMDD(currentData.brake_rti_date),
        brake_rti_km: null,
      };

      onSave(payload);
    },
    [onSave]
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#0F172B]">
            {mode === "edit" ? t("title_edit") : t("title_create")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                      />
                    </div>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {/* Ensure selected locomotive is always in options (for edit mode) */}
                    {locomotiveId &&
                      !filteredLocomotiveOptions.some(
                        (opt) => opt.value === locomotiveId
                      ) && (
                        <SelectItem
                          key={locomotiveId}
                          value={locomotiveId}
                          className="hidden"
                        >
                          {inspection?.locomotive_name || `${t("locomotive")} #${locomotiveId}`}
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
                  isPending ||
                  !locomotiveId ||
                  mode === "edit"
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
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#0F172B] border-b pb-2">
              {t("inspection_data_heading")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3" key={formKeyRef.current}>
              {inspectionFields.map((field) => (
                <InspectionField
                  key={field.dateField}
                  label={t(field.labelKey)}
                  dateField={field.dateField}
                  dateValue={dateFields[field.dateField as keyof typeof dateFields]}
                  onDateChange={(value) => handleFieldChange(field.dateField, value)}
                  disabled={isPending}
                  placeholder={t("placeholder_date")}
                />
              ))}
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

