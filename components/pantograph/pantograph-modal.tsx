"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/ui/card";
import { Label } from "@/ui/label";
import { Input } from "@/ui/input";
import { Textarea } from "@/ui/textarea";
import { Button } from "@/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SearchableSelect,
} from "@/ui/select";
import { useGetLocomotives } from "@/api/hooks/use-locomotives";
import {
  PantographJournalEntry,
  CreatePantographJournalPayload,
  UpdatePantographJournalPayload,
} from "@/api/types/pantograph";
import { STATION_OPTIONS } from "@/api/types/delays";
import { responsibleOrganizations } from "@/data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/ui/dialog";

interface PantographModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    payload: CreatePantographJournalPayload | UpdatePantographJournalPayload,
  ) => void;
  entry?: PantographJournalEntry | null;
  mode: "create" | "edit";
  isPending: boolean;
}

type LocomotiveOption = {
  id: number;
  label: string;
  value: string;
};

function LocomotiveSelectInner({
  value,
  onChange,
  options,
  isLoading,
  label,
  placeholder,
  loadingText,
  emptyText,
}: {
  value: string;
  onChange: (value: string) => void;
  options: LocomotiveOption[];
  isLoading: boolean;
  label: string;
  placeholder: string;
  loadingText: string;
  emptyText: string;
}) {
  return (
    <div>
      <Label htmlFor="locomotive">{label}</Label>
      <SearchableSelect
        name="locomotive"
        value={value}
        onValueChange={onChange}
        options={options}
        placeholder={isLoading ? loadingText : placeholder}
        searchable={true}
        emptyMessage={emptyText}
        disabled={isLoading || options.length === 0}
      />
    </div>
  );
}

export function PantographModal({
  isOpen,
  onClose,
  onSave,
  entry,
  mode,
  isPending,
}: PantographModalProps) {
  const t = useTranslations("PantographModal");
  const formRef = useRef<HTMLFormElement>(null);
  const [locomotive, setLocomotive] = useState("");
  const [department, setDepartment] = useState("");
  const [section, setSection] = useState("");

  const { data: locomotivesData, isPending: isLoadingLocomotives } =
    useGetLocomotives(isOpen);

  const locomotiveOptions = useMemo<LocomotiveOption[]>(() => {
    if (!locomotivesData) return [];
    return locomotivesData.results.map((locomotive) => ({
      id: locomotive.id,
      label: `${locomotive.name} (${locomotive.model_name})`,
      value: locomotive.id.toString(),
    }));
  }, [locomotivesData]);

  // Sync form when opening for edit vs create
  useEffect(() => {
    if (!isOpen) return;
    if (entry && mode === "edit") {
      setLocomotive(entry.locomotive ? String(entry.locomotive) : "");
      setDepartment(entry.department ?? "");
      setSection(entry.section ?? "");
    } else {
      setLocomotive("");
      setDepartment("");
      setSection("");
    }
  }, [isOpen, entry, mode]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = formRef.current;
    if (!form) return;
    if (!department || !section) return;
    const get = (name: string) =>
      (
        form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement
      )?.value?.trim() ?? "";
    const payload = {
      locomotive: Number(locomotive),
      department,
      section,
      date: get("date"),
      damage: get("damage"),
      description: get("description"),
    };
    if (mode === "create") {
      onSave(payload as CreatePantographJournalPayload);
    } else {
      onSave(payload as UpdatePantographJournalPayload);
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  const handleCancel = () => onClose();

  const modalTitle = mode === "create" ? t("title_create") : t("title_edit");
  const submitLabel = mode === "create" ? t("submit_create") : t("submit_edit");
  const pendingLabel =
    mode === "create" ? t("pending_create") : t("pending_edit");

  // Initial values for uncontrolled inputs; form remounts when key changes so these apply on open
  const initialDate =
    entry && mode === "edit" && entry.date ? entry.date.slice(0, 10) : "";
  const initialDamage = entry && mode === "edit" ? (entry.damage ?? "") : "";
  const initialDescription =
    entry && mode === "edit" ? (entry.description ?? "") : "";

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-3xl" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{modalTitle}</DialogTitle>
          <DialogDescription className="sr-only">
            {modalTitle} {t("form_description")}
          </DialogDescription>
        </DialogHeader>
        <Card className="border-none p-0 mt-2">
          <form
            ref={formRef}
            key={isOpen ? (entry?.id ?? "new") : "closed"}
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">{t("fields.date")}</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  defaultValue={initialDate}
                  required
                />
              </div>

              <LocomotiveSelectInner
                value={locomotive}
                onChange={setLocomotive}
                options={locomotiveOptions}
                isLoading={isLoadingLocomotives}
                label={t("fields.locomotive")}
                placeholder={t("fields.locomotive_placeholder")}
                loadingText={t("fields.locomotive_loading")}
                emptyText={t("fields.locomotive_empty")}
              />

              <div>
                <Label htmlFor="department">{t("fields.department")}</Label>
                <Select
                  value={department}
                  onValueChange={setDepartment}
                  required
                >
                  <SelectTrigger id="department">
                    <SelectValue
                      placeholder={t("fields.department_placeholder")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {responsibleOrganizations.map((org) => (
                      <SelectItem key={org} value={org}>
                        {org}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="section">{t("fields.section")}</Label>
                <SearchableSelect
                  name="section"
                  value={section}
                  onValueChange={setSection}
                  placeholder={t("fields.section_placeholder")}
                  searchable={true}
                  options={STATION_OPTIONS}
                />
              </div>

              <div>
                <Label htmlFor="damage">{t("fields.damage")}</Label>
                <Input
                  id="damage"
                  name="damage"
                  type="number"
                  step="0.01"
                  defaultValue={initialDamage}
                  placeholder={t("fields.damage_placeholder")}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">{t("fields.description")}</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={initialDescription}
                placeholder={t("fields.description_placeholder")}
                rows={4}
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isPending}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? pendingLabel : submitLabel}
              </Button>
            </div>
          </form>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
