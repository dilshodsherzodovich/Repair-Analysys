"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/ui/tabs";
import { Boxes, Cog } from "lucide-react";
import { SectionCard, EmptyBlock } from "./passport-shared";
import type { ComponentValue } from "@/api/types/component";
import type { ReactNode } from "react";

type FormValues = Record<
  number,
  { factory_number: string; date_info: string }
>;

/** A single labelled value that reads cleanly in view mode and becomes an
 *  editable input in edit mode — readonly instead of the greyed-out disabled. */
function ComponentField({
  label,
  value,
  onChange,
  editable,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  editable: boolean;
  placeholder: string;
}) {
  return (
    <div className="min-w-0">
      <label className="mb-0.5 block text-[11px] font-medium text-muted-foreground">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={!editable}
        placeholder={placeholder}
        className={cn(
          "h-8 w-full rounded-md px-2.5 text-sm outline-none transition-colors",
          editable
            ? "border border-gray-300 bg-white text-[#0F172B] hover:border-gray-400 focus:border-[#2354BF]"
            : "cursor-default border border-gray-200 bg-gray-50 font-medium text-[#0F172B] placeholder:font-normal"
        )}
      />
    </div>
  );
}

function ComponentTile({
  component,
  values,
  onFieldChange,
  editable,
}: {
  component: ComponentValue;
  values: { factory_number: string; date_info: string };
  onFieldChange: (
    field: "factory_number" | "date_info",
    value: string
  ) => void;
  editable: boolean;
}) {
  const t = useTranslations("locomotivePassport.components");
  return (
    <div className="rounded-lg border bg-card p-3 transition-colors hover:border-[#2354BF]/40">
      <div className="mb-2 flex items-center gap-1.5">
        <Cog className="h-3.5 w-3.5 shrink-0 text-[#2354BF]" />
        <h3 className="truncate text-xs font-semibold text-[#0F172B]">
          {component.component}
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <ComponentField
          label={t("factoryNumber")}
          value={values.factory_number}
          onChange={(v) => onFieldChange("factory_number", v)}
          editable={editable}
          placeholder={editable ? t("numberPlaceholder") : "—"}
        />
        <ComponentField
          label={t("manufactureYear")}
          value={values.date_info}
          onChange={(v) => onFieldChange("date_info", v)}
          editable={editable}
          placeholder={editable ? t("yearPlaceholder") : "—"}
        />
      </div>
    </div>
  );
}

export function PassportComponents({
  sections,
  activeSectionId,
  onSectionChange,
  components,
  formValues,
  onFieldChange,
  isEditing,
  canEdit,
  isFetching,
  actions,
}: {
  sections: { id: number; name: string }[];
  activeSectionId: number | null;
  onSectionChange: (id: number) => void;
  components: ComponentValue[];
  formValues: FormValues;
  onFieldChange: (
    componentId: number,
    field: "factory_number" | "date_info",
    value: string
  ) => void;
  isEditing: boolean;
  canEdit: boolean;
  isFetching: boolean;
  actions?: ReactNode;
}) {
  const t = useTranslations("locomotivePassport.components");
  const editable = isEditing && canEdit;

  return (
    <SectionCard
      title={t("title")}
      description={t("description")}
      icon={Boxes}
      loading={isFetching}
      action={actions}
    >
      {sections.length > 0 && (
        <Tabs
          value={activeSectionId?.toString() ?? ""}
          onValueChange={(value) => onSectionChange(Number(value))}
        >
          <TabsList className="inline-flex w-fit gap-1 rounded-lg border-0 bg-[#F1F5F9] p-1">
            {sections.map((section) => (
              <TabsTrigger
                key={section.id}
                value={section.id.toString()}
                className="px-6"
              >
                {section.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {activeSectionId === null ? (
        <EmptyBlock icon={Boxes} message={t("selectSection")} />
      ) : !components.length && !isFetching ? (
        <EmptyBlock icon={Boxes} message={t("empty")} />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {components.map((component) => {
            const values = formValues[component.id] ?? {
              factory_number: component.factory_number ?? "",
              date_info: component.date_info ?? "",
            };
            return (
              <ComponentTile
                key={component.id}
                component={component}
                values={values}
                editable={editable}
                onFieldChange={(field, value) =>
                  onFieldChange(component.id, field, value)
                }
              />
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
