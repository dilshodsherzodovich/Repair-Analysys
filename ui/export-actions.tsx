"use client";

import { useTranslations } from "next-intl";
import { FileDown, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/ui/button";

export type ExportKind = "excel" | "pdf" | "word";

/**
 * The only export buttons in the app: Excel (green), PDF and Word (outline),
 * always in that order, 36px like every action, with a spinner on the one running.
 * Pass a handler for each format the page offers.
 */
export function ExportActions({
  onExcel,
  onPdf,
  onWord,
  busy = null,
  disabled = false,
}: {
  onExcel?: () => void;
  onPdf?: () => void;
  onWord?: () => void;
  /** The export currently running, if any; all buttons wait while one runs. */
  busy?: ExportKind | null;
  /** E.g. nothing to export yet. */
  disabled?: boolean;
}) {
  const t = useTranslations("Common");
  const off = disabled || busy !== null;

  return (
    <>
      {onExcel && (
        <Button variant="success" onClick={onExcel} disabled={off} loading={busy === "excel"}>
          {busy !== "excel" && <FileSpreadsheet />}
          {t("export_excel")}
        </Button>
      )}
      {onPdf && (
        <Button variant="outline" onClick={onPdf} disabled={off} loading={busy === "pdf"}>
          {busy !== "pdf" && <FileDown />}
          {t("export_pdf")}
        </Button>
      )}
      {onWord && (
        <Button variant="outline" onClick={onWord} disabled={off} loading={busy === "word"}>
          {busy !== "word" && <FileText />}
          {t("export_word")}
        </Button>
      )}
    </>
  );
}
