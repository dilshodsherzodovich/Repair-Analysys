"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/ui/modal";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { Checkbox } from "@/ui/checkbox";
import { Progress } from "@/ui/progress";
import {
  Check,
  X,
  Undo2,
  Loader2,
  Train,
  MapPin,
  Users,
  CircleCheck,
  CircleDashed,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useSnackbar } from "@/providers/snackbar-provider";
import { usePayrollConfirm, useRecover } from "@/api/hooks/use-recovery";
import type { RecoveryDelay } from "@/api/types/recovery";
import type { Culprit } from "@/api/types/culprits";

type RecoveryMode = "payroll" | "accountant";

interface RecoveryCulpritsModalProps {
  isOpen: boolean;
  onClose: () => void;
  delay: RecoveryDelay | null;
  mode: RecoveryMode;
}

function formatAmount(amount: string | number): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (!value) return "0";
  return new Intl.NumberFormat("uz-UZ", {
    maximumFractionDigits: 0,
  }).format(value);
}

export function RecoveryCulpritsModal({
  isOpen,
  onClose,
  delay,
  mode,
}: RecoveryCulpritsModalProps) {
  const t = useTranslations("RecoveryModal");
  const { showSuccess, showError } = useSnackbar();

  const [culprits, setCulprits] = useState<Culprit[]>([]);
  const [totals, setTotals] = useState({ total: 0, recovered: 0 });
  const [busyId, setBusyId] = useState<number | "bulk" | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const payrollMutation = usePayrollConfirm();
  const recoverMutation = useRecover();

  useEffect(() => {
    if (!isOpen || !delay) return;
    setCulprits(delay.culprits ?? []);
    setTotals({
      total: delay.culprits_total_amount ?? 0,
      recovered: delay.culprits_recovered_amount ?? 0,
    });
    setSelected(new Set());
  }, [isOpen, delay]);

  const applyResult = (updated: RecoveryDelay) => {
    setCulprits(updated.culprits ?? []);
    setTotals({
      total: updated.culprits_total_amount ?? 0,
      recovered: updated.culprits_recovered_amount ?? 0,
    });
    setSelected(new Set());
  };

  const onError = (error: any) =>
    showError(
      t("messages.error_title"),
      error?.response?.data?.detail ||
        error?.message ||
        t("messages.error_message")
    );

  const runPayroll = (confirmed: boolean, ids?: number[]) => {
    if (!delay) return;
    setBusyId(ids && ids.length === 1 ? ids[0] : "bulk");
    payrollMutation.mutate(
      { id: delay.id, payload: { confirmed, ...(ids ? { culprit_ids: ids } : {}) } },
      {
        onSuccess: (updated) => {
          applyResult(updated);
          showSuccess(t("messages.payroll_success"));
          setBusyId(null);
        },
        onError: (e) => {
          onError(e);
          setBusyId(null);
        },
      }
    );
  };

  const runRecover = (recovered: boolean, ids?: number[]) => {
    if (!delay) return;
    setBusyId(ids && ids.length === 1 ? ids[0] : "bulk");
    recoverMutation.mutate(
      { id: delay.id, payload: { recovered, ...(ids ? { culprit_ids: ids } : {}) } },
      {
        onSuccess: (updated) => {
          applyResult(updated);
          showSuccess(t("messages.recover_success"));
          setBusyId(null);
        },
        onError: (e) => {
          onError(e);
          setBusyId(null);
        },
      }
    );
  };

  const anyBusy = busyId !== null;

  // Which culprits the forward (select-driven) action can target
  const isSelectable = (c: Culprit) =>
    mode === "payroll" ? !c.payroll_confirmed : c.payroll_confirmed && !c.recovered;

  const selectableIds = useMemo(
    () => culprits.filter(isSelectable).map((c) => c.id),
    [culprits, mode]
  );

  const allSelected =
    selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));
  const someSelected =
    selectableIds.some((id) => selected.has(id)) && !allSelected;
  const headerChecked: boolean | "indeterminate" = allSelected
    ? true
    : someSelected
      ? "indeterminate"
      : false;

  const toggleRow = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(selectableIds));

  const submitSelected = () => {
    const ids = selectableIds.filter((id) => selected.has(id));
    if (!ids.length) return;
    if (mode === "payroll") runPayroll(true, ids);
    else runRecover(true, ids);
  };

  const percent =
    totals.total > 0
      ? Math.min(100, Math.round((totals.recovered / totals.total) * 100))
      : 0;
  const selectedCount = selectableIds.filter((id) => selected.has(id)).length;

  const renderRowAction = (c: Culprit) => {
    if (busyId === c.id) {
      return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    }
    if (mode === "payroll") {
      if (c.recovered) return <span className="text-xs text-muted-foreground">—</span>;
      if (c.payroll_confirmed) {
        return (
          <Button
            size="sm"
            variant="ghost"
            disabled={anyBusy}
            onClick={() => runPayroll(false, [c.id])}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            {t("payroll_unconfirm")}
          </Button>
        );
      }
      return (
        <Button
          size="sm"
          variant="outline"
          disabled={anyBusy}
          onClick={() => runPayroll(true, [c.id])}
          className="h-7 px-2 text-xs border-success text-success hover:bg-success/10 hover:text-success hover:border-success"
        >
          <Check className="h-3.5 w-3.5 mr-1" />
          {t("payroll_confirm")}
        </Button>
      );
    }
    // accountant
    if (!c.payroll_confirmed) {
      return (
        <span className="text-xs text-muted-foreground">
          {t("not_confirmed_yet")}
        </span>
      );
    }
    if (c.recovered) {
      return (
        <Button
          size="sm"
          variant="ghost"
          disabled={anyBusy}
          onClick={() => runRecover(false, [c.id])}
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <Undo2 className="h-3.5 w-3.5 mr-1" />
          {t("unrecover")}
        </Button>
      );
    }
    return (
      <Button
        size="sm"
        variant="outline"
        disabled={anyBusy}
        onClick={() => runRecover(true, [c.id])}
        className="h-7 px-2 text-xs border-success text-success hover:bg-success/10 hover:text-success hover:border-success"
      >
        <Check className="h-3.5 w-3.5 mr-1" />
        {t("recover")}
      </Button>
    );
  };

  const flagPill = (active: boolean, by: string | null, label: string) => (
    <div className="flex flex-col gap-0.5">
      <span
        className={
          active
            ? "inline-flex w-fit items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success"
            : "inline-flex w-fit items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
        }
      >
        {active ? (
          <CircleCheck className="h-3 w-3" />
        ) : (
          <CircleDashed className="h-3 w-3" />
        )}
        {label}: {active ? t("yes") : t("no")}
      </span>
      {active && by && (
        <span className="pl-1 text-[10px] text-muted-foreground">{by}</span>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("title")}
      size="xl"
      ariaDescribedBy="recovery-culprits-modal"
    >
      <div className="mt-2 space-y-4">
        {/* Header card */}
        {delay && (
          <div className="rounded-xl border bg-muted/30 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-background px-2 py-1 text-xs font-medium shadow-sm">
                <Train className="h-3.5 w-3.5 text-muted-foreground" />
                {delay.train_number || "-"}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-background px-2 py-1 text-xs font-medium shadow-sm">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                {delay.station || "-"}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-background px-2 py-1 text-xs font-medium shadow-sm">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                {t("people_count", { count: culprits.length })}
              </span>
            </div>
            <div className="mt-3">
              <Progress value={percent} className="h-2" />
              <p className="mt-1.5 text-xs text-muted-foreground">
                {t("progress_percent", {
                  recovered: formatAmount(totals.recovered),
                  total: formatAmount(totals.total),
                  percent,
                })}
              </p>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="w-10 px-3 py-2.5 text-left">
                  <Checkbox
                    checked={headerChecked}
                    disabled={selectableIds.length === 0 || anyBusy}
                    onCheckedChange={toggleAll}
                    aria-label="select all"
                  />
                </th>
                <th className="px-3 py-2.5 text-left font-medium">
                  {t("columns.full_name")}
                </th>
                <th className="px-3 py-2.5 text-right font-medium">
                  {t("columns.amount")}
                </th>
                <th className="px-3 py-2.5 text-left font-medium">
                  {t("columns.payroll")}
                </th>
                <th className="px-3 py-2.5 text-left font-medium">
                  {t("columns.recovered")}
                </th>
                <th className="px-3 py-2.5 text-right font-medium">
                  {t("columns.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {culprits.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-8 text-center text-muted-foreground"
                  >
                    {t("empty")}
                  </td>
                </tr>
              ) : (
                culprits.map((c) => {
                  const selectable = isSelectable(c);
                  const checked = selected.has(c.id);
                  return (
                    <tr
                      key={c.id}
                      className={
                        "border-t align-top transition-colors " +
                        (checked ? "bg-primary/5" : "hover:bg-muted/30")
                      }
                    >
                      <td className="px-3 py-2.5">
                        <Checkbox
                          checked={checked}
                          disabled={!selectable || anyBusy}
                          onCheckedChange={() => toggleRow(c.id)}
                          aria-label={`select ${c.full_name}`}
                        />
                      </td>
                      <td className="px-3 py-2.5 font-medium">{c.full_name}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {formatAmount(c.amount)}
                      </td>
                      <td className="px-3 py-2.5">
                        {flagPill(
                          c.payroll_confirmed,
                          c.payroll_confirmed_by_name,
                          t("columns.payroll")
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        {flagPill(
                          c.recovered,
                          c.recovered_by_name,
                          t("columns.recovered")
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex justify-end">{renderRowAction(c)}</div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          <div className="flex items-center gap-2">
            <Button
              disabled={anyBusy || selectedCount === 0}
              onClick={submitSelected}
            >
              {busyId === "bulk" && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {mode === "payroll"
                ? t("confirm_selected", { count: selectedCount })
                : t("recover_selected", { count: selectedCount })}
            </Button>
            {selectableIds.length > 0 && (
              <Button
                variant="outline"
                disabled={anyBusy}
                onClick={() =>
                  mode === "payroll" ? runPayroll(true) : runRecover(true)
                }
              >
                {mode === "payroll" ? t("confirm_all") : t("recover_all")}
              </Button>
            )}
          </div>
          <Button type="button" variant="ghost" onClick={onClose}>
            {t("close")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
