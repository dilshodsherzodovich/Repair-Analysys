"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Card } from "@/ui/card";
import { Modal } from "@/ui/modal";
import { FormField } from "@/ui/form-field";
import { Button } from "@/ui/button";
import { useSnackbar } from "@/providers/snackbar-provider";
import { useTranslations } from "next-intl";
import type { Culprit } from "@/api/types/culprits";

interface CulpritFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: { full_name: string; amount: string }) => void;
  entry?: Culprit | null;
  isPending: boolean;
}

// Format a raw numeric string with space thousands separators (keeps optional decimals)
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

export function CulpritFormModal({
  isOpen,
  onClose,
  onSave,
  entry,
  isPending,
}: CulpritFormModalProps) {
  const t = useTranslations("CulpritsModal");
  const { showError } = useSnackbar();
  const [fullName, setFullName] = useState("");
  const [amountDisplay, setAmountDisplay] = useState("");

  const isEdit = !!entry;

  useEffect(() => {
    if (!isOpen) return;
    if (entry) {
      setFullName(entry.full_name || "");
      setAmountDisplay(formatThousands(String(entry.amount ?? "")));
    } else {
      setFullName("");
      setAmountDisplay("");
    }
  }, [entry, isOpen]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const name = fullName.trim();
    if (!name) {
      showError(t("errors.full_name_required"));
      return;
    }
    const amount = parseThousands(amountDisplay);
    if (!amount || amount <= 0) {
      showError(t("errors.amount_invalid"));
      return;
    }
    onSave({ full_name: name, amount: amount.toFixed(2) });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? t("form.title_edit") : t("form.title_create")}
      size="md"
      ariaDescribedBy="culprit-form-modal"
    >
      <Card className="border-none p-0 mt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            id="full_name"
            name="full_name"
            label={t("form.full_name")}
            value={fullName}
            onChange={setFullName}
            placeholder={t("form.full_name_placeholder")}
            required
          />
          <FormField
            id="amount"
            name="amount"
            label={t("form.amount")}
            type="text"
            value={amountDisplay}
            onChange={(v) => setAmountDisplay(formatThousands(v))}
            placeholder={t("form.amount_placeholder")}
            required
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              {t("form.cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isEdit ? t("form.submit_edit") : t("form.submit_create")}
            </Button>
          </div>
        </form>
      </Card>
    </Modal>
  );
}
