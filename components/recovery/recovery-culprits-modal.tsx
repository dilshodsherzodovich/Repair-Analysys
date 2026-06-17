"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/ui/modal";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { Check, X, Undo2, Loader2 } from "lucide-react";
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
    style: "currency",
    currency: "UZS",
    minimumFractionDigits: 0,
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
  const [busyId, setBusyId] = useState<number | "all" | null>(null);

  const payrollMutation = usePayrollConfirm();
  const recoverMutation = useRecover();

  useEffect(() => {
    if (!isOpen || !delay) return;
    setCulprits(delay.culprits ?? []);
    setTotals({
      total: delay.culprits_total_amount ?? 0,
      recovered: delay.culprits_recovered_amount ?? 0,
    });
  }, [isOpen, delay]);

  const applyResult = (updated: RecoveryDelay) => {
    setCulprits(updated.culprits ?? []);
    setTotals({
      total: updated.culprits_total_amount ?? 0,
      recovered: updated.culprits_recovered_amount ?? 0,
    });
  };

  const onError = (error: any) =>
    showError(
      t("messages.error_title"),
      error?.response?.data?.detail ||
        error?.message ||
        t("messages.error_message")
    );

  const runPayroll = (confirmed: boolean, culpritId?: number) => {
    if (!delay) return;
    setBusyId(culpritId ?? "all");
    payrollMutation.mutate(
      {
        id: delay.id,
        payload: {
          confirmed,
          ...(culpritId ? { culprit_ids: [culpritId] } : {}),
        },
      },
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

  const runRecover = (recovered: boolean, culpritId?: number) => {
    if (!delay) return;
    setBusyId(culpritId ?? "all");
    recoverMutation.mutate(
      {
        id: delay.id,
        payload: {
          recovered,
          ...(culpritId ? { culprit_ids: [culpritId] } : {}),
        },
      },
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

  const renderActions = (culprit: Culprit) => {
    if (mode === "payroll") {
      if (culprit.recovered) {
        // already recovered → cannot unconfirm
        return <span className="text-xs text-muted-foreground">—</span>;
      }
      if (culprit.payroll_confirmed) {
        return (
          <Button
            size="sm"
            variant="outline"
            disabled={anyBusy}
            onClick={() => runPayroll(false, culprit.id)}
            className="h-7 px-2 text-xs"
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
          onClick={() => runPayroll(true, culprit.id)}
          className="h-7 px-2 text-xs border-success text-success hover:bg-success/10 hover:text-success/80 hover:border-success"
        >
          <Check className="h-3.5 w-3.5 mr-1" />
          {t("payroll_confirm")}
        </Button>
      );
    }

    // accountant mode
    if (!culprit.payroll_confirmed) {
      return (
        <span className="text-xs text-muted-foreground">
          {t("not_confirmed_yet")}
        </span>
      );
    }
    if (culprit.recovered) {
      return (
        <Button
          size="sm"
          variant="outline"
          disabled={anyBusy}
          onClick={() => runRecover(false, culprit.id)}
          className="h-7 px-2 text-xs"
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
        onClick={() => runRecover(true, culprit.id)}
        className="h-7 px-2 text-xs border-success text-success hover:bg-success/10 hover:text-success/80 hover:border-success"
      >
        <Check className="h-3.5 w-3.5 mr-1" />
        {t("recover")}
      </Button>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("title")}
      size="xl"
      ariaDescribedBy="recovery-culprits-modal"
    >
      <div className="mt-2 space-y-4">
        {delay && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {t("subtitle", {
                train: delay.train_number || "-",
                station: delay.station || "-",
              })}
            </p>
            <p className="text-sm font-medium">
              {t("progress", {
                recovered: formatAmount(totals.recovered),
                total: formatAmount(totals.total),
              })}
            </p>
          </div>
        )}

        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">
                  {t("columns.full_name")}
                </th>
                <th className="px-3 py-2 text-left font-medium">
                  {t("columns.amount")}
                </th>
                <th className="px-3 py-2 text-left font-medium">
                  {t("columns.payroll")}
                </th>
                <th className="px-3 py-2 text-left font-medium">
                  {t("columns.recovered")}
                </th>
                <th className="px-3 py-2 text-right font-medium">
                  {t("columns.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {culprits.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-6 text-center text-muted-foreground"
                  >
                    {t("empty")}
                  </td>
                </tr>
              ) : (
                culprits.map((culprit) => (
                  <tr key={culprit.id} className="border-t align-top">
                    <td className="px-3 py-2">{culprit.full_name}</td>
                    <td className="px-3 py-2">{formatAmount(culprit.amount)}</td>
                    <td className="px-3 py-2">
                      <Badge
                        variant={
                          culprit.payroll_confirmed ? "info" : "outline"
                        }
                      >
                        {culprit.payroll_confirmed ? t("yes") : t("no")}
                      </Badge>
                      {culprit.payroll_confirmed_by_name && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {t("confirmed_by", {
                            name: culprit.payroll_confirmed_by_name,
                          })}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <Badge
                        variant={culprit.recovered ? "success" : "outline"}
                      >
                        {culprit.recovered ? t("yes") : t("no")}
                      </Badge>
                      {culprit.recovered_by_name && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {t("recovered_by", {
                            name: culprit.recovered_by_name,
                          })}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end">
                        {busyId === culprit.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                          renderActions(culprit)
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            {culprits.length > 0 &&
              (mode === "payroll" ? (
                <Button
                  variant="outline"
                  disabled={anyBusy}
                  onClick={() => runPayroll(true)}
                >
                  {busyId === "all" && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  {t("confirm_all")}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  disabled={anyBusy}
                  onClick={() => runRecover(true)}
                >
                  {busyId === "all" && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  {t("recover_all")}
                </Button>
              ))}
          </div>
          <Button type="button" variant="outline" onClick={onClose}>
            {t("close")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
