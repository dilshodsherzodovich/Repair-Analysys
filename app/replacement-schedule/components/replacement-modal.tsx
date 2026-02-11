"use client";

import { useState, useEffect, useRef } from "react";
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

function getFormString(form: HTMLFormElement | null, name: string): string {
  const el = form?.elements.namedItem(name) as HTMLInputElement | null;
  return el?.value?.trim() ?? "";
}

export function ReplacementModal({
  isOpen,
  onClose,
  onSave,
  isPending,
  replacement,
  mode = "create",
}: ReplacementModalProps) {
  const t = useTranslations("ReplacementModal");
  const formRef = useRef<HTMLFormElement>(null);

  const [locomotiveId, setLocomotiveId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [locomotiveSearchTerm, setLocomotiveSearchTerm] = useState("");
  const [maintenanceType, setMaintenanceType] = useState("");
  const [lubricantType, setLubricantType] = useState("");

  const { data: locomotivesData, isPending: loadingLocomotives } =
    useGetLocomotives(true, undefined, { no_page: true });

  const locomotiveOptions =
    locomotivesData?.results?.map((loc) => ({
      value: String(loc.id),
      label: `${loc.name} - ${loc.model_name || ""}`,
      sections: loc.sections || [],
    })) || [];

  const filteredLocomotiveOptions = locomotiveSearchTerm.trim()
    ? locomotiveOptions.filter((loc) =>
        loc.label.toLowerCase().includes(locomotiveSearchTerm.toLowerCase())
      )
    : locomotiveOptions;

  const selectedLocomotive = locomotiveOptions.find(
    (loc) => loc.value === locomotiveId
  );
  let sectionOptions =
    selectedLocomotive?.sections?.map((section) => ({
      value: String(section.id),
      label: section.name,
    })) || [];

  if (mode === "edit" && replacement && sectionId) {
    const hasSection = sectionOptions.some((s) => s.value === sectionId);
    if (!hasSection && replacement.section_name) {
      sectionOptions = [
        { value: sectionId, label: replacement.section_name },
        ...sectionOptions,
      ];
    }
  }

  const maintenanceTypeOptions = Object.keys(MAINTENANCE_TYPE_LABELS).map(
    (value) => ({
      value,
      label: t(`maintenance_types.${value}`),
    })
  );

  const lubricantTypeOptions = Object.keys(LUBRICANT_TYPE_LABELS).map(
    (value) => ({
      value,
      label: t(`lubricant_types.${value}`),
    })
  );

  useEffect(() => {
    if (!isOpen) {
      setLocomotiveSearchTerm("");
      setLocomotiveId("");
      setSectionId("");
      setMaintenanceType("");
      setLubricantType("");
      return;
    }
    if (mode === "edit" && replacement) {
      setLocomotiveId(
        replacement.locomotive_id != null
          ? String(replacement.locomotive_id)
          : ""
      );
      setSectionId(
        replacement.section_id != null ? String(replacement.section_id) : ""
      );
      setMaintenanceType(replacement.maintenance_type || "");
      setLubricantType(replacement.lubricant_type || "");
    } else {
      setLocomotiveId("");
      setSectionId("");
      setMaintenanceType("");
      setLubricantType("");
    }
  }, [isOpen, mode, replacement?.id]);

  const handleLocomotiveChange = (value: string) => {
    setLocomotiveId(value);
    setSectionId("");
    setLocomotiveSearchTerm("");
  };

  const handleSectionChange = (value: string) => {
    setSectionId(value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = formRef.current;
    const serviceDate = getFormString(form, "service_date");
    const consumption = getFormString(form, "consumption");

    if (
      !locomotiveId ||
      !sectionId ||
      !maintenanceType ||
      !serviceDate 
    ) {
      return;
    }

    const payload: CreateLocomotiveReplacementOilPayload = {
      locomotive_id: Number(locomotiveId),
      section_id: Number(sectionId),
      lubricant_type: lubricantType as LubricantType,
      maintenance_type: maintenanceType as MaintenanceType,
      service_date: serviceDate,
      consumption: Number(consumption),
    };

    onSave(payload);
  };

  const formKey = isOpen ? (mode === "edit" ? `edit-${replacement?.id}` : "create") : "closed";
  const initialServiceDate =
    mode === "edit" && replacement
      ? formatDateForInput(replacement.service_date)
      : "";
  const initialConsumption =
    mode === "edit" && replacement
      ? String(replacement.consumption ?? "")
      : "";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#0F172B]">
            {mode === "edit" ? t("title_edit") : t("title_create")}
          </DialogTitle>
        </DialogHeader>

        <form
          ref={formRef}
          key={formKey}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="locomotive_id">
                {t("locomotive")} <span className="text-red-500">*</span>
              </Label>
              <Select
                value={locomotiveId || undefined}
                onValueChange={handleLocomotiveChange}
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
                        onChange={(e) =>
                          setLocomotiveSearchTerm(e.target.value)
                        }
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
                onValueChange={handleSectionChange}
                disabled={isPending || !locomotiveId || mode === "edit"}
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
                onValueChange={setMaintenanceType}
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
                {t("lubricant_type")}
              </Label>
              <Select
                value={lubricantType || undefined}
                onValueChange={setLubricantType}
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
                name="service_date"
                type="date"
                defaultValue={initialServiceDate}
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="consumption">
                {t("consumption")}
              </Label>
              <Input
                id="consumption"
                name="consumption"
                type="number"
                defaultValue={initialConsumption}
                placeholder={t("placeholder_consumption")}
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
