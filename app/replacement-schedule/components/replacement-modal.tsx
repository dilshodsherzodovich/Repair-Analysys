"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Button } from "@/ui/button";
import { useGetLocomotives } from "@/api/hooks/use-locomotives";
import { Search } from "lucide-react";
import {
  CreateLocomotiveReplacementOilPayload,
  UpdateLocomotiveReplacementOilPayload,
  LocomotiveReplacementOil,
  MaintenanceType,
  LubricantType,
  MAINTENANCE_TYPE_LABELS,
  LUBRICANT_TYPE_LABELS,
} from "@/api/types/locomotive-replacement-oil";

import { Field, FieldGrid } from "@/ui/field";
import { Modal, ModalFooter } from "@/ui/modal";
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "edit" ? t("title_edit") : t("title_create")}
      size="lg"
    >

        <form
          ref={formRef}
          key={formKey}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <FieldGrid columns={2}>
            <Field label={t("locomotive")} htmlFor="locomotive_id" required>
              <Select
                value={locomotiveId || undefined}
                onValueChange={handleLocomotiveChange}
                disabled={isPending || loadingLocomotives || mode === "edit"}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("placeholder_locomotive")} />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2 border-b border-border">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input variant="compact" className="pl-8"
                        type="text"
                        placeholder={t("placeholder_search")}
                        value={locomotiveSearchTerm}
                        onChange={(e) =>
                          setLocomotiveSearchTerm(e.target.value)
                        }
                        onKeyDown={(e) => e.stopPropagation()}
                        onKeyUp={(e) => e.stopPropagation()}
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
                      <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                        {t("locomotive_not_found")}
                      </div>
                    )}
                  </div>
                </SelectContent>
              </Select>
            </Field>

            <Field label={t("section")} htmlFor="section_id" required>
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
                    <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                      {t("section_not_found")}
                    </div>
                  )}
                </SelectContent>
              </Select>
            </Field>

            <Field label={t("maintenance_type")} htmlFor="maintenance_type" required>
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
            </Field>

            <Field label={t("lubricant_type")} htmlFor="lubricant_type">
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
            </Field>

            <Field label={t("service_date")} htmlFor="service_date" required>
              <Input
                id="service_date"
                name="service_date"
                type="date"
                defaultValue={initialServiceDate}
                required
                disabled={isPending}
              />
            </Field>

            <Field label={t("consumption")} htmlFor="consumption">
              <Input
                id="consumption"
                name="consumption"
                type="number"
                defaultValue={initialConsumption}
                placeholder={t("placeholder_consumption")}
                disabled={isPending}
                onWheel={(e) => e.currentTarget.blur()}
              />
            </Field>
          </FieldGrid>

          <ModalFooter>
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
          </ModalFooter>
        </form>
    </Modal>
  );
}
