"use client";

import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
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
}

function isoToDate(iso: string | undefined): Date | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? undefined : d;
}

function dateToIso(date: Date): string {
  return date.toISOString();
}

export function BaselineModal({
  isOpen,
  onClose,
  locomotiveId,
  inspectionTypeId,
  locomotiveName,
  inspectionTypeName,
}: BaselineModalProps) {
  const t = useTranslations("BaselineModal");
  const [baselineDate, setBaselineDate] = useState<Date | undefined>(undefined);
  const [baselineKm, setBaselineKm] = useState<string>("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data, isLoading } = useLocomotiveMileageBaseline(
    { locomotive: locomotiveId, inspection_type: inspectionTypeId },
    { enabled: isOpen }
  );

  const existing = data?.results?.[0] ?? null;

  const createMutation = useCreateLocomotiveMileageBaseline();
  const updateMutation = useUpdateLocomotiveMileageBaseline();
  const deleteMutation = useDeleteLocomotiveMileageBaseline();

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  useEffect(() => {
    if (!isOpen) {
      setBaselineDate(undefined);
      setBaselineKm("");
      setConfirmDelete(false);
      return;
    }
    if (existing) {
      setBaselineDate(isoToDate(existing.baseline_date));
      setBaselineKm(String(existing.baseline_km));
    } else {
      setBaselineDate(undefined);
      setBaselineKm("");
    }
    setConfirmDelete(false);
  }, [isOpen, existing?.id]);

  function handleSave() {
    if (!baselineDate || baselineKm === "") return;
    const payload = {
      locomotive: locomotiveId,
      inspection_type: inspectionTypeId,
      baseline_date: dateToIso(baselineDate),
      baseline_km: Number(baselineKm),
    };
    if (existing) {
      updateMutation.mutate(
        { id: existing.id, payload },
        { onSuccess: onClose }
      );
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  }

  function handleDelete() {
    if (!existing) return;
    deleteMutation.mutate(existing.id, { onSuccess: onClose });
  }

  const canSave = !!baselineDate && baselineKm !== "" && !isNaN(Number(baselineKm));

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
                type="number"
                min={0}
                value={baselineKm}
                onChange={(e) => setBaselineKm(e.target.value)}
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
