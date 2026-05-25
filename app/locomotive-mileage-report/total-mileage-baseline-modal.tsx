"use client";

import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
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
  useTotalMileageBaseline,
  useCreateTotalMileageBaseline,
  useUpdateTotalMileageBaseline,
  useDeleteTotalMileageBaseline,
} from "@/api/hooks/use-locomotive-total-mileage-baselines";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  locomotiveId: number;
  locomotiveName: string;
}

function isoToDate(iso: string | undefined | null): Date | undefined {
  if (!iso) return undefined;
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return undefined;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function dateToIso(date: Date): string {
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${mo}-${d}`;
}

function formatDateTime(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function TotalMileageBaselineModal({ isOpen, onClose, locomotiveId, locomotiveName }: Props) {
  const [baselineDate, setBaselineDate] = useState<Date | undefined>(undefined);
  const [baselineKm, setBaselineKm] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data, isLoading } = useTotalMileageBaseline(locomotiveId, { enabled: isOpen });
  const existing = data?.baseline ?? null;

  const createMutation = useCreateTotalMileageBaseline();
  const updateMutation = useUpdateTotalMileageBaseline();
  const deleteMutation = useDeleteTotalMileageBaseline();
  const isPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

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
    const iso = dateToIso(baselineDate);
    const km = Number(baselineKm);
    if (existing) {
      updateMutation.mutate({ id: existing.id, payload: { baseline_date: iso, baseline_km: km } });
    } else {
      createMutation.mutate({ locomotive: locomotiveId, baseline_date: iso, baseline_km: km });
    }
    onClose();
  }

  function handleDelete() {
    if (!existing) return;
    deleteMutation.mutate(existing.id);
    onClose();
  }

  const canSave = !!baselineDate && baselineKm !== "" && !isNaN(Number(baselineKm));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-[#0F172B]">
            Umumiy yurish bazasi — {locomotiveName}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-6 text-center text-sm text-[#64748B]">Yuklanmoqda...</div>
        ) : (
          <div className="space-y-4 py-2">
            {existing && (
              <div className="rounded-md bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-2 space-y-1 text-xs text-[#475569]">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Oxirgi yangilashdagi probegi</span>
                  <span className="font-medium text-[#0F172B]">
                    {existing.last_mileage.toLocaleString("en-US")} km
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Yangilangan</span>
                  <span>{formatDateTime(existing.last_updated_at)}</span>
                </div>
              </div>
            )}

            <DatePicker
              label="Baza sanasi"
              value={baselineDate}
              onValueChange={setBaselineDate}
              disabled={isPending}
              placeholder="Sanani tanlang"
              captionLayout="dropdown"
              fromYear={2000}
              toYear={new Date().getFullYear()}
            />

            <div className="space-y-1.5">
              <Label htmlFor="total-baseline-km">Baza km</Label>
              <Input
                id="total-baseline-km"
                type="text"
                inputMode="numeric"
                value={baselineKm === "" ? "" : Number(baselineKm).toLocaleString("ru-RU")}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, "");
                  setBaselineKm(raw);
                }}
                disabled={isPending}
                placeholder="Masalan: 450000"
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
              O&apos;chirish
            </Button>
          )}
          {existing && confirmDelete && (
            <div className="flex items-center gap-2 mr-auto">
              <span className="text-xs text-[#DC2626]">Ishonchingiz komilmi?</span>
              <Button type="button" variant="destructive" size="sm" disabled={isPending} onClick={handleDelete}>
                Ha
              </Button>
              <Button type="button" variant="ghost" size="sm" disabled={isPending} onClick={() => setConfirmDelete(false)}>
                Yo&apos;q
              </Button>
            </div>
          )}

          {!confirmDelete && (
            <>
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isPending}>
                Bekor
              </Button>
              <Button type="button" size="sm" onClick={handleSave} disabled={isPending || !canSave || isLoading}>
                {isPending ? "Saqlanmoqda..." : existing ? "Yangilash" : "Saqlash"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
