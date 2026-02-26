"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/ui/card";
import { Label } from "@/ui/label";
import { Input } from "@/ui/input";
import { Button } from "@/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SearchableSelect,
} from "@/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { useGetLocomotives } from "@/api/hooks/use-locomotives";
import { INSPECTION_SECTION_OPTIONS } from "@/components/inspections/inspection-grouped-table";
import {
  ManeuverJournalEntry,
  ManeuverJournalCreateData,
  ManeuverJournalUpdateData,
} from "@/api/types/maneuver-journal";
import type { UserData } from "@/api/types/auth";

interface ManeuverJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    payload: ManeuverJournalCreateData | ManeuverJournalUpdateData,
  ) => void;
  entry?: ManeuverJournalEntry | null;
  mode: "create" | "edit";
  isPending: boolean;
  currentUser: UserData;
}

type LocomotiveOption = {
  id: number;
  label: string;
  value: string;
};

export function ManeuverJournalModal({
  isOpen,
  onClose,
  onSave,
  entry,
  mode,
  isPending,
  currentUser,
}: ManeuverJournalModalProps) {
  const t = useTranslations("ManeuverJournalModal");
  const formRef = useRef<HTMLFormElement>(null);

  const [locomotive, setLocomotive] = useState("");
  const [fromSection, setFromSection] = useState("");
  const [toSection, setToSection] = useState("");

  const { data: locomotivesData, isPending: isLoadingLocomotives } =
    useGetLocomotives(isOpen);

  const locomotiveOptions = useMemo<LocomotiveOption[]>(() => {
    if (!locomotivesData) return [];
    return locomotivesData.results.map((loc) => ({
      id: loc.id,
      label: `${loc.name} (${loc.model_name})`,
      value: loc.id.toString(),
    }));
  }, [locomotivesData]);

  useEffect(() => {
    if (!isOpen) return;
    if (entry && mode === "edit") {
      setLocomotive(entry.locomotive ? String(entry.locomotive) : "");
      setFromSection(entry.from_section ?? "");
      setToSection(entry.to_section ?? "");
    } else {
      setLocomotive("");
      setFromSection("");
      setToSection("");
    }
  }, [isOpen, entry, mode]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = formRef.current;
    if (!form || !locomotive || !fromSection || !toSection) return;

    const get = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement)?.value?.trim() ?? "";

    const payload = {
      locomotive: Number(locomotive),
      from_section: fromSection,
      to_section: toSection,
      station: get("station"),
      date: get("date"),
      author: currentUser.id,
      organization: currentUser?.branch?.organization?.id,
    };

    if (mode === "create") {
      onSave(payload as ManeuverJournalCreateData);
    } else {
      onSave(payload as ManeuverJournalUpdateData);
    }
  };

  const modalTitle = mode === "create" ? t("title_create") : t("title_edit");
  const submitLabel = mode === "create" ? t("submit_create") : t("submit_edit");

  const initialDate =
    entry && mode === "edit" && entry.date ? entry.date.slice(0, 10) : "";
  const initialStation = entry && mode === "edit" ? (entry.station ?? "") : "";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{modalTitle}</DialogTitle>
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

              <div>
                <Label htmlFor="locomotive">{t("fields.locomotive")}</Label>
                <SearchableSelect
                  name="locomotive"
                  value={locomotive}
                  onValueChange={setLocomotive}
                  options={locomotiveOptions}
                  placeholder={
                    isLoadingLocomotives
                      ? t("fields.locomotive_loading")
                      : t("fields.locomotive_placeholder")
                  }
                  searchable={true}
                  emptyMessage={t("fields.locomotive_empty")}
                  disabled={
                    isLoadingLocomotives || locomotiveOptions.length === 0
                  }
                />
              </div>

              <div>
                <Label htmlFor="station">{t("fields.station")}</Label>
                <Input
                  id="station"
                  name="station"
                  type="text"
                  defaultValue={initialStation}
                  placeholder={t("fields.station_placeholder")}
                  required
                />
              </div>

              <div></div>

              <div>
                <Label htmlFor="from_section">{t("fields.from_section")}</Label>
                <Select
                  value={fromSection}
                  onValueChange={setFromSection}
                  required
                >
                  <SelectTrigger id="from_section">
                    <SelectValue
                      placeholder={t("fields.from_section_placeholder")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {INSPECTION_SECTION_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="to_section">{t("fields.to_section")}</Label>
                <Select value={toSection} onValueChange={setToSection} required>
                  <SelectTrigger id="to_section">
                    <SelectValue
                      placeholder={t("fields.to_section_placeholder")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {INSPECTION_SECTION_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                {isPending ? t("pending") : submitLabel}
              </Button>
            </div>
          </form>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
