"use client";

import { useRef, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { SearchableSelect } from "@/ui/select";
import { FilterBar, FilterField, FilterReset, SearchInput } from "@/ui/filter-bar";
import { PermissionGuard } from "@/components/permission-guard";
import type { Permission } from "@/lib/permissions";
import { useFilterParams } from "@/lib/hooks/useFilterParams";
import { Label } from "@/ui/label";
import { SegmentedTabs } from "@/ui/segmented-tabs";
import { Checkbox } from "@/ui/checkbox";

const SERVICE_TYPE_OPTIONS = [
  { value: "", label: "Barchasi" },
  { value: "passenger", label: "Yo'lovchi" },
  { value: "freight", label: "Yuk tashuvchi" },
  { value: "mixed", label: "Yuk yo'lovchi" },
  { value: "intercity", label: "Shaharlararo" },
  { value: "afrosiyob", label: "Afrosiyob" },
  { value: "switcher", label: "Manyovr" },
  { value: "pusher", label: "Itaruvchi" },
  { value: "lead", label: "Tortuvchi" },
  { value: "carriage", label: "Vagon" },
];

const LOCOMOTIVE_TYPE_OPTIONS = [
  { value: "", label: "Barchasi" },
  { value: "electric_loco", label: "Elektrovoz" },
  { value: "diesel_loco", label: "Teplavoz" },
  { value: "electric_train", label: "Elektropoezd" },
  { value: "high_speed", label: "Tezyurar" },
  { value: "carriage", label: "Vagon" },
];

interface Txk13FiltersProps {
  organizations: { id: number; name: string }[];
  isLoadingOrganizations: boolean;
  locomotiveModels: { id: number; name: string }[];
  inspectionTypes: { type_id: number; type: string }[];
  selectedInspectionIds: number[];
  onToggleInspection: (typeId: number) => void;
  activeUnit: "all" | "km" | "hours";
  onUnitChange: (unit: "all" | "km" | "hours") => void;
}

export function Txk13Filters({
  organizations,
  isLoadingOrganizations,
  locomotiveModels,
  inspectionTypes,
  selectedInspectionIds,
  onToggleInspection,
  activeUnit,
  onUnitChange,
}: Txk13FiltersProps) {
  const t = useTranslations("LocomotiveMileageReportPage");
  const tc = useTranslations("Common");
  const { updateQuery, getQueryValue } = useFilterParams();
  const searchParams = useSearchParams();

  const organizationParam = getQueryValue("organization") ?? "";
  const serviceTypeParam = getQueryValue("service_type") ?? "";
  const locomotiveTypeParam = getQueryValue("locomotive_type") ?? "";
  const locomotiveModelParam = getQueryValue("locomotive_model") ?? "";

  const [searchLocal, setSearchLocal] = useState(getQueryValue("search") ?? "");
  useEffect(() => {
    setSearchLocal(getQueryValue("search") ?? "");
  }, [searchParams]);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = (val: string) => {
    setSearchLocal(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => updateQuery({ search: val }), 400);
  };

  const hasActiveFilters = !!(
    serviceTypeParam ||
    locomotiveTypeParam ||
    locomotiveModelParam ||
    searchLocal
  );

  const resetFilters = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSearchLocal("");
    updateQuery({
      service_type: "",
      locomotive_type: "",
      locomotive_model: "",
      search: "",
    });
  };

  return (
    <div className="space-y-3">
      <FilterBar>
        <FilterField label="Lokomotiv raqami">
          <SearchInput
            value={searchLocal}
            onChange={handleSearchChange}
            placeholder="Raqamni kiriting"
          />
        </FilterField>

        <PermissionGuard
          permission={"choose_inspection_organization" as Permission}
        >
          <FilterField label={tc("organization")} width="lg">
            <SearchableSelect
              size="md"
              searchable
              loading={isLoadingOrganizations}
              value={organizationParam}
              onValueChange={(v) => updateQuery({ organization: v })}
              options={organizations.map((o) => ({
                value: String(o.id),
                label: o.name,
              }))}
              placeholder={t("choose_organization")}
            />
          </FilterField>
        </PermissionGuard>

        <FilterField label="Xizmat turi">
          <SearchableSelect
            size="md"
            searchable
            value={serviceTypeParam}
            onValueChange={(v) => updateQuery({ service_type: v })}
            options={SERVICE_TYPE_OPTIONS}
            placeholder={tc("all")}
          />
        </FilterField>

        <FilterField label="Lokomotiv turi">
          <SearchableSelect
            size="md"
            searchable
            value={locomotiveTypeParam}
            onValueChange={(v) => updateQuery({ locomotive_type: v })}
            options={LOCOMOTIVE_TYPE_OPTIONS}
            placeholder={tc("all")}
          />
        </FilterField>

        <FilterField label="Model">
          <SearchableSelect
            size="md"
            searchable
            value={locomotiveModelParam}
            onValueChange={(v) => updateQuery({ locomotive_model: v })}
            options={[
              { value: "", label: tc("all") },
              ...locomotiveModels.map((m) => ({
                value: String(m.id),
                label: m.name,
              })),
            ]}
            placeholder={tc("all")}
          />
        </FilterField>

        <FilterReset active={hasActiveFilters} onReset={resetFilters} />
      </FilterBar>

      <FilterBar>
        <FilterField label="O'lchov birligi" width="auto">
          <SegmentedTabs
            size="sm"
            value={activeUnit}
            onValueChange={(v) => onUnitChange(v as typeof activeUnit)}
            options={[
              { value: "all", label: tc("all") },
              { value: "km", label: "Km" },
              { value: "hours", label: "Soat" },
            ]}
          />
        </FilterField>

        {inspectionTypes.length > 0 && (
          <FilterField label="Ko'rik turlari" width="auto">
            <div className="flex h-9 flex-wrap items-center gap-x-4 gap-y-1">
              {inspectionTypes.map((insp) => (
                <Label
                  key={insp.type_id}
                  className="flex cursor-pointer items-center gap-1.5 text-foreground"
                >
                  <Checkbox
                    checked={selectedInspectionIds.includes(insp.type_id)}
                    onCheckedChange={() => onToggleInspection(insp.type_id)}
                  />
                  {insp.type}
                </Label>
              ))}
            </div>
          </FilterField>
        )}
      </FilterBar>
    </div>
  );
}
