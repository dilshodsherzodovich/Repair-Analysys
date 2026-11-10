"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/ui/input";
import { Textarea } from "@/ui/textarea";
import { Button } from "@/ui/button";
import { SearchableSelect } from "@/ui/select";
import { useGetLocomotives } from "@/api/hooks/use-locomotives";
import {
  PantographJournalEntry,
  CreatePantographJournalPayload,
  UpdatePantographJournalPayload,
} from "@/api/types/pantograph";


import { Field, FieldGrid } from "@/ui/field";
import { Modal, ModalFooter } from "@/ui/modal";
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
    <Field label={label} htmlFor="locomotive">
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
    </Field>
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
    } else {
      setLocomotive("");
    }
  }, [isOpen, entry, mode]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = formRef.current;
    if (!form) return;
    const get = (name: string) =>
      (
        form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement
      )?.value?.trim() ?? "";
    const payload = {
      locomotive: Number(locomotive),
      department: get("department"),
      section: get("section"),
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
  const initialDepartment =
    entry && mode === "edit" ? (entry.department ?? "") : "";
  const initialSection = entry && mode === "edit" ? (entry.section ?? "") : "";

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => handleDialogOpenChange(false)}
      title={modalTitle}
      size="lg"
    >
        <form
            ref={formRef}
            key={isOpen ? (entry?.id ?? "new") : "closed"}
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <FieldGrid columns={2}>
              <Field label={t("fields.date")} htmlFor="date">
                <Input
                  id="date"
                  name="date"
                  type="date"
                  defaultValue={initialDate}
                  required
                />
              </Field>

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

              <Field label={t("fields.department")} htmlFor="department">
                <Input
                  id="department"
                  name="department"
                  type="text"
                  defaultValue={initialDepartment}
                  placeholder={t("fields.department_placeholder")}
                  required
                />
              </Field>

              <Field label={t("fields.section")} htmlFor="section">
                <Input
                  id="section"
                  name="section"
                  type="text"
                  defaultValue={initialSection}
                  placeholder={t("fields.section_placeholder")}
                  required
                />
              </Field>

              <Field label={t("fields.damage")} htmlFor="damage">
                <Input
                  id="damage"
                  name="damage"
                  type="number"
                  step="0.01"
                  defaultValue={initialDamage}
                  placeholder={t("fields.damage_placeholder")}
                  required
                />
              </Field>
            </FieldGrid>

            <Field label={t("fields.description")} htmlFor="description">
              <Textarea
                id="description"
                name="description"
                defaultValue={initialDescription}
                placeholder={t("fields.description_placeholder")}
                rows={4}
                required
              />
            </Field>

            <ModalFooter>
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
            </ModalFooter>
          </form>
    </Modal>
  );
}
