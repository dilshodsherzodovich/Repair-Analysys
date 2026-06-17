"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Modal } from "@/ui/modal";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { Input } from "@/ui/input";
import { ConfirmationDialog } from "@/ui/confirmation-dialog";
import { Plus, Check, Trash2, X, Lock, Loader2, Pencil } from "lucide-react";
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

  const { data, isLoading } = useCulprits(
    { delay: delay?.id, page_size: 100 },
    isOpen && !!delay
  );
  const culprits = data?.results ?? [];

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
            <p className="text-sm text-muted-foreground">
              {t("subtitle", {
                train: delay.train_number || "-",
                station: delay.station || "-",
              })}
            </p>
          )}

          {canManage && (
            <div className="flex justify-end">
              <Button size="sm" onClick={addDraft}>
                <Plus className="h-4 w-4 mr-1" />
                {t("add_button")}
              </Button>
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
                      <tr key={culprit.id} className="border-t">
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
                      <tr key={culprit.id} className="border-t">
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
                    <tr key={culprit.id} className="border-t">
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
                    return (
                      <tr key={`draft-${row.tempId}`} className="border-t bg-muted/20">
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
                          <Input
                            className="mb-0 h-8"
                            placeholder={t("form.amount_placeholder")}
                            value={row.amount}
                            onChange={(e) =>
                              updateDraft(row.tempId, {
                                amount: formatThousands(e.target.value),
                              })
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                submitDraft(row);
                              }
                            }}
                          />
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
                {canManage && (
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
