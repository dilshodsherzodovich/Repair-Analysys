"use client";

import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { txk13ReportService } from "@/api/services/txk13-report.service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/ui/modal";
import { DatePicker } from "@/ui/date-picker";
import { Input } from "@/ui/input";
import { Button } from "@/ui/button";
import { Label } from "@/ui/label";
import {
  useLocomotiveMileageBaseline,
  useCreateLocomotiveMileageBaseline,
  useUpdateLocomotiveMileageBaseline,
  useDeleteLocomotiveMileageBaseline,
} from "@/api/hooks/use-locomotive-mileage-baselines";

interface BaselineModalProps {
  isOpen: boolean;
  onClose: () => void;
  locomotiveId: number;
  inspectionTypeId: number;
  locomotiveName: string;
  inspectionTypeName: string;
  currentActualDate?: string;
  onPendingChange?: (pending: boolean, key: string) => void;
}

function isoToDate(iso: string | undefined | null): Date | undefined {
  if (!iso) return undefined;
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return undefined;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function parseServerDate(s: string | undefined | null): Date | undefined {
  if (!s || s === "-") return undefined;
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3]);
  const display = s.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
  if (display) return new Date(+display[3], +display[2] - 1, +display[1]);
  return undefined;
}

function dateToIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}T00:00:00.000Z`;
}

function dateToIsoSimple(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function BaselineModal({
  isOpen,
  onClose,
  locomotiveId,
  inspectionTypeId,
  locomotiveName,
  inspectionTypeName,
  currentActualDate,
  onPendingChange,
}: BaselineModalProps) {
  const t = useTranslations("BaselineModal");
  const queryClient = useQueryClient();
  const [actualInspectionDate, setActualInspectionDate] = useState<Date | undefined>(undefined);
  const [lastInspectionDate, setLastInspectionDate] = useState<Date | undefined>(undefined);
  const [baselineDate, setBaselineDate] = useState<Date | undefined>(undefined);
  const [baselineKm, setBaselineKm] = useState<string>("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data, isLoading } = useLocomotiveMileageBaseline(locomotiveId, {
    enabled: isOpen,
  });

  const item = data?.find((d) => d.inspection_type_id === inspectionTypeId) ?? null;
  const existing = item?.baseline ?? null;

  const createMutation = useCreateLocomotiveMileageBaseline();
  const updateMutation = useUpdateLocomotiveMileageBaseline();
  const deleteMutation = useDeleteLocomotiveMileageBaseline();

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  useEffect(() => {
    if (!isOpen) {
      setActualInspectionDate(undefined);
      setLastInspectionDate(undefined);
      setBaselineDate(undefined);
      setBaselineKm("");
      setConfirmDelete(false);
      return;
    }
    setActualInspectionDate(parseServerDate(currentActualDate));
    setLastInspectionDate(isoToDate(item?.last_inspection_date));
    if (existing) {
      setBaselineDate(isoToDate(existing.baseline_date));
      setBaselineKm(String(existing.baseline_km));
    } else {
      setBaselineDate(undefined);
      setBaselineKm("");
    }
    setConfirmDelete(false);
  }, [isOpen, existing?.id, item?.last_inspection_date, currentActualDate]);

  function handleSave() {
    const key = `${locomotiveId}-${inspectionTypeId}`;

    if (actualInspectionDate) {
      const iso = dateToIsoSimple(actualInspectionDate);
      txk13ReportService
        .patchActualInspectionDate(locomotiveId, inspectionTypeId, iso)
        .then(() => queryClient.invalidateQueries({ queryKey: ["txk13-report"] }))
        .catch(() => {});
    }

    if (baselineDate && baselineKm !== "" && !isNaN(Number(baselineKm))) {
      const payload = {
        locomotive: locomotiveId,
        inspection_type: inspectionTypeId,
        last_inspection_date: lastInspectionDate ? dateToIso(lastInspectionDate) : null,
        baseline_date: dateToIso(baselineDate),
        baseline_km: Number(baselineKm),
      };
      onPendingChange?.(true, key);
      if (existing) {
        updateMutation.mutate({ id: existing.id, payload }, { onSettled: () => onPendingChange?.(false, key) });
      } else {
        createMutation.mutate(payload, { onSettled: () => onPendingChange?.(false, key) });
      }
    }

    onClose();
  }

  function handleDelete() {
    if (!existing) return;
    const key = `${locomotiveId}-${inspectionTypeId}`;
    onPendingChange?.(true, key);
    deleteMutation.mutate(existing.id, { onSettled: () => onPendingChange?.(false, key) });
    onClose();
  }

  const canSave =
    !!actualInspectionDate ||
    (!!baselineDate && baselineKm !== "" && !isNaN(Number(baselineKm)));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-[#0F172B]">
            {t("title", { locomotiveName, inspectionTypeName })}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-6 text-center text-sm text-[#64748B]">
            {t("loading")}
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <DatePicker
              label={t("actual_inspection_date_label")}
              value={actualInspectionDate}
              onValueChange={setActualInspectionDate}
              disabled={isPending}
              placeholder={t("actual_inspection_date_placeholder")}
              captionLayout="dropdown"
              fromYear={2000}
              toYear={new Date().getFullYear()}
            />

            <DatePicker
              label={t("last_inspection_date_label")}
              value={lastInspectionDate}
              onValueChange={setLastInspectionDate}
              disabled={isPending}
              placeholder={t("last_inspection_date_placeholder")}
              captionLayout="dropdown"
              fromYear={2000}
              toYear={new Date().getFullYear()}
            />

            <DatePicker
              label={t("date_label")}
              value={baselineDate}
              onValueChange={setBaselineDate}
              disabled={isPending}
              placeholder={t("date_placeholder")}
              captionLayout="dropdown"
              fromYear={2000}
              toYear={new Date().getFullYear()}
            />

            <div className="space-y-1.5">
              <Label htmlFor="baseline-km">{t("km_label")}</Label>
              <Input
                id="baseline-km"
                type="text"
                inputMode="numeric"
                value={baselineKm === "" ? "" : Number(baselineKm).toLocaleString("ru-RU")}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, "");
                  setBaselineKm(raw);
                }}
                disabled={isPending}
                placeholder={t("km_placeholder")}
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {existing && !confirmDelete && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={() => setConfirmDelete(true)}
              className="text-[#DC2626] hover:text-[#DC2626] hover:bg-red-50 mr-auto"
            >
              <Trash2 className="size-4" />
              {t("delete")}
            </Button>
          )}
          {existing && confirmDelete && (
            <div className="flex items-center gap-2 mr-auto">
              <span className="text-xs text-[#DC2626]">{t("confirm_delete")}</span>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={isPending}
                onClick={handleDelete}
              >
                {t("yes_delete")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isPending}
                onClick={() => setConfirmDelete(false)}
              >
                {t("cancel")}
              </Button>
            </div>
          )}

          {!confirmDelete && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isPending}
              >
                {t("cancel")}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={isPending || !canSave || isLoading}
              >
                {isPending ? t("saving") : existing ? t("update") : t("save")}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
