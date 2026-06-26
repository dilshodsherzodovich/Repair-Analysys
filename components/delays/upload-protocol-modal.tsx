"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Card } from "@/ui/card";
import { Modal } from "@/ui/modal";
import { FormField } from "@/ui/form-field";
import { FileUpload } from "@/ui/file-upload";
import { Button } from "@/ui/button";
import { FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSnackbar } from "@/providers/snackbar-provider";
import type { DelayEntry, UploadProtocolPayload } from "@/api/types/delays";

interface UploadProtocolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: UploadProtocolPayload) => void;
  entry?: DelayEntry | null;
  isPending: boolean;
}

export function UploadProtocolModal({
  isOpen,
  onClose,
  onSave,
  entry,
  isPending,
}: UploadProtocolModalProps) {
  const t = useTranslations("UploadProtocolModal");
  const { showError } = useSnackbar();
  const [file, setFile] = useState<File | null>(null);
  const [protocolNumber, setProtocolNumber] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setFile(null);
    setProtocolNumber(entry?.protocol_number || "");
  }, [isOpen, entry]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!file) {
      showError(t("errors.file_required"));
      return;
    }
    const number = protocolNumber.trim();
    if (!number) {
      showError(t("errors.protocol_required"));
      return;
    }
    onSave({ report: file, protocol_number: number });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={entry?.protocol_number ? t("title_edit") : t("title")}
      size="md"
      ariaDescribedBy="upload-protocol-modal"
    >
      <Card className="border-none p-0 mt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            id="protocol_number"
            name="protocol_number"
            label={t("protocol_number")}
            value={protocolNumber}
            onChange={setProtocolNumber}
            placeholder={t("protocol_number_placeholder")}
            required
          />

          <div>
            <FileUpload
              label={t("report_file")}
              filesUploaded={file ? [file] : []}
              onFilesChange={(files) => setFile(files[0] || null)}
              accept=".pdf,.doc,.docx,.xls,.xlsx"
              multiple={false}
              maxSize={10}
            />
            {!file && entry?.report && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 mb-1">
                  {t("current_report")}
                </p>
                <a
                  href={entry.report}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  <FileText className="h-4 w-4" />
                  {entry.report_filename || entry.protocol_number || "—"}
                </a>
              </div>
            )}
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
              {isPending ? t("pending") : t("submit")}
            </Button>
          </div>
        </form>
      </Card>
    </Modal>
  );
}
