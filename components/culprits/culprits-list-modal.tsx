"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Modal } from "@/ui/modal";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { Input } from "@/ui/input";
import { ConfirmationDialog } from "@/ui/confirmation-dialog";
import {
  Plus,
  Check,
  Trash2,
  X,
  Lock,
  Loader2,
  Pencil,
  Train,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useSnackbar } from "@/providers/snackbar-provider";
import {
  useCulprits,
  useCreateCulprit,
  useUpdateCulprit,
  useDeleteCulprit,
} from "@/api/hooks/use-culprits";
import type { Culprit } from "@/api/types/culprits";
import type { DelayEntry } from "@/api/types/delays";

interface CulpritsListModalProps {
  isOpen: boolean;
  onClose: () => void;
  delay: DelayEntry | null;
  canManage: boolean;
}

interface DraftRow {
  tempId: number;
  full_name: string;
  amount: string;
}

function formatThousands(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, "");
  if (!cleaned) return "";
  const [intPart, ...rest] = cleaned.split(".");
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return rest.length ? `${grouped}.${rest.join("")}` : grouped;
}

function parseThousands(formatted: string): number {
  return Number.parseFloat(formatted.replace(/\s/g, "")) || 0;
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

export function CulpritsListModal({
  isOpen,
  onClose,
  delay,
  canManage,
}: CulpritsListModalProps) {
  const t = useTranslations("CulpritsModal");
  const { showSuccess, showError } = useSnackbar();

  // Inline-edit values for existing culprits, keyed by id
  const [editValues, setEditValues] = useState<
    Record<number, { full_name: string; amount: string }>
  >({});
  // New draft rows being typed in the table
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [deleting, setDeleting] = useState<Culprit | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [savingDraftId, setSavingDraftId] = useState<number | null>(null);
  const tempIdRef = useRef(0);

  // Read-only view (admin/info) reuses the culprits already on the delay object;
  // only fetch when the moderator needs fresh data for CRUD.
  const { data, isLoading } = useCulprits(
    { delay: delay?.id, page_size: 100 },
    isOpen && !!delay && canManage
  );
  const culprits = canManage ? (data?.results ?? []) : (delay?.culprits ?? []);

  const createMutation = useCreateCulprit();
  const updateMutation = useUpdateCulprit();
  const deleteMutation = useDeleteCulprit();

  // Seed inline-edit values whenever the fetched list changes
  useEffect(() => {
    const map: Record<number, { full_name: string; amount: string }> = {};
    culprits.forEach((c) => {
      map[c.id] = {
        full_name: c.full_name ?? "",
        amount: formatThousands(String(c.amount ?? "")),
      };
    });
    setEditValues(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Reset drafts when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setDrafts([]);
      setEditingId(null);
    }
  }, [isOpen]);

  const canAdd = canManage && !delay?.archive;

  // Distribution of the delay's damage across culprits (existing + draft, live)
  const damage = delay?.damage_amount ?? 0;
  const assignedSum =
    culprits.reduce((sum, c) => sum + (Number(c.amount) || 0), 0) +
    drafts.reduce((sum, d) => sum + parseThousands(d.amount), 0);
  const percent = damage > 0 ? Math.round((assignedSum / damage) * 100) : 0;
  const remaining = damage - assignedSum;
  const over = assignedSum > damage;

  // Max a given draft may take = zarar minus everyone else already assigned
  const maxForDraft = (tempId: number) => {
    const others =
      culprits.reduce((sum, c) => sum + (Number(c.amount) || 0), 0) +
      drafts
        .filter((d) => d.tempId !== tempId)
        .reduce((sum, d) => sum + parseThousands(d.amount), 0);
    return Math.max(0, damage - others);
  };

  const onErr = useCallback(
    (error: any) =>
      showError(
        t("messages.error_title"),
        error?.response?.data?.detail ||
          error?.message ||
          t("messages.error_message")
      ),
    [showError, t]
  );

  const validate = useCallback(
    (full_name: string, amountDisplay: string) => {
      const name = full_name.trim();
      if (!name) {
        showError(t("errors.full_name_required"));
        return null;
      }
      const amount = parseThousands(amountDisplay);
      if (!amount || amount <= 0) {
        showError(t("errors.amount_invalid"));
        return null;
      }
      return { full_name: name, amount: amount.toFixed(2) };
    },
    [showError, t]
  );

  const addDraft = useCallback(() => {
    tempIdRef.current += 1;
    setDrafts((d) => [
      ...d,
      { tempId: tempIdRef.current, full_name: "", amount: "" },
    ]);
  }, []);

  const updateDraft = useCallback(
    (tempId: number, patch: Partial<DraftRow>) => {
      setDrafts((d) =>
        d.map((row) => (row.tempId === tempId ? { ...row, ...patch } : row))
      );
    },
    []
  );

  const removeDraft = useCallback((tempId: number) => {
    setDrafts((d) => d.filter((row) => row.tempId !== tempId));
  }, []);

  const submitDraft = useCallback(
    (row: DraftRow) => {
      if (!delay) return;
      const payload = validate(row.full_name, row.amount);
      if (!payload) return;
      setSavingDraftId(row.tempId);
      createMutation.mutate(
        { delay: delay.id, ...payload },
        {
          onSuccess: () => {
            showSuccess(t("messages.create_success"));
            removeDraft(row.tempId);
            setSavingDraftId(null);
          },
          onError: (e: any) => {
            onErr(e);
            setSavingDraftId(null);
          },
        }
      );
    },
    [delay, validate, createMutation, showSuccess, t, removeDraft, onErr]
  );

  const startEdit = useCallback((culprit: Culprit) => {
    setEditValues((prev) => ({
      ...prev,
      [culprit.id]: {
        full_name: culprit.full_name ?? "",
        amount: formatThousands(String(culprit.amount ?? "")),
      },
    }));
    setEditingId(culprit.id);
  }, []);

  const cancelEdit = useCallback((culprit: Culprit) => {
    setEditValues((prev) => ({
      ...prev,
      [culprit.id]: {
        full_name: culprit.full_name ?? "",
        amount: formatThousands(String(culprit.amount ?? "")),
      },
    }));
    setEditingId(null);
  }, []);

  const saveExisting = useCallback(
    (culprit: Culprit) => {
      const values = editValues[culprit.id];
      if (!values) return;
      const payload = validate(values.full_name, values.amount);
      if (!payload) return;
      setSavingId(culprit.id);
      updateMutation.mutate(
        { id: culprit.id, payload },
        {
          onSuccess: () => {
            showSuccess(t("messages.update_success"));
            setSavingId(null);
            setEditingId(null);
          },
          onError: (e: any) => {
            onErr(e);
            setSavingId(null);
          },
        }
      );
    },
    [editValues, validate, updateMutation, showSuccess, t, onErr]
  );

  const handleDeleteConfirm = useCallback(() => {
    if (!deleting) return;
    deleteMutation.mutate(deleting.id, {
      onSuccess: () => {
        showSuccess(t("messages.delete_success"));
        setDeleting(null);
      },
      onError: (e: any) => {
        onErr(e);
        setDeleting(null);
      },
    });
  }, [deleting, deleteMutation, showSuccess, t, onErr]);

  const statusBadge = (culprit: Culprit) => {
    if (culprit.recovered) {
      return <Badge variant="success">{t("status.recovered")}</Badge>;
    }
    if (culprit.payroll_confirmed) {
      return <Badge variant="info">{t("status.payroll_confirmed")}</Badge>;
    }
    return <Badge variant="outline">{t("status.pending")}</Badge>;
  };

  const colSpan = canManage ? 4 : 3;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={t("title")}
        size="lg"
        ariaDescribedBy="culprits-list-modal"
      >
        <div className="mt-2 space-y-4">
          {delay && (
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-background px-2 py-1 text-xs font-medium shadow-sm">
                    <Train className="h-3.5 w-3.5 text-muted-foreground" />
                    {delay.train_number || "-"}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-background px-2 py-1 text-xs font-medium shadow-sm">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    {delay.station || "-"}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {t("zarar")}
                  </div>
                  <div className="text-base font-semibold tabular-nums">
                    {formatAmount(damage)}
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      over
                        ? "bg-red-500"
                        : percent >= 100
                          ? "bg-success"
                          : "bg-primary"
                    )}
                    style={{ width: `${Math.min(100, Math.max(percent, 0))}%` }}
                  />
                </div>
                <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-muted-foreground">
                    {t("distributed", {
                      sum: formatAmount(assignedSum),
                      total: formatAmount(damage),
                      percent,
                    })}
                  </span>
                  <span
                    className={
                      over ? "font-medium text-red-600" : "text-muted-foreground"
                    }
                  >
                    {over
                      ? t("over_limit", { amount: formatAmount(-remaining) })
                      : t("remaining", { amount: formatAmount(remaining) })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {canAdd && (
            <div className="flex justify-end">
              <Button size="sm" onClick={addDraft}>
                <Plus className="h-4 w-4 mr-1" />
                {t("add_button")}
              </Button>
            </div>
          )}

          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">
                    {t("columns.full_name")}
                  </th>
                  <th className="px-3 py-2 text-left font-medium">
                    {t("columns.amount")}
                  </th>
                  <th className="px-3 py-2 text-left font-medium">
                    {t("columns.status")}
                  </th>
                  {canManage && (
                    <th className="px-3 py-2 text-right font-medium">
                      {t("columns.actions")}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={colSpan} className="px-3 py-6">
                      <div className="flex justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    </td>
                  </tr>
                ) : culprits.length === 0 && drafts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={colSpan}
                      className="px-3 py-6 text-center text-muted-foreground"
                    >
                      {t("empty")}
                    </td>
                  </tr>
                ) : null}

                {/* Existing culprits */}
                {culprits.map((culprit) => {
                  const locked = culprit.payroll_confirmed;
                  const values = editValues[culprit.id] ?? {
                    full_name: culprit.full_name ?? "",
                    amount: formatThousands(String(culprit.amount ?? "")),
                  };
                  const saving = savingId === culprit.id;

                  if (!canManage || locked) {
                    return (
                      <tr key={culprit.id} className="border-t hover:bg-muted/20">
                        <td className="px-3 py-2">{culprit.full_name}</td>
                        <td className="px-3 py-2">
                          {formatAmount(culprit.amount)}
                        </td>
                        <td className="px-3 py-2">{statusBadge(culprit)}</td>
                        {canManage && (
                          <td className="px-3 py-2">
                            <div className="flex items-center justify-end">
                              <span
                                className="inline-flex items-center gap-1 text-xs text-muted-foreground"
                                title={t("locked_hint")}
                              >
                                <Lock className="h-3.5 w-3.5" />
                              </span>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  }

                  // Default: plain text row with Edit/Delete
                  if (editingId !== culprit.id) {
                    return (
                      <tr key={culprit.id} className="border-t hover:bg-muted/20">
                        <td className="px-3 py-2">{culprit.full_name}</td>
                        <td className="px-3 py-2">
                          {formatAmount(culprit.amount)}
                        </td>
                        <td className="px-3 py-2">{statusBadge(culprit)}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 w-7 p-0"
                              onClick={() => startEdit(culprit)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 w-7 p-0 border-red-600 text-red-600 hover:text-red-700 hover:border-red-600 hover:bg-red-600/10"
                              onClick={() => setDeleting(culprit)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  // Edit mode: inline inputs + Save/Cancel
                  return (
                    <tr key={culprit.id} className="border-t hover:bg-muted/20">
                      <td className="px-3 py-2">
                        <Input
                          className="mb-0 h-8"
                          value={values.full_name}
                          onChange={(e) =>
                            setEditValues((prev) => ({
                              ...prev,
                              [culprit.id]: {
                                ...values,
                                full_name: e.target.value,
                              },
                            }))
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          className="mb-0 h-8"
                          value={values.amount}
                          onChange={(e) =>
                            setEditValues((prev) => ({
                              ...prev,
                              [culprit.id]: {
                                ...values,
                                amount: formatThousands(e.target.value),
                              },
                            }))
                          }
                        />
                      </td>
                      <td className="px-3 py-2">{statusBadge(culprit)}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0 border-success text-success hover:bg-success/10 hover:text-success/80 hover:border-success"
                            disabled={saving}
                            onClick={() => saveExisting(culprit)}
                          >
                            {saving ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0"
                            disabled={saving}
                            onClick={() => cancelEdit(culprit)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {/* Draft rows (new culprits being typed inline) */}
                {canManage &&
                  drafts.map((row) => {
                    const saving = savingDraftId === row.tempId;
                    const max = maxForDraft(row.tempId);
                    const maxStr = max > 0 ? formatThousands(String(max)) : "";
                    return (
                      <tr key={`draft-${row.tempId}`} className="border-t bg-primary/5">
                        <td className="px-3 py-2">
                          <Input
                            className="mb-0 h-8"
                            autoFocus
                            placeholder={t("form.full_name_placeholder")}
                            value={row.full_name}
                            onChange={(e) =>
                              updateDraft(row.tempId, {
                                full_name: e.target.value,
                              })
                            }
                          />
                        </td>
                        <td className="px-3 py-2">
                          <div className="relative">
                            <Input
                              className="mb-0 h-8 pr-12"
                              placeholder={
                                maxStr || t("form.amount_placeholder")
                              }
                              title={
                                max > 0
                                  ? t("max_hint", { amount: maxStr })
                                  : undefined
                              }
                              value={row.amount}
                              onChange={(e) => {
                                let next = formatThousands(e.target.value);
                                if (max > 0 && parseThousands(next) > max) {
                                  next = maxStr;
                                }
                                updateDraft(row.tempId, { amount: next });
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  submitDraft(row);
                                  return;
                                }
                                if (e.key === "Tab" && !row.amount && max > 0) {
                                  e.preventDefault();
                                  updateDraft(row.tempId, { amount: maxStr });
                                }
                              }}
                            />
                            {!row.amount && max > 0 && (
                              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border bg-muted px-1 text-[10px] font-medium text-muted-foreground">
                                Tab
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant="outline">{t("status.pending")}</Badge>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs border-success text-success hover:bg-success/10 hover:text-success/80 hover:border-success"
                              disabled={saving}
                              onClick={() => submitDraft(row)}
                            >
                              {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 w-7 p-0"
                              disabled={saving}
                              onClick={() => removeDraft(row.tempId)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                {/* Persistent "+ add" row, always last */}
                {canAdd && (
                  <tr className="border-t">
                    <td colSpan={colSpan} className="px-3 py-2">
                      <button
                        type="button"
                        onClick={addDraft}
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                      >
                        <Plus className="h-4 w-4" />
                        {t("add_button")}
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("close")}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmationDialog
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDeleteConfirm}
        title={t("delete.title")}
        message={t("delete.message")}
        confirmText={t("delete.confirm")}
        cancelText={t("delete.cancel")}
        isDoingActionText={t("delete.deleting")}
        isDoingAction={deleteMutation.isPending}
        variant="danger"
      />
    </>
  );
}
