"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "@/ui/modal";
import { Label } from "@/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { Button } from "@/ui/button";
import { FormField } from "@/ui/form-field";
import { TU152Entry, TU152_STATUSES, TU152UpdatePayload } from "@/api/types/tu152";
import { useSnackbar } from "@/providers/snackbar-provider";

interface TU152ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: TU152UpdatePayload) => void;
  entry: TU152Entry | null;
  isPending: boolean;
}

export function TU152Modal({
  isOpen,
  onClose,
  onSave,
  entry,
  isPending,
}: TU152ModalProps) {
  const [statusId, setStatusId] = useState<string>("");
  const [answer, setAnswer] = useState<string>("");
  const { showError } = useSnackbar();

  useEffect(() => {
    if (entry && isOpen) {
      setStatusId(entry.status_id?.toString() || "");
      setAnswer(entry.answer || "");
    } else {
      setStatusId("");
      setAnswer("");
    }
  }, [entry, isOpen]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!statusId) {
      showError("Iltimos, holatni tanlang.");
      return;
    }

    const payload: TU152UpdatePayload = {
      status_id: parseInt(statusId),
      answer: answer.trim(),
    };

    onSave(payload);
  };

  const handleClose = () => {
    setStatusId("");
    setAnswer("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="TU152 nosozlikni tahrirlash"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="status" className="mb-2 block">
            Holat <span className="text-red-500">*</span>
          </Label>
          <Select value={statusId} onValueChange={setStatusId}>
            <SelectTrigger id="status">
              <SelectValue placeholder="Holatni tanlang" />
            </SelectTrigger>
            <SelectContent>
              {TU152_STATUSES.map((status) => (
                <SelectItem key={status.id} value={status.id.toString()}>
                  {status.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <FormField
          id="answer"
          name="answer"
          label="Javob"
          type="textarea"
          rows={6}
          placeholder="Javob kiriting"
          value={answer}
          onChange={setAnswer}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isPending}
          >
            Bekor qilish
          </Button>
          <Button type="submit" disabled={isPending || !statusId}>
            {isPending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

