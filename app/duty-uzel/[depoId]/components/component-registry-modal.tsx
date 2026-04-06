"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { Label } from "@/ui/label";
import { Input } from "@/ui/input";
import { DatePicker } from "@/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SearchableSelect,
} from "@/ui/select";
import { Button } from "@/ui/button";
import {
  useGetLocomotives,
  useGetLocomotiveDetail,
} from "@/api/hooks/use-locomotives";
import { useInspectionTypes } from "@/api/hooks/use-inspection";
import { useComponents } from "@/api/hooks/use-component";
import {
  ComponentRegistryEntry,
  CreateComponentRegistryPayload,
} from "@/api/types/component-registry";
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
  editData?: ComponentRegistryEntry;
}

type SelectState = {
  locomotive_id: string;
  section_id: string;
  component_id: string;
  inspection_id: string;
};

const INITIAL_SELECT_STATE: SelectState = {
  locomotive_id: "",
  section_id: "",
  component_id: "",
  inspection_id: "",
};

function parseApiDate(dateStr: string | undefined): Date | undefined {
  if (!dateStr) return undefined;
  const d = new Date(dateStr + "T00:00:00");
  return isNaN(d.getTime()) ? undefined : d;
}

function getFormString(form: HTMLFormElement | null, name: string): string {
  const el = form?.elements.namedItem(name) as HTMLInputElement | null;
  return el?.value?.trim() ?? "";
}

export function ComponentRegistryModal({
  isOpen,
  onClose,
  onSave,
  organizationId,
  isPending,
  editData,
}: ComponentRegistryModalProps) {
  const t = useTranslations("ComponentRegistryModal");
  const formRef = useRef<HTMLFormElement>(null);
  const [selects, setSelects] = useState<SelectState>(INITIAL_SELECT_STATE);
  const [defectDate, setDefectDate] = useState<Date | undefined>(undefined);
  const [removedYear, setRemovedYear] = useState<string>("");
  const [installedYear, setInstalledYear] = useState<string>("");

  const { data: locomotivesData, isPending: loadingLocomotives } =
    useGetLocomotives(true, undefined, {
      no_page: true,
      organization: organizationId,
    });

  const { data: locomotiveDetail, isPending: loadingLocomotiveDetail } =
    useGetLocomotiveDetail(
      selects.locomotive_id ? Number(selects.locomotive_id) : undefined,
      isOpen && !!selects.locomotive_id,
    );

  const { data: inspectionTypesData, isPending: loadingInspectionTypes } =
    useInspectionTypes(isOpen);

  const { data: componentsData, isPending: loadingComponents } = useComponents(
    {
      locomotive: selects.locomotive_id
        ? Number(selects.locomotive_id)
        : undefined,
      section: selects.section_id ? Number(selects.section_id) : undefined,
      no_page: true,
    },
    isOpen && !!selects.locomotive_id && !!selects.section_id,
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

  // On open: set locomotive + inspection immediately; section/component cascade after their data loads
  useEffect(() => {
    if (!isOpen) return;
    if (editData) {
      setSelects({
        locomotive_id: editData.locomotive_id
          ? String(editData.locomotive_id)
          : "",
        section_id: "",
        component_id: "",
        inspection_id: editData.inspection_id
          ? String(editData.inspection_id)
          : "",
      });
      setDefectDate(parseApiDate(editData.defect_date));
      setRemovedYear(editData.removed_manufacture_year?.slice(0, 4) ?? "");
      setInstalledYear(editData.installed_manufacture_year?.slice(0, 4) ?? "");
    } else {
      setSelects(INITIAL_SELECT_STATE);
      setDefectDate(undefined);
      setRemovedYear("");
      setInstalledYear("");
    }
  }, [isOpen, editData]);

  // Once locomotiveDetail loads, set section_id (edit mode only)
  useEffect(() => {
    if (!isOpen || !editData?.section_id || !locomotiveDetail) return;
    setSelects((prev) => {
      if (prev.section_id) return prev; // user already changed it
      return { ...prev, section_id: String(editData.section_id!) };
    });
  }, [isOpen, editData?.section_id, locomotiveDetail]);

  // Once componentsData loads, set component_id (edit mode only)
  useEffect(() => {
    if (!isOpen || !editData?.component_id || !componentsData) return;
    setSelects((prev) => {
      if (prev.component_id) return prev; // user already changed it
      return { ...prev, component_id: String(editData.component_id!) };
    });
  }, [isOpen, editData?.component_id, componentsData]);

  const handleSelectChange = (field: keyof SelectState, value: string) => {
    setSelects((prev) => {
      if (field === "locomotive_id") {
        return {
          ...prev,
          locomotive_id: value,
          section_id: "",
          component_id: "",
        };
      }
      if (field === "section_id") {
        return { ...prev, section_id: value, component_id: "" };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (
      !selects.locomotive_id ||
      !selects.section_id ||
      !selects.component_id ||
      !selects.inspection_id
    ) {
      alert(t("validation_required"));
      return;
    }
    const form = formRef.current;
    const payload: CreateComponentRegistryPayload = {
      organization_id: organizationId,
      locomotive_id: Number(selects.locomotive_id),
      section_id: Number(selects.section_id),
      component_id: Number(selects.component_id),
      inspection_id: Number(selects.inspection_id),
      reason: getFormString(form, "reason"),
      defect_date: defectDate ? format(defectDate, "yyyy-MM-dd") : "",
      removed_manufacture_year: removedYear,
      installed_manufacture_year: installedYear,
      installed_manufacture_factory: getFormString(
        form,
        "installed_manufacture_factory",
      ),
      removed_manufacture_factory: getFormString(
        form,
        "removed_manufacture_factory",
      ),
    };
    onSave(payload);
  };

  const formKey = editData?.id ? `edit-${editData.id}` : "create";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:!max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editData ? t("title_edit") : t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <form
          ref={formRef}
          key={formKey}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="locomotive_id">
                {t("locomotive")} <span className="text-red-500 ml-1">*</span>
              </Label>
              <SearchableSelect
                value={selects.locomotive_id}
                onValueChange={(value: string) =>
                  handleSelectChange("locomotive_id", value)
                }
                options={locomotiveOptions ?? []}
                placeholder={
                  loadingLocomotives
                    ? t("placeholder_loading")
                    : t("placeholder_locomotive")
                }
                searchable
                searchPlaceholder={t("search_locomotive")}
                emptyMessage={t("no_results")}
                disabled={loadingLocomotives || isPending}
                triggerClassName="w-full mb-0"
              />
            </div>

            <div>
              <Label htmlFor="section_id">
                {t("section")} <span className="text-red-500 ml-1">*</span>
              </Label>
              <Select
                value={selects.section_id}
                onValueChange={(value) =>
                  handleSelectChange("section_id", value)
                }
                disabled={
                  !selects.locomotive_id || loadingLocomotiveDetail || isPending
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      !selects.locomotive_id
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
                    : selects.locomotive_id &&
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
                value={selects.component_id}
                onValueChange={(value) =>
                  handleSelectChange("component_id", value)
                }
                disabled={
                  !selects.locomotive_id ||
                  !selects.section_id ||
                  loadingComponents ||
                  isPending
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      !selects.locomotive_id
                        ? t("placeholder_locomotive_first")
                        : !selects.section_id
                          ? t("placeholder_section_first")
                          : loadingComponents
                            ? t("placeholder_loading")
                            : t("placeholder_uzel")
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {componentOptions.length === 0 &&
                  selects.locomotive_id &&
                  selects.section_id &&
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
                {t("inspection_type")}{" "}
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Select
                value={selects.inspection_id}
                onValueChange={(value) =>
                  handleSelectChange("inspection_id", value)
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

            <div>
              <Label htmlFor="reason">{t("reason")}</Label>
              <Input
                id="reason"
                name="reason"
                type="text"
                defaultValue={editData?.reason ?? ""}
                placeholder={t("placeholder_reason")}
                className="w-full"
              />
            </div>

            <div>
              <Label>{t("defect_date")}</Label>
              <DatePicker
                value={defectDate}
                onValueChange={setDefectDate}
                placeholder={t("placeholder_defect_date")}
                disabled={isPending}
                captionLayout="dropdown"
                fromYear={1990}
                toYear={new Date().getFullYear() + 1}
              />
            </div>

            <div>
              <Label>{t("removed_manufacture_year")}</Label>
              <Input
                type="number"
                min={1900}
                max={new Date().getFullYear() + 1}
                value={removedYear}
                onChange={(e) => setRemovedYear(e.target.value)}
                placeholder={t("placeholder_date_example")}
                disabled={isPending}
                className="w-full"
              />
            </div>

            <div>
              <Label htmlFor="removed_manufacture_factory">
                {t("removed_manufacture_factory")}
              </Label>
              <Input
                id="removed_manufacture_factory"
                name="removed_manufacture_factory"
                type="text"
                defaultValue={editData?.removed_manufacture_factory ?? ""}
                placeholder={t("placeholder_factory")}
                disabled={!selects.component_id}
                className="w-full"
              />
            </div>

            <div>
              <Label>{t("installed_manufacture_year")}</Label>
              <Input
                type="number"
                min={1900}
                max={new Date().getFullYear() + 1}
                value={installedYear}
                onChange={(e) => setInstalledYear(e.target.value)}
                placeholder={t("placeholder_date_example")}
                disabled={isPending}
                className="w-full"
              />
            </div>

            <div>
              <Label htmlFor="installed_manufacture_factory">
                {t("installed_manufacture_factory")}
              </Label>
              <Input
                id="installed_manufacture_factory"
                name="installed_manufacture_factory"
                type="text"
                defaultValue={editData?.installed_manufacture_factory ?? ""}
                placeholder={t("placeholder_factory")}
                disabled={!selects.component_id}
                className="w-full"
              />
            </div>
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
              {isPending ? t("saving") : editData ? t("update") : t("save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
