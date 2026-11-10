"use client";

import { useRef, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { SelectWithSearch } from "@/ui/filters";
import { PermissionGuard } from "@/components/permission-guard";
import type { Permission } from "@/lib/permissions";
import { useFilterParams } from "@/lib/hooks/useFilterParams";
import { Label } from "@/ui/label";
import { Button } from "@/ui/button";
import { SegmentedTabs } from "@/ui/segmented-tabs";
import { Checkbox } from "@/ui/checkbox";
import { Input } from "@/ui/input";

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

  return (
    <div className="space-y-3 mb-4">
      {/* Row 1: full-width selects + search + clear */}
      <div className="flex items-center gap-3 w-full">
        <Input variant="compact" className="h-10 flex-1"
          type="number"
          value={searchLocal}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Lokomotiv raqami"
        />

        <PermissionGuard
          permission={"choose_inspection_organization" as Permission}
        >
          <div className="flex-1 min-w-0">
            <SelectWithSearch
              value={organizationParam}
              onValueChange={(v) => updateQuery({ organization: v })}
              options={[
                ...organizations.map((o) => ({
                  value: String(o.id),
                  label: o.name,
                })),
              ]}
              placeholder={t("choose_organization")}
              loading={isLoadingOrganizations}
              triggerClassName="h-10 mb-0"
            />
          </div>
        </PermissionGuard>

        <div className="flex-1 min-w-0">
          <SelectWithSearch
            value={serviceTypeParam}
            onValueChange={(v) => updateQuery({ service_type: v })}
            options={SERVICE_TYPE_OPTIONS}
            placeholder="Barcha xizmat turlari"
            triggerClassName="h-10 mb-0"
          />
        </div>

        <div className="flex-1 min-w-0">
          <SelectWithSearch
            value={locomotiveTypeParam}
            onValueChange={(v) => updateQuery({ locomotive_type: v })}
            options={LOCOMOTIVE_TYPE_OPTIONS}
            placeholder="Barcha lokomotiv turlari"
            triggerClassName="h-10 mb-0"
          />
        </div>

        <div className="flex-1 min-w-0">
          <SelectWithSearch
            value={locomotiveModelParam}
            onValueChange={(v) => updateQuery({ locomotive_model: v })}
            options={[
              { value: "", label: "Barchasi" },
              ...locomotiveModels.map((m) => ({
                value: String(m.id),
                label: m.name,
              })),
            ]}
            placeholder="Barcha modellar"
            triggerClassName="h-10 mb-0"
          />
        </div>

        {hasActiveFilters && (
          <Button variant="outline-destructive" className="h-10"
            type="button"
            onClick={() => {
              updateQuery({
                service_type: "",
                locomotive_type: "",
                locomotive_model: "",
                search: "",
              });
              setSearchLocal("");
            }}
          >
            Filtrlarni tozalash
          </Button>
        )}
      </div>

      {/* Row 2: unit tabs + inspection checkboxes */}
      <div className="flex flex-wrap items-center gap-3">
        <SegmentedTabs
          size="sm"
          value={activeUnit}
          onValueChange={(v) => onUnitChange(v as typeof activeUnit)}
          options={[
            { value: "all", label: "Barchasi" },
            { value: "km", label: "Km" },
            { value: "hours", label: "Soat" },
          ]}
        />

        {inspectionTypes.length > 0 && (
          <div className="h-8 w-px bg-border shrink-0" />
        )}

        {inspectionTypes.map((insp) => (
          <Label
            key={insp.type_id}
            className="flex items-center gap-1.5 cursor-pointer select-none"
          >
            <Checkbox
              checked={selectedInspectionIds.includes(insp.type_id)}
              onCheckedChange={() => onToggleInspection(insp.type_id)}
            />
            <span className="text-sm text-foreground whitespace-nowrap font-medium">
              {insp.type}
            </span>
          </Label>
        ))}
      </div>
    </div>
  );
}
